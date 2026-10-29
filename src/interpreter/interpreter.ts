import {
  ASTNode,
  Program,
  FunctionDecl,
  ClassDecl,
  VarDecl,
  BlockStmt,
  IfStmt,
  WhileStmt,
  DoWhileStmt,
  ForStmt,
  RangeForStmt,
  ReturnStmt,
  BreakStmt,
  ContinueStmt,
  ExprStmt,
  BinaryExpr,
  UnaryExpr,
  AssignExpr,
  TernaryExpr,
  CallExpr,
  MemberExpr,
  IndexExpr,
  Identifier,
  Literal,
  NewExpr,
  ArrayLiteral
} from './parser';
import { ExecutionResult, TraceStep, StructureInfo, VariableValue } from '../types/trace';

class ReturnSignal {
  constructor(public value: any) {}
}

class BreakSignal {}
class ContinueSignal {}

export class Environment {
  private values: Map<string, any> = new Map();
  private types: Map<string, string> = new Map();
  public parent: Environment | null;

  constructor(parent: Environment | null = null) {
    this.parent = parent;
  }

  public define(name: string, value: any, type: string = 'any') {
    this.values.set(name, value);
    this.types.set(name, type);
  }

  public assign(name: string, value: any): boolean {
    if (this.values.has(name)) {
      this.values.set(name, value);
      return true;
    }
    if (this.parent) {
      return this.parent.assign(name, value);
    }
    return false;
  }

  public get(name: string): any {
    if (this.values.has(name)) {
      return this.values.get(name);
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    return undefined;
  }

  public has(name: string): boolean {
    if (this.values.has(name)) return true;
    return this.parent ? this.parent.has(name) : false;
  }

  public getType(name: string): string {
    if (this.types.has(name)) return this.types.get(name)!;
    if (this.parent) return this.parent.getType(name);
    return 'any';
  }

  public getAllVisible(): Record<string, { value: any; type: string }> {
    const res: Record<string, { value: any; type: string }> = {};
    if (this.parent) {
      Object.assign(res, this.parent.getAllVisible());
    }
    for (const [k, v] of this.values.entries()) {
      res[k] = { value: v, type: this.types.get(k) || 'any' };
    }
    return res;
  }
}

export class Interpreter {
  private trace: TraceStep[] = [];
  private stepCount = 0;
  private maxSteps: number;
  private truncated = false;
  private stdoutBuffer: string[] = [];
  private prevVars: Record<string, any> = {};
  private prevStructures: Record<string, any> = {};
  private loopCounters: Record<number, number> = {};
  private callStack: string[] = ['<main>'];

  constructor(maxSteps = 20000) {
    this.maxSteps = maxSteps;
  }

  public execute(
    ast: Program,
    entryFunctionName?: string,
    args: any[] = []
  ): ExecutionResult {
    this.trace = [];
    this.stepCount = 0;
    this.truncated = false;
    this.stdoutBuffer = [];
    this.prevVars = {};
    this.prevStructures = {};
    this.loopCounters = {};
    this.callStack = ['<main>'];

    const globalEnv = new Environment();
    this.setupGlobals(globalEnv);

    // Register all classes and functions
    const functions = new Map<string, FunctionDecl>();
    const classes = new Map<string, ClassDecl>();

    for (const node of ast.body) {
      if (node.type === 'ClassDecl') {
        classes.set(node.name, node);
        for (const method of node.methods) {
          functions.set(`${node.name}::${method.name}`, method);
          functions.set(method.name, method);
        }
      } else if (node.type === 'FunctionDecl') {
        functions.set(node.name, node);
      }
    }

    try {
      // Find entry point:
      // 1. If explicit entryFunctionName provided (e.g. from LeetCode class Solution or test case harness)
      let targetFn: FunctionDecl | undefined;
      let targetClass: ClassDecl | undefined;

      if (entryFunctionName) {
        targetFn = functions.get(entryFunctionName);
      }

      if (!targetFn && classes.has('Solution')) {
        targetClass = classes.get('Solution')!;
        targetFn = targetClass.methods.find((m) => m.name !== 'Solution');
      }

      if (!targetFn && functions.has('main')) {
        targetFn = functions.get('main');
      }

      if (!targetFn && functions.size > 0) {
        targetFn = Array.from(functions.values())[0];
      }

      let returnValue: any = undefined;

      if (targetFn) {
        this.callStack = [targetFn.name];
        const fnEnv = new Environment(globalEnv);

        // Bind parameters
        for (let i = 0; i < targetFn.params.length; i++) {
          const param = targetFn.params[i];
          const val = args[i] !== undefined ? this.clone(args[i]) : this.getDefaultValueForType(param.type);
          fnEnv.define(param.name, val, param.type);
        }

        this.recordStep(targetFn.line, 'call', fnEnv);

        try {
          this.executeBlock(targetFn.body, fnEnv, functions, classes);
        } catch (signal) {
          if (signal instanceof ReturnSignal) {
            returnValue = signal.value;
            this.recordStep(targetFn.body.line, 'return', fnEnv);
          } else {
            throw signal;
          }
        }
      } else {
        // Execute top-level statements
        for (const node of ast.body) {
          this.executeStatement(node, globalEnv, functions, classes);
        }
      }

      return {
        success: true,
        trace: this.trace,
        totalSteps: this.trace.length,
        truncated: this.truncated,
        stdout: this.stdoutBuffer.join(''),
        returnValue
      };
    } catch (err: any) {
      return {
        success: false,
        trace: this.trace,
        totalSteps: this.trace.length,
        truncated: this.truncated,
        error: {
          line: err.line || 1,
          message: err.message || String(err),
          type: 'RuntimeError'
        },
        stdout: this.stdoutBuffer.join('')
      };
    }
  }

  private setupGlobals(env: Environment) {
    // Built-in std::cout / System.out helper
    env.define('cout', 'cout');
    env.define('cin', 'cin');
    env.define('endl', '\n');
    env.define('null', null);
    env.define('nullptr', null);
  }

  private executeStatement(
    node: ASTNode,
    env: Environment,
    functions: Map<string, FunctionDecl>,
    classes: Map<string, ClassDecl>
  ) {
    this.checkStepCap();

    switch (node.type) {
      case 'BlockStmt':
        this.executeBlock(node, new Environment(env), functions, classes);
        break;

      case 'VarDecl':
        let initVal: any = undefined;
        if (node.init) {
          initVal = this.evaluate(node.init, env, functions, classes);
        } else {
          initVal = this.getDefaultValueForType(node.varType);
        }
        env.define(node.name, initVal, node.varType);
        this.recordStep(node.line, 'line', env);
        break;

      case 'ExprStmt':
        this.recordStep(node.line, 'line', env);
        this.evaluate(node.expr, env, functions, classes);
        break;

      case 'IfStmt': {
        const condVal = !!this.evaluate(node.condition, env, functions, classes);
        this.recordStep(node.line, 'branch', env, {
          branch: {
            line: node.line,
            condition: node.conditionText || 'condition',
            result: condVal
          }
        });
        if (condVal) {
          this.executeStatement(node.consequent, env, functions, classes);
        } else if (node.alternate) {
          this.executeStatement(node.alternate, env, functions, classes);
        }
        break;
      }

      case 'WhileStmt': {
        while (true) {
          this.checkStepCap();
          const condVal = !!this.evaluate(node.condition, env, functions, classes);
          this.loopCounters[node.line] = (this.loopCounters[node.line] || 0) + 1;
          this.recordStep(node.line, 'loop', env, {
            loop: { line: node.line, iteration: this.loopCounters[node.line] },
            branch: { line: node.line, condition: 'while', result: condVal }
          });
          if (!condVal) break;
          try {
            this.executeStatement(node.body, env, functions, classes);
          } catch (e) {
            if (e instanceof BreakSignal) break;
            if (e instanceof ContinueSignal) continue;
            throw e;
          }
        }
        break;
      }

      case 'DoWhileStmt': {
        do {
          this.checkStepCap();
          try {
            this.executeStatement(node.body, env, functions, classes);
          } catch (e) {
            if (e instanceof BreakSignal) break;
            if (e instanceof ContinueSignal) continue;
            throw e;
          }
          const condVal = !!this.evaluate(node.condition, env, functions, classes);
          this.recordStep(node.line, 'loop', env);
          if (!condVal) break;
        } while (true);
        break;
      }

      case 'ForStmt': {
        const forEnv = new Environment(env);
        if (node.init) {
          this.executeStatement(node.init, forEnv, functions, classes);
        }
        while (true) {
          this.checkStepCap();
          let condVal = true;
          if (node.condition) {
            condVal = !!this.evaluate(node.condition, forEnv, functions, classes);
          }
          this.loopCounters[node.line] = (this.loopCounters[node.line] || 0) + 1;
          this.recordStep(node.line, 'loop', forEnv, {
            loop: { line: node.line, iteration: this.loopCounters[node.line] },
            branch: { line: node.line, condition: 'for condition', result: condVal }
          });
          if (!condVal) break;
          try {
            this.executeStatement(node.body, forEnv, functions, classes);
          } catch (e) {
            if (e instanceof BreakSignal) break;
            if (e instanceof ContinueSignal) {
              // proceed to update
            } else {
              throw e;
            }
          }
          if (node.update) {
            this.evaluate(node.update, forEnv, functions, classes);
          }
        }
        break;
      }

      case 'RangeForStmt': {
        const iterable = this.evaluate(node.iterable, env, functions, classes);
        if (Array.isArray(iterable)) {
          const rangeEnv = new Environment(env);
          for (let i = 0; i < iterable.length; i++) {
            this.checkStepCap();
            rangeEnv.define(node.varName, iterable[i], node.varType);
            this.loopCounters[node.line] = (this.loopCounters[node.line] || 0) + 1;
            this.recordStep(node.line, 'loop', rangeEnv, {
              loop: { line: node.line, iteration: this.loopCounters[node.line] }
            });
            try {
              this.executeStatement(node.body, rangeEnv, functions, classes);
            } catch (e) {
              if (e instanceof BreakSignal) break;
              if (e instanceof ContinueSignal) continue;
              throw e;
            }
          }
        }
        break;
      }

      case 'ReturnStmt': {
        let val: any = undefined;
        if (node.value) {
          val = this.evaluate(node.value, env, functions, classes);
        }
        this.recordStep(node.line, 'return', env);
        throw new ReturnSignal(val);
      }

      case 'BreakStmt':
        throw new BreakSignal();

      case 'ContinueStmt':
        throw new ContinueSignal();

      default:
        break;
    }
  }

  private executeBlock(
    block: BlockStmt,
    env: Environment,
    functions: Map<string, FunctionDecl>,
    classes: Map<string, ClassDecl>
  ) {
    for (const stmt of block.statements) {
      this.executeStatement(stmt, env, functions, classes);
    }
  }

  private evaluate(
    node: ASTNode,
    env: Environment,
    functions: Map<string, FunctionDecl>,
    classes: Map<string, ClassDecl>
  ): any {
    switch (node.type) {
      case 'Literal':
        return node.value;

      case 'Identifier':
        if (env.has(node.name)) {
          return env.get(node.name);
        }
        // Known library symbols
        if (['Math', 'std', 'System', 'cout', 'cin', 'endl'].includes(node.name)) {
          return node.name;
        }
        return undefined;

      case 'ArrayLiteral':
        return node.elements.map((e) => this.evaluate(e, env, functions, classes));

      case 'NewExpr': {
        // e.g. new ListNode(1, new ListNode(2))
        const evalArgs = node.args.map((a) => this.evaluate(a, env, functions, classes));
        if (node.className.startsWith('ListNode')) {
          return {
            __class__: 'ListNode',
            val: evalArgs[0] ?? 0,
            next: evalArgs[1] ?? null
          };
        }
        if (node.className.startsWith('TreeNode')) {
          return {
            __class__: 'TreeNode',
            val: evalArgs[0] ?? 0,
            left: evalArgs[1] ?? null,
            right: evalArgs[2] ?? null
          };
        }
        if (node.className.endsWith('[]')) {
          const size = evalArgs[0] || 0;
          return new Array(size).fill(0);
        }
        return { __class__: node.className };
      }

      case 'AssignExpr': {
        const val = this.evaluate(node.value, env, functions, classes);
        if (node.target.type === 'Identifier') {
          const varName = node.target.name;
          let finalVal = val;
          if (node.operator === '+=') finalVal = (env.get(varName) || 0) + val;
          if (node.operator === '-=') finalVal = (env.get(varName) || 0) - val;
          if (node.operator === '*=') finalVal = (env.get(varName) || 0) * val;
          if (node.operator === '/=') finalVal = Math.floor((env.get(varName) || 0) / val);
          if (node.operator === '%=') finalVal = (env.get(varName) || 0) % val;

          env.assign(varName, finalVal);
          return finalVal;
        } else if (node.target.type === 'IndexExpr') {
          const targetObj = this.evaluate(node.target.object, env, functions, classes);
          const indexVal = this.evaluate(node.target.index, env, functions, classes);
          if (Array.isArray(targetObj)) {
            let finalVal = val;
            if (node.operator === '+=') finalVal = targetObj[indexVal] + val;
            if (node.operator === '-=') finalVal = targetObj[indexVal] - val;
            targetObj[indexVal] = finalVal;
            return finalVal;
          } else if (targetObj && typeof targetObj === 'object') {
            targetObj[indexVal] = val;
            return val;
          }
        } else if (node.target.type === 'MemberExpr') {
          const targetObj = this.evaluate(node.target.object, env, functions, classes);
          if (targetObj && typeof targetObj === 'object') {
            targetObj[node.target.property] = val;
            return val;
          }
        }
        return val;
      }

      case 'BinaryExpr': {
        // C++ cout << ...
        if (node.operator === '<<' && node.left.type === 'Identifier' && node.left.name === 'cout') {
          const outVal = this.evaluate(node.right, env, functions, classes);
          const text = outVal === '\n' ? '\n' : String(outVal);
          this.stdoutBuffer.push(text);
          return 'cout';
        }

        const left = this.evaluate(node.left, env, functions, classes);
        const right = this.evaluate(node.right, env, functions, classes);

        switch (node.operator) {
          case '+': return left + right;
          case '-': return left - right;
          case '*': return left * right;
          case '/':
            if (right === 0) {
              const err = new Error('Division by zero');
              (err as any).line = node.line;
              throw err;
            }
            return Math.floor(left / right);
          case '%':
            if (right === 0) {
              const err = new Error('Modulo by zero');
              (err as any).line = node.line;
              throw err;
            }
            return left % right;
          case '==': return left === right;
          case '!=': return left !== right;
          case '<': return left < right;
          case '<=': return left <= right;
          case '>': return left > right;
          case '>=': return left >= right;
          case '&&': return left && right;
          case '||': return left || right;
          default: return undefined;
        }
      }

      case 'UnaryExpr': {
        if (node.prefix) {
          if (node.operator === '!') return !this.evaluate(node.argument, env, functions, classes);
          if (node.operator === '-') return -this.evaluate(node.argument, env, functions, classes);
          if (node.operator === '++' && node.argument.type === 'Identifier') {
            const v = env.get(node.argument.name) + 1;
            env.assign(node.argument.name, v);
            return v;
          }
          if (node.operator === '--' && node.argument.type === 'Identifier') {
            const v = env.get(node.argument.name) - 1;
            env.assign(node.argument.name, v);
            return v;
          }
        } else {
          if (node.operator === '++' && node.argument.type === 'Identifier') {
            const old = env.get(node.argument.name);
            env.assign(node.argument.name, old + 1);
            return old;
          }
          if (node.operator === '--' && node.argument.type === 'Identifier') {
            const old = env.get(node.argument.name);
            env.assign(node.argument.name, old - 1);
            return old;
          }
        }
        return this.evaluate(node.argument, env, functions, classes);
      }

      case 'TernaryExpr': {
        const cond = !!this.evaluate(node.condition, env, functions, classes);
        return cond
          ? this.evaluate(node.consequent, env, functions, classes)
          : this.evaluate(node.alternate, env, functions, classes);
      }

      case 'IndexExpr': {
        const obj = this.evaluate(node.object, env, functions, classes);
        const idx = this.evaluate(node.index, env, functions, classes);
        if (Array.isArray(obj)) {
          if (idx < 0 || idx >= obj.length) {
            const err = new Error(`Array index out of bounds: index ${idx}, length ${obj.length}`);
            (err as any).line = node.line;
            throw err;
          }
          return obj[idx];
        }
        if (typeof obj === 'string') {
          return obj[idx];
        }
        if (obj && typeof obj === 'object') {
          return obj[idx];
        }
        return undefined;
      }

      case 'MemberExpr': {
        const obj = this.evaluate(node.object, env, functions, classes);
        if (obj && typeof obj === 'object') {
          return obj[node.property];
        }
        return undefined;
      }

      case 'CallExpr': {
        return this.evaluateCall(node, env, functions, classes);
      }

      default:
        return undefined;
    }
  }

  private evaluateCall(
    node: CallExpr,
    env: Environment,
    functions: Map<string, FunctionDecl>,
    classes: Map<string, ClassDecl>
  ): any {
    const evalArgs = node.args.map((a) => this.evaluate(a, env, functions, classes));

    // 1. Method calls: obj.method(...)
    if (node.callee.type === 'MemberExpr') {
      const obj = this.evaluate(node.callee.object, env, functions, classes);
      const method = node.callee.property;

      // System.out.println / print
      if (
        node.callee.object.type === 'MemberExpr' &&
        node.callee.object.property === 'out'
      ) {
        if (method === 'println') {
          this.stdoutBuffer.push(evalArgs.join(' ') + '\n');
          return;
        }
        if (method === 'print') {
          this.stdoutBuffer.push(evalArgs.join(' '));
          return;
        }
      }

      // Arrays / Vectors: size(), push_back(), pop_back(), empty()
      if (Array.isArray(obj)) {
        if (method === 'size' || method === 'length') return obj.length;
        if (method === 'push_back' || method === 'add') {
          obj.push(evalArgs[0]);
          return;
        }
        if (method === 'pop_back') return obj.pop();
        if (method === 'empty' || method === 'isEmpty') return obj.length === 0;
        if (method === 'get') return obj[evalArgs[0]];
        if (method === 'set') {
          obj[evalArgs[0]] = evalArgs[1];
          return;
        }
        if (method === 'remove') return obj.splice(evalArgs[0], 1)[0];
      }

      // Strings: length(), charAt(), substring()
      if (typeof obj === 'string') {
        if (method === 'length' || method === 'size') return obj.length;
        if (method === 'charAt') return obj.charAt(evalArgs[0]);
        if (method === 'substring') return obj.substring(evalArgs[0], evalArgs[1]);
      }

      // Maps / Dictionaries
      if (obj && typeof obj === 'object') {
        if (method === 'put') {
          obj[evalArgs[0]] = evalArgs[1];
          return;
        }
        if (method === 'get') return obj[evalArgs[0]];
        if (method === 'containsKey' || method === 'count') return evalArgs[0] in obj;
        if (method === 'remove' || method === 'erase') {
          delete obj[evalArgs[0]];
          return;
        }
        if (method === 'size') return Object.keys(obj).length;
      }

      // Math functions
      if (node.callee.object.type === 'Identifier') {
        const objName = node.callee.object.name;
        if (objName === 'Math' || objName === 'std') {
          if (method === 'max') return Math.max(evalArgs[0], evalArgs[1]);
          if (method === 'min') return Math.min(evalArgs[0], evalArgs[1]);
          if (method === 'abs') return Math.abs(evalArgs[0]);
          if (method === 'floor') return Math.floor(evalArgs[0]);
          if (method === 'sqrt') return Math.sqrt(evalArgs[0]);
          if (method === 'swap') {
            // std::swap(a, b)
            return;
          }
        }
      }
    }

    // 2. Direct function call: fnName(...)
    if (node.callee.type === 'Identifier') {
      const fnName = node.callee.name;

      if (['max', 'std::max'].includes(fnName)) return Math.max(evalArgs[0], evalArgs[1]);
      if (['min', 'std::min'].includes(fnName)) return Math.min(evalArgs[0], evalArgs[1]);
      if (['abs', 'std::abs'].includes(fnName)) return Math.abs(evalArgs[0]);

      if (functions.has(fnName)) {
        const fnDecl = functions.get(fnName)!;
        this.callStack.push(fnName);
        const fnEnv = new Environment(env);

        for (let i = 0; i < fnDecl.params.length; i++) {
          const param = fnDecl.params[i];
          const isRef = param.type.includes('&');
          let val: any;
          if (isRef && node.args[i]?.type === 'Identifier') {
            val = env.get((node.args[i] as any).name);
          } else {
            val = evalArgs[i] !== undefined ? this.clone(evalArgs[i]) : this.getDefaultValueForType(param.type);
          }
          fnEnv.define(param.name, val, param.type);
        }

        this.recordStep(node.line, 'call', fnEnv);

        try {
          this.executeBlock(fnDecl.body, fnEnv, functions, classes);
        } catch (signal) {
          if (signal instanceof ReturnSignal) {
            this.callStack.pop();
            this.recordStep(node.line, 'return', env);
            return signal.value;
          }
          throw signal;
        }
        this.callStack.pop();
        return undefined;
      }
    }

    return undefined;
  }

  private checkStepCap() {
    this.stepCount++;
    if (this.stepCount > this.maxSteps) {
      this.truncated = true;
      throw new Error(`Execution stopped: step limit reached (${this.maxSteps} steps)`);
    }
  }

  private recordStep(
    line: number,
    event: TraceStep['event'],
    env: Environment,
    extra?: Partial<TraceStep>
  ) {
    const visibleVars = env.getAllVisible();
    const currVars: Record<string, VariableValue> = {};
    const changed: string[] = [];
    const structures: StructureInfo[] = [];

    for (const [k, vInfo] of Object.entries(visibleVars)) {
      if (['cout', 'cin', 'endl'].includes(k)) continue;

      const val = vInfo.value;
      const typeStr = this.inferTypeString(val, vInfo.type);

      currVars[k] = {
        type: typeStr,
        value: this.clone(val),
        raw: JSON.stringify(val)
      };

      if (this.prevVars[k] !== undefined && JSON.stringify(this.prevVars[k]) !== JSON.stringify(val)) {
        changed.push(k);
      }

      // Structure detection
      if (Array.isArray(val)) {
        if (val.length > 0 && Array.isArray(val[0])) {
          structures.push({
            id: k,
            kind: 'matrix',
            data: this.clone(val),
            pointers: {},
            highlighted: []
          });
        } else {
          structures.push({
            id: k,
            kind: 'array',
            data: this.clone(val),
            pointers: {},
            highlighted: []
          });
        }
      } else if (val && typeof val === 'object' && val.__class__ === 'ListNode') {
        structures.push({
          id: k,
          kind: 'linkedlist',
          data: this.serializeLinkedList(val),
          pointers: {},
          highlighted: []
        });
      } else if (val && typeof val === 'object' && val.__class__ === 'TreeNode') {
        structures.push({
          id: k,
          kind: 'tree',
          data: this.serializeTree(val),
          pointers: {},
          highlighted: []
        });
      } else if (val && typeof val === 'object' && !val.__class__) {
        structures.push({
          id: k,
          kind: 'map',
          data: this.clone(val),
          pointers: {},
          highlighted: []
        });
      }
    }

    // Pointers & highlight calculation
    for (const s of structures) {
      if (s.kind === 'array') {
        const arrLen = s.data.length;
        // Detect modified elements
        const oldArr = this.prevStructures[s.id];
        if (Array.isArray(oldArr)) {
          for (let i = 0; i < Math.min(oldArr.length, arrLen); i++) {
            if (oldArr[i] !== s.data[i]) {
              s.highlighted.push(i);
            }
          }
        }

        // Detect index pointers
        for (const [vName, vData] of Object.entries(currVars)) {
          if (vData.type === 'int') {
            const idx = vData.value;
            if (typeof idx === 'number' && idx >= 0 && idx < arrLen) {
              s.pointers[vName] = idx;
              if (changed.includes(vName) && !s.highlighted.includes(idx)) {
                s.highlighted.push(idx);
              }
            }
          }
        }
      }
    }

    this.trace.push({
      step: this.trace.length,
      line,
      event,
      frame: this.callStack[this.callStack.length - 1] || '<main>',
      depth: this.callStack.length - 1,
      vars: currVars,
      changed,
      structures,
      ...extra
    });

    this.prevVars = Object.fromEntries(
      Object.entries(currVars).map(([k, v]) => [k, this.clone(v.value)])
    );
    this.prevStructures = Object.fromEntries(
      structures.map((s) => [s.id, this.clone(s.data)])
    );
  }

  private serializeLinkedList(head: any): { nodes: any[] } {
    const nodes: any[] = [];
    let curr = head;
    let count = 0;
    while (curr && count < 50) {
      nodes.push({ id: `node_${count}`, val: curr.val });
      curr = curr.next;
      count++;
    }
    return { nodes };
  }

  private serializeTree(root: any): { nodes: any[]; edges: any[] } {
    const nodes: any[] = [];
    const edges: any[] = [];
    if (!root) return { nodes, edges };

    const queue: Array<{ node: any; id: string; parentId: string | null }> = [
      { node: root, id: '0', parentId: null }
    ];
    let count = 0;

    while (queue.length > 0 && count < 60) {
      const { node, id, parentId } = queue.shift()!;
      nodes.push({ id, val: node.val });
      if (parentId !== null) {
        edges.push({ from: parentId, to: id });
      }
      count++;
      if (node.left) queue.push({ node: node.left, id: id + 'L', parentId: id });
      if (node.right) queue.push({ node: node.right, id: id + 'R', parentId: id });
    }

    return { nodes, edges };
  }

  private inferTypeString(val: any, declaredType: string): string {
    if (val === null || val === undefined) return declaredType || 'null';
    if (typeof val === 'number') return Number.isInteger(val) ? 'int' : 'double';
    if (typeof val === 'boolean') return 'bool';
    if (typeof val === 'string') return 'string';
    if (Array.isArray(val)) {
      if (val.length > 0 && Array.isArray(val[0])) return 'matrix';
      return 'array';
    }
    if (val.__class__) return val.__class__;
    return declaredType || 'object';
  }

  private getDefaultValueForType(typeStr: string): any {
    const t = typeStr.toLowerCase();
    if (t.includes('hashmap') || t.includes('unordered_map') || t.includes('map')) return {};
    if (t.includes('hashset') || t.includes('unordered_set') || t.includes('set')) return [];
    if (t.includes('[]') || t.includes('vector')) return [];
    if (t.includes('int') || t.includes('long')) return 0;
    if (t.includes('double') || t.includes('float')) return 0.0;
    if (t.includes('bool')) return false;
    if (t.includes('string')) return '';
    return null;
  }

  private clone(val: any): any {
    if (val === null || val === undefined || typeof val !== 'object') return val;
    try {
      return JSON.parse(JSON.stringify(val));
    } catch (e) {
      return val;
    }
  }
}

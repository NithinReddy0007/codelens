import { Token } from './tokenizer';

export type ASTNode =
  | Program
  | FunctionDecl
  | ClassDecl
  | VarDecl
  | BlockStmt
  | IfStmt
  | WhileStmt
  | DoWhileStmt
  | ForStmt
  | RangeForStmt
  | ReturnStmt
  | BreakStmt
  | ContinueStmt
  | ExprStmt
  | BinaryExpr
  | UnaryExpr
  | AssignExpr
  | TernaryExpr
  | CallExpr
  | MemberExpr
  | IndexExpr
  | Identifier
  | Literal
  | NewExpr
  | ArrayLiteral;

export interface BaseNode {
  type: string;
  line: number;
}

export interface Program extends BaseNode {
  type: 'Program';
  body: ASTNode[];
}

export interface FunctionDecl extends BaseNode {
  type: 'FunctionDecl';
  name: string;
  returnType: string;
  params: Array<{ name: string; type: string }>;
  body: BlockStmt;
}

export interface ClassDecl extends BaseNode {
  type: 'ClassDecl';
  name: string;
  methods: FunctionDecl[];
  fields: VarDecl[];
}

export interface VarDecl extends BaseNode {
  type: 'VarDecl';
  varType: string;
  name: string;
  init?: ASTNode;
}

export interface BlockStmt extends BaseNode {
  type: 'BlockStmt';
  statements: ASTNode[];
}

export interface IfStmt extends BaseNode {
  type: 'IfStmt';
  condition: ASTNode;
  consequent: ASTNode;
  alternate?: ASTNode;
  conditionText?: string;
}

export interface WhileStmt extends BaseNode {
  type: 'WhileStmt';
  condition: ASTNode;
  body: ASTNode;
  conditionText?: string;
}

export interface DoWhileStmt extends BaseNode {
  type: 'DoWhileStmt';
  body: ASTNode;
  condition: ASTNode;
}

export interface ForStmt extends BaseNode {
  type: 'ForStmt';
  init?: ASTNode;
  condition?: ASTNode;
  update?: ASTNode;
  body: ASTNode;
  conditionText?: string;
}

export interface RangeForStmt extends BaseNode {
  type: 'RangeForStmt';
  varName: string;
  varType: string;
  iterable: ASTNode;
  body: ASTNode;
}

export interface ReturnStmt extends BaseNode {
  type: 'ReturnStmt';
  value?: ASTNode;
}

export interface BreakStmt extends BaseNode {
  type: 'BreakStmt';
}

export interface ContinueStmt extends BaseNode {
  type: 'ContinueStmt';
}

export interface ExprStmt extends BaseNode {
  type: 'ExprStmt';
  expr: ASTNode;
}

export interface BinaryExpr extends BaseNode {
  type: 'BinaryExpr';
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryExpr extends BaseNode {
  type: 'UnaryExpr';
  operator: string;
  argument: ASTNode;
  prefix: boolean;
}

export interface AssignExpr extends BaseNode {
  type: 'AssignExpr';
  operator: string;
  target: ASTNode;
  value: ASTNode;
}

export interface TernaryExpr extends BaseNode {
  type: 'TernaryExpr';
  condition: ASTNode;
  consequent: ASTNode;
  alternate: ASTNode;
}

export interface CallExpr extends BaseNode {
  type: 'CallExpr';
  callee: ASTNode;
  args: ASTNode[];
}

export interface MemberExpr extends BaseNode {
  type: 'MemberExpr';
  object: ASTNode;
  property: string;
  isArrow: boolean;
}

export interface IndexExpr extends BaseNode {
  type: 'IndexExpr';
  object: ASTNode;
  index: ASTNode;
}

export interface Identifier extends BaseNode {
  type: 'Identifier';
  name: string;
}

export interface Literal extends BaseNode {
  type: 'Literal';
  value: any;
  raw: string;
}

export interface NewExpr extends BaseNode {
  type: 'NewExpr';
  className: string;
  args: ASTNode[];
}

export interface ArrayLiteral extends BaseNode {
  type: 'ArrayLiteral';
  elements: ASTNode[];
}

export class Parser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.current] || { type: 'eof', value: '', line: 0, column: 0 };
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'eof';
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private check(value: string): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().value === value;
  }

  private match(...values: string[]): boolean {
    for (const val of values) {
      if (this.check(val)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(value: string, message: string): Token {
    if (this.check(value)) return this.advance();
    const token = this.peek();
    throw new Error(`${message} at line ${token.line}, got "${token.value}"`);
  }

  public parse(): Program {
    const statements: ASTNode[] = [];
    const startLine = this.peek().line;

    while (!this.isAtEnd()) {
      // Skip top-level package or import statements
      if (this.match('package', 'import', 'using')) {
        while (!this.isAtEnd() && !this.check(';')) {
          this.advance();
        }
        this.match(';');
        continue;
      }

      // Skip visibility qualifiers
      if (this.check('public') || this.check('private') || this.check('protected')) {
        const nextNext = this.tokens[this.current + 1]?.value;
        if (nextNext === ':') {
          // C++ access label: public:
          this.advance(); // public
          this.advance(); // :
          continue;
        }
      }

      statements.push(this.declaration());
    }

    return {
      type: 'Program',
      body: statements,
      line: startLine
    };
  }

  private declaration(): ASTNode {
    // Class or Struct
    if (this.check('class') || this.check('struct')) {
      return this.classDeclaration();
    }

    // Function or Variable declaration
    return this.functionOrVarDeclaration();
  }

  private classDeclaration(): ClassDecl {
    const line = this.advance().line; // class or struct
    const name = this.consumeIdentifier('Expect class name');
    this.consume('{', "Expect '{' before class body");

    const methods: FunctionDecl[] = [];
    const fields: VarDecl[] = [];

    while (!this.check('}') && !this.isAtEnd()) {
      if (this.match('public', 'private', 'protected')) {
        if (this.match(':')) {
          continue;
        }
      }
      if (this.match('static')) {
        // Skip static qualifier
      }

      const decl = this.functionOrVarDeclaration();
      if (decl.type === 'FunctionDecl') {
        methods.push(decl);
      } else if (decl.type === 'VarDecl') {
        fields.push(decl);
      }
    }

    this.consume('}', "Expect '}' after class body");
    this.match(';'); // Optional trailing semicolon in C++

    return {
      type: 'ClassDecl',
      name,
      methods,
      fields,
      line
    };
  }

  private functionOrVarDeclaration(): ASTNode {
    const startLine = this.peek().line;

    // Skip qualifiers
    while (this.match('public', 'private', 'protected', 'static', 'inline', 'const', 'final')) {}

    // Parse type name (e.g. int, void, vector<int>, int[], TreeNode*)
    const typeStr = this.parseTypeString();

    // Check constructor: className(...)
    if (this.check('(') && !this.isAtEnd()) {
      // It was a constructor!
      const fnName = typeStr;
      return this.finishFunctionDecl(fnName, 'void', startLine);
    }

    const name = this.consumeIdentifier('Expect variable or function name');

    // If followed by '(', it is a function
    if (this.check('(')) {
      return this.finishFunctionDecl(name, typeStr, startLine);
    }

    // Otherwise, variable declaration
    let init: ASTNode | undefined;
    if (this.match('=')) {
      init = this.expression();
    } else if (this.check('{') && (typeStr.includes('[]') || typeStr.includes('vector'))) {
      init = this.arrayLiteral();
    }

    this.consume(';', "Expect ';' after variable declaration");

    return {
      type: 'VarDecl',
      varType: typeStr,
      name,
      init,
      line: startLine
    };
  }

  private finishFunctionDecl(name: string, returnType: string, line: number): FunctionDecl {
    this.consume('(', "Expect '(' after function name");
    const params: Array<{ name: string; type: string }> = [];

    if (!this.check(')')) {
      do {
        while (this.match('const')) {}
        const pType = this.parseTypeString();
        // Handle reference & or pointer *
        const pName = this.consumeIdentifier('Expect parameter name');
        params.push({ name: pName, type: pType });
      } while (this.match(','));
    }

    this.consume(')', "Expect ')' after parameters");
    const body = this.blockStatement();

    return {
      type: 'FunctionDecl',
      name,
      returnType,
      params,
      body,
      line
    };
  }

  private blockStatement(): BlockStmt {
    const line = this.peek().line;
    this.consume('{', "Expect '{' before block");
    const statements: ASTNode[] = [];

    while (!this.check('}') && !this.isAtEnd()) {
      statements.push(this.statement());
    }

    this.consume('}', "Expect '}' after block");
    return {
      type: 'BlockStmt',
      statements,
      line
    };
  }

  private statement(): ASTNode {
    if (this.match('if')) return this.ifStatement();
    if (this.match('while')) return this.whileStatement();
    if (this.match('do')) return this.doWhileStatement();
    if (this.match('for')) return this.forStatement();
    if (this.match('return')) return this.returnStatement();
    if (this.match('break')) {
      const line = this.previous().line;
      this.consume(';', "Expect ';' after 'break'");
      return { type: 'BreakStmt', line };
    }
    if (this.match('continue')) {
      const line = this.previous().line;
      this.consume(';', "Expect ';' after 'continue'");
      return { type: 'ContinueStmt', line };
    }
    if (this.check('{')) return this.blockStatement();

    // Check variable declaration inside block
    if (this.isTypeAhead()) {
      return this.functionOrVarDeclaration();
    }

    // Expression statement
    const line = this.peek().line;
    const expr = this.expression();
    this.consume(';', "Expect ';' after expression");
    return {
      type: 'ExprStmt',
      expr,
      line
    };
  }

  private ifStatement(): IfStmt {
    const line = this.previous().line;
    this.consume('(', "Expect '(' after 'if'");
    const condition = this.expression();
    this.consume(')', "Expect ')' after if condition");

    const consequent = this.check('{') ? this.blockStatement() : this.statement();
    let alternate: ASTNode | undefined;
    if (this.match('else')) {
      alternate = this.check('{') ? this.blockStatement() : this.statement();
    }

    return {
      type: 'IfStmt',
      condition,
      consequent,
      alternate,
      line
    };
  }

  private whileStatement(): WhileStmt {
    const line = this.previous().line;
    this.consume('(', "Expect '(' after 'while'");
    const condition = this.expression();
    this.consume(')', "Expect ')' after while condition");

    const body = this.check('{') ? this.blockStatement() : this.statement();
    return {
      type: 'WhileStmt',
      condition,
      body,
      line
    };
  }

  private doWhileStatement(): DoWhileStmt {
    const line = this.previous().line;
    const body = this.check('{') ? this.blockStatement() : this.statement();
    this.consume('while', "Expect 'while' after 'do' body");
    this.consume('(', "Expect '(' after 'while'");
    const condition = this.expression();
    this.consume(')', "Expect ')' after condition");
    this.consume(';', "Expect ';' after do-while");
    return {
      type: 'DoWhileStmt',
      body,
      condition,
      line
    };
  }

  private forStatement(): ASTNode {
    const line = this.previous().line;
    this.consume('(', "Expect '(' after 'for'");

    // Check range-based for: for (int x : nums) or for (auto x : nums)
    if (this.isTypeAhead()) {
      const varType = this.parseTypeString();
      const varName = this.consumeIdentifier('Expect variable name in for loop');
      if (this.match(':')) {
        const iterable = this.expression();
        this.consume(')', "Expect ')' after range-for");
        const body = this.check('{') ? this.blockStatement() : this.statement();
        return {
          type: 'RangeForStmt',
          varType,
          varName,
          iterable,
          body,
          line
        };
      }
      // Standard for loop with init declaration
      let initExpr: ASTNode | undefined;
      if (this.match('=')) {
        initExpr = this.expression();
      }
      this.consume(';', "Expect ';' after for init");
      const init: VarDecl = {
        type: 'VarDecl',
        varType,
        name: varName,
        init: initExpr,
        line
      };
      return this.finishStandardFor(init, line);
    }

    let init: ASTNode | undefined;
    if (!this.match(';')) {
      init = this.expression();
      this.consume(';', "Expect ';' after for init");
    }

    return this.finishStandardFor(init, line);
  }

  private finishStandardFor(init: ASTNode | undefined, line: number): ForStmt {
    let condition: ASTNode | undefined;
    if (!this.check(';')) {
      condition = this.expression();
    }
    this.consume(';', "Expect ';' after for condition");

    let update: ASTNode | undefined;
    if (!this.check(')')) {
      update = this.expression();
    }
    this.consume(')', "Expect ')' after for clauses");

    const body = this.check('{') ? this.blockStatement() : this.statement();
    return {
      type: 'ForStmt',
      init,
      condition,
      update,
      body,
      line
    };
  }

  private returnStatement(): ReturnStmt {
    const line = this.previous().line;
    let value: ASTNode | undefined;
    if (!this.check(';')) {
      value = this.expression();
    }
    this.consume(';', "Expect ';' after return value");
    return {
      type: 'ReturnStmt',
      value,
      line
    };
  }

  private expression(): ASTNode {
    return this.assignment();
  }

  private assignment(): ASTNode {
    const expr = this.ternary();

    if (
      this.match('=', '+=', '-=', '*=', '/=', '%=')
    ) {
      const op = this.previous().value;
      const value = this.assignment();
      return {
        type: 'AssignExpr',
        operator: op,
        target: expr,
        value,
        line: expr.line
      };
    }

    return expr;
  }

  private ternary(): ASTNode {
    let expr = this.logicalOr();

    if (this.match('?')) {
      const consequent = this.expression();
      this.consume(':', "Expect ':' in ternary expression");
      const alternate = this.expression();
      return {
        type: 'TernaryExpr',
        condition: expr,
        consequent,
        alternate,
        line: expr.line
      };
    }

    return expr;
  }

  private logicalOr(): ASTNode {
    let expr = this.logicalAnd();
    while (this.match('||')) {
      const op = this.previous().value;
      const right = this.logicalAnd();
      expr = {
        type: 'BinaryExpr',
        operator: op,
        left: expr,
        right,
        line: expr.line
      };
    }
    return expr;
  }

  private logicalAnd(): ASTNode {
    let expr = this.equality();
    while (this.match('&&')) {
      const op = this.previous().value;
      const right = this.equality();
      expr = {
        type: 'BinaryExpr',
        operator: op,
        left: expr,
        right,
        line: expr.line
      };
    }
    return expr;
  }

  private equality(): ASTNode {
    let expr = this.comparison();
    while (this.match('==', '!=')) {
      const op = this.previous().value;
      const right = this.comparison();
      expr = {
        type: 'BinaryExpr',
        operator: op,
        left: expr,
        right,
        line: expr.line
      };
    }
    return expr;
  }

  private comparison(): ASTNode {
    let expr = this.term();
    while (this.match('<', '<=', '>', '>=')) {
      const op = this.previous().value;
      const right = this.term();
      expr = {
        type: 'BinaryExpr',
        operator: op,
        left: expr,
        right,
        line: expr.line
      };
    }
    return expr;
  }

  private term(): ASTNode {
    let expr = this.factor();
    while (this.match('+', '-', '<<', '>>')) {
      const op = this.previous().value;
      const right = this.factor();
      expr = {
        type: 'BinaryExpr',
        operator: op,
        left: expr,
        right,
        line: expr.line
      };
    }
    return expr;
  }

  private factor(): ASTNode {
    let expr = this.unary();
    while (this.match('*', '/', '%')) {
      const op = this.previous().value;
      const right = this.unary();
      expr = {
        type: 'BinaryExpr',
        operator: op,
        left: expr,
        right,
        line: expr.line
      };
    }
    return expr;
  }

  private unary(): ASTNode {
    if (this.match('!', '-', '+', '++', '--')) {
      const op = this.previous().value;
      const arg = this.unary();
      return {
        type: 'UnaryExpr',
        operator: op,
        argument: arg,
        prefix: true,
        line: arg.line
      };
    }
    return this.postfix();
  }

  private postfix(): ASTNode {
    let expr = this.primary();

    while (true) {
      if (this.match('(')) {
        // Call
        const args: ASTNode[] = [];
        if (!this.check(')')) {
          do {
            args.push(this.expression());
          } while (this.match(','));
        }
        this.consume(')', "Expect ')' after call arguments");
        expr = {
          type: 'CallExpr',
          callee: expr,
          args,
          line: expr.line
        };
      } else if (this.match('[')) {
        // Index
        const index = this.expression();
        this.consume(']', "Expect ']' after index");
        expr = {
          type: 'IndexExpr',
          object: expr,
          index,
          line: expr.line
        };
      } else if (this.match('.', '->', '::')) {
        const isArrow = this.previous().value === '->';
        const property = this.consumeIdentifier('Expect property or method name');
        expr = {
          type: 'MemberExpr',
          object: expr,
          property,
          isArrow,
          line: expr.line
        };
      } else if (this.match('++', '--')) {
        const op = this.previous().value;
        expr = {
          type: 'UnaryExpr',
          operator: op,
          argument: expr,
          prefix: false,
          line: expr.line
        };
      } else {
        break;
      }
    }

    return expr;
  }

  private primary(): ASTNode {
    const line = this.peek().line;

    if (this.match('true')) return { type: 'Literal', value: true, raw: 'true', line };
    if (this.match('false')) return { type: 'Literal', value: false, raw: 'false', line };
    if (this.match('null', 'nullptr')) return { type: 'Literal', value: null, raw: 'null', line };

    if (this.peek().type === 'number') {
      const val = this.advance().value;
      const num = val.includes('.') ? parseFloat(val) : parseInt(val, 10);
      return { type: 'Literal', value: num, raw: val, line };
    }

    if (this.peek().type === 'string') {
      const val = this.advance().value;
      return { type: 'Literal', value: val, raw: JSON.stringify(val), line };
    }

    if (this.peek().type === 'char') {
      const val = this.advance().value;
      return { type: 'Literal', value: val, raw: `'${val}'`, line };
    }

    if (this.match('new')) {
      const className = this.parseTypeString();
      if (className.includes('[]')) {
        // className already swallowed the brackets, e.g. int[]
        if (this.check('{')) {
          return this.arrayLiteral();
        }
      }
      if (this.match('[')) {
        // new int[5] or new int[] { 1, 2 }
        let sizeExpr: ASTNode | undefined;
        if (!this.check(']')) {
          sizeExpr = this.expression();
        }
        this.consume(']', "Expect ']' after array size");
        if (this.check('{')) {
          return this.arrayLiteral();
        }
        return {
          type: 'NewExpr',
          className: className + '[]',
          args: sizeExpr ? [sizeExpr] : [],
          line
        };
      }
      if (this.check('{')) {
        return this.arrayLiteral();
      }
      this.consume('(', "Expect '(' after class name in new");
      const args: ASTNode[] = [];
      if (!this.check(')')) {
        do {
          args.push(this.expression());
        } while (this.match(','));
      }
      this.consume(')', "Expect ')' after constructor args");
      return {
        type: 'NewExpr',
        className,
        args,
        line
      };
    }

    if (this.check('{')) {
      return this.arrayLiteral();
    }

    if (this.peek().type === 'identifier' || this.peek().type === 'keyword') {
      const id = this.advance().value;
      return {
        type: 'Identifier',
        name: id,
        line
      };
    }

    if (this.match('(')) {
      const expr = this.expression();
      this.consume(')', "Expect ')' after expression");
      return expr;
    }

    throw new Error(`Unsupported construct: "${this.peek().value}" at line ${line}`);
  }

  private arrayLiteral(): ArrayLiteral {
    const line = this.peek().line;
    this.consume('{', "Expect '{' for array literal");
    const elements: ASTNode[] = [];
    if (!this.check('}')) {
      do {
        elements.push(this.expression());
      } while (this.match(','));
    }
    this.consume('}', "Expect '}' after array literal");
    return {
      type: 'ArrayLiteral',
      elements,
      line
    };
  }

  private parseTypeString(): string {
    let t = this.advance().value;
    while (this.match('::')) {
      t += '::' + this.consumeIdentifier('Expect identifier after ::');
    }
    if (this.match('<')) {
      if (this.match('>')) {
        t += '<>';
      } else {
        t += '<' + this.parseTypeString();
        while (this.match(',')) {
          t += ', ' + this.parseTypeString();
        }
        if (this.check('>>')) {
          this.peek().value = '>';
          t += '>';
        } else {
          this.consume('>', "Expect '>' closing template");
          t += '>';
        }
      }
    }
    while (this.match('[')) {
      if (!this.check(']')) {
        // e.g. new int[0] — put the token back so new expression handler can parse the size expression!
        this.current--;
        break;
      }
      this.consume(']', "Expect ']'");
      t += '[]';
    }
    while (this.match('*', '&')) {
      t += this.previous().value;
    }
    return t;
  }

  private isTypeAhead(): boolean {
    const val = this.peek().value;
    if (val === 'std' && this.tokens[this.current + 1]?.value === '::') {
      return true;
    }
    return [
      'int', 'long', 'double', 'float', 'char', 'byte', 'short', 'bool', 'boolean', 'void',
      'string', 'String', 'vector', 'ArrayList', 'List', 'Map', 'Set', 'unordered_map', 'HashMap',
      'unordered_set', 'HashSet', 'set', 'stack', 'Stack', 'queue', 'Queue', 'Deque', 'ArrayDeque',
      'LinkedList', 'Integer', 'Character', 'Double', 'Boolean', 'Long', 'Object',
      'pair', 'auto', 'ListNode', 'TreeNode', 'Solution'
    ].includes(val);
  }

  private consumeIdentifier(msg: string): string {
    if (this.peek().type === 'identifier' || this.peek().type === 'keyword') {
      return this.advance().value;
    }
    throw new Error(`${msg} at line ${this.peek().line}, got "${this.peek().value}"`);
  }
}

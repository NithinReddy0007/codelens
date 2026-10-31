const f=`
import sys
import io
import json
import ast
import traceback

MAX_STEPS_DEFAULT = 20000

class StopExecution(Exception):
    pass

class CodeAnalyzer(ast.NodeVisitor):
    def __init__(self, source_code: str):
        self.source = source_code
        self.lines = source_code.splitlines()
        self.if_nodes = {}
        self.while_nodes = {}
        self.for_nodes = {}
        self.function_defs = []
        self.class_defs = []
        self.has_top_level_exec = False
        self.sol_class_method = None

    def analyze(self):
        try:
            tree = ast.parse(self.source)
            for stmt in tree.body:
                if isinstance(stmt, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    self.function_defs.append(stmt.name)
                elif isinstance(stmt, ast.ClassDef):
                    self.class_defs.append(stmt.name)
                    for item in stmt.body:
                        if isinstance(item, ast.FunctionDef) and not item.name.startswith('_'):
                            args = [arg.arg for arg in item.args.args if arg.arg != 'self']
                            if not self.sol_class_method:
                                self.sol_class_method = (stmt.name, item.name, args)
                elif isinstance(stmt, (ast.Import, ast.ImportFrom)):
                    continue
                else:
                    self.has_top_level_exec = True

            for node in ast.walk(tree):
                lineno = getattr(node, 'lineno', None)
                if lineno is None:
                    continue
                if isinstance(node, ast.If):
                    try:
                        cond = ast.unparse(node.test)
                    except Exception:
                        cond = self.lines[lineno - 1].strip() if lineno <= len(self.lines) else 'condition'
                    self.if_nodes[lineno] = cond
                elif isinstance(node, ast.While):
                    try:
                        cond = ast.unparse(node.test)
                    except Exception:
                        cond = self.lines[lineno - 1].strip() if lineno <= len(self.lines) else 'condition'
                    self.while_nodes[lineno] = cond
                elif isinstance(node, ast.For):
                    try:
                        target = ast.unparse(node.target)
                        iter_s = ast.unparse(node.iter)
                        cond = f"{target} in {iter_s}"
                    except Exception:
                        cond = self.lines[lineno - 1].strip() if lineno <= len(self.lines) else 'loop'
                    self.for_nodes[lineno] = cond
        except Exception:
            pass

def serialize_val(val, depth=0):
    if val is None:
        return ('NoneType', None, 'None')
    elif isinstance(val, bool):
        return ('bool', val, str(val))
    elif isinstance(val, int):
        return ('int', val, str(val))
    elif isinstance(val, float):
        return ('float', round(val, 6), str(val))
    elif isinstance(val, str):
        if len(val) > 200:
            return ('str', val[:200] + '...', repr(val[:200] + '...'))
        return ('str', val, repr(val))
    elif isinstance(val, (list, tuple)):
        tname = 'list' if isinstance(val, list) else 'tuple'
        if depth > 3 or len(val) > 100:
            return (tname, [str(x) for x in val[:50]], f"{tname}[{len(val)}]")
        try:
            return (tname, [serialize_val(x, depth + 1)[1] for x in val], repr(val))
        except Exception:
            return (tname, [], repr(val))
    elif isinstance(val, dict):
        if depth > 2 or len(val) > 100:
            return ('dict', {str(k): str(v) for k, v in list(val.items())[:20]}, f"dict[{len(val)}]")
        try:
            return ('dict', {str(k): serialize_val(v, depth + 1)[1] for k, v in val.items()}, repr(val))
        except Exception:
            return ('dict', {}, repr(val))
    elif isinstance(val, set):
        try:
            items = [serialize_val(x, depth + 1)[1] for x in list(val)[:50]]
            return ('set', items, repr(val))
        except Exception:
            return ('set', [], repr(val))
    else:
        cls_name = val.__class__.__name__
        if hasattr(val, 'val') or hasattr(val, 'value') or hasattr(val, 'data'):
            node_val = getattr(val, 'val', getattr(val, 'value', getattr(val, 'data', None)))
            has_next = hasattr(val, 'next')
            has_left_right = hasattr(val, 'left') or hasattr(val, 'right')
            if has_next:
                return ('ListNode', {'val': node_val, 'id': id(val)}, f"ListNode({node_val})")
            if has_left_right:
                return ('TreeNode', {'val': node_val, 'id': id(val)}, f"TreeNode({node_val})")
        return (cls_name, str(val), str(val))

def extract_linked_list(head_node, max_len=50):
    nodes = []
    curr = head_node
    visited = set()
    while curr is not None and len(nodes) < max_len:
        node_id = str(id(curr))
        if node_id in visited:
            nodes.append({'id': 'cycle', 'val': 'CYCLE'})
            break
        visited.add(node_id)
        val = getattr(curr, 'val', getattr(curr, 'value', getattr(curr, 'data', '?')))
        nodes.append({'id': node_id, 'val': val})
        curr = getattr(curr, 'next', None)
    return {'nodes': nodes}

def extract_tree(root_node, max_nodes=60):
    nodes = []
    edges = []
    if root_node is None:
        return {'nodes': [], 'edges': []}
    queue = [(root_node, '0', None)]
    count = 0
    while queue and count < max_nodes:
        curr, curr_id, parent_id = queue.pop(0)
        count += 1
        val = getattr(curr, 'val', getattr(curr, 'value', getattr(curr, 'data', '?')))
        nodes.append({'id': curr_id, 'val': val})
        if parent_id is not None:
            edges.append({'from': parent_id, 'to': curr_id})
        
        left = getattr(curr, 'left', None)
        right = getattr(curr, 'right', None)
        if left is not None:
            queue.append((left, curr_id + 'L', curr_id))
        if right is not None:
            queue.append((right, curr_id + 'R', curr_id))
    return {'nodes': nodes, 'edges': edges}

def run_python_tracer(user_code, harness_input=None, max_steps=MAX_STEPS_DEFAULT):
    try:
        compile(user_code, '<user_code>', 'exec')
    except SyntaxError as e:
        return json.dumps({
            'success': False,
            'trace': [],
            'totalSteps': 0,
            'truncated': False,
            'error': {
                'line': e.lineno or 1,
                'message': f"SyntaxError: {e.msg} at line {e.lineno}, column {e.offset}",
                'type': 'SyntaxError'
            },
            'stdout': ''
        })
    except Exception as e:
        return json.dumps({
            'success': False,
            'trace': [],
            'totalSteps': 0,
            'truncated': False,
            'error': {
                'line': 1,
                'message': str(e),
                'type': 'CompileError'
            },
            'stdout': ''
        })

    analyzer = CodeAnalyzer(user_code)
    analyzer.analyze()

    helpers = """
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
    def __repr__(self):
        return f"ListNode({self.val})"

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
    def __repr__(self):
        return f"TreeNode({self.val})"
"""

    code_to_exec = user_code
    harness_append = ""
    if not analyzer.has_top_level_exec:
        if analyzer.sol_class_method:
            cls_name, method_name, args = analyzer.sol_class_method
            call_args = []
            if harness_input and 'args' in harness_input:
                for arg_val in harness_input['args']:
                    call_args.append(repr(arg_val))
            arg_str = ", ".join(call_args)
            harness_append = f"\\n__solution__ = {cls_name}()\\n__result__ = __solution__.{method_name}({arg_str})\\n"
        elif analyzer.function_defs:
            fn_name = analyzer.function_defs[0]
            call_args = []
            if harness_input and 'args' in harness_input:
                for arg_val in harness_input['args']:
                    call_args.append(repr(arg_val))
            arg_str = ", ".join(call_args)
            harness_append = f"\\n__result__ = {fn_name}({arg_str})\\n"

    total_code = helpers + "\\n" + code_to_exec + harness_append
    helpers_line_count = len(helpers.strip().splitlines()) + 1

    trace = []
    prev_vars = {}
    prev_structures = {}
    prev_line = -1
    loop_iterations = {}
    step_count = 0
    truncated = False
    return_value = None

    class StdoutCapture:
        def __init__(self):
            self.buf = io.StringIO()
            self.last_pos = 0

        def write(self, s):
            self.buf.write(s)

        def flush(self):
            self.buf.flush()

        def get_delta(self):
            self.buf.seek(self.last_pos)
            delta = self.buf.read()
            self.last_pos = self.buf.tell()
            return delta

        def get_all(self):
            return self.buf.getvalue()

    capture = StdoutCapture()
    old_stdout = sys.stdout
    sys.stdout = capture

    def tracer(frame, event, arg):
        nonlocal step_count, truncated, prev_vars, prev_structures, prev_line, return_value
        if frame.f_code.co_filename != '<user_code>':
            return tracer

        raw_line = frame.f_lineno
        user_line = raw_line - helpers_line_count
        if user_line < 1 or user_line > len(analyzer.lines):
            return tracer

        step_count += 1
        if step_count > max_steps:
            truncated = True
            raise StopExecution("Execution stopped: step limit reached")

        curr_vars = {}
        changed = []
        structures = []

        local_items = dict(frame.f_locals)
        for k, v in local_items.items():
            if k.startswith('__') or k in ('ListNode', 'TreeNode', 'self', '__solution__', '__result__'):
                continue
            type_str, s_val, raw_s = serialize_val(v)
            curr_vars[k] = {'type': type_str, 'value': s_val, 'raw': raw_s}

            old_val = prev_vars.get(k)
            if old_val != s_val:
                changed.append(k)

            if isinstance(v, list):
                if len(v) > 0 and isinstance(v[0], list):
                    structures.append({
                        'id': k,
                        'kind': 'matrix',
                        'data': s_val,
                        'pointers': {},
                        'highlighted': []
                    })
                else:
                    structures.append({
                        'id': k,
                        'kind': 'array',
                        'data': s_val,
                        'pointers': {},
                        'highlighted': []
                    })
            elif isinstance(v, dict):
                structures.append({
                    'id': k,
                    'kind': 'map',
                    'data': s_val,
                    'pointers': {},
                    'highlighted': []
                })
            elif isinstance(v, set):
                structures.append({
                    'id': k,
                    'kind': 'set',
                    'data': s_val,
                    'pointers': {},
                    'highlighted': []
                })
            elif type_str == 'ListNode':
                structures.append({
                    'id': k,
                    'kind': 'linkedlist',
                    'data': extract_linked_list(v),
                    'pointers': {},
                    'highlighted': []
                })
            elif type_str == 'TreeNode':
                structures.append({
                    'id': k,
                    'kind': 'tree',
                    'data': extract_tree(v),
                    'pointers': {},
                    'highlighted': []
                })

        # Pointers and cell highlight detection
        for s in structures:
            if s['kind'] == 'array':
                arr_len = len(s['data'])
                # Detect changed indices
                old_arr = prev_structures.get(s['id'])
                if old_arr and isinstance(old_arr, list):
                    for idx in range(min(len(old_arr), arr_len)):
                        if old_arr[idx] != s['data'][idx]:
                            s['highlighted'].append(idx)
                
                # Attach index pointers
                for vk, v_info in curr_vars.items():
                    if v_info['type'] == 'int':
                        val = v_info['value']
                        if 0 <= val < arr_len:
                            s['pointers'][vk] = val
                            if val not in s['highlighted']:
                                s['highlighted'].append(val)

        loop_info = None
        if user_line in analyzer.while_nodes or user_line in analyzer.for_nodes:
            loop_iterations[user_line] = loop_iterations.get(user_line, 0) + 1
            loop_info = {'line': user_line, 'iteration': loop_iterations[user_line]}

        branch_info = None
        if user_line in analyzer.if_nodes:
            cond_str = analyzer.if_nodes[user_line]
            branch_info = {'line': user_line, 'condition': cond_str, 'result': True}

        delta_stdout = capture.get_delta()

        call_stack_frames = []
        curr_f = frame
        while curr_f:
            if curr_f.f_code.co_filename == '<user_code>':
                f_name = curr_f.f_code.co_name
                f_line = max(1, curr_f.f_lineno - helpers_line_count)
                f_vars = {k: serialize_val(v)[1] for k, v in curr_f.f_locals.items()
                          if not k.startswith('__') and k not in ('ListNode', 'TreeNode', 'self', '__solution__', '__result__')}
                call_stack_frames.append({
                    'name': f_name,
                    'line': f_line,
                    'variables': f_vars
                })
            curr_f = curr_f.f_back
        call_stack_frames.reverse()

        step_data = {
            'step': len(trace),
            'line': user_line,
            'event': event,
            'frame': frame.f_code.co_name,
            'depth': max(0, len(call_stack_frames) - 1),
            'callStack': call_stack_frames,
            'vars': curr_vars,
            'changed': changed,
            'structures': structures,
            'branch': branch_info,
            'loop': loop_info,
            'stdout': delta_stdout if delta_stdout else None
        }

        if event == 'return':
            return_value = serialize_val(arg)[1]

        trace.append(step_data)
        prev_vars = {k: v['value'] for k, v in curr_vars.items()}
        prev_structures = {s['id']: s['data'] for s in structures}
        prev_line = user_line
        return tracer

    err_obj = None
    try:
        compiled = compile(total_code, '<user_code>', 'exec')
        sys.settrace(tracer)
        global_scope = {}
        exec(compiled, global_scope)
        if '__result__' in global_scope:
            return_value = serialize_val(global_scope['__result__'])[1]
    except StopExecution:
        pass
    except Exception as e:
        tb = traceback.extract_tb(sys.exc_info()[2])
        err_line = 1
        for frame_summary in reversed(tb):
            if frame_summary.filename == '<user_code>':
                err_line = max(1, frame_summary.lineno - helpers_line_count)
                break
        err_obj = {
            'line': err_line,
            'message': f"{type(e).__name__}: {str(e)}",
            'type': type(e).__name__
        }
    finally:
        sys.settrace(None)
        sys.stdout = old_stdout

    return json.dumps({
        'success': err_obj is None,
        'trace': trace,
        'totalSteps': len(trace),
        'truncated': truncated,
        'error': err_obj,
        'stdout': capture.get_all(),
        'returnValue': return_value
    })
`;let r=null,n=!1,l=null;async function o(){if(r)return r;if(n){for(;n;)await new Promise(e=>setTimeout(e,100));if(r)return r;throw new Error(l||"Pyodide failed to load")}n=!0,self.postMessage({type:"status",status:"loading",message:"Downloading & initializing Pyodide runtime..."});try{const{loadPyodide:e}=await import("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.mjs"),s=await e({stdout:a=>{},stderr:a=>console.error("[Pyodide stderr]",a)});return await s.runPythonAsync(f),r=s,n=!1,self.postMessage({type:"status",status:"ready",message:"Pyodide ready"}),r}catch(e){throw n=!1,l=(e==null?void 0:e.message)||String(e),self.postMessage({type:"status",status:"error",message:`Pyodide init error: ${l}`}),e}}self.onmessage=async e=>{const{id:s,type:a,code:_,harnessInput:i,maxSteps:d}=e.data;if(a==="init"){try{await o()}catch(t){self.postMessage({id:s,type:"status",status:"error",message:t.message})}return}if(a==="run")try{const t=await o();t.globals.set("__user_code_input__",_),t.globals.set("__user_harness_input__",i?JSON.stringify(i):null),t.globals.set("__user_max_steps__",d||2e4);const c=await t.runPythonAsync(`
import json
h_in = json.loads(__user_harness_input__) if __user_harness_input__ else None
run_python_tracer(__user_code_input__, h_in, __user_max_steps__)
`),u=JSON.parse(c);self.postMessage({id:s,type:"result",result:u})}catch(t){self.postMessage({id:s,type:"result",result:{success:!1,trace:[],totalSteps:0,truncated:!1,error:{line:1,message:t.message||String(t),type:"WorkerRuntimeError"},stdout:""}})}};

"""
CodeLens Python Tracing Engine
Executes Python code with sys.settrace, recording line events, variables,
pointers, data structures, branch evaluations, loop iterations, and stdout.
"""

import sys
import io
import json
import ast
import traceback
from typing import Any, Dict, List, Optional, Set, Tuple

MAX_STEPS_DEFAULT = 20000

class StopExecution(Exception):
    pass

class CodeAnalyzer(ast.NodeVisitor):
    def __init__(self, source_code: str):
        self.source = source_code
        self.lines = source_code.splitlines()
        self.if_nodes: Dict[int, str] = {} # line -> condition string
        self.while_nodes: Dict[int, str] = {} # line -> condition string
        self.for_nodes: Dict[int, str] = {} # line -> iter expression
        self.function_defs: List[str] = []
        self.class_defs: List[str] = []
        self.has_top_level_exec = False
        self.sol_class_method: Optional[Tuple[str, str, List[str]]] = None # class, method, args

    def analyze(self):
        try:
            tree = ast.parse(self.source)
            for stmt in tree.body:
                if isinstance(stmt, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    self.function_defs.append(stmt.name)
                elif isinstance(stmt, ast.ClassDef):
                    self.class_defs.append(stmt.name)
                    # Check for LeetCode class Solution
                    for item in stmt.body:
                        if isinstance(item, ast.FunctionDef) and not item.name.startswith('_'):
                            args = [arg.arg for arg in item.args.args if arg.arg != 'self']
                            if not self.sol_class_method:
                                self.sol_class_method = (stmt.name, item.name, args)
                elif isinstance(stmt, (ast.Import, ast.ImportFrom)):
                    continue
                else:
                    self.has_top_level_exec = True

            # Collect branches and loops
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

def serialize_val(val: Any, depth: int = 0) -> Tuple[str, Any, str]:
    """Returns (type_str, serializable_value, raw_str)"""
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
        # Check if 1D or 2D
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
        # Check for ListNode or TreeNode
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

def extract_linked_list(head_node: Any, max_len: int = 50) -> Dict[str, Any]:
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

def extract_tree(root_node: Any, max_nodes: int = 60) -> Dict[str, Any]:
    nodes = []
    edges = []
    if root_node is None:
        return {'nodes': [], 'edges': []}
    queue = [(root_node, '0', None)] # node, id, parent_id
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

def run_python_tracer(user_code: str, harness_input: Optional[Dict[str, Any]] = None, max_steps: int = MAX_STEPS_DEFAULT) -> Dict[str, Any]:
    stdout_buf = io.StringIO()
    old_stdout = sys.stdout

    # 1. Syntax check
    try:
        compile(user_code, '<user_code>', 'exec')
    except SyntaxError as e:
        return {
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
        }
    except Exception as e:
        return {
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
        }

    # 2. Analyze AST
    analyzer = CodeAnalyzer(user_code)
    analyzer.analyze()

    # LeetCode helper definitions prepended if needed
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
    # If no top-level exec and has class Solution or function, create harness call
    harness_append = ""
    if not analyzer.has_top_level_exec:
        if analyzer.sol_class_method:
            cls_name, method_name, args = analyzer.sol_class_method
            call_args = []
            if harness_input and 'args' in harness_input:
                for arg_val in harness_input['args']:
                    call_args.append(repr(arg_val))
            arg_str = ", ".join(call_args)
            harness_append = f"\n__solution__ = {cls_name}()\n__result__ = __solution__.{method_name}({arg_str})\n"
        elif analyzer.function_defs:
            fn_name = analyzer.function_defs[0]
            call_args = []
            if harness_input and 'args' in harness_input:
                for arg_val in harness_input['args']:
                    call_args.append(repr(arg_val))
            arg_str = ", ".join(call_args)
            harness_append = f"\n__result__ = {fn_name}({arg_str})\n"

    total_code = helpers + "\n" + code_to_exec + harness_append
    helpers_line_count = len(helpers.strip().splitlines()) + 1

    trace: List[Dict[str, Any]] = []
    prev_vars: Dict[str, Any] = {}
    prev_line = -1
    loop_iterations: Dict[int, int] = {}
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
    sys.stdout = capture

    def tracer(frame, event, arg):
        nonlocal step_count, truncated, prev_vars, prev_line, return_value
        if frame.f_code.co_filename != '<user_code>':
            return tracer

        raw_line = frame.f_lineno
        user_line = raw_line - helpers_line_count
        if user_line < 1:
            return tracer
        if user_line > len(analyzer.lines):
            return tracer

        step_count += 1
        if step_count > max_steps:
            truncated = True
            raise StopExecution("Execution stopped: step limit reached")

        # Capture locals
        curr_vars: Dict[str, Dict[str, Any]] = {}
        changed: List[str] = []
        structures: List[Dict[str, Any]] = []

        local_items = dict(frame.f_locals)
        for k, v in local_items.items():
            if k.startswith('__') or k in ('ListNode', 'TreeNode', 'self', '__solution__', '__result__'):
                continue
            type_str, s_val, raw_s = serialize_val(v)
            curr_vars[k] = {'type': type_str, 'value': s_val, 'raw': raw_s}

            # Check for changes
            old_val = prev_vars.get(k)
            if old_val != s_val:
                changed.append(k)

            # Structure detection
            if isinstance(v, list):
                if len(v) > 0 and isinstance(v[0], list):
                    # 2D matrix
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

        # Pointers & highlights detection
        for s in structures:
            if s['kind'] == 'array':
                arr_len = len(s['data'])
                for vk, v_info in curr_vars.items():
                    if v_info['type'] == 'int':
                        val = v_info['value']
                        # Any int variable used as an index into an array
                        if 0 <= val < arr_len:
                            # Attach as pointer
                            s['pointers'][vk] = val
                            # Always highlight the cell pointed to by an active index/pointer!
                            if val not in s['highlighted']:
                                s['highlighted'].append(val)

        # Loop iteration tracking
        loop_info = None
        if user_line in analyzer.while_nodes or user_line in analyzer.for_nodes:
            loop_iterations[user_line] = loop_iterations.get(user_line, 0) + 1
            loop_info = {'line': user_line, 'iteration': loop_iterations[user_line]}

        # Branch evaluation
        branch_info = None
        if user_line in analyzer.if_nodes:
            cond_str = analyzer.if_nodes[user_line]
            # Will be confirmed or estimated
            branch_info = {'line': user_line, 'condition': cond_str, 'result': True}

        # Stdout delta
        delta_stdout = capture.get_delta()

        # Build full call stack inspection
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
        call_stack_frames.reverse() # bottom of stack first

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
        prev_line = user_line
        return tracer

    # Execute
    err_obj = None
    try:
        compiled = compile(total_code, '<user_code>', 'exec')
        sys.settrace(tracer)
        global_scope = {}
        exec(compiled, global_scope)
        if '__result__' in global_scope:
            return_value = serialize_val(global_scope['__result__'])[1]
    except StopExecution as e:
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

    return {
        'success': err_obj is None,
        'trace': trace,
        'totalSteps': len(trace),
        'truncated': truncated,
        'error': err_obj,
        'stdout': capture.get_all(),
        'returnValue': return_value
    }

if __name__ == '__main__':
    # Test script standalone
    test_code = """
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

a = [5, 2, 8, 1]
res = bubble_sort(a)
print("Done:", res)
"""
    res = run_python_tracer(test_code)
    print("Success:", res['success'])
    print("Total steps:", res['totalSteps'])
    print("Stdout:", res['stdout'])
    print("First 3 steps lines:", [s['line'] for s in res['trace'][:3]])
    print("Step 5 structures:", res['trace'][5]['structures'] if len(res['trace']) > 5 else None)


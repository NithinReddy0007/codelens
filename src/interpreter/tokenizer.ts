export interface Token {
  type:
    | 'keyword'
    | 'identifier'
    | 'number'
    | 'string'
    | 'char'
    | 'operator'
    | 'punctuation'
    | 'eof';
  value: string;
  line: number;
  column: number;
}

const KEYWORDS = new Set([
  'int', 'long', 'double', 'float', 'char', 'bool', 'boolean', 'void',
  'string', 'String', 'vector', 'ArrayList', 'unordered_map', 'HashMap',
  'unordered_set', 'HashSet', 'set', 'stack', 'Stack', 'queue', 'Queue',
  'pair', 'class', 'struct', 'public', 'private', 'protected', 'static',
  'return', 'if', 'else', 'while', 'for', 'do', 'switch', 'case', 'break',
  'continue', 'new', 'true', 'false', 'null', 'nullptr', 'this', 'auto',
  'std', 'Math', 'System', 'out', 'println', 'print', 'cout', 'cin', 'endl'
]);

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  let line = 1;
  let column = 1;

  while (index < source.length) {
    const ch = source[index];

    // Newlines
    if (ch === '\n') {
      line++;
      column = 1;
      index++;
      continue;
    }

    // Whitespace
    if (/\s/.test(ch)) {
      column++;
      index++;
      continue;
    }

    // Single-line comment
    if (ch === '/' && source[index + 1] === '/') {
      while (index < source.length && source[index] !== '\n') {
        index++;
      }
      continue;
    }

    // Multi-line comment
    if (ch === '/' && source[index + 1] === '*') {
      index += 2;
      column += 2;
      while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
        if (source[index] === '\n') {
          line++;
          column = 1;
        } else {
          column++;
        }
        index++;
      }
      index += 2;
      column += 2;
      continue;
    }

    // Preprocessor directive (e.g. #include <vector>)
    if (ch === '#') {
      while (index < source.length && source[index] !== '\n') {
        index++;
      }
      continue;
    }

    // String literal
    if (ch === '"') {
      const startCol = column;
      const startLine = line;
      let strVal = '';
      index++;
      column++;
      while (index < source.length && source[index] !== '"') {
        if (source[index] === '\\' && index + 1 < source.length) {
          strVal += source[index + 1];
          index += 2;
          column += 2;
        } else {
          strVal += source[index];
          index++;
          column++;
        }
      }
      if (index < source.length && source[index] === '"') {
        index++;
        column++;
      }
      tokens.push({
        type: 'string',
        value: strVal,
        line: startLine,
        column: startCol
      });
      continue;
    }

    // Character literal
    if (ch === "'") {
      const startCol = column;
      const startLine = line;
      index++;
      column++;
      let charVal = '';
      if (index < source.length && source[index] === '\\') {
        charVal = source[index + 1];
        index += 2;
        column += 2;
      } else if (index < source.length) {
        charVal = source[index];
        index++;
        column++;
      }
      if (index < source.length && source[index] === "'") {
        index++;
        column++;
      }
      tokens.push({
        type: 'char',
        value: charVal,
        line: startLine,
        column: startCol
      });
      continue;
    }

    // Numbers (integer & float)
    if (/\d/.test(ch)) {
      const startCol = column;
      const startLine = line;
      let numStr = '';
      while (index < source.length && (/[\d.]/.test(source[index]))) {
        numStr += source[index];
        index++;
        column++;
      }
      tokens.push({
        type: 'number',
        value: numStr,
        line: startLine,
        column: startCol
      });
      continue;
    }

    // Identifiers & Keywords
    if (/[a-zA-Z_]/.test(ch)) {
      const startCol = column;
      const startLine = line;
      let idStr = '';
      while (index < source.length && /[a-zA-Z0-9_]/.test(source[index])) {
        idStr += source[index];
        index++;
        column++;
      }
      const type = KEYWORDS.has(idStr) ? 'keyword' : 'identifier';
      tokens.push({
        type,
        value: idStr,
        line: startLine,
        column: startCol
      });
      continue;
    }

    // Multi-char operators
    const twoChars = source.substr(index, 2);
    if (
      ['==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '%=', '->', '<<', '>>', '::'].includes(
        twoChars
      )
    ) {
      tokens.push({
        type: 'operator',
        value: twoChars,
        line,
        column
      });
      index += 2;
      column += 2;
      continue;
    }

    // Single-char operators
    if (['+', '-', '*', '/', '%', '=', '<', '>', '!', '?', ':', '&', '|', '^', '~'].includes(ch)) {
      tokens.push({
        type: 'operator',
        value: ch,
        line,
        column
      });
      index++;
      column++;
      continue;
    }

    // Punctuation
    if (['(', ')', '{', '}', '[', ']', ';', ',', '.'].includes(ch)) {
      tokens.push({
        type: 'punctuation',
        value: ch,
        line,
        column
      });
      index++;
      column++;
      continue;
    }

    // Unknown char
    index++;
    column++;
  }

  tokens.push({
    type: 'eof',
    value: '',
    line,
    column
  });

  return tokens;
}


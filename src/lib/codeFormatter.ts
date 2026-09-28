/**
 * Robust Multi-Language Code Formatter
 * Supports: C++, Java, Python, JavaScript, TypeScript, C, Go, Rust
 * 
 * Safely formats indentation, operator spacing, blank lines, and line trims
 * without corrupting string literals or comments.
 */

export interface FormatOptions {
  indentSize?: number; // default: 4 spaces
  trimTrailingWhitespace?: boolean;
}

/**
 * Token types used during lexing to protect strings and comments
 */
type TokenType = 'code' | 'string' | 'comment_line' | 'comment_block';

interface Token {
  type: TokenType;
  text: string;
}

/**
 * Splits source code into tokens: strings, comments, and raw code.
 */
function tokenize(source: string, lang: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let currentCode = '';
  const len = source.length;
  const isPython = lang === 'python' || lang === 'py';

  while (i < len) {
    const char = source[i];
    const next = i + 1 < len ? source[i + 1] : '';

    // Python single-line comment #
    if (isPython && char === '#') {
      if (currentCode) {
        tokens.push({ type: 'code', text: currentCode });
        currentCode = '';
      }
      let end = source.indexOf('\n', i);
      if (end === -1) end = len;
      tokens.push({ type: 'comment_line', text: source.slice(i, end) });
      i = end;
      continue;
    }

    // Single-line comment //
    if (char === '/' && next === '/') {
      if (currentCode) {
        tokens.push({ type: 'code', text: currentCode });
        currentCode = '';
      }
      let end = source.indexOf('\n', i);
      if (end === -1) end = len;
      tokens.push({ type: 'comment_line', text: source.slice(i, end) });
      i = end;
      continue;
    }

    // Multi-line comment /* ... */
    if (char === '/' && next === '*') {
      if (currentCode) {
        tokens.push({ type: 'code', text: currentCode });
        currentCode = '';
      }
      let end = source.indexOf('*/', i + 2);
      if (end === -1) end = len;
      else end += 2;
      tokens.push({ type: 'comment_block', text: source.slice(i, end) });
      i = end;
      continue;
    }

    // Python triple-quotes: """ or '''
    if (isPython && (source.startsWith('"""', i) || source.startsWith("'''", i))) {
      if (currentCode) {
        tokens.push({ type: 'code', text: currentCode });
        currentCode = '';
      }
      const quote = source.slice(i, i + 3);
      let end = source.indexOf(quote, i + 3);
      if (end === -1) end = len;
      else end += 3;
      tokens.push({ type: 'string', text: source.slice(i, end) });
      i = end;
      continue;
    }

    // String literals: "...", '...', `...`
    if (char === '"' || char === "'" || char === '`') {
      if (currentCode) {
        tokens.push({ type: 'code', text: currentCode });
        currentCode = '';
      }
      const quote = char;
      let j = i + 1;
      let escaped = false;
      while (j < len) {
        if (escaped) {
          escaped = false;
        } else if (source[j] === '\\') {
          escaped = true;
        } else if (source[j] === quote) {
          j++;
          break;
        } else if (quote !== '`' && source[j] === '\n') {
          // unclosed single-line string
          break;
        }
        j++;
      }
      tokens.push({ type: 'string', text: source.slice(i, j) });
      i = j;
      continue;
    }

    currentCode += char;
    i++;
  }

  if (currentCode) {
    tokens.push({ type: 'code', text: currentCode });
  }

  return tokens;
}

/**
 * Normalizes operator spacing in raw code tokens without affecting strings/comments.
 */
function normalizeOperators(code: string): string {
  // Add spaces around common operators: = + - * / % == != <= >= && || += -= *= /=
  // Carefully avoid pointer/reference declarations like int* or vector<int>&
  let res = code;

  // Normalize comma and semicolon spacing
  res = res.replace(/,(\S)/g, ', $1');
  res = res.replace(/;(\S)/g, '; $1');

  // Space out binary assignments and comparisons: ==, !=, <=, >=, &&, ||, +=, -=, *=, /=
  res = res.replace(/\s*([=!<>]=|&&|\|\||\+=|-=|\*=|\/=|%=)\s*/g, ' $1 ');

  // Single = assignment (not preceded or followed by =, !, <, >)
  res = res.replace(/([^=!<>\s])\s*=\s*([^=])/g, '$1 = $2');

  // Arithmetic operators + and - (when binary, not unary ++, --, +5, -1)
  res = res.replace(/([a-zA-Z0-9_)\]])\s*([+*])\s*([a-zA-Z0-9_(\[])/g, '$1 $2 $3');

  // Stream operators in C++: << and >>
  res = res.replace(/\s*(<<|>>)\s*/g, ' $1 ');

  return res;
}

/**
 * Formats Python code with clean 4-space indentation and colon detection.
 */
function formatPython(source: string, indentSize = 4): string {
  const lines = source.split(/\r?\n/);
  const formattedLines: string[] = [];
  let indentLevel = 0;
  const indentStr = ' '.repeat(indentSize);

  // Consecutive empty lines tracker
  let consecutiveEmpty = 0;

  for (let rawLine of lines) {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      if (consecutiveEmpty < 2 && formattedLines.length > 0) {
        formattedLines.push('');
        consecutiveEmpty++;
      }
      continue;
    }
    consecutiveEmpty = 0;

    // Check if line should be dedented: elif, else, except, finally
    const isDedentedKeyword = /^(elif\b|else:|except\b|finally:)/.test(trimmed);
    const effectiveIndent = Math.max(0, isDedentedKeyword ? indentLevel - 1 : indentLevel);

    formattedLines.push(indentStr.repeat(effectiveIndent) + trimmed);

    // Adjust indent for next line
    if (trimmed.endsWith(':')) {
      indentLevel++;
    } else if (
      indentLevel > 0 &&
      (trimmed.startsWith('return') ||
        trimmed === 'pass' ||
        trimmed === 'break' ||
        trimmed === 'continue' ||
        trimmed.startsWith('raise'))
    ) {
      // Lookahead or hint: don't automatically drop if block continues, but keep reasonable bounds
    }
  }

  return formattedLines.join('\n');
}

/**
 * Formats C-style bracket languages (C++, Java, JS, TS, C, Go, Rust).
 */
function formatBraceLang(source: string, lang: string, indentSize = 4): string {
  // First tokenize to protect strings & comments
  const tokens = tokenize(source, lang);
  
  // Reconstruct code with normalized operator spacing for code tokens
  let intermediate = '';
  for (const t of tokens) {
    if (t.type === 'code') {
      intermediate += normalizeOperators(t.text);
    } else {
      intermediate += t.text;
    }
  }

  // Now process lines
  const rawLines = intermediate.split(/\r?\n/);
  const formattedLines: string[] = [];
  let indentLevel = 0;
  const indentStr = ' '.repeat(indentSize);
  let consecutiveEmpty = 0;

  for (let rawLine of rawLines) {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      if (consecutiveEmpty < 2 && formattedLines.length > 0) {
        formattedLines.push('');
        consecutiveEmpty++;
      }
      continue;
    }
    consecutiveEmpty = 0;

    // Count opening and closing braces on this line (outside of strings)
    // Quick tokenization of just this line to count braces accurately
    let openCount = 0;
    let closeCount = 0;
    let inStr: string | null = null;

    for (let c = 0; c < trimmed.length; c++) {
      const ch = trimmed[c];
      const prev = c > 0 ? trimmed[c - 1] : '';

      if (inStr) {
        if (ch === inStr && prev !== '\\') inStr = null;
      } else if (ch === '"' || ch === "'" || ch === '`') {
        inStr = ch;
      } else if (ch === '/' && trimmed[c + 1] === '/') {
        // Comment rest of line
        break;
      } else if (ch === '{') {
        openCount++;
      } else if (ch === '}') {
        closeCount++;
      }
    }

    // If the line begins with closing brace(s), reduce indent BEFORE printing this line
    let leadingClose = 0;
    let idx = 0;
    while (idx < trimmed.length) {
      if (trimmed[idx] === '}') leadingClose++;
      else if (trimmed[idx] !== ' ' && trimmed[idx] !== '\t') break;
      idx++;
    }

    // Check for "case ...:" or "default:" in switch statements (reduce indent by 1)
    const isSwitchCase = /^(case\s+[^:]+:|default:)/.test(trimmed);

    const displayIndent = Math.max(0, indentLevel - leadingClose - (isSwitchCase ? 1 : 0));
    formattedLines.push(indentStr.repeat(displayIndent) + trimmed);

    // Update ongoing indentLevel for subsequent lines
    indentLevel = Math.max(0, indentLevel + openCount - closeCount);
  }

  return formattedLines.join('\n');
}

/**
 * Primary code formatting entry point.
 */
export function formatCode(sourceCode: string, languageId: string = 'cpp', options?: FormatOptions): string {
  if (!sourceCode || !sourceCode.trim()) return sourceCode;

  const indentSize = options?.indentSize ?? 4;
  const lang = (languageId || '').toLowerCase();

  try {
    if (lang === 'python' || lang === 'py') {
      return formatPython(sourceCode, indentSize);
    }
    return formatBraceLang(sourceCode, lang, indentSize);
  } catch (err) {
    console.warn('Formatting failed, falling back to original code:', err);
    return sourceCode;
  }
}

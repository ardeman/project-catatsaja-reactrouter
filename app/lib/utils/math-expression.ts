// Arithmetic typed into a number field, such as "((24/22)*28500000)/4".
// A small parser of its own (never `eval`): numbers, + - * /, brackets and
// unary minus, with the usual precedence.

const OPERATOR = /[+\-*/()]/

// Typed text → an expression with "." decimals and no thousands separators,
// using the person's separators. "x" and "×" multiply; "÷" and ":" divide
// (":" is the division sign taught in Indonesia).
export const normalizeExpression = (
  text: string,
  thousand: string,
  decimal: string,
) => {
  let cleaned = text
    .replaceAll(/\s/g, '')
    .replaceAll(/[x×]/gi, '*')
    .replaceAll(/[÷:]/g, '/')
  if (thousand.trim()) cleaned = cleaned.replaceAll(thousand, '')
  // Phone keyboards may offer only "." or ",": either works as the decimal
  // mark when it isn't the thousands separator.
  if (decimal !== '.' && thousand !== '.')
    cleaned = cleaned.replaceAll('.', decimal)
  if (decimal !== ',' && thousand !== ',')
    cleaned = cleaned.replaceAll(',', decimal)
  return cleaned.replaceAll(decimal, '.')
}

export const isExpression = (normalized: string) => OPERATOR.test(normalized)

// The value, rounded to 12 significant digits to drop float noise
// (0.1 + 0.2 → 0.3); undefined when the expression is incomplete, has
// anything else in it, or divides by zero.
export const evaluateExpression = (normalized: string) => {
  const tokens = normalized.match(/\d+(?:\.\d*)?|\.\d+|[+\-*/()]/g)
  if (!tokens || tokens.join('') !== normalized) return
  let position = 0
  const peek = () => tokens[position]
  const take = () => tokens[position++]

  // expression := term (("+" | "-") term)*
  // term       := factor (("*" | "/") factor)*
  // factor     := "-" factor | "+" factor | number | "(" expression ")"
  const factor = (): number => {
    const token = take()
    if (token === '-') return -factor()
    if (token === '+') return factor()
    if (token === '(') {
      const value = expression()
      if (take() !== ')') return NaN
      return value
    }
    return token === undefined ? NaN : Number(token)
  }
  const term = (): number => {
    let value = factor()
    while (peek() === '*' || peek() === '/') {
      const operator = take()
      const right = factor()
      value = operator === '*' ? value * right : value / right
    }
    return value
  }
  const expression = (): number => {
    let value = term()
    while (peek() === '+' || peek() === '-') {
      const operator = take()
      const right = term()
      value = operator === '+' ? value + right : value - right
    }
    return value
  }

  const value = expression()
  if (position !== tokens.length || !Number.isFinite(value)) return
  return Number(value.toPrecision(12))
}

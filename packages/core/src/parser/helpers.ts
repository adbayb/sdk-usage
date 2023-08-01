/**
 * Helper to unify the way unknown AST token are persisted
 * @param token AST token value
 * @returns Formatted AST token
 */
export const getUnknownValue = (token: string) => `#${token}`;

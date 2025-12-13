
export const normalizeAnswer = (str: string): string => {
  if (!str) return "";
  // 1. Lowercase
  // 2. Remove accents/diacritics (e.g., é -> e)
  // 3. Remove punctuation and special characters (keep alphanumeric and spaces)
  // 4. Collapse multiple spaces into one
  // 5. Trim whitespace
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^\w\s]|_/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

export function normalizeArPhone(input: string) {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("54")) return digits;
  if (digits.startsWith("0")) digits = digits.slice(1);
  return `54${digits}`;
}

export function isPlausiblePhone(input: string) {
  const digits = normalizeArPhone(input);
  return digits.length >= 12 && digits.length <= 15;
}

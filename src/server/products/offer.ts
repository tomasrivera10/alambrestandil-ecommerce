export function activeOffer(
  regular: number | null,
  discount: number | null,
  startsAt: Date | null,
  endsAt: Date | null,
  now = new Date(),
): number | null {
  if (regular == null || discount == null || discount <= 0 || discount >= regular) return null;
  if (startsAt && now < startsAt) return null;
  if (endsAt && now > endsAt) return null;
  return discount;
}

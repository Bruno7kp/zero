export function getColorForName(value: string | null | undefined): string {
  const input = (value ?? '').trim().toLowerCase();
  if (!input) {
    return 'hsl(210, 70%, 55%)';
  }

  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

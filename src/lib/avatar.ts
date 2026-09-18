/**
 * Zero-Cost Deterministic SVG Avatar Generator
 * Generates beautiful, modern, deterministic HSL gradient avatars with monograms.
 * Zero external HTTP requests, zero npm dependencies, 100% offline & fast.
 */

const PALETTES = [
  { start: "#6366F1", end: "#8B5CF6", text: "#FFFFFF", glow: "#818CF8" }, // Indigo -> Purple
  { start: "#06B6D4", end: "#3B82F6", text: "#FFFFFF", glow: "#38BDF8" }, // Cyan -> Blue
  { start: "#10B981", end: "#059669", text: "#FFFFFF", glow: "#34D399" }, // Emerald -> Green
  { start: "#F59E0B", end: "#D97706", text: "#FFFFFF", glow: "#FBBF24" }, // Amber -> Orange
  { start: "#EC4899", end: "#8B5CF6", text: "#FFFFFF", glow: "#F472B6" }, // Pink -> Purple
  { start: "#8B5CF6", end: "#EC4899", text: "#FFFFFF", glow: "#A78BFA" }, // Purple -> Pink
  { start: "#3B82F6", end: "#10B981", text: "#FFFFFF", glow: "#60A5FA" }, // Blue -> Teal
  { start: "#F43F5E", end: "#FB7185", text: "#FFFFFF", glow: "#FDA4AF" }, // Rose -> Coral
];

/**
 * Deterministic string hash (DJB2)
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

/**
 * Extract 1 or 2 letter uppercase initials from a name or username.
 */
export function getInitials(name: string, username?: string): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (username && username.trim().length > 0) {
    return username.trim().substring(0, 2).toUpperCase();
  }
  return "AV";
}

/**
 * Generate a standalone SVG markup string.
 */
export function generateAvatarSvg(
  name: string,
  identifier?: string,
  size: number = 128
): string {
  const seed = (identifier || name || "avyantrix").toLowerCase().trim();
  const hash = hashString(seed);
  const palette = PALETTES[hash % PALETTES.length];
  const initials = getInitials(name, identifier);
  const fontSize = Math.round(size * 0.42);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="grad-${hash}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.start}" />
      <stop offset="100%" stop-color="${palette.end}" />
    </linearGradient>
    <radialGradient id="glow-${hash}" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.28)}" fill="url(#grad-${hash})" />
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.28)}" fill="url(#glow-${hash})" />
  <text 
    x="50%" 
    y="52%" 
    fill="${palette.text}" 
    font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
    font-size="${fontSize}" 
    font-weight="700" 
    letter-spacing="0.05em"
    dominant-baseline="central" 
    text-anchor="middle"
  >${initials}</text>
</svg>`.trim();
}

/**
 * Returns an isomorphic SVG Data URL for use as standard <img src="..." />.
 */
export function getAvatarDataUrl(
  name: string,
  identifier?: string,
  size: number = 128
): string {
  const svg = generateAvatarSvg(name, identifier, size);
  if (typeof window !== "undefined") {
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
  const base64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

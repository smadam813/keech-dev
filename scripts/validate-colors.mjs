const palette = {
  background: '#E8B4B8',
  foreground: '#000000',
  accent: '#2D8B8B',
  surface: '#F5E6E8',
  muted: '#666666',
};

/**
 * Parse a 6-digit hex color string to {r, g, b} (0-255).
 */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

/**
 * Compute relative luminance per WCAG 2.1 spec.
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function relativeLuminance(r, g, b) {
  const [sR, sG, sB] = [r, g, b].map((val) => {
    const c = val / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
}

/**
 * Compute WCAG contrast ratio between two hex colors.
 * Returns a value >= 1. WCAG AA requires >= 4.5 for normal text.
 */
function contrastRatio(hex1, hex2) {
  const { r: r1, g: g1, b: b1 } = hexToRgb(hex1);
  const { r: r2, g: g2, b: b2 } = hexToRgb(hex2);
  const L1 = relativeLuminance(r1, g1, b1);
  const L2 = relativeLuminance(r2, g2, b2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Generate all unique pairs and compute contrast
const names = Object.keys(palette);
let allPass = true;

console.log('Color Contrast Report (WCAG AA = 4.5:1 minimum)\n');

for (let i = 0; i < names.length; i++) {
  for (let j = i + 1; j < names.length; j++) {
    const a = names[i];
    const b = names[j];
    const ratio = contrastRatio(palette[a], palette[b]);
    const pass = ratio >= 4.5;
    if (!pass) allPass = false;
    console.log(`${a} vs ${b}: ${ratio.toFixed(2)} [${pass ? 'PASS' : 'FAIL'}]`);
  }
}

if (!allPass) {
  console.log('\nWARNING: Some combinations fail WCAG AA. Adjust palette if using these pairs for text.');
} else {
  console.log('\nAll critical text/background combinations pass WCAG AA.');
}

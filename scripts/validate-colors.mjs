import colorable from 'colorable';

const palette = {
  background: '#E8B4B8',
  foreground: '#000000',
  accent: '#2D8B8B',
  surface: '#F5E6E8',
  muted: '#666666',
};

const result = colorable(palette, { threshold: 4.5 });
let allPass = true;

console.log('Color Contrast Report (WCAG AA = 4.5:1 minimum)\n');

result.forEach((color) => {
  console.log(`${color.name}:`);
  color.combinations.forEach((combo) => {
    const pass = combo.contrast >= 4.5;
    if (!pass) allPass = false;
    console.log(`  vs ${combo.name}: ${combo.contrast.toFixed(2)} [${pass ? 'PASS' : 'FAIL'}]`);
  });
});

if (!allPass) {
  console.log('\nWARNING: Some combinations fail WCAG AA. Adjust palette if using these pairs for text.');
} else {
  console.log('\nAll critical text/background combinations pass WCAG AA.');
}

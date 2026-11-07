import { describe, it, expect } from 'vitest';
import { lightTheme, darkTheme } from './index';

/** WCAG relative luminance contrast ratio */
function lum(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}
const ratio = (a: string, b: string) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1! + 0.05) / (l2! + 0.05);
};

describe('theme accessibility', () => {
  for (const [name, t] of [['light', lightTheme], ['dark', darkTheme]] as const) {
    it(`${name}: body text meets WCAG AA (4.5:1)`, () => {
      expect(ratio(t.text, t.background)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(t.text, t.surface)).toBeGreaterThanOrEqual(4.5);
    });
    it(`${name}: primary button text meets AA`, () => {
      expect(ratio(t.onPrimary, t.primary)).toBeGreaterThanOrEqual(4.5);
    });
    it(`${name}: muted text meets AA on background`, () => {
      expect(ratio(t.textMuted, t.background)).toBeGreaterThanOrEqual(4.5);
    });
  }
});

import { themeToCssVars } from './index';
describe('css variables', () => {
  it('emits kebab-case custom properties', () => {
    const css = themeToCssVars(lightTheme);
    expect(css).toContain('--color-surface-muted:#F2EFE8;');
    expect(css).toContain('--color-on-primary:#FFFFFF;');
  });
});

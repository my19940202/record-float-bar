import type { FloatingBackground } from '@/types/outline';

export const defaultFloatingSettings = {
  theme: 'light' as const,
  layout: 'vertical' as const,
  background: 'cream' as FloatingBackground,
  fontSize: 16,
  opacity: 0.85,
  blur: 24,
};

export const floatingBackgroundChoices: Array<{
  value: FloatingBackground;
  labelKey: FloatingBackground;
  swatch: string;
}> = [
  { value: 'cream', labelKey: 'cream', swatch: '#fff4e6' },
  { value: 'white', labelKey: 'white', swatch: '#ffffff' },
  { value: 'lavender', labelKey: 'lavender', swatch: '#eadcff' },
  { value: 'blue', labelKey: 'blue', swatch: '#dff2ff' },
  { value: 'pink', labelKey: 'pink', swatch: '#ffe1eb' },
  { value: 'slate', labelKey: 'slate', swatch: '#111827' },
  { value: 'butter', labelKey: 'butter', swatch: '#fff8ca' },
  { value: 'lemon', labelKey: 'lemon', swatch: '#f9ff9e' },
  { value: 'lilac', labelKey: 'lilac', swatch: '#f3e8ff' },
  { value: 'sky', labelKey: 'sky', swatch: '#dcf4ff' },
  { value: 'blush', labelKey: 'blush', swatch: '#ffe7df' },
  { value: 'graphite', labelKey: 'graphite', swatch: '#241f33' },
];

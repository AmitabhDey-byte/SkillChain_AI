# Current Theme

Source: `src/styles.css`

## Foundation

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');

:root {
  font-family: 'Manrope', sans-serif;
  color: #eaf5ee;
  background: #07140f;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  --ink: #07140f;
  --surface: #0c1c15;
  --surface-2: #12261c;
  --line: rgba(217, 239, 225, 0.13);
  --muted: #9bb0a2;
  --green: #7cf39d;
  --green-bright: #b7ff7a;
  --cream: #f4f2e9;
}
```

## Typography

- Interface: Manrope
- Display: Space Grotesk and Instrument Serif
- Data: DM Mono
- Display headings use compressed line height and negative tracking

## Visual Language

- Dark forest foundation with acid green highlights
- Cream editorial sections
- Square cards and buttons
- Thin translucent borders
- Soft green bloom and dark depth shadows
- Responsive breakpoint concentrated at tablet/mobile widths

The complete implementation is in `src/styles.css` and must be passed as a context file for design generation.

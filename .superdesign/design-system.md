# SkillChain AI — Editorial Proof Infrastructure

## Product intent

SkillChain should feel like a credible, quietly ambitious professional product—not a generic AI landing page. The interface makes technical work legible: evidence, verification, hiring decisions, and wallet ownership.

## Direction

**Character:** editorial systems studio, precise and human.  
**Reference qualities:** a serious developer tool meets a thoughtfully designed career publication.  
**Avoid:** neon-space imagery, multi-colour gradients, glass-card grids, floating score widgets, repeated all-caps micro-labels, decorative orbit motifs, and “AI magic” language.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| Canvas | `#F2EFE8` | Primary page background |
| Ink | `#171A20` | Headings, body, outlines |
| Carbon | `#222733` | Dark navigation and dense panels |
| Paper | `#FCFBF8` | Cards and raised surfaces |
| Line | `#D5D0C6` | Rules, dividers, fields |
| Slate | `#69717D` | Secondary text |
| Cobalt | `#3E4EDB` | Primary action and proof state |
| Signal | `#DD5E39` | Rare alert/active accent |
| Verified | `#2F6FD0` | Positive and verified status |

Use solid colour fields and thin rules. Cobalt is the only primary accent. Never use green or acid-lime shades, rainbow, purple-cyan, or pink gradients.

## Typography

- **Display:** Instrument Serif for one short, editorial phrase per view.
- **Interface:** Manrope for all navigation, labels, controls, and body text.
- **Data:** DM Mono for wallet addresses, timestamps, scores, and proof references.
- Headlines are large but compact, with readable line-height; do not stack several stylized headings.
- Body text must be at least 15px desktop / 14px mobile. Utility labels must be at least 12px, form controls at least 14px, and metadata at least 12px.

## Layout

- Centered 12-column desktop grid with deliberate asymmetric compositions.
- Use one strong feature composition per section rather than a bento grid of equal cards.
- Keep sections airy; divide with fine horizontal rules, not glows.
- Make evidence and provenance visible as useful metadata, not decoration.
- Mobile should become a purposeful single-column editorial sequence, not shrunken desktop cards.

## Components

- Buttons are solid, rectangular-soft (8px radius), with text-forward labels and clear hover contrast.
- Cards are paper surfaces with 1px ink/line borders, minimal shadows, and generous padding.
- Metrics appear as typographic facts in a strip or table—not floating HUD chips.
- Use the real SkillChain mark in all logo positions. Never replace it with initials or a generic glyph.
- Add subtle Framer Motion transitions for route entry, section reveal, card hover, modals, and state changes. Use 180–450ms durations, small 8–18px offsets, spring easing for interactive surfaces, and respect reduced-motion preferences.

## Landing-page hierarchy

1. Compact dark masthead with logo, product navigation, and wallet action.
2. Editorial hero: strong claim, succinct explanation, one primary CTA, and a restrained proof specimen.
3. Evidence process shown as a numbered reading sequence.
4. A real credential/evidence preview with wallet and repository metadata.
5. Recruiter value framed as an operational outcome, not a futuristic dashboard.
6. Clear final CTA and an information-rich footer.

## Fidelity constraint

Use only the typography, colours, spacing, and component rules above. Do not introduce neon glows, cosmic gradients, random images, invented logos, or generic AI-dashboard visual language.

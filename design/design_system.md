# Flex Forge Design System

## 1. Brand Identity
**Name**: Flex Forge
**Essence**: Strength, Precision, Heat, Transformation.
**Logo**: An abstract representation of a forge/anvil combined with muscular dynamism.

## 2. Color Palette
The Flex Forge palette is built on a dark, immersive foundation with high-energy accents.

### Primary Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#FF5500` | Primary Actions, Active States, "Heat" |
| `primary-content` | `#FFFFFF` | Text on Primary |

### Accent Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `accent` | `#00C2FF` | Highlights, "Electric/Energy" elements |
| `secondary` | `#FF9500` | Secondary warnings, transitions |

### Neutral Colors (Dark Mode)
| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#0A0A0A` | Main page background |
| `surface` | `#171717` | Cards, Sidebar, Modals |
| `surface-highlight`| `#262626` | Hover states, Inputs |
| `border` | `#404040` | Subtle dividers |
| `text-primary` | `#EDEDED` | Headings, High contrast text |
| `text-secondary` | `#A1A1A1` | Body text, metadata |

### Functional Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#22C55E` | Completion, Success feedback |
| `error` | `#EF4444` | Destructive actions, Errors |
| `warning` | `#F59E0B` | Alerts |

## 3. Typography
**Font Family**: `Inter` (Sans-serif) or `Geist Sans`.

### Scale
| Style | Size | Weight | Line Height |
|-------|------|--------|-------------|
| **Display** | 3rem (48px) | 800 | 1.1 |
| **H1** | 2.25rem (36px)| 700 | 1.2 |
| **H2** | 1.5rem (24px) | 600 | 1.3 |
| **H3** | 1.25rem (20px)| 600 | 1.4 |
| **Body** | 1rem (16px) | 400 | 1.5 |
| **Small** | 0.875rem (14px)| 400 | 1.5 |
| **Micro** | 0.75rem (12px) | 500 | 1.5 |

## 4. Components & Styling
### Cards
- **Background**: `surface`
- **Border**: 1px solid `white/5` (or `border`)
- **Radius**: `1rem` (16px) or `1.5rem` (24px) for large containers.

### Buttons
- **Primary**: `bg-primary` text-white, rounded-xl, bold.
- **Secondary**: `bg-surface` border `border`, hover `bg-white/10`.

### Gradients
- Use subtle gradients for text highlights: `bg-gradient-to-r from-primary to-accent`.
- Use blur effects (glassmorphism) for overlays: `backdrop-blur-xl bg-surface/50`.

## 5. Theming Engine
Flex Forge supports dynamic theming.
Programs can override:
- `--color-primary`
- `--color-accent`
- `--color-background`
- `--color-surface`

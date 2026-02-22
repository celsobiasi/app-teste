---
name: Layout Reference - Sistema Gestão Escolar
description: Design system and visual reference based on sistemagestaoescolar.com.br
---

# Design System Reference: Sistema Gestão Escolar

This document serves as a design reference for the application, based on the layout and style of `sistemagestaoescolar.com.br`.

## 1. Core Identity

- **Vibe**: Professional, Modern, Trustworthy, Educational.
- **Key Characteristics**: Clean typography, rounded UI elements, subtle shadows, and a distinct Blue-to-Green gradient theme.

## 2. Color Palette (HSL)

### Primary Colors

- **Primary (Deep Blue)**: `hsl(214, 76%, 19%)` - Used for main buttons, headers, active states.
- **Primary Light**: `hsl(214, 84%, 32%)` - Used for hover states, lighter accents.
- **Secondary (Green)**: `hsl(142, 71%, 45%)` - Used for success states, call-to-actions, secondary branding.
- **Secondary Light**: `hsl(142, 71%, 55%)`

### Backgrounds & Surfaces

- **Background**: `hsl(210, 20%, 98%)` - A very light cool gray, not pure white.
- **Card Background**: `hsl(0, 0%, 100%)` (White) to `hsl(210, 20%, 98%)` (Light Gray).
- **Foreground (Text)**: `hsl(215, 25%, 26.9%)` - Dark blue-gray, softer than pure black.

### Accents

- **Yellow**: `hsl(45, 93%, 58%)`
- **Cyan**: `hsl(190, 90%, 50%)`
- **Orange**: `hsl(25, 95%, 53%)`
- **Destructive (Red)**: `hsl(0, 84.2%, 60.2%)`

### Gradients

- **Hero Gradient**: `linear-gradient(135deg, hsl(214 76% 19%) 0%, hsl(214 84% 32%) 50%, hsl(142 71% 45%) 100%)`
  *Usage*: Main hero sections, primary branding backgrounds.
- **Primary Gradient**: `linear-gradient(135deg, hsl(214 76% 19%), hsl(214 84% 32%))`
- **Secondary Gradient**: `linear-gradient(135deg, hsl(142 71% 45%), hsl(142 71% 55%))`

## 3. Typography

- **Font Family**: `Inter`, sans-serif.
- **Weights**:
  - Regular: 400
  - Medium: 500
  - Semibold: 600
  - Bold: 700
  - Extra Bold: 800
- **Base Size**: 16px (1rem).
- **Line Heights**: Relaxed (1.625) for body text, Tighter (1.1-1.25) for headings.

## 4. UI Elements & Tokens

### Borders & Radius

- **Border Color**: `hsl(214.3, 31.8%, 91.4%)` - Very subtle light blue-gray.
- **Border Radius**: `.5rem` (8px) - Used for buttons, inputs, cards.
- **Rounded Buttons**: Often `rounded-md` or `rounded-lg`.

### Shadows

- **Shadow Small**: `0 1px 2px 0 hsl(215 25% 26.9% / .05)`
- **Shadow Medium**: `0 4px 6px -1px hsl(215 25% 26.9% / .1)`
- **Shadow Large**: `0 10px 15px -3px hsl(215 25% 26.9% / .1)`
- **Shadow Primary**: `0 10px 30px -10px hsl(214 76% 19% / .3)` - colored shadow for primary actions.

### Animation & Transitions

- **Transition**: `all .3s cubic-bezier(.4, 0, .2, 1)` - Smooth, slightly snappy transitions.
- **Key Animations**: `fade-in`, `float` (for hero images), `pulse`.

## 5. Implementation Guide (Tailwind CSS)

When building the app, assume `tailwindcss` with `tailwindcss-animate`.

```js
// tailwind.config.js extension suggestion
theme: {
  extend: {
    fontFamily: {
      sans: ["Inter", "sans-serif"],
    },
    colors: {
      border: "hsl(var(--border))", // 214.3 31.8% 91.4%
      background: "hsl(var(--background))", // 210 20% 98%
      foreground: "hsl(var(--foreground))", // 215 25% 26.9%
      primary: {
        DEFAULT: "hsl(214 76% 19%)",
        foreground: "hsl(210 40% 98%)",
      },
      secondary: {
        DEFAULT: "hsl(142 71% 45%)",
        foreground: "hsl(0 0% 100%)",
      },
      // ... maps to the HSL values above
    },
    backgroundImage: {
      'hero-gradient': 'linear-gradient(135deg, hsl(214 76% 19%) 0%, hsl(214 84% 32%) 50%, hsl(142 71% 45%) 100%)',
    }
  }
}
```

## 6. Layout Patterns

- **Container**: Centered, max-width 1400px.
- **Cards**: White background, subtle border, shadow-sm or shadow-md on hover.
- **Navigation**: Sticky top, slight transparency/backdrop-blur.

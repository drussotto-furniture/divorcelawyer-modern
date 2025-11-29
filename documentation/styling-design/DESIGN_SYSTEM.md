# Design System Implementation Plan

## Overview

This document outlines the approach for creating a comprehensive design system for the DivorceLawyer.com project, including component organization, design token management, and the integration between Figma (design source of truth) and code (implementation).

## Current State Analysis

### Component Organization Issues
- **Flat structure**: All components in single `/components` directory
- **No categorization**: Homepage, reusable, and admin components mixed together
- **Inconsistent styling**: Mix of SCSS files and Tailwind classes
- **No documentation**: Components lack usage examples and prop documentation

### Design Token Issues
- **80+ color names** in `tailwind.config.ts` with no clear organization
- **Many overlapping/duplicate colors** (e.g., `beige`, `warmbeige`, `softbeige`, `antiquesand`)
- **No clear naming convention** or semantic hierarchy
- **Typography defined** but not documented or systematized
- **Spacing/breakpoints exist** but not organized into a clear system

### Existing Assets
- ✅ Tailwind configuration with extended theme
- ✅ SCSS files for component-specific styles
- ✅ Multiple font families defined (Proxima, Libre, DMSans, DMSerifText)
- ✅ Container and responsive breakpoints configured

## Proposed Solution: Dual Approach

### 1. Figma (Design Source of Truth)
**Purpose**: Visual design specifications and design-time documentation

**Should contain**:
- Visual design specs for all components
- Component library documentation
- Design tokens (colors, typography, spacing)
- Interaction states and animations
- Responsive breakpoints and grid systems
- Design review and collaboration

**Benefits**:
- Single source of truth for designers
- Easy to share with stakeholders
- Visual reference for developers
- Can export tokens for code integration

### 2. Code (Implementation)
**Purpose**: Functional, type-safe component library

**Should contain**:
- TypeScript component library
- Tailwind design tokens (synced from Figma)
- Component documentation (Storybook or similar)
- Reusable component patterns
- Type-safe props interfaces

**Benefits**:
- Type safety and autocomplete
- Version controlled
- Testable components
- Production-ready code

## Proposed Component Structure

```
components/
├── ui/                    # Base design system components
│   ├── Button.tsx         # Primary, secondary, tertiary variants
│   ├── Card.tsx           # Base card component
│   ├── Input.tsx          # Form inputs
│   ├── Select.tsx         # Dropdown selects
│   ├── Textarea.tsx       # Text areas
│   ├── Checkbox.tsx       # Checkboxes
│   ├── Radio.tsx          # Radio buttons
│   ├── Badge.tsx          # Status badges
│   ├── Alert.tsx          # Alert messages
│   ├── Modal.tsx          # Modal dialogs
│   ├── Accordion.tsx      # Expandable sections
│   ├── Tabs.tsx           # Tab navigation
│   └── index.ts           # Barrel exports
│
├── layout/                # Layout components
│   ├── Header.tsx         # Site header
│   ├── Footer.tsx         # Site footer
│   ├── Container.tsx      # Page container
│   └── Section.tsx        # Section wrapper
│
├── homepage/              # Homepage-specific components
│   ├── DiscoverSlider.tsx
│   ├── ThreePackComponent.tsx
│   ├── MostPopularReads.tsx
│   ├── FAQAccordion.tsx
│   ├── RealVoicesCarousel.tsx
│   └── index.ts
│
├── directory/             # Lawyer/firm directory components
│   ├── FirmCard.tsx
│   ├── LawyerSlide.tsx
│   ├── LawyerCard.tsx
│   └── index.ts
│
├── content/               # Content display components
│   ├── ArticleCard.tsx
│   ├── ArticleList.tsx
│   ├── RichText.tsx       # Rich text renderer
│   └── index.ts
│
├── forms/                 # Form components
│   ├── ContactForm.tsx
│   ├── SearchForm.tsx
│   └── index.ts
│
└── admin/                 # Admin panel components (already organized)
    ├── AdminHeader.tsx
    ├── AdminSidebar.tsx
    └── ...
```

## Design Token Organization

### Color System

**Proposed structure** (to be refined with Figma):

```typescript
colors: {
  // Primary brand colors
  primary: {
    50: '#...',   // Lightest
    100: '#...',
    200: '#...',
    300: '#...',
    400: '#...',
    500: '#...',  // Base
    600: '#...',
    700: '#...',
    800: '#...',
    900: '#...',  // Darkest
  },
  
  // Secondary colors
  secondary: { ... },
  
  // Semantic colors
  success: { ... },
  warning: { ... },
  error: { ... },
  info: { ... },
  
  // Neutral colors
  gray: { ... },
  white: '#FFFFFF',
  black: '#000000',
  
  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F4F2EC',  // subtlesand
    tertiary: '#F5F1ED',   // seashell
  },
}
```

**Action items**:
- [ ] Audit all 80+ colors in `tailwind.config.ts`
- [ ] Map colors to semantic names (primary, secondary, etc.)
- [ ] Remove duplicates and consolidate
- [ ] Create color palette documentation
- [ ] Update Figma with official palette (when available)

### Typography System

**Proposed structure**:

```typescript
typography: {
  fontFamily: {
    sans: ['DMSans', 'Inter', 'Proxima Nova', ...],
    serif: ['DMSerifText', 'Libre Bodoni', ...],
    mono: [...],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
}
```

**Action items**:
- [ ] Document font usage guidelines
- [ ] Create typography scale documentation
- [ ] Define heading styles (h1-h6)
- [ ] Create text utility classes

### Spacing System

**Proposed structure**:

```typescript
spacing: {
  // Base spacing scale (multiples of 4px)
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  // ... etc
}
```

**Action items**:
- [ ] Document spacing scale
- [ ] Create spacing utility classes
- [ ] Define section spacing patterns

### Breakpoint System

**Current breakpoints** (to be verified with Figma):

```typescript
screens: {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  container: '1830px',  // Custom container max-width
}
```

**Action items**:
- [ ] Verify breakpoints match Figma designs
- [ ] Document responsive patterns
- [ ] Create responsive utility examples

## Implementation Phases

### Phase 1: Foundation (Before Figma)
**Goal**: Organize existing components and clean up design tokens

**Tasks**:
- [ ] Reorganize components into proposed directory structure
- [ ] Audit and consolidate color tokens in `tailwind.config.ts`
- [ ] Create base UI components (Button, Card, Input, etc.)
- [ ] Document component usage patterns
- [ ] Set up component documentation (Storybook or similar)

**Deliverables**:
- Reorganized component structure
- Cleaned up `tailwind.config.ts`
- Base UI component library
- Component documentation site

### Phase 2: Figma Integration (After Figma Available)
**Goal**: Sync design tokens and refine components to match designs

**Tasks**:
- [ ] Extract design tokens from Figma
- [ ] Map Figma tokens to code tokens
- [ ] Update Tailwind config with official tokens
- [ ] Refine components to match Figma specs exactly
- [ ] Update spacing, typography, and colors to match
- [ ] Create component variants based on Figma
- [ ] Document design-to-code handoff process

**Deliverables**:
- Synced design tokens
- Pixel-perfect component implementations
- Design token documentation
- Design-to-code handoff guide

### Phase 3: Component Library Expansion
**Goal**: Build out all reusable components

**Tasks**:
- [ ] Create all base UI components
- [ ] Build layout components
- [ ] Create content display components
- [ ] Build form components
- [ ] Create homepage-specific components (refactor existing)
- [ ] Build directory components
- [ ] Add component tests
- [ ] Complete component documentation

**Deliverables**:
- Complete component library
- Component tests
- Full documentation

### Phase 4: Migration & Cleanup
**Goal**: Migrate existing code to use new design system

**Tasks**:
- [ ] Update homepage to use new components
- [ ] Migrate admin panel to use design system
- [ ] Remove duplicate SCSS files (where replaced by Tailwind)
- [ ] Update all pages to use new components
- [ ] Remove unused design tokens
- [ ] Final documentation review

**Deliverables**:
- Fully migrated codebase
- Cleaned up styles
- Complete documentation

## Tools & Setup

### Recommended Tools

1. **Storybook** (Component Documentation)
   - Visual component library
   - Interactive component playground
   - Documentation generation
   - Installation: `npx storybook@latest init`

2. **Figma Tokens Plugin** (Design Token Sync)
   - Export tokens from Figma
   - Sync to code
   - Maintain design-code consistency

3. **TypeScript** (Type Safety)
   - Already in use
   - Ensure all components have proper types
   - Create shared type definitions

4. **Tailwind CSS** (Styling)
   - Already in use
   - Extend with design tokens
   - Use for all new components

### File Structure

```
divorcelawyer-modern/
├── components/
│   ├── ui/              # Base components
│   ├── layout/          # Layout components
│   ├── homepage/        # Homepage components
│   ├── directory/       # Directory components
│   ├── content/         # Content components
│   ├── forms/           # Form components
│   └── admin/           # Admin components
├── lib/
│   ├── design-tokens.ts # Design token definitions
│   └── utils.ts          # Utility functions
├── styles/
│   ├── design-system.css # Design system styles
│   └── ...              # Existing SCSS (to be migrated)
├── docs/
│   ├── DESIGN_SYSTEM.md  # This file
│   ├── COMPONENTS.md     # Component documentation
│   └── TOKENS.md         # Design token documentation
└── .storybook/           # Storybook configuration
```

## Design Token Documentation Template

When Figma is available, document tokens like this:

### Colors

| Token Name | Hex Value | Usage | Tailwind Class |
|------------|-----------|-------|----------------|
| `primary.500` | `#FC9445` | Primary buttons, CTAs | `bg-primary` |
| `secondary.500` | `#B6572E` | Secondary buttons | `bg-secondary` |
| `background.primary` | `#FFFFFF` | Main background | `bg-white` |
| `background.secondary` | `#F4F2EC` | Section backgrounds | `bg-subtlesand` |

### Typography

| Token Name | Font Size | Line Height | Usage |
|------------|-----------|-------------|-------|
| `heading.1` | `3rem` | `1.2` | H1 headings |
| `heading.2` | `2.25rem` | `1.3` | H2 headings |
| `body.large` | `1.125rem` | `1.75` | Large body text |
| `body.base` | `1rem` | `1.5` | Base body text |

## Success Criteria

- [ ] All components organized in logical structure
- [ ] Design tokens consolidated and documented
- [ ] Base UI components created and documented
- [ ] Figma tokens synced to code
- [ ] All components match Figma designs
- [ ] Component documentation complete
- [ ] Existing code migrated to new system
- [ ] No duplicate/unused design tokens
- [ ] Type-safe component library
- [ ] Responsive patterns documented

## Notes

- **SCSS Migration**: Gradually migrate from SCSS to Tailwind. Keep SCSS for complex animations or when Tailwind is insufficient.
- **Backward Compatibility**: Ensure existing components continue to work during migration.
- **Performance**: Monitor bundle size as component library grows.
- **Accessibility**: Ensure all components meet WCAG 2.1 AA standards.

## Questions to Resolve

- [ ] What is the official brand color palette? (Wait for Figma)
- [ ] What are the exact typography scales? (Wait for Figma)
- [ ] What spacing system should we use? (Wait for Figma)
- [ ] Should we use a component library like Radix UI or build custom?
- [ ] Do we need dark mode support?
- [ ] What animation/transition patterns should we use?

## Next Steps

1. **Immediate**: Start Phase 1 - reorganize components and clean up tokens
2. **When Figma available**: Begin Phase 2 - sync tokens and refine components
3. **Ongoing**: Build out component library and migrate existing code

---

**Last Updated**: January 2025
**Status**: Planning Phase
**Owner**: [To be assigned]


# Figma Design Tokens - Extracted from CSS Export

## Colors

### Primary Colors
- **Primary Orange**: `#FC9445` (buttons, CTAs)
- **Secondary Brown**: `#B6572E` (links, accents)
- **Secondary Dark**: `#604B30` (text, headings)

### Background Colors
- **White**: `#FFFFFF`
- **Subtle Sand**: `#F4F2EC` (section backgrounds)
- **Seashell**: `#F5F1ED` (card backgrounds)
- **Peach Cream**: `#F8F1EA` (card backgrounds)
- **Soft White**: `#FBFAF9` (section backgrounds)
- **Ivory Tint**: `#EDEAE1` (backgrounds)
- **Warm Beige**: `#EFE8DF` (backgrounds, borders)
- **Light Cream**: `#ECE6DE` (text, borders)

### Dark/Teal Colors (Hero, Sections)
- **Bluish/Dark Teal**: `#163B46` (hero background, sections)
- **Bluish Light**: `#235561` (navigation, accents)
- **Dark Bluish**: `#18414D` (search bar background)
- **Slate Blue**: `#18414D` (similar to dark bluish)
- **Dark Cyan**: `#2F778C` (borders, accents)
- **Teal Haze**: `#6191A3` (text, borders, dividers)
- **Ocean Blue**: `#16596D`
- **Midnight Black**: `#0F1819`
- **Dark Background**: `#01171D` (dark sections)
- **Green Shades Light**: `#08555c` (emotion buttons)
- **Teal Accent**: `#0C7077` (blur effects)

### Text Colors
- **Black**: `#000000`
- **Dark Gray**: `#1A1A1A`
- **Charcoal**: `#3F3F3F`
- **Gray**: `#7A7474` (placeholder text)
- **Light Gray**: `#737069` (placeholder text)
- **Beige Muted**: `#D4CDBB` (hero subtitle)

### Accent Colors
- **Orange Accent**: `#E5855C` (dots, accents)
- **Link Brown**: `#95754B` (links, icons)
- **Sandy**: `#C7AF90` (dots with opacity)
- **Light Sand**: `#E2D5C5` (borders)
- **Pale Brown**: `#D5C2AA`
- **Dark Chocolate**: `#332E24` (text)
- **Birch**: `#332E24` (text)

### Neutral/Utility
- **Light Gray Background**: `#F6F6F6` (search bar)
- **Light Smoke**: `#FAFAFA` (input backgrounds)
- **Vanilla**: `#F0E8CB` (icons, accents)

## Typography

### Font Families
- **Proxima Nova**: Primary sans-serif (body text, buttons, navigation)
- **Libre Bodoni**: Serif (headings, large text)
- **Helvetica**: Buttons (some instances)
- **Roboto**: Cards, footer text

### Font Sizes & Weights

#### Headings
- **H1 (Hero Title)**: 
  - Font: Libre Bodoni
  - Size: 90px
  - Line Height: 84px (93%)
  - Weight: 400
  - Letter Spacing: -0.03em
  - Color: #FFFFFF

- **H2 (Section Titles)**:
  - Font: Libre Bodoni
  - Size: 64px
  - Line Height: 68px (106%)
  - Weight: 400
  - Letter Spacing: -0.03em
  - Color: Varies (#000000, #FFFFFF, #B6572E, #3F3F3F)

- **H3 (Subsection Titles)**:
  - Font: Libre Bodoni
  - Size: 48px
  - Line Height: 55px (115%)
  - Weight: 400
  - Letter Spacing: -0.03em

- **H4 (Card Titles)**:
  - Font: Libre Bodoni
  - Size: 32px
  - Line Height: 32px (100%)
  - Weight: 400
  - Letter Spacing: -0.04em

- **H5 (Small Headings)**:
  - Font: Libre Bodoni
  - Size: 24px
  - Line Height: 30px (125%)
  - Weight: 400 or 700

#### Body Text
- **Large Body**:
  - Font: Proxima Nova
  - Size: 20px
  - Line Height: 26px (130%)
  - Weight: 300 or 400
  - Color: #000000 or #FFFFFF

- **Regular Body**:
  - Font: Proxima Nova
  - Size: 16px
  - Line Height: 24px (150%)
  - Weight: 400

- **Small Text**:
  - Font: Proxima Nova
  - Size: 14px
  - Line Height: 18px (129%)
  - Weight: 400, 500, 600, 700, or 800

#### Buttons
- **Button Text**:
  - Font: Proxima Nova or Helvetica
  - Size: 15px (Proxima) or 14px (Helvetica)
  - Line Height: 32px (213% or 229%)
  - Weight: 700
  - Letter Spacing: 0.1em
  - Text Transform: uppercase
  - Color: #000000 (on orange buttons)

#### Navigation
- **Nav Links**:
  - Font: Proxima Nova
  - Size: 14px
  - Line Height: 17px
  - Weight: 700
  - Color: #FFFFFF

#### Labels/Small Text
- **Uppercase Labels**:
  - Font: Proxima Nova
  - Size: 14px
  - Line Height: 18px (129%)
  - Weight: 600 or 800
  - Letter Spacing: 0.2em
  - Text Transform: uppercase

## Spacing

### Padding
- **Button Padding**: `12px 18px`
- **Card Content Padding**: `24px 20px` or `24px 32px`
- **Section Padding**: Varies (typically 0px in auto layout)
- **Accordion Item Padding**: `20px 0px`

### Gaps (Auto Layout)
- **Small Gap**: `4px`
- **Medium Gap**: `8px`
- **Default Gap**: `12px`
- **Large Gap**: `16px`
- **Extra Large Gap**: `24px`, `32px`, `42px`

### Border Radius
- **Buttons**: `100px` (fully rounded)
- **Cards**: `10px`, `12px`, `15px`, `20px`
- **Input Fields**: `1000px` (fully rounded)
- **Small Elements**: `67px`, `8px`

### Container Widths
- **Full Width**: `1920px`
- **Container Max**: `1824px` (with 48px margins)
- **Content Widths**: `656px`, `704px`, `998px`, `1086px`, `1385px`, `1516px`

## Component Specifications

### Buttons

#### Primary Button (Orange)
- Background: `#FC9445`
- Border Radius: `100px`
- Padding: `12px 18px`
- Font: Proxima Nova or Helvetica
- Font Size: `15px` (Proxima) or `14px` (Helvetica)
- Font Weight: `700`
- Line Height: `32px`
- Letter Spacing: `0.1em`
- Text Transform: `uppercase`
- Color: `#000000`

#### Secondary Button (Outlined)
- Border: `3px solid #FFFFFF`
- Border Radius: `100px`
- Padding: `12px 18px`
- Font: Proxima Nova
- Font Size: `15px`
- Font Weight: `700`
- Color: `#FFFFFF`

### Cards

#### Article Cards
- Background: `#F8F1EA` (Peach Cream)
- Border Radius: `10px`
- Content Padding: `24px 20px` or `24px 32px`
- Gap: `24px`

#### Category Cards
- Background: `#F4F2EC` (Subtle Sand)
- Border Radius: `12px`
- Font: Libre Bodoni
- Font Size: `26px`
- Line Height: `30px`
- Text Decoration: `underline`

### Hero Section
- Background: `#154652` or `#163B46`
- Title Font: Libre Bodoni, 90px
- Subtitle Font: Proxima Nova, 15px, 600, uppercase
- Body Font: Proxima Nova, 20px, 400
- Text Color: `#FFFFFF` (white)
- Subtitle Color: `#D4CDBB` (beige muted)

### Navigation
- Background: `#235561` (Bluish Light)
- Height: `101px`
- Logo: `287px × 42.34px`
- Nav Links: Proxima Nova, 14px, 700, white
- Search Bar Background: `#F6F6F6`
- Search Bar Border Radius: `1000px`

### Footer
- Background Top: `#EFE8DF` (Warm Beige)
- Background Main: `#163B46` (Bluish)
- Background Bottom: `#235561` (Bluish Light)
- Footer Links: Proxima Nova, 16px, 400, white
- Footer Headings: Proxima Nova, 28px, 400, `#ECE6DE`

### Accordion (FAQ)
- Divider Color: `#6191A3` (Teal Haze)
- Divider Height: `1px`
- Question Font: Proxima Nova, 20px, 700
- Question Line Height: `30px` (150%)
- Padding: `20px 0px`
- Gap: `12px`

### Emotion Buttons
- Background: `#6191A3` (Teal Haze)
- Border: `0px 1px 1px 0px solid #2F778C`
- Border Radius: `100px`
- Padding: `12px 24px`
- Font: Proxima Nova, 28px, 700
- Color: `#FFFFFF`
- Box Shadow: `0px 2px 10px rgba(0, 0, 0, 0.12)`

### Stages Section
- Background: `#F4F2EC` (Subtle Sand)
- Title Font: Libre Bodoni, 64px, italic, `#B6572E`
- Stage Icons: `48px × 48px`
- Stage Text: Proxima Nova, 16px, 400
- Stage Headings: Proxima Nova, 28px, 600, italic, `#604B30`, underline

## Key Differences from Current Implementation

### Colors Missing/Incorrect
1. **Hero Background**: Figma uses `#154652` or `#163B46`, current uses `bg-bluish` which should match
2. **Beige Muted**: `#D4CDBB` used for hero subtitle - verify this is in Tailwind config
3. **Teal Haze**: `#6191A3` used extensively for borders, text - verify in config
4. **Green Shades Light**: `#08555c` for emotion buttons - verify this matches

### Typography Issues
1. **Hero Title**: Figma uses 90px Libre Bodoni, need to verify current implementation
2. **Section Titles**: 64px Libre Bodoni - verify line heights match
3. **Button Fonts**: Some buttons use Helvetica instead of Proxima Nova
4. **Letter Spacing**: Hero title uses `-0.03em`, buttons use `0.1em` - verify these are applied

### Spacing Issues
1. **Button Padding**: Should be `12px 18px` consistently
2. **Card Padding**: Varies between `24px 20px` and `24px 32px` - need to standardize
3. **Gaps**: Auto layout uses specific gap values (4px, 8px, 12px, 16px, 24px, 32px, 42px)

### Component-Specific
1. **Border Radius**: Buttons should be `100px` (fully rounded), not `rounded-full` if that's different
2. **Input Fields**: Should have `1000px` border radius (fully rounded)
3. **Card Backgrounds**: Use `#F8F1EA` (Peach Cream) for article cards
4. **Category Cards**: Use `#F4F2EC` (Subtle Sand) background


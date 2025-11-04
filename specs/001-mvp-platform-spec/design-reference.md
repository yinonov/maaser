# Design Reference Guide

**Created**: 2025-11-04  
**Tool**: Google Stitch (HTML/Tailwind CSS prototypes)  
**Location**: `/example pages/*.html`

---

## Overview

High-fidelity UI mockups created to guide implementation of the HaMaaser MVP. These are fully functional HTML prototypes built with Tailwind CSS, demonstrating exact layouts, interactions, and visual design for both mobile and desktop viewports.

---

## Design System

### Color Palette

The design uses multiple warm, earthy color schemes that vary by page (demonstrating flexibility for final brand selection):

**Primary Options**:

- **Terracotta/Soft Gold**: `#d4a373` (registration-login.html)
- **Bright Gold**: `#eebd2b` (home.html, business-payment-setup.html)
- **Coral**: `#E87A5D` (donation.html)
- **Soft Teal**: `#A0DDE6` (invoice.html)

**Backgrounds**:

- **Light Mode**: `#F9F7F3`, `#FEFBF6`, `#FDF8F2`, `#f8f7f6`
- **Dark Mode**: `#2a2620`, `#221d10`, `#1A1A1A`

**Text Colors**:

- **Light Mode Primary**: `#4A4A4A`, `#333333`, `#181611`
- **Light Mode Secondary**: `#7a7a7a`, `#897f61`, `#7E7973`
- **Dark Mode Primary**: `#f0eade`, `#E0E0E0`, `#f8f7f6`
- **Dark Mode Secondary**: `#a8a296`, `#A8A29E`

**Borders**:

- **Light Mode**: `#E0E0E0`, `#E6E3DB`, `#EAE5E0`, `#f4f3f0`
- **Dark Mode**: `#5f5647`, `#44403c`, `#4A4A4A`

### Typography

**Font Family**: Plus Jakarta Sans + Noto Sans Hebrew (for Hebrew support)

**Font Weights**:

- Regular: 400
- Medium: 500
- Bold: 700
- Black: 800

**Font Sizes** (Tailwind classes used):

- Headings: `text-4xl` (36px), `text-3xl` (30px), `text-2xl` (24px), `text-xl` (20px)
- Body: `text-base` (16px), `text-sm` (14px), `text-xs` (12px)

### Border Radius

- Default: `0.25rem` (4px)
- Large: `0.5rem` (8px)
- XL: `0.75rem` (12px), `1rem` (16px)
- Full: `9999px` (rounded-full)

### Dark Mode Support

All pages include full dark mode support using Tailwind's `dark:` classes. Toggle can be implemented via JavaScript on the `html` element's class (`class="dark"` or `class="light"`).

---

## Page Breakdown

### 1. home.html - Story Feed

**Purpose**: Main donor-facing screen showing list of beneficiary stories

**Key Components**:

- **Header**: Sticky navigation with logo, menu items, user avatar
- **Story Card**:
  - NGO profile image and name
  - Hero image (aspect-video)
  - Story title and description
  - Progress bar with raised/goal amounts
  - Donation count and recent donor avatars
  - Social proof ("24 donations")
  - Primary CTA: "Donate" button
- **Infinite Scroll Loader**: Spinner at bottom during pagination

**Layout**: Single-column feed (max-width 600px) centered on page

**Interactions**:

- Hover states on story cards (subtle highlight)
- Smooth scrolling with loading indicator
- "Read more" link expands description

**Mobile Responsiveness**: Fully responsive with padding adjustments for small screens

---

### 2. registration-login.html - Authentication Flow

**Purpose**: User signup and login with email or social providers

**Key Components**:

- **Segmented Control**: Toggle between "Sign Up" and "Login" tabs
- **Social Login Buttons**:
  - Google (with logo)
  - WhatsApp (with logo)
- **Divider**: "או" (or) with horizontal rules
- **Form Fields**:
  - Full Name (for signup)
  - Email
  - Password
  - Terms & Conditions checkbox
- **Primary CTA**: "Create Account" button
- **Footer Link**: "Forgot Password?"

**Layout**: Centered card (max-width 448px) on light background

**Interactions**:

- Segmented control switches active state
- Form validation (not implemented in mockup, but structure ready)
- Hover states on all buttons

**RTL Support**: Full Hebrew layout with right-aligned text

---

### 3. dontation.html - Donation Flow

**Purpose**: Amount selection and donation submission

**Key Components**:

- **Amount Selector**:
  - Preset buttons: ₪18, ₪50, ₪100
  - Custom amount input field
  - Selected state highlighting
- **Dropdowns**:
  - "Donate To" (NGO/fund selection)
  - Purpose/Category selector
- **Frequency Toggle**:
  - One-time donation (selected)
  - Monthly recurring
  - Visual card-based toggle
- **Summary Box**: Highlights donation details with amounts in bold
- **Primary CTA**: "תרום עכשיו" (Donate Now) button in Hebrew
- **Secondary CTA**: "הגדר הוראת קבע" (Set up Monthly Tithe)
- **Security Badge**: SSL/PCI compliance indicator at bottom

**Layout**: Single-column form (max-width 720px) centered

**Interactions**:

- Amount buttons toggle active state
- Frequency cards change border/background on selection
- Real-time summary updates (not functional in mockup)

---

### 4. invoice.html - Receipt Generation

**Purpose**: View donation history and generate receipts

**Key Components**:

- **Left Panel** (2/5 width):
  - Search bar
  - Filter chips (Date Range, Status)
  - Donation table with rows:
    - NGO name and logo
    - Amount
    - Date
    - Status badge
    - Selected row highlighted
- **Right Panel** (3/5 width):
  - Receipt preview:
    - Header with NGO logo and details
    - Receipt number and date
    - Donor information section
    - Donation details table
    - Footer with legal text
  - Primary CTA: "הורד PDF" (Download PDF)

**Layout**: Two-column split view (responsive: stacks on mobile)

**Interactions**:

- Row selection highlights left panel item
- Hover states on table rows
- Download button triggers PDF generation

**Data Display**: Real receipt format with proper invoice structure

---

### 5. business-payment-setup.html - NGO Payment Settings

**Purpose**: NGO admins configure billing and payment information

**Key Components**:

- **Business Details Section**:
  - Business name
  - Tax ID (מספר עוסק מורשה)
  - Address (multi-line input)
  - City
  - Postal code
- **Payment Methods Section**:
  - Three payment type selectors:
    - Credit Card (selected)
    - Bank Transfer
    - PayPal
  - Credit card form:
    - Card number
    - Cardholder name
    - Expiry date
    - CVV
  - "Save this card" checkbox
  - Security badge (PCI compliance)
- **Action Buttons**:
  - Cancel (secondary)
  - Save Details (primary)

**Layout**: Single-column form (max-width 960px) with two-column grid for inputs

**Interactions**:

- Payment type selector toggles active card style
- Form validation ready (structure present)
- Save button primary emphasis

**Security**: Emphasizes secure payment processing with lock icons

---

## Implementation Guidelines

### For Mobile App (React Native)

1. **Component Mapping**:
   - HTML `<div class="custom-card">` → React Native `<View style={styles.card}>`
   - Tailwind classes → StyleSheet definitions
   - Example: `rounded-xl` → `borderRadius: 12`

2. **Color System**: Extract Tailwind colors to theme constants:

```typescript
// theme.ts
export const colors = {
  primary: '#d4a373',
  backgroundLight: '#F9F7F3',
  backgroundDark: '#2a2620',
  textLightPrimary: '#4A4A4A',
  textDarkPrimary: '#f0eade',
  // ... rest of palette
};
```

3. **Typography**: Use custom fonts with expo-font:

```typescript
import { useFonts } from 'expo-font';

useFonts({
  'PlusJakartaSans-Regular': require('./assets/fonts/PlusJakartaSans-Regular.ttf'),
  'PlusJakartaSans-Bold': require('./assets/fonts/PlusJakartaSans-Bold.ttf'),
  // ...
});
```

4. **RTL Support**: Use I18nManager for Hebrew:

```typescript
import { I18nManager } from 'react-native';
I18nManager.forceRTL(true);
```

### For Web Dashboard (Next.js)

1. **Use Tailwind Directly**: Copy Tailwind classes from mockups
2. **Component Library**: Build reusable components matching mockup patterns:
   - `<Card>` component with light/dark variants
   - `<Button>` with primary/secondary variants
   - `<Input>` with consistent styling
3. **Dark Mode**: Use Next.js dark mode with `next-themes`:

```typescript
import { useTheme } from 'next-themes';
const { theme, setTheme } = useTheme();
```

### Responsive Breakpoints

Match Tailwind defaults:

- `sm`: 640px (mobile landscape)
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)

### Icon System

Mockups use Material Symbols Outlined:

- For React Native: Use `@expo/vector-icons` MaterialCommunityIcons
- For Web: Keep Material Symbols or use Heroicons

---

## Design Decisions & Rationale

### Why Multiple Color Schemes?

The mockups intentionally use different primary colors across pages to demonstrate flexibility. Final implementation should:

1. **Choose ONE primary color** for brand consistency
2. Recommended: `#d4a373` (muted terracotta) for warm, trustworthy feel
3. Alternative: `#eebd2b` (gold) for more energetic, optimistic brand

### Why Warm, Earthy Tones?

- **Trust**: Warm colors evoke security and reliability (important for donations)
- **Accessibility**: Sufficient contrast ratios for WCAG AA compliance
- **Cultural Fit**: Resonates with traditional values of tithing/charity

### Why Card-Based Layouts?

- **Mobile-First**: Cards work well on small screens
- **Scannability**: Clear visual hierarchy with contained content
- **Modularity**: Easy to add/remove cards without breaking layout

### Why Dark Mode?

- **User Preference**: 40%+ of users prefer dark interfaces
- **Battery Savings**: OLED screens save power with dark pixels
- **Accessibility**: Some users find dark mode easier to read

---

## Testing the Mockups

### Open Locally

```bash
# Open any mockup in browser
open "example pages/home.html"

# Or with live server for hot reload
npx live-server "example pages"
```

### View on Mobile Device

1. Serve files on local network:

```bash
cd "example pages"
python3 -m http.server 8000
```

2. Get local IP: `ifconfig | grep "inet "`
3. Open on phone: `http://192.168.x.x:8000/home.html`

### Test Dark Mode

Toggle in browser console:

```javascript
document.documentElement.classList.toggle('dark');
```

---

## Files Reference

| File | Screen | User Story | Priority |
|------|--------|------------|----------|
| `home.html` | Story Feed | US-001 (Donor Discovery) | P1 |
| `registration-login.html` | Auth Flow | US-001 (Donor Discovery) | P1 |
| `dontation.html` | Donation Flow | US-001 (First Donation) | P1 |
| `invoice.html` | Receipt Management | US-004 (Receipt Tracking) | P3 |
| `business-payment-setup.html` | NGO Settings | US-002 (NGO Management) | P2 |

---

## Next Steps for Developers

1. ✅ Review all 5 mockup files in browser
2. ✅ Extract color palette to theme constants
3. ✅ Create component library matching mockup patterns
4. ✅ Set up Tailwind config with custom colors
5. ✅ Implement dark mode toggle
6. ✅ Test RTL layout with Hebrew content
7. ✅ Build reusable components (StoryCard, Button, Input, etc.)
8. ✅ Match spacing, typography, and border radius exactly

---

**Questions?** Refer back to mockup HTML source for exact Tailwind classes and structure.

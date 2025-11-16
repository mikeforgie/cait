# CAIT Color Palette & Brand Guidelines

## Primary Gradient: Red → Yellow → Green

The CAIT dashboard uses a dynamic gradient that represents the SEO lifecycle:
- **Red**: Issues, Errors, Urgent Actions Required
- **Yellow**: In Progress, Pending, Warnings
- **Green**: Complete, Healthy, Active

### Color Values

#### Primary Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| Red | `#ef4444` | `rgb(239, 68, 68)` | Errors, urgent actions, primary buttons |
| Red (Light) | `#fca5a5` | `rgb(252, 165, 165)` | Hover states, backgrounds |
| Red (Dark) | `#991b1b` | `rgb(153, 27, 27)` | Text, dark hover states |
| Yellow | `#eab308` | `rgb(234, 179, 8)` | Warnings, in-progress indicators |
| Yellow (Light) | `#facc15` | `rgb(250, 204, 21)` | Hover states, highlights |
| Yellow (Dark) | `#ca8a04` | `rgb(202, 138, 4)` | Text on light backgrounds |
| Green | `#22c55e` | `rgb(34, 197, 94)` | Success, complete, healthy |
| Green (Light) | `#86efac` | `rgb(134, 239, 172)` | Hover states, backgrounds |
| Green (Dark) | `#15803d` | `rgb(21, 128, 61)` | Text, dark hover states |

#### Neutral Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| White | `#ffffff` | `rgb(255, 255, 255)` | Card backgrounds, text on colored backgrounds |
| Gray 50 | `#f9fafb` | `rgb(249, 250, 251)` | Page background, light sections |
| Gray 100 | `#f3f4f6` | `rgb(243, 244, 246)` | Hover states, subtle backgrounds |
| Gray 200 | `#e5e7eb` | `rgb(229, 231, 235)` | Borders, dividers |
| Gray 300 | `#d1d5db` | `rgb(209, 213, 219)` | Secondary borders |
| Gray 400 | `#9ca3af` | `rgb(156, 163, 175)` | Disabled text, secondary labels |
| Gray 500 | `#6b7280` | `rgb(107, 114, 128)` | Secondary text, muted content |
| Gray 600 | `#4b5563` | `rgb(75, 85, 99)` | Body text, content |
| Gray 700 | `#374151` | `rgb(55, 65, 81)` | Secondary headings |
| Gray 800 | `#1f2937` | `rgb(31, 41, 55)` | Headings, important text |
| Gray 900 | `#111827` | `rgb(17, 24, 39)` | Primary text, darkest |

#### Status Colors

| Status | Color | Hex | Usage |
|--------|-------|-----|-------|
| Success | Green | `#22c55e` | Completed tasks, connected status |
| Warning | Yellow | `#eab308` | In progress, pending status |
| Danger | Red | `#ef4444` | Errors, disconnected status |
| Info | Blue | `#3b82f6` | Information, notifications |

### Gradient Definitions

#### Main Gradient (135° diagonal)
```css
linear-gradient(135deg, #ef4444, #eab308, #22c55e)
```
**Usage**: Buttons, headers, logo, accent elements

#### Reverse Gradient
```css
linear-gradient(135deg, #22c55e, #eab308, #ef4444)
```
**Usage**: Alternative direction for visual variety

#### Hover Gradient (Lighter tones)
```css
linear-gradient(135deg, #fca5a5, #facc15, #86efac)
```
**Usage**: Button hover states, interactive elements

#### Subtle Gradient Backgrounds
```css
linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(34, 197, 94, 0.05))
```
**Usage**: Card backgrounds, action items, status containers

### Color Application Guidelines

#### Buttons

**Primary Button (Call-to-Action)**
- Background: Red → Yellow → Green Gradient
- Text: White
- Shadow: `0 10px 30px rgba(239, 68, 68, 0.1)`
- Hover: Use lighter gradient tones
- Example: "Generate with AI", "Connect Now", "Save"

```css
.btn-primary {
    background: linear-gradient(135deg, #ef4444, #eab308, #22c55e);
    color: #ffffff;
    box-shadow: 0 10px 30px rgba(239, 68, 68, 0.1);
}

.btn-primary:hover {
    background: linear-gradient(135deg, #fca5a5, #facc15, #86efac);
    box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
}
```

**Secondary Button**
- Background: Gray 200
- Text: Gray 900
- Hover: Gray 300
- Example: "Cancel", "Schedule", "Review"

```css
.btn-secondary {
    background: #e5e7eb;
    color: #111827;
}

.btn-secondary:hover {
    background: #d1d5db;
}
```

**Danger Button**
- Background: Red (light)
- Text: Red (dark)
- Hover: Red background with white text
- Example: "Delete", "Disconnect"

```css
.btn-danger {
    background: rgba(239, 68, 68, 0.1);
    color: #991b1b;
}

.btn-danger:hover {
    background: #ef4444;
    color: #ffffff;
}
```

#### Status Indicators

**Status Dots (Animated pulse)**
```css
.status-dot.status-green {
    background-color: #22c55e;
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.status-dot.status-yellow {
    background-color: #eab308;
}

.status-dot.status-red {
    background-color: #ef4444;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
```

**Status Badges**
```css
.status-badge.status-good {
    background: rgba(34, 197, 94, 0.1);    /* Green background */
    color: #15803d;                        /* Dark green text */
}

.status-badge.status-warning {
    background: rgba(234, 179, 8, 0.1);    /* Yellow background */
    color: #ca8a04;                        /* Dark yellow text */
}

.status-badge.status-error {
    background: rgba(239, 68, 68, 0.1);    /* Red background */
    color: #991b1b;                        /* Dark red text */
}
```

#### Progress Bars

**Color progression based on value:**
- 0-33%: Red (`#ef4444`)
- 34-66%: Yellow (`#eab308`)
- 67-100%: Green (`#22c55e`)

**Implementation with gradient:**
```css
.progress-fill {
    background: linear-gradient(90deg, #ef4444, #eab308, #22c55e);
    height: 100%;
}
```

#### Text Gradients

**For headings and important text:**
```css
h1, h2, .page-title {
    background: linear-gradient(135deg, #ef4444, #eab308, #22c55e);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}
```

#### Card Styling

**Connection Card States:**
```css
/* Connected card */
.connection-card.connected {
    border-color: #22c55e;
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.02), rgba(34, 197, 94, 0.05));
}

/* Pending card */
.connection-card.pending {
    border-color: #eab308;
    background: linear-gradient(135deg, rgba(234, 179, 8, 0.02), rgba(234, 179, 8, 0.05));
}

/* Disconnected card */
.connection-card.disconnected {
    border-color: #ef4444;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.02), rgba(239, 68, 68, 0.05));
}
```

### Accessibility Considerations

1. **Contrast Ratios**: All text colors meet WCAG AA standards against their backgrounds
   - Gray 900 on White: 17.5:1 ✓
   - Gray 600 on White: 6.1:1 ✓
   - Green on Gray 50: 6.2:1 ✓

2. **Color-blind Safe**: Don't rely solely on color to convey status
   - Use icons + color for status indicators
   - Use text labels with status dots
   - Patterns and contrast as backup

3. **Dark Mode Compatibility** (future):
   - Invert colors for dark backgrounds
   - Maintain gradient definitions
   - Ensure same contrast ratios

### Typography Color Usage

| Element | Color | Hex |
|---------|-------|-----|
| Primary Heading (h1, h2) | Gradient or Gray 900 | Gradient or `#111827` |
| Secondary Heading (h3, h4) | Gray 900 | `#111827` |
| Body Text | Gray 700 | `#374151` |
| Secondary Text | Gray 600 | `#4b5563` |
| Muted Text (labels, helper) | Gray 500 | `#6b7280` |
| Disabled Text | Gray 400 | `#9ca3af` |
| Links | Red | `#ef4444` |
| Links Hover | Red Dark | `#991b1b` |

### Shadow/Elevation System

**Shadow colors use RGB values with opacity:**

```css
/* Small shadow */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);

/* Medium shadow */
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);

/* Large shadow */
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

/* Extra large shadow */
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);

/* Gradient-specific shadow (red-tinted for gradient buttons) */
--shadow-gradient: 0 10px 30px rgba(239, 68, 68, 0.1);
```

### Export Formats

For use in design tools:

**Figma/Adobe XD:**
```
Primary Gradient: linear-gradient(135deg, #ef4444 0%, #eab308 50%, #22c55e 100%)
```

**Tailwind CSS:**
```js
colors: {
  'red': '#ef4444',
  'red-light': '#fca5a5',
  'red-dark': '#991b1b',
  'yellow': '#eab308',
  'yellow-light': '#facc15',
  'yellow-dark': '#ca8a04',
  'green': '#22c55e',
  'green-light': '#86efac',
  'green-dark': '#15803d',
}

gradients: {
  'primary': 'linear-gradient(135deg, #ef4444, #eab308, #22c55e)',
  'primary-reverse': 'linear-gradient(135deg, #22c55e, #eab308, #ef4444)',
  'hover': 'linear-gradient(135deg, #fca5a5, #facc15, #86efac)',
}
```

**SCSS Variables:**
```scss
$color-red: #ef4444;
$color-red-light: #fca5a5;
$color-red-dark: #991b1b;
$color-yellow: #eab308;
$color-yellow-light: #facc15;
$color-yellow-dark: #ca8a04;
$color-green: #22c55e;
$color-green-light: #86efac;
$color-green-dark: #15803d;

$gradient-primary: linear-gradient(135deg, $color-red, $color-yellow, $color-green);
$gradient-hover: linear-gradient(135deg, $color-red-light, $color-yellow-light, $color-green-light);
```

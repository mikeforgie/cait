# CAIT Interaction Specifications & User Flows

## Overview

This document outlines all user interactions, animations, and behavioral patterns for the CAIT dashboard. It ensures consistent, intuitive experiences across all user journeys.

---

## 1. AI GENERATION FEATURE (Core Interaction)

### 1.1 Trigger Points

Users can access AI generation from multiple locations:

1. **Dashboard - Recommended Actions Card**
   - "Generate with AI" button on action items
   - Location: Main dashboard, bottom card

2. **Tasks Dashboard - To-Do Section**
   - "Generate with AI" button on each task
   - Visible in both list and Kanban views

3. **In-Context Actions**
   - Right-click context menu (future enhancement)
   - Inline quick-action buttons

### 1.2 AI Generation Flow

```
User clicks "Generate with AI"
        ↓
Modal opens with task name
        ↓
Loading state shows (2-3 seconds)
    - Spinner animation
    - Placeholder text: "Generating your content..."
        ↓
Content preview appears
    - Generated content displayed
    - Preview area shows sample output
        ↓
User has 3 options:
    1. "Use This" → Apply and close
    2. "Regenerate" → New variation
    3. "Edit" → Manual customization
    4. "Cancel" → Dismiss
```

### 1.3 Modal Specification

**Modal Container:**
- Size: 600px max-width (90% on mobile)
- Overlay: `rgba(0, 0, 0, 0.5)` with fade animation
- Animation: Slide up + fade in (300ms)
- Position: Centered on screen
- Dismiss: Close button, overlay click, Escape key

**Modal Content Areas:**

1. **Header Section**
   - Close button (top right)
   - Task name as h2
   - Smaller text showing "Generate: [Task Name]"

2. **Loading State** (Initial 2 seconds)
   ```
   [Spinner Icon - rotating]
   Generating your content...
   ```
   - Spinner color: Red (`#ef4444`)
   - Animation: CSS rotation, 2s per rotation
   - Text: Gray 600

3. **Preview Section** (After loading)
   ```
   Generated Content
   [Sample text preview]

   This is AI-generated content that would be customized
   based on your specific needs. You can review, edit, or
   regenerate before applying it to your site.
   ```
   - Background: Gray 50 (`#f9fafb`)
   - Min-height: 200px
   - Border-radius: 12px
   - Padding: 48px 32px

4. **Action Buttons** (Bottom)
   - Primary: "Use This" (gradient)
   - Secondary: "Regenerate" (gray)
   - Secondary: "Edit" (gray)
   - Secondary: "Cancel" (gray)
   - Gap between buttons: 16px
   - Alignment: Right-aligned

### 1.4 Detailed Interaction States

#### State: Loading
```css
.modal-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    background: #f9fafb;
    border-radius: 12px;
}

.spinner {
    font-size: 2rem;
    color: #ef4444;
    animation: spin 2s linear infinite;
    margin-bottom: 16px;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
```

#### State: Ready
- Preview text appears smoothly (fade-in, 300ms)
- Action buttons become interactive
- User can click "Regenerate" to create variations
- Each regeneration triggers loading state again

#### State: Complete
- "Use This" button becomes primary action
- Content is applied to the task
- Modal closes automatically (optional)
- Toast notification: "Content applied successfully"

### 1.5 Keyboard Interactions

| Key | Action |
|-----|--------|
| `Escape` | Close modal |
| `Tab` | Cycle through buttons |
| `Enter` | Activate focused button |
| `Ctrl+Enter` / `Cmd+Enter` | "Use This" (shortcut) |

### 1.6 Accessibility Features

- Modal has `role="dialog"` and `aria-modal="true"`
- Focus trap: Tab cycling stays within modal
- ARIA labels on all buttons
- Loading state announced to screen readers
- Generated content is focusable and readable

---

## 2. NAVIGATION FLOW

### 2.1 Sidebar Navigation

**Interaction Pattern:**
```
User clicks nav item
        ↓
Active state updates (highlight + gradient border)
        ↓
Current view fades out (200ms)
        ↓
New view fades in (200ms)
```

**Visual Feedback:**
- Active item: Gradient left border (4px)
- Hover state: Light background, slight left indent
- Cursor changes to pointer on hover

**Animation:**
```css
.nav-item {
    transition: all 300ms ease-in-out;
}

.nav-item.active {
    background-color: #f3f4f6;
    border-left: 4px solid transparent;
    border-image: linear-gradient(135deg, #ef4444, #eab308, #22c55e) 1;
    padding-left: calc(var(--spacing-lg) - 4px);
}
```

### 2.2 View Transitions

**Available Views:**
1. Dashboard (home)
2. Connections
3. Tasks
4. Analytics
5. Settings (future)

**Transition Animation:**
- Fade out current view: 150ms
- Fade in new view: 150ms
- Scroll to top: 300ms smooth

---

## 3. TASK MANAGEMENT INTERACTIONS

### 3.1 List View Interactions

#### Checkbox Interaction
```
User clicks checkbox
        ↓
Visual feedback (highlight row)
        ↓
Checkbox animates to checked state
        ↓
Row becomes slightly transparent (0.7 opacity)
        ↓
Task text gets strikethrough effect
        ↓
Status updates in backend
```

**Animation Details:**
- Checkbox animation: 200ms scale + color change
- Row highlight: 150ms background color fade
- Strikethrough: Appears with text color change

#### Task Expand/Collapse (Future)
```
User clicks task item
        ↓
Row expands to show more details
        ↓
Additional actions appear:
    - Edit details
    - Change priority
    - Add due date
    - Add tags
```

### 3.2 Task Filtering

**Filter Button Interaction:**
```
User clicks filter button
        ↓
Active state updates (gradient background)
        ↓
Tasks re-render with filter applied
        ↓
Result count updates
        ↓
No animation delay (instant filtering)
```

**Active Filter States:**
```css
.filter-btn.active {
    background: linear-gradient(135deg, #ef4444, #eab308, #22c55e);
    color: #ffffff;
    border-color: transparent;
    box-shadow: 0 10px 30px rgba(239, 68, 68, 0.1);
}
```

### 3.3 View Toggle (List ↔ Kanban)

**Transition:**
```
User clicks view toggle button
        ↓
Active button highlights (white background, red text)
        ↓
Current view fades out (150ms)
        ↓
New view fades in (150ms)
```

**Animations:**
```css
.view-btn.active {
    background-color: #ffffff;
    color: #ef4444;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.tasks-list,
.tasks-kanban {
    transition: opacity 150ms ease-in-out;
}

.tasks-list.hidden,
.tasks-kanban.hidden {
    display: none;
    opacity: 0;
}
```

---

## 4. KANBAN BOARD INTERACTIONS

### 4.1 Drag & Drop Mechanics

**Drag Initiation:**
```
User clicks and holds kanban card
        ↓
Cursor changes to "grab"
        ↓
Card becomes semi-transparent (0.5 opacity)
        ↓
Dragging initiated
```

**During Drag:**
```
User moves mouse with card held
        ↓
Card follows cursor
        ↓
Target column highlights (subtle background color change)
        ↓
Drop zone visual feedback appears
```

**Drop Completion:**
```
User releases mouse over target column
        ↓
Card animates into new column
        ↓
Card opacity restores (1.0)
        ↓
Target column highlight fades
        ↓
Status updates in backend
        ↓
Toast confirmation: "Task moved to [Column]"
```

**CSS Implementation:**
```css
.kanban-card {
    cursor: grab;
    transition: all 300ms ease-in-out;
}

.kanban-card:active {
    cursor: grabbing;
    opacity: 0.5;
}

.kanban-columns:hover {
    background-color: rgba(239, 68, 68, 0.05);
    transition: background-color 150ms ease-in-out;
}
```

### 4.2 Card Hover States

**Kanban Card Hover:**
```css
.kanban-card:hover {
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
    transform: translateY(-4px);
    transition: all 300ms ease-in-out;
}
```

**Visual Changes:**
- Lift effect: 4px upward
- Enhanced shadow
- Slight scale increase (1.02x)
- Cursor changes to grab

---

## 5. CONNECTION MANAGEMENT FLOW

### 5.1 OAuth Connection Flow

```
User clicks "Connect Now" or "Connect"
        ↓
Modal/window opens with connection instructions
        ↓
Show step-by-step setup:
    1. Redirect to service OAuth page
    2. User authorizes CAIT
    3. Return to dashboard
        ↓
Connection status updates
        ↓
Toast: "Successfully connected [Service]"
        ↓
Refresh connections list
```

### 5.2 Connection Card States

**Connected Card:**
- Border: Green (`#22c55e`)
- Background: Subtle green gradient
- Status dot: Green (pulsing)
- Buttons: "Settings", "Disconnect"

**Pending Card:**
- Border: Yellow (`#eab308`)
- Background: Subtle yellow gradient
- Status dot: Yellow (pulsing)
- Buttons: "Connect Now" or "Instructions"

**Disconnected Card:**
- Border: Red (`#ef4444`)
- Background: Subtle red gradient
- Status dot: Red (static)
- Buttons: "Connect"

**Hover Interaction:**
All connection cards:
```css
.connection-card:hover {
    border-color: #ef4444;
    box-shadow: 0 0 0 1px #ef4444, 0 10px 15px rgba(0, 0, 0, 0.1);
    transition: all 300ms ease-in-out;
}
```

### 5.3 Disconnect Confirmation

```
User clicks "Disconnect"
        ↓
Confirmation modal appears:
    "Are you sure you want to disconnect [Service]?"
    "This action cannot be undone."
        ↓
Options: "Cancel", "Disconnect" (danger button)
        ↓
If confirmed:
    - Card animates to disconnected state
    - Status updates
    - Toast: "Disconnected successfully"
```

---

## 6. BUTTON & CONTROL INTERACTIONS

### 6.1 Primary Button (Gradient)

**States:**

1. **Default**
   - Background: Red → Yellow → Green gradient
   - Text: White
   - Shadow: Gradient shadow

2. **Hover**
   - Background: Lighter gradient (hover tones)
   - Shadow: Larger, more prominent
   - Transform: translateY(-2px) - lift effect
   - Duration: 300ms

3. **Active (Pressed)**
   - Transform: translateY(0) - return to baseline
   - Shadow: Less prominent
   - Duration: 150ms

4. **Loading**
   - Opacity: 0.7
   - Cursor: Wait/spinner
   - Text: Hidden or replaced with spinner
   - Disabled: true

5. **Disabled**
   - Opacity: 0.5
   - Cursor: Not-allowed
   - No hover effects

**CSS:**
```css
.btn-primary {
    background: linear-gradient(135deg, #ef4444, #eab308, #22c55e);
    color: #ffffff;
    box-shadow: 0 10px 30px rgba(239, 68, 68, 0.1);
    transition: all 300ms ease-in-out;
}

.btn-primary:hover {
    background: linear-gradient(135deg, #fca5a5, #facc15, #86efac);
    box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
}

.btn-primary:active {
    transform: translateY(0);
}

.btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
```

### 6.2 Secondary Button

**Behavior:**
- Background: Gray 200 → Gray 300 (on hover)
- Text: Gray 900
- No lift effect on hover
- Subtle shadow changes

### 6.3 Status Dots (Animated Pulse)

**Animation:**
```css
.status-dot {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}
```

**Colors:**
- Green: Active/connected
- Yellow: Pending/in-progress
- Red: Error/disconnected

---

## 7. FORM INTERACTIONS

### 7.1 Input Field Focus States

**Focus Behavior:**
```
User clicks input field
        ↓
Field highlights with border color change
        ↓
Shadow increases to indicate focus
        ↓
Placeholder text animates up (if using floating labels)
```

**CSS:**
```css
input:focus {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    outline: none;
}
```

### 7.2 Error States

**Error Display:**
```
User submits invalid form
        ↓
Error message appears below field (fade-in)
        ↓
Input border turns red
        ↓
Field gets red left border accent
```

---

## 8. NOTIFICATION SYSTEM

### 8.1 Toast Notifications

**Toast Position:** Bottom-right

**Types:**
1. **Success** (Green)
   - Duration: 4 seconds auto-dismiss
   - Icon: Checkmark

2. **Warning** (Yellow)
   - Duration: 6 seconds auto-dismiss
   - Icon: Exclamation

3. **Error** (Red)
   - Duration: 8 seconds auto-dismiss (manual dismiss available)
   - Icon: X mark

4. **Info** (Blue)
   - Duration: 5 seconds auto-dismiss
   - Icon: Info circle

**Animation:**
- Entrance: Slide in from right (300ms)
- Exit: Slide out to right (300ms)

**Example Success Toast:**
```
✓ Content applied successfully
```

---

## 9. RESPONSIVE INTERACTIONS

### 9.1 Mobile (< 768px)

**Sidebar:**
- Collapses to hamburger menu
- Full-width on tap
- Slide-in animation from left

**Navigation:**
- Horizontal scrollable tabs
- Icons only on mobile
- Active indicator bottom bar

**Buttons:**
- Larger touch targets (44px minimum)
- More spacing between elements

**Modal:**
- Full-screen on mobile
- Slide up animation
- Proper padding for safe areas

### 9.2 Tablet (768px - 1024px)

**Grid Layout:**
- 2-column card layout instead of 3
- Optimized spacing

**Sidebar:**
- Collapsible with toggle
- Auto-collapse on narrow viewports

---

## 10. MICRO-INTERACTIONS

### 10.1 Loading Animations

**Spinner for AI Generation:**
```css
@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.spinner {
    animation: spin 2s linear infinite;
}
```

### 10.2 Progress Bar Animations

**Progress Update:**
```css
.progress-fill {
    transition: width 600ms cubic-bezier(0.4, 0, 0.2, 1);
}
```
- Easing: Ease-out for natural feel
- Duration: 600ms (smooth but responsive)

### 10.3 Hover Lift Effects

**Common Pattern:**
```css
.interactive-element:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
    transition: all 300ms ease-in-out;
}
```

---

## 11. ACCESSIBILITY INTERACTIONS

### 11.1 Keyboard Navigation

- **Tab**: Navigate between interactive elements
- **Shift+Tab**: Navigate backwards
- **Enter**: Activate buttons/links
- **Space**: Toggle checkboxes
- **Escape**: Close modals/dropdowns
- **Arrow Keys**: Navigate within lists/Kanban

### 11.2 Focus Indicators

All interactive elements must have visible focus states:
```css
:focus-visible {
    outline: 2px solid #ef4444;
    outline-offset: 2px;
    border-radius: 4px;
}
```

### 11.3 ARIA Announcements

- Modal opens: Announce "Dialog opened"
- Task completed: Announce "Task marked complete"
- Content generated: Announce "AI generation complete"
- Drag & drop: Announce "Dropped in [Column]"

---

## 12. PERFORMANCE OPTIMIZATION

### 12.1 Animation Best Practices

- Use `transform` and `opacity` for smooth animations
- Avoid animating `width`, `height`, or `left`
- Use `will-change` sparingly for expensive operations
- RequestAnimationFrame for complex animations

### 12.2 Interaction Delays

- Instant feedback for user input (< 100ms)
- Loading states show within 200ms
- Modal animations: 300ms
- View transitions: 150ms fade

---

## Summary Table: Key Interactions

| Feature | Trigger | Feedback | Duration |
|---------|---------|----------|----------|
| Generate AI | Button click | Modal opens, spinner | 2s loading |
| Task complete | Checkbox | Strikethrough effect | 200ms |
| Filter tasks | Button click | Instant filter | Instant |
| Drag card | Mouse hold | Opacity 0.5, cursor grab | 300ms |
| View toggle | Button click | Fade transition | 150ms |
| Connection connect | Button click | OAuth flow | Variable |
| Notify user | Action complete | Toast slide-in | 300ms |

---

## Future Enhancements

1. **Advanced Animations**
   - Parallax scrolling in dashboard
   - Card flip animations for stats
   - Animated backgrounds in headers

2. **Gesture Support**
   - Swipe between views on mobile
   - Long-press for context menus
   - Pinch to zoom for charts

3. **Advanced Feedback**
   - Haptic feedback on mobile
   - Sound effects for AI generation complete
   - Voice feedback for accessibility

4. **Progressive Disclosure**
   - Expandable cards with more details
   - Tooltip hints for new users
   - Progressive enhancement for power users

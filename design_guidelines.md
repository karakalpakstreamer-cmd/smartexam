# SmartExam Design Guidelines

## Design System

### Colors
- **Primary**: #1E40AF (royal blue)
- **Primary Light**: #3B82F6
- **Primary Dark**: #1E3A8A
- **Success**: #059669 (emerald)
- **Warning**: #D97706 (amber)
- **Error**: #DC2626 (red)
- **Background**: #F1F5F9 (light slate)
- **Card**: #FFFFFF
- **Text Primary**: #1E293B (slate)
- **Text Secondary**: #64748B (slate gray)
- **Border**: #E2E8F0 (light slate)
- **Sidebar Background**: #0F172A (slate-900)

### Typography
- **Font Family**: 'Inter', sans-serif (import from Google Fonts with Cyrillic subset for Uzbek support)
- **Headings**: 
  - H1: 28px bold
  - H2: 24px semibold
  - H3: 20px semibold
  - H4: 16px medium
- **Body Text**: 14px regular
- **Small Text**: 12px regular

### Spacing System
Base unit: 4px
Common spacing: 4px, 8px, 12px, 16px, 24px, 32px, 48px

### Border Radius
- Buttons: 6px
- Cards: 8px
- Modals: 12px

### Shadows
- **Small**: 0 1px 2px rgba(0,0,0,0.05)
- **Medium**: 0 4px 6px rgba(0,0,0,0.07)
- **Large**: 0 10px 15px rgba(0,0,0,0.1)

### Logo Integration
- **Login Page**: 48px height, centered above form
- **Sidebar Header**: 32px height, inline with "SmartExam" text
- **Favicon**: Auto-generated from logo.png
- **Contrast**: Ensure logo works on both light (#FFFFFF) and dark (#1E3A5F) backgrounds
- **File Path**: /client/public/logo.png

## Language
All interface text in **Uzbek language** (use Cyrillic alphabet)

## Layout Architecture

### Login & Setup Pages
- **Full viewport height**, centered content
- **Background**: Linear gradient from #1E40AF to #3B82F6
- **Card**: max-width 420px, white background, rounded-xl, shadow-lg, padding 8 units
- **Logo Section**: SmartExam logo (48px) + "SmartExam" text (24px bold) + tagline "Adolatli imtihon tizimi" (14px gray)

### Application Layout (Post-Login)
**Sidebar (Fixed Left)**:
- Width: 260px
- Height: 100vh
- Background: #0F172A (slate-900)
- Text: white
- Logo section at top with border-bottom
- User info card with avatar (initials), name, role badge
- Navigation items with icons (24px) + text (14px)
- Active state: bg-slate-700
- Hover state: bg-slate-800
- Logout button at bottom with border-top

**Main Content Area**:
- Margin-left: 260px
- Background: #F1F5F9
- Minimum height: 100vh
- Padding: 24px

**Top Bar**:
- Height: 64px
- Background: white
- Shadow: small
- Flex layout: page title (left) + notifications/user menu (right)
- Padding: 24px horizontal

## Component Patterns

### Role Selector Cards (Login)
- 3 cards in a row
- Each card: 100px width, padding 12px, border, rounded-lg, cursor-pointer
- Icon (24px) + label (12px) centered
- Selected: border-primary, bg-primary with 5% opacity
- Hover: border-primary with 50% opacity

### Input Fields
- Height: 44px
- Border: 1px solid #E2E8F0
- Rounded: 8px
- Focus: 2px ring in primary color
- Left icon space: 40px padding
- Password toggle icon on right

### Buttons
- Height: 44px
- Padding: 12px 24px
- Rounded: 6px
- Primary: bg-primary, text-white, hover:bg-primary-dark
- Outline: border-primary, text-primary, hover:bg-primary with 5% opacity

### Stats Cards
- Grid: 4 columns with 24px gap
- Background: white
- Rounded: 12px
- Padding: 24px
- Shadow: small
- Icon: 40px circle with colored background
- Title: 12px gray
- Value: 24px bold
- Subtitle: 12px secondary text

### Data Tables
- Background: white
- Rounded: 12px
- Overflow: hidden
- Row hover: bg-slate-50
- Header: semibold, border-bottom
- Actions column: icon buttons (edit/delete)

### Modals
- Backdrop: rgba(0,0,0,0.5)
- Content: white, rounded-xl, max-width 500px, shadow-lg
- Title: 20px semibold, border-bottom
- Form padding: 24px
- Button row: right-aligned with gap

### Navigation Items
- Padding: 8px vertical, 16px horizontal
- Rounded: 8px
- Margin: 8px horizontal
- Icon + text layout with 12px gap
- Active/hover states as specified in sidebar

## Page-Specific Layouts

### Dashboard (Bosh sahifa)
- 4-column stats grid at top
- Recent activity section below (white card with list)
- Upcoming exams table (white card with table)

### CRUD Pages (Fakultetlar, Guruhlar, etc.)
- Header row: title (left) + "Add" button (right)
- White card containing data table
- Empty state: centered illustration + message + CTA button

### Exam Interface (Student)
- Fullscreen mode when active
- Timer in fixed top-right corner
- Question cards with large, readable text
- Text area for answers
- Submit button fixed at bottom

### Results Review (Teacher)
- Split view: student list (left sidebar 30%) + answer details (right 70%)
- AI score badges with color coding
- Feedback cards with expandable details
- Score adjustment controls with +/- buttons

## Icons
Use Heroicons via CDN for consistent, professional iconography throughout the application

## Anti-Patterns to Avoid
- Do not use animations except for subtle transitions (200ms ease)
- Avoid cluttered layouts - maintain generous whitespace
- No auto-playing media or distracting elements during exams
- Ensure all interactive elements have clear visual feedback
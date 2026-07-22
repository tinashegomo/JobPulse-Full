# JobPulse Design System

Version: 1.0

---

# Philosophy

JobPulse is a mobile-first Progressive Web App.

Users frequently open the app for only a few seconds to quickly check for new jobs.

The UI must therefore be:

• Fast to scan
• Calm
• Modern
• Consistent
• Comfortable
• Thumb-friendly

Everything should reduce cognitive load.

---

# Design Principles

## 1. Consistency

Every screen should look like it belongs to the same application.

Spacing, typography, buttons, icons, and cards must follow the same rules.

Never create one-off components.

---

## 2. Breathing Room

Never cram information.

Whitespace is part of the design.

Each section should have enough spacing to make the interface feel premium.

---

## 3. Clear Hierarchy

Users should immediately see:

Primary information

↓

Secondary information

↓

Actions

Never make everything the same visual weight.

---

## 4. Mobile First

Every decision starts from mobile.

Desktop expands gracefully.

Never shrink desktop layouts to mobile.

---

# Layout

Maximum content width:

480px

Page padding:

16px

Section spacing:

24px

Card spacing:

16px

Card internal padding:

16px

---

# 8pt Grid

Allowed spacing:

4
8
12
16
20
24
32
40
48
64

Never use arbitrary values.

---

# Border Radius

Small

8px

Medium

12px

Large

16px

Pill

999px

Never mix random radii.

---

# Shadows

Cards:

Very soft.

Buttons:

None.

Dialogs:

Medium shadow.

Avoid heavy shadows.

---

# Typography

Font

Inter

---

Display

32

Bold

---

H1

28

Bold

---

H2

24

Bold

---

H3

20

Semibold

---

Title

18

Semibold

---

Body

16

Regular

---

Small

14

Regular

---

Caption

12

Medium

---

Line Height

1.5

---

# Colors

Background

White

Card

Very light gray

Primary Text

Near black

Secondary Text

Gray

Border

Very light gray

Accent

Blue

Success

Green

Warning

Amber

Danger

Red

Use color sparingly.

---

# Buttons

Height

44–48px

Radius

12px

Horizontal padding

20px

Never use giant buttons.

---

# Cards

Padding

16px

Gap

12px

Radius

16px

Border

1px

Soft shadow

Cards should never appear compressed.

---

# Job Cards

Structure

Company

Role

Metadata

Tags

Actions

Spacing between sections:

12px

Primary action should never dominate the card.

---

# Tags

Rounded pill

12px text

Small padding

Subtle background

---

# Navigation

Bottom navigation

56–64px height

Safe area support

Icons:

20px

Labels:

12px

---

# Icons

Lucide

20px default

24px inside hero areas

Never mix icon packs.

---

# Inputs

Height

48px

Radius

12px

Padding

16px

Clear labels

Good focus states

---

# Empty States

Centered

Large icon

Title

Description

Action

Never show empty white screens.

---

# Loading

Skeletons

Never spinners for page loads.

---

# Toasts

Bottom of screen.

Rounded.

Minimal.

Disappear automatically.

---

# Animations

150–200ms

Ease-out

Subtle fade

Small translate

No bouncing.

---

# Responsive Rules

360px

Everything fits.

375px

Default design target.

390px

Should look excellent.

430px

More breathing room.

Tablets

Increase margins rather than stretching components.

---

# Component Rules

Every component must:

Use design tokens.

Use spacing scale.

Use typography scale.

Use consistent radius.

Use consistent shadows.

Support dark mode.

Support accessibility.

Support touch interaction.

---

# UI Checklist

Before shipping any screen ask:

✓ Is spacing consistent?

✓ Are buttons appropriately sized?

✓ Is there enough breathing room?

✓ Can information be scanned in under 3 seconds?

✓ Is typography consistent?

✓ Are icons aligned?

✓ Does this feel premium?

✓ Does it look good on a 360px screen?

✓ Can everything be comfortably tapped with one thumb?

✓ Would someone enjoy opening this app multiple times every day?

If any answer is "No", redesign the screen before shipping.
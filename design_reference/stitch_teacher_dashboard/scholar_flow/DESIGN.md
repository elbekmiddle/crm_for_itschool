# Design System Specification: The Academic Edge

## 1. Overview & Creative North Star
**Creative North Star: "The Enlightened Canvas"**

This design system moves away from the rigid, boxy constraints of traditional Learning Management Systems. Instead of a "software tool," we are building an "intellectual environment." By utilizing organic roundedness (`xl` to `full`), intentional asymmetry, and a sophisticated tonal palette, we create a space that feels both academically authoritative and start-up agile. 

The "playful" element is not an afterthought; it is integrated through high-contrast typography and emoji-friendly "micro-moments" where data meets human expression. We prioritize "Breathing Room" over "Grid Density," using whitespace as a functional separator rather than a decorative one.

---

## 2. Colors & Surface Philosophy
The palette is rooted in a deep `primary` (#4a40e0) that signals trust, balanced by a vibrant `secondary` (#006947) for growth and success.

### The "No-Line" Rule
To achieve a high-end editorial feel, **1px solid borders are prohibited** for sectioning. Structural boundaries must be defined through:
*   **Tonal Shifts:** Placing a `surface_container_lowest` card on a `surface_container_low` background.
*   **Negative Space:** Using the spacing scale (e.g., `spacing.8` or `spacing.12`) to define groups.
*   **Depth:** Utilizing the `surface_container` tiers to create natural hierarchy.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
*   **Base:** `surface` (#f4f6ff) — The foundation of the application.
*   **Sections:** `surface_container_low` (#eaf1ff) — Used for large structural areas like sidebars or secondary content zones.
*   **Interactive Units:** `surface_container_lowest` (#ffffff) — Used for primary cards and data modules to make them "pop" against the base.

### The "Glass & Gradient" Rule
For floating elements (modals, dropdowns, or "Live Now" student indicators), use **Glassmorphism**:
*   **Fill:** `surface_container_low` at 70% opacity.
*   **Effect:** `backdrop-blur` (12px–20px).
*   **Soul:** Main CTAs should use a subtle linear gradient from `primary` (#4a40e0) to `primary_container` (#9795ff) at a 135-degree angle to add a premium shimmer.

---

## 3. Typography: Editorial Authority
We utilize a dual-font strategy to balance character and clarity.

*   **Display & Headlines (Plus Jakarta Sans):** Used for "The Big Picture." Large, bold, and slightly wide to give a modern startup feel.
    *   *Headline-lg:* 2rem, tight letter-spacing (-0.02em).
*   **Body & UI (Inter):** Used for "The Details." Optimized for legibility in high-density tables and LMS course content.
    *   *Body-md:* 0.875rem, normal tracking.
*   **Labels (Inter):** Used for "The Metadata." 
    *   *Label-sm:* 0.6875rem, uppercase with +0.05em tracking for a "utility-chic" aesthetic.

---

## 4. Elevation & Depth
Depth in this system is achieved through **Tonal Layering** rather than traditional structural lines.

*   **The Layering Principle:** Place a `surface_container_highest` element on top of a `surface_container` to create "lift."
*   **Ambient Shadows:** For floating elements, use extra-diffused shadows.
    *   *Value:* `0 20px 50px -12px rgba(32, 48, 68, 0.08)`. The shadow color is a 8% opacity tint of `on_surface` to keep it feeling natural.
*   **The "Ghost Border" Fallback:** If a border is required for high-density tables, use `outline_variant` (#9eaec7) at **15% opacity**. Never use 100% opaque lines.

---

## 5. Components

### Navigation: Minimalist Sidebar
*   **Background:** `surface_container_low`.
*   **Active State:** No background pill. Instead, use a `primary` vertical accent bar (4px width) on the left and transition the icon to `primary`.
*   **Typography:** `title-sm` with increased vertical padding (`spacing.4`).

### Buttons: The "Full-Round" Signature
*   **Primary:** `rounded-full`. Background: `primary` to `primary_container` gradient. 
*   **Secondary:** `rounded-full`. Background: `surface_container_high`. Text: `on_surface`.
*   **Interaction:** On hover, the button should "lift" via a 2px Y-axis translate and a slight increase in shadow spread.

### Data Tables: High-Density, Zero-Line
*   **Header:** `label-md` in `on_surface_variant`. No background color.
*   **Rows:** Alternating background shifts are forbidden. Use whitespace and `title-sm` for the primary column.
*   **Status Tags:** Use `rounded-full` pills with `surface_variant` backgrounds and `on_surface` text for a subtle, professional look. Use the `secondary` (Success) or `error` (Danger) colors only for the status dot within the tag.

### Input Fields
*   **Styling:** `rounded-xl`. Background: `surface_container_lowest`. 
*   **Active:** A 2px "Ghost Border" using `primary` at 40% opacity. 
*   **Emoji Support:** All text inputs must have an emoji picker icon in the `trailing` position, utilizing `outline_variant` color.

### Progress Gauges (LMS Specific)
*   Instead of flat bars, use "Liquid Gauges" for course completion. Use a `primary` to `secondary` horizontal gradient with a soft `rounded-full` container.

---

## 6. Do's and Don'ts

### Do:
*   **Use Asymmetry:** Place a large `display-sm` headline next to a small, high-density data table to create visual tension.
*   **Embrace Emojis:** Use them in empty states (e.g., "Nothing here yet 🏝️") and sidebar labels to maintain the "playful startup" vibe.
*   **Layer Surfaces:** Think in 3D. If an element is "important," don't make it bigger—make it "higher" by using a lighter surface color.

### Don't:
*   **Don't use Dividers:** Avoid horizontal `<hr>` tags. Use `spacing.8` or a change in `surface_container` color to separate content blocks.
*   **Don't use Pure Black:** Even in Dark Mode, the darkest color should be `inverse_surface` (#000f21). Pure black kills the premium "frosted glass" effect.
*   **Don't use Default Corners:** Avoid `rounded-sm` or `rounded-md`. If it's a container, it's `rounded-xl`. If it's a button, it's `rounded-full`.

---

## 7. Interaction & Motion
*   **The "Elastic" Feel:** All transitions (hover, toggle, modal entry) should use a `cubic-bezier(0.34, 1.56, 0.64, 1)` easing function. This gives a "bouncy," playful feel that aligns with the rounded aesthetic.
*   **State Transitions:** When switching between Light and Dark mode, use a 500ms cross-fade to emphasize the "softness" of the system.
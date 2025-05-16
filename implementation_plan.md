# UI Styling Improvement Plan

This document outlines the plan for improving the styling of specific UI components to better align with the project's design principles (Data-Focused Flat 2.0) and enhance user experience.

## 1. Allocation Type Selection Styling

**Applies to:** `AddAssetForm.js`, `EditAssetModal.js`

### Current Situation
The "Allocation Type" selection uses standard HTML radio buttons within a `<fieldset>` and `<legend>`. While functional and accessible, the default appearance of radio buttons can be visually enhanced to better integrate with the application's modern, flat design. The current UI shows standard small radio circles.

### Goals
- Improve the visual appeal of the radio button group for selecting allocation type (Percentage vs. Value).
- Make the selection more prominent and visually integrated with the form's style.
- Ensure the component remains fully accessible (keyboard navigation, screen reader compatibility).
- Adhere to the "Data-Focused Flat 2.0" aesthetic, particularly regarding affordance for interactive elements.

### Proposed Solution: Custom Styled Radio Button Group (Button-like Segments)

We will style the labels associated with the radio inputs to look like connected, selectable buttons or segments of a control. The actual `<input type="radio">` elements will be visually hidden but remain functional for accessibility and state management.

**Implementation Details:**

1.  **Visually Hide Radio Inputs:**
    *   Apply `className="sr-only peer"` to the `<input type="radio">` elements.
2.  **Style Labels as Buttons/Segments:**
    *   The parent `div` containing the `label`s (within the `fieldset`) will use Flexbox to lay them out side-by-side.
    *   Each `<label>` will be styled with:
        *   Padding (e.g., `py-2 px-4`)
        *   Borders (e.g., `border border-gray-300`)
        *   Rounded corners where appropriate (e.g., `rounded-l-md` for the first, `rounded-r-md` for the last, or fully `rounded-md` if separated).
        *   `cursor-pointer`.
        *   Transition for smooth style changes (e.g., `transition-colors duration-150`).
3.  **Selected State Styling (using `peer-checked:`):**
    *   When a radio input is checked, its corresponding label (the "peer") will change style:
        *   Background: `peer-checked:bg-primary-600` (using the theme's primary color)
        *   Text Color: `peer-checked:text-white`
        *   Border Color: `peer-checked:border-primary-600`
4.  **Unselected State Styling:**
    *   Background: `bg-white`
    *   Text Color: `text-gray-700`
    *   Border Color: `border-gray-300`
5.  **Hover State Styling:**
    *   For unselected items: `hover:bg-gray-50` or `hover:border-gray-400`.
    *   The `peer-checked:` styles should override hover styles for the selected item to maintain its active appearance.
6.  **Focus State Styling:**
    *   Apply Tailwind's focus ring utilities (e.g., `peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:ring-offset-1`) to the *labels* when their corresponding hidden input receives focus. This makes keyboard navigation clear. The `peer-focus:` variant on the label, triggered by the hidden input, is key here.

**Example Snippet (Conceptual for one option):**
```html
<fieldset>
  <legend>Allocation Type</legend>
  <div class="flex">
    <label htmlFor="percentageMode" class="py-2 px-4 border border-gray-300 rounded-l-md cursor-pointer hover:bg-gray-50 peer-checked:bg-primary-600 peer-checked:text-white peer-checked:border-primary-600">
      <input type="radio" id="percentageMode" name="allocationMode" class="sr-only peer" />
      Percentage (%)
    </label>
    <label htmlFor="valueMode" class="py-2 px-4 border border-gray-300 rounded-r-md cursor-pointer hover:bg-gray-50 peer-checked:bg-primary-600 peer-checked:text-white peer-checked:border-primary-600">
      <input type="radio" id="valueMode" name="allocationMode" class="sr-only peer" />
      Value ($)
    </label>
  </div>
</fieldset>
```
*(Note: Exact classes and structure might be refined during implementation within the React components.)*

### Affected Files
- `frontend/src/features/portfolio/components/AddAssetForm.js`
- `frontend/src/features/portfolio/components/EditAssetModal.js`

### Accessibility Considerations
- The use of `<fieldset>` and `<legend>` is already correctly implemented and will be maintained.
- Visually hiding the radio button but keeping it functional ensures screen readers announce it correctly.
- Focus indicators on the styled labels (triggered by the hidden input's focus) will be crucial for keyboard users.
- Ensuring sufficient color contrast for text and background in both selected and unselected states.

---

## 2. Dropdown Menu (Select Component) Styling

**Applies to:** `frontend/src/components/Select/Select.js` and all its instances (e.g., "Asset Type" dropdown).

### Current Situation
The current `Select.js` component wraps a native HTML `<select>` element. While this provides good baseline accessibility and functionality, styling of the dropdown panel and options is heavily restricted by browser-native rendering, leading to potential visual inconsistencies with the overall "Data-Focused Flat 2.0" theme and across different browsers.

### Goals
- Achieve a fully custom-styled dropdown experience that aligns with the Flat 2.0 aesthetic.
- Ensure consistency with other form inputs (`Input.js`, etc.) in terms of appearance (borders, focus states, padding, font).
- Provide clear visual feedback for hover, focus, and selected states within the dropdown options.
- Maintain high accessibility standards (keyboard navigation, ARIA attributes).

### Proposed Solution: Rebuild `Select.js` as a Custom Styled Component

To gain full styling control while avoiding external UI libraries for this specific component, we will refactor `Select.js` into a custom React component. This approach involves managing the component's state, interactions, and ARIA attributes manually.

**Implementation Steps:**

1.  **Component Structure (`Select.js`):**
    *   The component will consist of a main wrapper `div`.
    *   Inside, a `button` element will act as the trigger to open/close the dropdown. It will display the selected value or placeholder.
    *   A `div` (conditionally rendered) will serve as the dropdown panel, containing a list (`ul`) of options (`li`).
2.  **State Management (React `useState`):**
    *   `isOpen`: Boolean to control the visibility of the dropdown panel.
    *   `selectedValue`: Stores the currently selected option's value.
    *   `highlightedIndex`: (Optional, for keyboard navigation) Stores the index of the currently highlighted option.
3.  **Styling the Trigger Button:**
    *   Apply Tailwind classes to match other form inputs: `w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm`.
    *   Include a chevron icon (e.g., custom SVG or from `heroicons`) that rotates based on the `isOpen` state.
4.  **Styling the Dropdown Panel:**
    *   Apply Tailwind classes for:
        *   Positioning: `absolute z-10 mt-1 w-full` (or as appropriate for the layout).
        *   Background: `bg-white`.
        *   Shadow: `shadow-lg`.
        *   Border: `border border-gray-200 rounded-md`.
        *   Max height and overflow: `max-h-60 overflow-auto`.
        *   Focus management: `focus:outline-none`.
5.  **Styling Individual Options (`<li>`):**
    *   Apply Tailwind classes for:
        *   Padding: `px-3 py-2`.
        *   Text color: `text-gray-900`.
        *   Cursor: `cursor-pointer`.
        *   Hover/Focus state: `hover:bg-primary-500 hover:text-white` or `hover:bg-gray-100`.
        *   Selected state: `font-semibold bg-primary-100 text-primary-700` (or a checkmark icon alongside).
6.  **Event Handling:**
    *   **Trigger Button Click:** Toggle `isOpen` state.
    *   **Option Click:** Update `selectedValue`, set `isOpen` to `false`, and call `onChange` prop.
    *   **Click Outside:** Implement a mechanism (e.g., `useEffect` with an event listener on `document`) to close the dropdown when clicking outside the component.
    *   **Keyboard Navigation:**
        *   `ArrowDown`/`ArrowUp`: Navigate through options, updating `highlightedIndex`.
        *   `Enter`: Select the highlighted option.
        *   `Escape`: Close the dropdown.
7.  **Accessibility (ARIA Attributes - Manual Implementation):**
    *   **Trigger Button:**
        *   `aria-haspopup="listbox"`
        *   `aria-expanded={isOpen}`
        *   `aria-labelledby` (if an external label exists, referencing its ID).
    *   **Dropdown Panel (`ul`):**
        *   `role="listbox"`
        *   `tabindex="-1"` (to make it focusable programmatically if needed, e.g., after opening).
        *   `aria-labelledby` (if the trigger button itself acts as the label, reference its ID).
    *   **Options (`li`):**
        *   `role="option"`
        *   `aria-selected={option.value === selectedValue}`
        *   `id` for each option to be used with `aria-activedescendant` on the listbox or trigger.
    *   Manage focus appropriately (e.g., return focus to the button when the dropdown closes).
    *   Use `aria-activedescendant` on the listbox element, pointing to the ID of the currently highlighted option, for better screen reader announcements during keyboard navigation.
8.  **Props Handling:**
    *   Adapt the existing `Select.js` props: `label` (visual label, may also be used for `aria-label` or `aria-labelledby`), `id`, `name`, `value`, `onChange`, `options` (array of `{ value, label }`), `placeholder`, `disabled`, `required`, `error`.
    *   The `placeholder` can be handled as the initial display text on the button if no value is selected, or as a disabled first option.

### Affected Files
- `frontend/src/components/Select/Select.js` (major refactor).
- Potentially all files that import and use `Select.js` will benefit from the improved styling without direct changes, but will need testing.

### Accessibility Considerations
- Building a custom select component requires diligent manual implementation of ARIA attributes and keyboard navigation patterns to meet accessibility standards. This is more complex than relying on a headless UI library.
- Key aspects include:
    - Correct `role` attributes (`listbox`, `option`).
    - `aria-` attributes for state (`aria-expanded`, `aria-selected`).
    - Relationship attributes (`aria-labelledby`, `aria-activedescendant`).
    - Full keyboard navigability (arrows, Enter, Escape, Tab).
    - Clear focus indicators for the button and options.
    - Managing focus flow (e.g., on open, on close, on selection).
- Thorough testing with screen readers and keyboard-only navigation will be critical.

### Alternative (Limited Improvement - Fallback if Custom Component is too complex/time-consuming initially):
- **Enhance Native `<select>`:**
    - Use `appearance-none` to hide the default browser arrow.
    - Add a custom SVG chevron icon as a background image or an absolutely positioned element within the select wrapper.
    - Style the main `<select>` element itself to match other inputs as closely as possible.
    - **Limitation:** The dropdown panel and options styling will remain largely browser-native. 
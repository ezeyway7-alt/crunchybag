# Keyboard Stroke & Navigation Standards (Select2, Dropdowns, Comboboxes & Controls)

Always prioritize full keyboard navigation, keystroke handling, and accessibility across all interactive components in the application. No user should be forced to use a mouse to open, navigate, select, or dismiss options in any dropdown, combobox, select2 component, modal, or form control.

## 1. Select2, Comboboxes & Custom Dropdowns

Every custom select, Select2 component, combobox, and searchable autocomplete dropdown MUST adhere to the following keyboard interaction requirements:

### A. Arrow Key Navigation (`ArrowDown` / `ArrowUp`)
- **Closed State**:
  - Pressing `ArrowDown` or `ArrowUp` while the input has focus MUST immediately open the dropdown menu.
  - `ArrowDown` should initialize or move the highlight to the first available option.
  - `ArrowUp` should open the dropdown and highlight the last option.
- **Open State**:
  - `ArrowDown` increments `highlightedIndex` (cycling back to 0 when reaching the end, or clamping).
  - `ArrowUp` decrements `highlightedIndex` (cycling to the last item when reaching the top, or clamping).
  - Both keys MUST call `e.preventDefault()` to prevent unwanted scrolling of the parent page or cursor repositioning in the text input.
  - Both filtered search results AND secondary actions (such as "+ Add new ...") MUST be part of the keyboard navigation sequence.

### B. Selection via `Enter`
- Pressing `Enter` when the dropdown is open MUST:
  - Call `e.preventDefault()` to prevent accidental form submission.
  - Select the currently highlighted item (`highlightedIndex`).
  - If on the "+ Add new" action, trigger the creation or selection of the custom input.
  - If no specific item is highlighted but filtered options exist, default to selecting the first match (`filtered[0]`).
  - Close the dropdown menu and trigger any chained focus actions (e.g. advance focus to the next form field, like `onSupplierSelected`).

### C. Dismissal & Cancellation (`Escape`)
- Pressing `Escape` MUST close the dropdown menu immediately (`setIsOpen(false)`), reset the highlight state, and keep focus on the trigger input element.

### D. Tab Key Handling (`Tab` / `Shift+Tab`)
- Pressing `Tab` while the menu is open should gracefully close the dropdown and advance focus naturally to the next interactive element without trapping focus or disrupting workflow.

### E. Auto-Scroll into View
- As the user presses `ArrowDown` or `ArrowUp`, the highlighted item MUST automatically scroll into view within the scrollable dropdown container.
- Use `element.scrollIntoView({ block: 'nearest' })` or container scroll position adjustments whenever `highlightedIndex` changes.

### F. Mouse & Keyboard Synchronization
- Hovering over an item with the mouse (`onMouseEnter`) MUST synchronize `highlightedIndex` to that item. This prevents visual confusion or conflicting selections between mouse hover and keyboard focus.

### G. Buttons & Controls ("Buttons with Keyboard")
- Any companion buttons (such as dropdown toggle chevrons `ChevronDown`, clear buttons `X`, or add buttons `Plus`) MUST:
  - Be keyboard reachable or operable via the input keystrokes.
  - Have clear `aria-label` or `title` attributes.
  - Support `Enter` and `Space` key activation when focused (`onKeyDown`).
  - Not interfere with rapid typing or arrow key navigation.

### H. Visual Cues & Accessibility (ARIA)
- Active / highlighted items MUST have distinct visual styling (contrasting background, border/ring, and clear text color) so the keyboard user always knows which option is active.
- Use semantic ARIA attributes:
  - Container / Input: `role="combobox"`, `aria-expanded`, `aria-autocomplete="list"`, `aria-activedescendant`.
  - Dropdown List: `role="listbox"`.
  - Option items: `role="option"`, `aria-selected`.

## 2. Forms, Buttons & General UI Elements

1. **Tab Order**: All inputs, buttons, and actionable items must follow an intuitive tab order (`tabIndex={0}` or standard HTML interactive tags).
2. **Focus Visibility**: Ensure `focus-visible` outlines or rings are visible when navigating via keyboard (never disable outlines with `outline-none` without providing an alternative ring/focus style).
3. **Modal & Dialog Dismissal**: Every modal or overlay must support closing via `Escape`.
4. **Fast POS & Data Entry**: In fast data-entry workflows (such as inward inventory purchase bills, bill generation, catalog management), ensure continuous keyboard flow from field to field using `Enter` or `Tab`.

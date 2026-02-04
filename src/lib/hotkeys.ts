/**
 * Check if the current event target is an interactive element
 * that should suppress global keyboard shortcuts.
 */
export function shouldSuppressHotkey(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement;
  
  if (!target) return false;
  
  // Standard form inputs
  if (target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement) {
    return true;
  }
  
  // Contenteditable elements
  if (target.isContentEditable) {
    return true;
  }
  
  // Radix UI interactive elements (Select, Dialog, Popover, etc.)
  // These use data-radix-* attributes
  if (target.closest('[data-radix-select-viewport]') ||
      target.closest('[data-radix-select-content]') ||
      target.closest('[data-radix-popper-content-wrapper]') ||
      target.closest('[data-radix-menu-content]') ||
      target.closest('[data-radix-dialog-content]') ||
      target.closest('[data-radix-popover-content]') ||
      target.closest('[data-radix-dropdown-menu-content]') ||
      target.closest('[data-radix-context-menu-content]') ||
      target.closest('[cmdk-root]') ||
      target.closest('[cmdk-input]')) {
    return true;
  }
  
  // ARIA roles that indicate interactive content
  const role = target.getAttribute('role');
  if (role && ['listbox', 'option', 'menu', 'menuitem', 'combobox', 'textbox', 'searchbox'].includes(role)) {
    return true;
  }
  
  return false;
}

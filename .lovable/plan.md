

# Fix: Hotkey Interference with Dropdown Menus and Other Interactive Elements

## Problem Summary

When interacting with dropdown menus (specifically the parent location Select), pressing 'S' triggers the global hotkey to start a session. This happens because the keyboard event handler in `SessionControl.tsx` only checks for `HTMLInputElement` and `HTMLTextAreaElement` targets, but Radix UI components (Select, Dialog, Command) use different element types like `<button>` or `<div>` with ARIA roles.

## Root Cause

In `SessionControl.tsx` (lines 104-109):

```typescript
const handleKeyPress = (e: KeyboardEvent) => {
  // Don't trigger if user is typing in an input
  if (e.target instanceof HTMLInputElement || 
      e.target instanceof HTMLTextAreaElement) {
    return;
  }
  // ... hotkeys fire for S, P, E
}
```

This check is incomplete. Radix UI Select items render as `<div role="option">` elements, and the trigger is a `<button>`. Neither of these match the check, so hotkeys fire during dropdown interaction.

## Affected Components

| Component | File | Hotkeys | Issue |
|-----------|------|---------|-------|
| SessionControl | `src/components/campaign/SessionControl.tsx` | S, P, E | Fires during Select/Dialog interaction |
| InitiativeTracker | `src/components/combat/InitiativeTracker.tsx` | [, ] | Same incomplete check |
| Sidebar | `src/components/ui/sidebar.tsx` | Ctrl/Cmd+B | Uses modifier key - less likely to conflict |
| QuickCaptureModal | `src/components/notes/QuickCaptureModal.tsx` | Ctrl/Cmd+J | Uses modifier key - less likely to conflict |
| CommandPalette | `src/components/campaign/CommandPalette.tsx` | Ctrl/Cmd+K | Uses modifier key - less likely to conflict |

## Solution

Create a reusable utility function to detect when the user is interacting with any interactive UI element that should suppress global hotkeys. Then update all affected keyboard handlers to use this function.

### Step 1: Create Utility Function

Create a new utility in `src/lib/hotkeys.ts`:

```typescript
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
```

### Step 2: Update SessionControl.tsx

Update the keyboard handler to use the new utility:

```typescript
import { shouldSuppressHotkey } from "@/lib/hotkeys";

// Inside useEffect
const handleKeyPress = (e: KeyboardEvent) => {
  // Don't trigger during interactive element interaction
  if (shouldSuppressHotkey(e)) {
    return;
  }

  const key = e.key.toLowerCase();
  
  if (key === 's' && !session && !loading) {
    e.preventDefault();
    handleStart();
  } else if (key === 'p' && session?.status === 'live') {
    // ... rest unchanged
  }
};
```

### Step 3: Update InitiativeTracker.tsx

Apply the same fix:

```typescript
import { shouldSuppressHotkey } from "@/lib/hotkeys";

const handleKeyPress = (e: KeyboardEvent) => {
  // Don't trigger during interactive element interaction
  if (shouldSuppressHotkey(e)) {
    return;
  }

  if (initiative.length === 0) return;

  if (e.key === '[') {
    e.preventDefault();
    previousTurn();
  } else if (e.key === ']') {
    e.preventDefault();
    nextTurn();
  }
};
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/hotkeys.ts` | **Create new file** with `shouldSuppressHotkey` utility |
| `src/components/campaign/SessionControl.tsx` | Import utility, replace instance checks with `shouldSuppressHotkey(e)` |
| `src/components/combat/InitiativeTracker.tsx` | Import utility, replace instance checks with `shouldSuppressHotkey(e)` |

## Interactive Elements Covered

The utility will suppress hotkeys when interacting with:
- Standard form inputs (`<input>`, `<textarea>`, `<select>`)
- Contenteditable elements
- Radix UI Select dropdowns
- Radix UI Dialog content
- Radix UI Popover content
- Radix UI Dropdown menus
- Radix UI Context menus
- cmdk Command palette
- Any element with ARIA roles: listbox, option, menu, menuitem, combobox, textbox, searchbox

## Testing Checklist

After implementation:
1. Open Location Dialog and use the parent location dropdown - pressing S should NOT start a session
2. Open NPC Editor and use any Select dropdown - pressing S/P/E should NOT trigger session controls
3. Open Faction Editor and use dropdowns - same behavior
4. Press S outside of any interactive element - should start session (if no active session)
5. Open Command Palette (Cmd/Ctrl+K) and type - hotkeys should not fire
6. Edit in any contenteditable field - hotkeys should not fire
7. During combat, use Initiative Tracker - [ and ] should only work when not in an interactive element


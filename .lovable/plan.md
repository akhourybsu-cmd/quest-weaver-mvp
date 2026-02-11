# Fix Notes Auto-Save -- Reduce Frequency to 45 Seconds

## Problem

The current auto-save triggers a debounced save after only **1.5 seconds** of inactivity, and the debounce function is recreated on every keystroke (because `content` is in its dependency array). This causes:

- Saves firing almost continuously while typing
- Version conflict errors from rapid consecutive saves
- Unnecessary database load

## Solution

Replace the current debounce-on-every-change approach with a simple **45-second interval timer** that only saves when changes exist.

## Changes

**File: `src/components/notes/NoteEditor.tsx**`

1. **Remove** the `debouncedSave` callback and its `useEffect` trigger (lines ~349-358)
2. **Add** a `hasUnsavedChanges` ref that gets set to `true` whenever `title`, `content`, `visibility`, `isPinned`, or `tags` change
3. **Add** a `useEffect` with a `setInterval` at 45 seconds that:
  - Checks if `autoSaveEnabled && hasUnsavedChanges.current && title.trim()`
  - If so, calls `performSave(true)` and resets the flag
  - Clears the interval on unmount or when auto-save is toggled off
4. **Remove** `debounce` import from `../editor/constants` if no longer needed elsewhere in this file

This approach means:

- No save storms during active typing
- A predictable 45-second cadence
- Still saves on manual Ctrl+S / button click immediately
- Revision snapshots still created every 5th auto-save

## Technical Detail

```text
Before:  keystroke -> 1.5s debounce -> save (fires constantly)
After:   45s interval tick -> check dirty flag -> save if needed
```
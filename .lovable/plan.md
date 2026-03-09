

## Comprehensive Bug Scan — Beta Tools

### Bugs Found

**1. Object field corruption in edit modes (BetaGeneratorForm + BetaAssetEditor)**
When a field value is an object (e.g. `stat_suggestion: { level_or_cr: "5", archetype: "brute" }`), both editors render it as `JSON.stringify(value, null, 2)` but on save, store the raw string instead of parsing it back to JSON. This silently corrupts structured data — the next load shows `"{ ... }"` as a literal string instead of an object.

- **BetaGeneratorForm.tsx** line 512-517: `onChange` saves string directly when original is an object
- **BetaAssetEditor.tsx** line 199-211: Same issue — object fields serialized to JSON for display but never parsed back

**Fix**: When the original value is an object (not array, not string), attempt `JSON.parse()` on the edited text before storing. Fall back to the raw string if parsing fails.

**2. Ctrl+Enter global shortcut conflicts with Refine input**
`BetaGeneratorForm.tsx` lines 196-204: A global `keydown` listener fires `handleGenerate()` on Ctrl+Enter regardless of focus. When a user is typing in the Refine input and presses Ctrl+Enter (expecting to refine), it instead triggers a full regeneration, discarding their current result.

**Fix**: Check if the active element is inside the refine section; if so, skip the global handler (the refine input already has its own Enter handler on line 549).

**3. Clipboard copy has no error handling (BetaAssetCard)**
`handleCopyMarkdown` (line 47-50) calls `navigator.clipboard.writeText()` without try/catch. In insecure contexts (HTTP, some iframes), this throws an unhandled promise rejection that silently fails with no user feedback.

**Fix**: Wrap in try/catch, show error toast on failure.

**4. Array bullet formatting inconsistency (BetaResultRenderer)**
`formatValue` line 85: Array items are joined with `'\n• '` — this means the first item has no bullet prefix while all subsequent items do. Renders as:
```
First item
• Second item  
• Third item
```

**Fix**: Prepend `'• '` to the first item as well, or use `.map(item => '• ' + formatted).join('\n')`.

**5. Faction import maps `secrets` to wrong field (BetaImportDialog)**
Line 105: `secrets: d.weakness` — should be `d.secrets` (the faction schema generates both `secrets` and `weakness` as separate fields). The weakness is already included in `gm_notes`.

**Fix**: Map `secrets` to `d.secrets || null`.

**6. BetaAssetEditor doesn't update `updated_at` on save**
Line 50-55: The update call sets `name`, `status`, `tags`, `data` but doesn't set `updated_at`. If the database doesn't have a trigger for this, the "last updated" timestamp shown on cards won't reflect edits made through the editor.

**Fix**: Add `updated_at: new Date().toISOString()` to the update payload.

### Files to modify
- `src/components/beta-tools/BetaGeneratorForm.tsx` — bugs 1, 2
- `src/components/beta-tools/BetaAssetEditor.tsx` — bugs 1, 6
- `src/components/beta-tools/BetaAssetCard.tsx` — bug 3
- `src/components/beta-tools/BetaResultRenderer.tsx` — bug 4
- `src/components/beta-tools/BetaImportDialog.tsx` — bug 5


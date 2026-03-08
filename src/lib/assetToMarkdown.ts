import { ASSET_TYPE_LABELS } from "@/components/beta-tools/toolRegistry";

export function assetToMarkdown(asset: { name: string; asset_type: string; data: Record<string, any>; tags?: string[] }): string {
  const lines: string[] = [];
  const typeLabel = ASSET_TYPE_LABELS[asset.asset_type] || asset.asset_type;

  lines.push(`# ${asset.name}`);
  lines.push(`**Type:** ${typeLabel}`);
  if (asset.tags?.length) {
    lines.push(`**Tags:** ${asset.tags.join(', ')}`);
  }
  lines.push('');

  for (const [key, value] of Object.entries(asset.data || {})) {
    if (key === 'name' || key === 'title' || key === 'event_name' || value == null) continue;
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    if (Array.isArray(value)) {
      lines.push(`## ${label}`);
      for (const item of value) {
        if (typeof item === 'object' && item !== null) {
          const name = item.name || item.title || item.label || '';
          const desc = item.description || item.desc || item.effect || item.text || '';
          lines.push(`- **${name}**${desc ? `: ${desc}` : ''}`);
        } else {
          lines.push(`- ${String(item)}`);
        }
      }
      lines.push('');
    } else if (typeof value === 'object') {
      lines.push(`## ${label}`);
      for (const [k, v] of Object.entries(value)) {
        lines.push(`- **${k.replace(/_/g, ' ')}:** ${v}`);
      }
      lines.push('');
    } else {
      const str = String(value);
      if (str.length > 100) {
        lines.push(`## ${label}`);
        lines.push(str);
        lines.push('');
      } else {
        lines.push(`**${label}:** ${str}`);
      }
    }
  }

  return lines.join('\n');
}

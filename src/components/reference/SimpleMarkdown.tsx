/**
 * Lightweight markdown renderer for Open5e descriptions.
 * Handles: paragraphs, **bold**, *italic*, ## headings, bullet lists, and pipe tables.
 * No external deps.
 */
import { ReactNode } from "react";

function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) parts.push(<strong key={i++}>{t.slice(2, -2)}</strong>);
    else parts.push(<em key={i++}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function SimpleMarkdown({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    // Heading
    const h = /^(#{1,4})\s+(.+)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const Tag = (`h${Math.min(level + 2, 6)}`) as keyof JSX.IntrinsicElements;
      out.push(<Tag key={key++} className="font-semibold mt-3">{inline(h[2])}</Tag>);
      i++;
      continue;
    }
    // Table
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?\s*-{2,}/.test(lines[i + 1])) {
      const headers = line.split("|").map((c) => c.trim()).filter(Boolean);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|")) {
        rows.push(lines[i].split("|").map((c) => c.trim()).filter(Boolean));
        i++;
      }
      out.push(
        <div key={key++} className="overflow-x-auto my-2">
          <table className="text-xs border-collapse w-full">
            <thead><tr>{headers.map((h, j) => <th key={j} className="border border-border/50 px-2 py-1 bg-muted/30 text-left">{inline(h)}</th>)}</tr></thead>
            <tbody>{rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci} className="border border-border/50 px-2 py-1">{inline(c)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }
    // Bullet list
    if (/^\s*[*-]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[*-]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[*-]\s+/, ""));
        i++;
      }
      out.push(<ul key={key++} className="list-disc pl-5 space-y-1">{items.map((it, idx) => <li key={idx}>{inline(it)}</li>)}</ul>);
      continue;
    }
    // Paragraph
    out.push(<p key={key++} className="leading-relaxed">{inline(line)}</p>);
    i++;
  }
  return <div className="space-y-2 text-sm">{out}</div>;
}
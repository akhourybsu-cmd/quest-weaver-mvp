import React from "react";

interface WikilinkTextProps {
  children: React.ReactNode;
  onNavigate?: (title: string) => void;
}

/**
 * Renders text containing [[wikilinks]] as styled spans.
 * If `onNavigate` is provided, wikilinks are clickable buttons.
 * Otherwise, they render as read-only highlighted text.
 */
export function WikilinkText({ children, onNavigate }: WikilinkTextProps) {
  const text = String(children);
  const parts = text.split(/(\[\[[^\]]+\]\])/g);

  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^\[\[([^\]]+)\]\]$/);
        if (match) {
          if (onNavigate) {
            return (
              <button
                key={i}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onNavigate(match[1]);
                }}
                className="text-primary font-medium hover:underline cursor-pointer bg-primary/10 px-1 rounded"
              >
                {match[1]}
              </button>
            );
          }
          return (
            <span
              key={i}
              className="text-primary font-medium bg-primary/10 px-0.5 rounded"
            >
              {match[1]}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

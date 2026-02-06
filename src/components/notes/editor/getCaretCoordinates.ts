/**
 * Get the pixel coordinates of the caret at a given position in a textarea.
 * Uses a hidden mirror div that replicates the textarea's styling.
 */
export function getCaretCoordinates(
  element: HTMLTextAreaElement,
  position: number
): { top: number; left: number; height: number } {
  const div = document.createElement("div");
  const computed = getComputedStyle(element);

  const properties = [
    "direction", "boxSizing", "width",
    "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
    "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
    "fontStyle", "fontVariant", "fontWeight", "fontStretch",
    "fontSize", "lineHeight", "fontFamily",
    "textAlign", "textTransform", "textIndent",
    "letterSpacing", "wordSpacing", "tabSize",
    "overflowWrap", "wordWrap", "wordBreak",
  ];

  div.style.position = "absolute";
  div.style.visibility = "hidden";
  div.style.whiteSpace = "pre-wrap";
  div.style.overflow = "hidden";
  div.style.height = "auto";

  for (const prop of properties) {
    const kebab = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
    (div.style as any)[prop] = computed.getPropertyValue(kebab);
  }

  div.textContent = element.value.substring(0, position);

  const span = document.createElement("span");
  span.textContent = element.value.substring(position) || ".";
  div.appendChild(span);

  document.body.appendChild(div);

  const rect = element.getBoundingClientRect();
  const lineHeight = parseInt(computed.lineHeight) || parseInt(computed.fontSize) * 1.2;

  const coords = {
    top: rect.top + span.offsetTop - element.scrollTop,
    left: rect.left + span.offsetLeft,
    height: lineHeight,
  };

  document.body.removeChild(div);
  return coords;
}

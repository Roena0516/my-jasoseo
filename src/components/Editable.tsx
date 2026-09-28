import { useLayoutEffect, useRef } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  inline?: boolean;
  /** Single-line fields swallow Enter. */
  singleLine?: boolean;
}

function readText(el: HTMLElement) {
  let text = el.innerText;
  // Chrome keeps a trailing <br> so an empty last line stays visible; it is not content.
  if (el.lastChild?.nodeName === 'BR' && text.endsWith('\n')) text = text.slice(0, -1);
  return text;
}

/**
 * Uncontrolled plain-text contentEditable. The DOM owns the text while the user is typing
 * (so the caret and native undo keep working); external changes are written back only when
 * the element is not focused.
 */
export function Editable({ value, onChange, className, placeholder, inline, singleLine }: Props) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || document.activeElement === el) return;
    if (readText(el) !== value) el.textContent = value;
  }, [value]);

  const Tag = inline ? 'span' : 'div';
  return (
    <Tag
      ref={ref as never}
      className={`editable ${className ?? ''}`}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck={false}
      data-placeholder={placeholder}
      onInput={(e) => onChange(readText(e.currentTarget))}
      onKeyDown={singleLine ? (e) => e.key === 'Enter' && e.preventDefault() : undefined}
    />
  );
}

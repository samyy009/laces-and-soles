import { useRef } from 'react';

/**
 * Lordicon component - uses Lordicon via CDN (loaded in index.html)
 * Uses dangerouslySetInnerHTML to avoid React's unknown element warnings
 * that can crash the app with custom web components.
 */
export default function Lordicon({
  src,
  trigger = 'hover',
  colors = 'primary:#111111,secondary:#ff3366',
  size = 24,
  className = '',
}) {
  const html = `<lord-icon src="${src}" trigger="${trigger}" colors="${colors}" style="width:${size}px;height:${size}px;" class="${className}"></lord-icon>`;

  return (
    <span
      dangerouslySetInnerHTML={{ __html: html }}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    />
  );
}

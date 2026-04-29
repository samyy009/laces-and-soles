import { useEffect, useRef } from 'react';
import lottie from 'lottie-web';

/**
 * LottieAnimation - Uses lottie-web with the `path` option (the correct API).
 * Serves animations from the /public/animations/ folder for zero CORS issues.
 *
 * @param {string} src - Path to the animation JSON (e.g. "/animations/empty-cart.json")
 * @param {object} animationData - Optional: inline animation JSON data
 * @param {boolean} loop - Whether to loop the animation
 * @param {string} className - CSS classes for the container div
 * @param {object} style - Inline styles for the container div
 */
export default function LottieAnimation({
  src,
  animationData,
  loop = true,
  className = '',
  style = {},
}) {
  const containerRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!src && !animationData) return;

    // Destroy previous instance
    if (animRef.current) {
      animRef.current.destroy();
      animRef.current = null;
    }

    try {
      animRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop,
        autoplay: true,
        // Use `path` for file-based loading, `animationData` for inline JSON
        ...(animationData ? { animationData } : { path: src }),
      });
    } catch (e) {
      console.warn('Lottie: animation failed to load', src, e);
    }

    return () => {
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
    };
  }, [src, animationData, loop]);

  return <div ref={containerRef} className={className} style={style} />;
}

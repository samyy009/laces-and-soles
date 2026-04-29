/**
 * UiballLoader - CSS-only premium loader (no external dependency)
 * Replaces @uiball/loaders which is deprecated and incompatible with React 19
 */
export default function UiballLoader({ size = 40, color = '#ff3366', speed = 1.5 }) {
  const dotStyle = (delay) => ({
    width: size / 5,
    height: size / 5,
    borderRadius: '50%',
    backgroundColor: color,
    display: 'inline-block',
    animation: `dotStream ${speed}s ease-in-out infinite`,
    animationDelay: `${delay}s`,
    margin: `0 ${size / 15}px`,
  });

  return (
    <>
      <style>{`
        @keyframes dotStream {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: size }}>
        <span style={dotStyle(0)} />
        <span style={dotStyle(0.16)} />
        <span style={dotStyle(0.32)} />
      </div>
    </>
  );
}

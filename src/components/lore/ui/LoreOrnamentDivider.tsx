interface LoreOrnamentDividerProps {
  className?: string;
}

export default function LoreOrnamentDivider({ className = "" }: LoreOrnamentDividerProps) {
  return (
    <div className={`fantasy-divider ${className}`}>
      <div className="fantasy-divider-ornament" />
    </div>
  );
}

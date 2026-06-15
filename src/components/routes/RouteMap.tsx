const PIN_COORDS: [number, number][] = [
  [70, 150],
  [200, 86],
  [330, 142],
  [470, 80],
  [590, 150],
];

function truncate(s: string, max = 12): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function buildPath(count: number): string {
  if (count === 0) return "";
  const pts = PIN_COORDS.slice(0, count);
  return pts.map(([x, y], i) => (i === 0 ? `M ${x},${y}` : `L ${x},${y}`)).join(" ");
}

export function RouteMap({
  labels,
  activeIndex,
  onSelect,
}: {
  labels: string[];
  activeIndex: number;
  onSelect: (i: number) => void;
}) {
  const count = Math.min(labels.length, 5);
  const d = buildPath(count);

  return (
    <div className="rounded-md bg-muted/40 overflow-hidden mt-3">
      <svg
        viewBox="0 0 640 200"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full"
        aria-label="Schematická mapa trasy"
      >
        {/* Casing (white outline behind the route line) */}
        {d && (
          <path
            d={d}
            className="stroke-background"
            strokeWidth={8}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {/* Purple route line */}
        {d && (
          <path
            d={d}
            stroke="#6d5ae6"
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Pins */}
        {labels.slice(0, 5).map((label, i) => {
          const [px, py] = PIN_COORDS[i];
          const isActive = i === activeIndex;
          return (
            <g
              key={i}
              className="cursor-pointer"
              onClick={() => onSelect(i)}
            >
              {/* Active ring */}
              {isActive && (
                <circle
                  cx={px}
                  cy={py}
                  r={16}
                  fill="#6d5ae6"
                  stroke="#534ab7"
                  strokeWidth={3}
                />
              )}
              {/* Default pin */}
              {!isActive && (
                <circle cx={px} cy={py} r={12} fill="#6d5ae6" />
              )}
              {/* Number */}
              <text
                x={px}
                y={py}
                textAnchor="middle"
                dominantBaseline="central"
                dy={0}
                fill="white"
                fontSize={12}
                fontWeight="600"
                style={{ userSelect: "none" }}
              >
                {i + 1}
              </text>
              {/* Label below pin */}
              <text
                x={px}
                y={py + 26}
                textAnchor="middle"
                fontSize={11}
                className="fill-muted-foreground"
                style={{ userSelect: "none" }}
              >
                {truncate(label, 12)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

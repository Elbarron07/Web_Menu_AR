import { motion } from 'framer-motion';

// Reproduire les fonctions de geometry du vrai SpinningTacticalMenu
const angleToCoords = (angle: number, radius: number, cx: number, cy: number) => {
  const rad = (angle * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
};

const createArcPath = (
  startAngle: number,
  endAngle: number,
  innerR: number,
  outerR: number,
  cx: number,
  cy: number
): string => {
  const so = angleToCoords(startAngle, outerR, cx, cy);
  const eo = angleToCoords(endAngle, outerR, cx, cy);
  const si = angleToCoords(startAngle, innerR, cx, cy);
  const ei = angleToCoords(endAngle, innerR, cx, cy);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${si.x} ${si.y}`,
    `L ${so.x} ${so.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${eo.x} ${eo.y}`,
    `L ${ei.x} ${ei.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${si.x} ${si.y}`,
    'Z',
  ].join(' ');
};

// Constantes identiques au vrai menu
const INNER_RADIUS = 120;
const OUTER_RADIUS = 280;
const CENTER_X = 0;
const SVG_SIZE = OUTER_RADIUS * 2;
const SEGMENT_COUNT = 5; // Nombre moyen de categories

// Animation de shimmer pour les segments
const shimmerTransition = {
  duration: 1.8,
  repeat: Infinity,
  ease: 'easeInOut' as const,
};

export const MenuSkeleton = () => {
  // centerY dynamique comme le vrai menu
  const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 400;

  const segments = Array.from({ length: SEGMENT_COUNT }).map((_, i) => {
    const anglePerSegment = 360 / SEGMENT_COUNT;
    const startAngle = i * anglePerSegment - 90;
    const endAngle = (i + 1) * anglePerSegment - 90;
    const midAngle = (startAngle + endAngle) / 2;
    const labelRadius = (INNER_RADIUS + OUTER_RADIUS) / 2;
    const labelPos = angleToCoords(midAngle, labelRadius, CENTER_X, centerY);
    return { startAngle, endAngle, midAngle, labelPos, index: i };
  });

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Overlay glassmorphism identique au vrai menu */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(59, 130, 246, 0.03) 50%, rgba(147, 197, 253, 0.02) 100%)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      />

      {/* Conteneur left-aligned comme le vrai menu */}
      <div
        className="absolute left-0 top-0 bottom-0 overflow-hidden"
        style={{ width: '100vw' }}
      >
        <div className="relative h-full">
          {/* Conteneur positionne comme le vrai menu */}
          <div
            className="absolute"
            style={{
              left: '2px',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: `${SVG_SIZE * 2}px`,
              height: `${SVG_SIZE * 2}px`,
            }}
          >
            {/* SVG avec segments arques statiques */}
            <svg
              width={SVG_SIZE}
              height={SVG_SIZE}
              viewBox={`${-OUTER_RADIUS} ${centerY - OUTER_RADIUS} ${SVG_SIZE} ${SVG_SIZE}`}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Segments phantom avec shimmer */}
              {segments.map((seg) => {
                const path = createArcPath(
                  seg.startAngle,
                  seg.endAngle,
                  INNER_RADIUS,
                  OUTER_RADIUS,
                  CENTER_X,
                  centerY
                );
                return (
                  <motion.path
                    key={seg.index}
                    d={path}
                    fill="rgba(255, 255, 255, 0.07)"
                    stroke="rgba(37, 99, 235, 0.15)"
                    strokeWidth="1.5"
                    animate={{
                      fill: [
                        'rgba(255, 255, 255, 0.05)',
                        'rgba(255, 255, 255, 0.12)',
                        'rgba(255, 255, 255, 0.05)',
                      ],
                    }}
                    transition={{
                      ...shimmerTransition,
                      delay: seg.index * 0.15,
                    }}
                  />
                );
              })}

              {/* Lignes skeleton pour icone + label dans chaque segment */}
              {segments.map((seg) => (
                <g
                  key={`label-${seg.index}`}
                  transform={`translate(${seg.labelPos.x}, ${seg.labelPos.y}) rotate(${seg.midAngle + 90})`}
                >
                  {/* Icone skeleton */}
                  <motion.rect
                    x="-14"
                    y="-24"
                    width="28"
                    height="28"
                    rx="6"
                    fill="rgba(255, 255, 255, 0.06)"
                    animate={{
                      fill: [
                        'rgba(255, 255, 255, 0.04)',
                        'rgba(255, 255, 255, 0.1)',
                        'rgba(255, 255, 255, 0.04)',
                      ],
                    }}
                    transition={{
                      ...shimmerTransition,
                      delay: seg.index * 0.15 + 0.3,
                    }}
                  />
                  {/* Label skeleton */}
                  <motion.rect
                    x="-30"
                    y="8"
                    width="60"
                    height="10"
                    rx="5"
                    fill="rgba(255, 255, 255, 0.06)"
                    animate={{
                      fill: [
                        'rgba(255, 255, 255, 0.04)',
                        'rgba(255, 255, 255, 0.1)',
                        'rgba(255, 255, 255, 0.04)',
                      ],
                    }}
                    transition={{
                      ...shimmerTransition,
                      delay: seg.index * 0.15 + 0.4,
                    }}
                  />
                </g>
              ))}

              {/* Demi-cercle central (clip droit comme le vrai menu) */}
              <defs>
                <clipPath id="skeletonHalfCircle">
                  <rect
                    x={CENTER_X}
                    y={centerY - INNER_RADIUS}
                    width={INNER_RADIUS}
                    height={INNER_RADIUS * 2}
                  />
                </clipPath>
              </defs>
              <motion.circle
                cx={CENTER_X}
                cy={centerY}
                r={INNER_RADIUS}
                fill="rgba(255, 255, 255, 0.08)"
                stroke="rgba(37, 99, 235, 0.15)"
                strokeWidth="2"
                clipPath="url(#skeletonHalfCircle)"
                animate={{
                  fill: [
                    'rgba(255, 255, 255, 0.06)',
                    'rgba(255, 255, 255, 0.12)',
                    'rgba(255, 255, 255, 0.06)',
                  ],
                }}
                transition={shimmerTransition}
              />

              {/* Texte skeleton "MENU" dans le centre */}
              <motion.rect
                x={CENTER_X + INNER_RADIUS / 2 - 25}
                y={centerY - 14}
                width="50"
                height="12"
                rx="6"
                fill="rgba(255, 255, 255, 0.08)"
                animate={{
                  fill: [
                    'rgba(255, 255, 255, 0.05)',
                    'rgba(255, 255, 255, 0.12)',
                    'rgba(255, 255, 255, 0.05)',
                  ],
                }}
                transition={{ ...shimmerTransition, delay: 0.2 }}
              />
              {/* Texte skeleton "Bienvenue !" */}
              <motion.rect
                x={CENTER_X + INNER_RADIUS / 2 - 20}
                y={centerY + 6}
                width="40"
                height="8"
                rx="4"
                fill="rgba(255, 255, 255, 0.05)"
                animate={{
                  fill: [
                    'rgba(255, 255, 255, 0.03)',
                    'rgba(255, 255, 255, 0.08)',
                    'rgba(255, 255, 255, 0.03)',
                  ],
                }}
                transition={{ ...shimmerTransition, delay: 0.3 }}
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

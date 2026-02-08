import { motion } from 'framer-motion';

const shimmer = {
  animate: {
    backgroundColor: ['#E5E7EB', '#F3F4F6', '#E5E7EB'],
  },
  transition: {
    duration: 1.8,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

const Pulse = ({
  width,
  height,
  className = '',
  delay = 0,
}: {
  width?: string;
  height?: string;
  className?: string;
  delay?: number;
}) => (
  <motion.div
    className={`rounded-md bg-gray-200 ${className}`}
    style={{ width, height }}
    animate={shimmer.animate}
    transition={{ ...shimmer.transition, delay }}
  />
);

// ============================================================
// Variant "table" : header + barre recherche + table 5 lignes
// Pour : MenuManagement, Categories, CustomerTracking
// ============================================================
const TableSkeleton = () => (
  <div className="space-y-6">
    {/* Header : titre + bouton action */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Pulse width="240px" height="36px" className="rounded-lg" />
        <Pulse width="300px" height="16px" delay={0.05} />
      </div>
      <Pulse width="140px" height="44px" className="rounded-xl" delay={0.1} />
    </div>

    {/* Barre de recherche + filtre categorie */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Pulse width="100%" height="44px" className="rounded-xl flex-1" delay={0.15} />
        <Pulse width="180px" height="44px" className="rounded-xl flex-shrink-0" delay={0.2} />
      </div>

      {/* En-tete table */}
      <div className="flex items-center gap-4 pb-3 mb-1 border-b border-gray-200">
        {['25%', '20%', '15%', '15%', '10%'].map((w, i) => (
          <Pulse key={i} width={w} height="12px" delay={0.2 + i * 0.04} />
        ))}
      </div>

      {/* Lignes de table */}
      {[0, 1, 2, 3, 4].map((row) => (
        <div
          key={row}
          className="flex items-center gap-4 py-4 border-b border-gray-50 last:border-0"
        >
          {['25%', '20%', '15%', '15%', '10%'].map((w, col) => (
            <Pulse
              key={col}
              width={w}
              height="14px"
              className={col === 4 ? 'rounded-full' : ''}
              delay={0.25 + row * 0.06 + col * 0.03}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// ============================================================
// Variant "analytics" : header + 4 metric cards + 2 graphiques
// Pour : Analytics, DataAnalytics
// ============================================================
const AnalyticsSkeleton = () => (
  <div className="space-y-6">
    {/* Header : titre + selecteur periode */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Pulse width="220px" height="36px" className="rounded-lg" />
        <Pulse width="280px" height="16px" delay={0.05} />
      </div>
      <Pulse width="160px" height="44px" className="rounded-xl" delay={0.1} />
    </div>

    {/* 4 Metric Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <Pulse width="48px" height="48px" className="rounded-xl" delay={i * 0.1} />
            <Pulse width="52px" height="24px" className="rounded-full" delay={i * 0.1 + 0.05} />
          </div>
          <Pulse width="80px" height="32px" className="mb-2 rounded-lg" delay={i * 0.1 + 0.1} />
          <Pulse width="100px" height="14px" delay={i * 0.1 + 0.15} />
        </div>
      ))}
    </div>

    {/* 2 zones graphiques */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <Pulse width="160px" height="24px" className="rounded-lg" delay={0.4 + i * 0.1} />
            <Pulse width="80px" height="28px" className="rounded-lg" delay={0.45 + i * 0.1} />
          </div>
          {/* Zone graphique */}
          <div className="flex items-end gap-2 h-[250px] pt-4">
            {Array.from({ length: 7 }).map((_, j) => {
              const h = 40 + Math.round(Math.sin(j + i * 3) * 25 + 25);
              return (
                <motion.div
                  key={j}
                  className="flex-1 rounded-t-lg bg-gray-200"
                  style={{ height: `${h}%` }}
                  animate={shimmer.animate}
                  transition={{ ...shimmer.transition, delay: 0.5 + j * 0.06 }}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ============================================================
// Composant principal
// ============================================================
interface AdminPageSkeletonProps {
  variant?: 'table' | 'analytics';
}

export const AdminPageSkeleton = ({ variant = 'table' }: AdminPageSkeletonProps) => {
  return variant === 'analytics' ? <AnalyticsSkeleton /> : <TableSkeleton />;
};

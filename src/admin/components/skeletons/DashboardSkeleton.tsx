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

/** Skeleton d'une StatCard */
const StatCardSkeleton = ({ delay }: { delay: number }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-start justify-between mb-4">
      {/* Icone */}
      <Pulse width="48px" height="48px" className="rounded-xl" delay={delay} />
      {/* Badge trend */}
      <Pulse width="52px" height="24px" className="rounded-full" delay={delay + 0.1} />
    </div>
    {/* Valeur */}
    <Pulse width="80px" height="32px" className="mb-2 rounded-lg" delay={delay + 0.15} />
    {/* Label */}
    <Pulse width="110px" height="16px" delay={delay + 0.2} />
  </div>
);

/** Skeleton d'une ligne d'activite */
const ActivityRowSkeleton = ({ delay }: { delay: number }) => (
  <div className="flex items-center gap-4">
    <Pulse width="44px" height="44px" className="rounded-xl flex-shrink-0" delay={delay} />
    <div className="flex-1 space-y-2">
      <Pulse width="70%" height="14px" delay={delay + 0.05} />
      <Pulse width="40%" height="12px" delay={delay + 0.1} />
    </div>
  </div>
);

/** Skeleton d'une ligne de table */
const TableRowSkeleton = ({ delay }: { delay: number }) => (
  <div className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
    <Pulse width="30%" height="14px" delay={delay} />
    <Pulse width="20%" height="14px" delay={delay + 0.05} />
    <Pulse width="15%" height="14px" delay={delay + 0.1} />
    <Pulse width="64px" height="24px" className="rounded-full" delay={delay + 0.15} />
  </div>
);

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Pulse width="200px" height="36px" className="mb-2 rounded-lg" />
        <Pulse width="280px" height="18px" delay={0.1} />
      </div>

      {/* KPI Cards - 4 colonnes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[0, 1, 2, 3].map((i) => (
          <StatCardSkeleton key={i} delay={i * 0.1} />
        ))}
      </div>

      {/* Grille principale : graphique (2/3) + feature card (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique revenus */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-2">
                <Pulse width="180px" height="24px" className="rounded-lg" delay={0.3} />
                <Pulse width="320px" height="14px" delay={0.35} />
              </div>
              <Pulse width="52px" height="24px" className="rounded-full" delay={0.4} />
            </div>
            {/* Zone du graphique en barres */}
            <div className="flex items-end gap-3 h-[300px] pt-6">
              {[65, 72, 78, 82, 70, 76, 84, 80, 90].map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-t-lg bg-gray-200"
                  style={{ height: `${h}%` }}
                  animate={shimmer.animate}
                  transition={{ ...shimmer.transition, delay: 0.3 + i * 0.06 }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Feature card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="space-y-4">
            <Pulse width="80px" height="24px" className="rounded-full" delay={0.4} />
            <Pulse width="100%" height="24px" className="rounded-lg" delay={0.45} />
            <Pulse width="90%" height="14px" delay={0.5} />
            <Pulse width="70%" height="14px" delay={0.55} />
            <div className="pt-4">
              <Pulse width="100%" height="44px" className="rounded-xl" delay={0.6} />
            </div>
          </div>
        </div>
      </div>

      {/* Grille bas : activites + plats recents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activites recentes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <Pulse width="180px" height="24px" className="mb-6 rounded-lg" delay={0.5} />
          <div className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <ActivityRowSkeleton key={i} delay={0.55 + i * 0.1} />
            ))}
          </div>
        </div>

        {/* Plats recents - table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <Pulse width="160px" height="24px" className="mb-6 rounded-lg" delay={0.5} />
          {/* En-tete table */}
          <div className="flex items-center gap-4 pb-3 mb-2 border-b border-gray-100">
            <Pulse width="30%" height="12px" delay={0.55} />
            <Pulse width="20%" height="12px" delay={0.6} />
            <Pulse width="15%" height="12px" delay={0.65} />
            <Pulse width="64px" height="12px" delay={0.7} />
          </div>
          {/* Lignes */}
          <div>
            {[0, 1, 2, 3, 4].map((i) => (
              <TableRowSkeleton key={i} delay={0.6 + i * 0.08} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

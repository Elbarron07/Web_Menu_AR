import { motion } from 'framer-motion';

/**
 * Detecte le theme via la classe CSS sur <html>.
 * Fonctionne meme en dehors du ThemeProvider.
 */
function isDarkMode(): boolean {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
}

const Pulse = ({
  width,
  height,
  className = '',
  delay = 0,
  dark = false,
}: {
  width?: string;
  height?: string;
  className?: string;
  delay?: number;
  dark?: boolean;
}) => (
  <motion.div
    className={`rounded-md ${dark ? 'bg-gray-700' : 'bg-gray-200'} ${className}`}
    style={{ width, height }}
    animate={{
      backgroundColor: dark
        ? ['#374151', '#4B5563', '#374151']
        : ['#E5E7EB', '#F3F4F6', '#E5E7EB'],
    }}
    transition={{
      duration: 1.8,
      repeat: Infinity,
      ease: 'easeInOut' as const,
      delay,
    }}
  />
);

// ============================================================
// Variant "table"
// ============================================================
const TableSkeleton = ({ dark }: { dark: boolean }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Pulse width="240px" height="36px" className="rounded-lg" dark={dark} />
        <Pulse width="300px" height="16px" delay={0.05} dark={dark} />
      </div>
      <Pulse width="140px" height="44px" className="rounded-xl" delay={0.1} dark={dark} />
    </div>

    <div className={`rounded-2xl shadow-sm border p-6 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Pulse width="100%" height="44px" className="rounded-xl flex-1" delay={0.15} dark={dark} />
        <Pulse width="180px" height="44px" className="rounded-xl flex-shrink-0" delay={0.2} dark={dark} />
      </div>

      <div className={`flex items-center gap-4 pb-3 mb-1 border-b ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
        {['25%', '20%', '15%', '15%', '10%'].map((w, i) => (
          <Pulse key={i} width={w} height="12px" delay={0.2 + i * 0.04} dark={dark} />
        ))}
      </div>

      {[0, 1, 2, 3, 4].map((row) => (
        <div
          key={row}
          className={`flex items-center gap-4 py-4 border-b last:border-0 ${dark ? 'border-gray-700/50' : 'border-gray-50'}`}
        >
          {['25%', '20%', '15%', '15%', '10%'].map((w, col) => (
            <Pulse
              key={col}
              width={w}
              height="14px"
              className={col === 4 ? 'rounded-full' : ''}
              delay={0.25 + row * 0.06 + col * 0.03}
              dark={dark}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// ============================================================
// Variant "analytics" : 6 metric cards + 2 graphiques + activites
// ============================================================
const AnalyticsSkeleton = ({ dark }: { dark: boolean }) => {
  const cardBg = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const barBg = dark ? 'bg-gray-700' : 'bg-gray-200';
  const barColors = dark ? ['#374151', '#4B5563', '#374151'] : ['#E5E7EB', '#F3F4F6', '#E5E7EB'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Pulse width="220px" height="36px" className="rounded-lg" dark={dark} />
          <Pulse width="280px" height="16px" delay={0.05} dark={dark} />
        </div>
        <Pulse width="160px" height="44px" className="rounded-xl" delay={0.1} dark={dark} />
      </div>

      {/* 6 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`rounded-2xl shadow-sm border p-6 ${cardBg}`}>
            <div className="flex items-start justify-between mb-4">
              <Pulse width="48px" height="48px" className="rounded-xl" delay={i * 0.1} dark={dark} />
              <Pulse width="52px" height="24px" className="rounded-full" delay={i * 0.1 + 0.05} dark={dark} />
            </div>
            <Pulse width="80px" height="32px" className="mb-2 rounded-lg" delay={i * 0.1 + 0.1} dark={dark} />
            <Pulse width="100px" height="14px" delay={i * 0.1 + 0.15} dark={dark} />
          </div>
        ))}
      </div>

      {/* 2 zones graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <div key={i} className={`rounded-2xl shadow-sm border p-8 ${cardBg}`}>
            <div className="flex items-center justify-between mb-6">
              <Pulse width="160px" height="24px" className="rounded-lg" delay={0.4 + i * 0.1} dark={dark} />
              <Pulse width="80px" height="28px" className="rounded-lg" delay={0.45 + i * 0.1} dark={dark} />
            </div>
            <div className="flex items-end gap-2 h-[250px] pt-4">
              {Array.from({ length: 7 }).map((_, j) => {
                const h = 40 + Math.round(Math.sin(j + i * 3) * 25 + 25);
                return (
                  <motion.div
                    key={j}
                    className={`flex-1 rounded-t-lg ${barBg}`}
                    style={{ height: `${h}%` }}
                    animate={{ backgroundColor: barColors }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const, delay: 0.5 + j * 0.06 }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Chart activites par jour (pleine largeur) */}
      <div className={`rounded-2xl shadow-sm border p-8 ${cardBg}`}>
        <Pulse width="200px" height="24px" className="mb-6 rounded-lg" delay={0.6} dark={dark} />
        <div className="flex items-end gap-2 h-[200px] pt-4">
          {Array.from({ length: 14 }).map((_, j) => {
            const h = 30 + Math.round(Math.cos(j * 0.8) * 20 + 30);
            return (
              <motion.div
                key={j}
                className={`flex-1 rounded-t-lg ${barBg}`}
                style={{ height: `${h}%` }}
                animate={{ backgroundColor: barColors }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const, delay: 0.65 + j * 0.04 }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Composant principal
// ============================================================
interface AdminPageSkeletonProps {
  variant?: 'table' | 'analytics';
}

export const AdminPageSkeleton = ({ variant = 'table' }: AdminPageSkeletonProps) => {
  const dark = isDarkMode();
  return variant === 'analytics' ? <AnalyticsSkeleton dark={dark} /> : <TableSkeleton dark={dark} />;
};

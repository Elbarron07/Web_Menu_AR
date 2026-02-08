import { motion } from 'framer-motion';

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

const StatCardSkeleton = ({ delay, dark }: { delay: number; dark: boolean }) => (
  <div className={`rounded-2xl shadow-sm border p-6 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
    <div className="flex items-start justify-between mb-4">
      <Pulse width="48px" height="48px" className="rounded-xl" delay={delay} dark={dark} />
      <Pulse width="52px" height="24px" className="rounded-full" delay={delay + 0.1} dark={dark} />
    </div>
    <Pulse width="80px" height="32px" className="mb-2 rounded-lg" delay={delay + 0.15} dark={dark} />
    <Pulse width="110px" height="16px" delay={delay + 0.2} dark={dark} />
  </div>
);

const ActivityRowSkeleton = ({ delay, dark }: { delay: number; dark: boolean }) => (
  <div className="flex items-center gap-4">
    <Pulse width="44px" height="44px" className="rounded-xl flex-shrink-0" delay={delay} dark={dark} />
    <div className="flex-1 space-y-2">
      <Pulse width="70%" height="14px" delay={delay + 0.05} dark={dark} />
      <Pulse width="40%" height="12px" delay={delay + 0.1} dark={dark} />
    </div>
  </div>
);

const TableRowSkeleton = ({ delay, dark }: { delay: number; dark: boolean }) => (
  <div className={`flex items-center gap-4 py-3 border-b last:border-0 ${dark ? 'border-gray-700/50' : 'border-gray-50'}`}>
    <Pulse width="30%" height="14px" delay={delay} dark={dark} />
    <Pulse width="20%" height="14px" delay={delay + 0.05} dark={dark} />
    <Pulse width="15%" height="14px" delay={delay + 0.1} dark={dark} />
    <Pulse width="64px" height="24px" className="rounded-full" delay={delay + 0.15} dark={dark} />
  </div>
);

export const DashboardSkeleton = () => {
  const dark = isDarkMode();
  const cardBg = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const barColors = dark ? ['#374151', '#4B5563', '#374151'] : ['#E5E7EB', '#F3F4F6', '#E5E7EB'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Pulse width="200px" height="36px" className="mb-2 rounded-lg" dark={dark} />
        <Pulse width="280px" height="18px" delay={0.1} dark={dark} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[0, 1, 2, 3].map((i) => (
          <StatCardSkeleton key={i} delay={i * 0.1} dark={dark} />
        ))}
      </div>

      {/* Graphique + feature card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className={`rounded-2xl shadow-sm border p-8 ${cardBg}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-2">
                <Pulse width="180px" height="24px" className="rounded-lg" delay={0.3} dark={dark} />
                <Pulse width="320px" height="14px" delay={0.35} dark={dark} />
              </div>
              <Pulse width="52px" height="24px" className="rounded-full" delay={0.4} dark={dark} />
            </div>
            <div className="flex items-end gap-3 h-[300px] pt-6">
              {[65, 72, 78, 82, 70, 76, 84, 80, 90].map((h, i) => (
                <motion.div
                  key={i}
                  className={`flex-1 rounded-t-lg ${dark ? 'bg-gray-700' : 'bg-gray-200'}`}
                  style={{ height: `${h}%` }}
                  animate={{ backgroundColor: barColors }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const, delay: 0.3 + i * 0.06 }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className={`rounded-2xl shadow-sm border p-8 ${cardBg}`}>
          <div className="space-y-4">
            <Pulse width="80px" height="24px" className="rounded-full" delay={0.4} dark={dark} />
            <Pulse width="100%" height="24px" className="rounded-lg" delay={0.45} dark={dark} />
            <Pulse width="90%" height="14px" delay={0.5} dark={dark} />
            <Pulse width="70%" height="14px" delay={0.55} dark={dark} />
            <div className="pt-4">
              <Pulse width="100%" height="44px" className="rounded-xl" delay={0.6} dark={dark} />
            </div>
          </div>
        </div>
      </div>

      {/* Activites + plats recents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`rounded-2xl shadow-sm border p-8 ${cardBg}`}>
          <Pulse width="180px" height="24px" className="mb-6 rounded-lg" delay={0.5} dark={dark} />
          <div className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <ActivityRowSkeleton key={i} delay={0.55 + i * 0.1} dark={dark} />
            ))}
          </div>
        </div>

        <div className={`rounded-2xl shadow-sm border p-8 ${cardBg}`}>
          <Pulse width="160px" height="24px" className="mb-6 rounded-lg" delay={0.5} dark={dark} />
          <div className={`flex items-center gap-4 pb-3 mb-2 border-b ${dark ? 'border-gray-700' : 'border-gray-100'}`}>
            <Pulse width="30%" height="12px" delay={0.55} dark={dark} />
            <Pulse width="20%" height="12px" delay={0.6} dark={dark} />
            <Pulse width="15%" height="12px" delay={0.65} dark={dark} />
            <Pulse width="64px" height="12px" delay={0.7} dark={dark} />
          </div>
          <div>
            {[0, 1, 2, 3, 4].map((i) => (
              <TableRowSkeleton key={i} delay={0.6 + i * 0.08} dark={dark} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

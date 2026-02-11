import { motion } from 'framer-motion';

/**
 * Detecte le theme via la classe CSS sur <html>.
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

const CardShell = ({ dark, children, className = '' }: { dark: boolean; children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl shadow-sm border p-6 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} ${className}`}>
    {children}
  </div>
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

    <CardShell dark={dark}>
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
    </CardShell>
  </div>
);

// ============================================================
// Variant "analytics" — Matches DataAnalytics.tsx 6 sections:
//  1) Funnel de conversion
//  2) Engagement par plat (table)
//  3) Horaires de pointe (heatmap grid)
//  4) Cohortes de sessions (bar chart)
//  5) QR Analytics (bars)
//  6) Engagement Score (2-col rankings)
// ============================================================
const AnalyticsSkeleton = ({ dark }: { dark: boolean }) => {
  const barBg = dark ? 'bg-gray-700' : 'bg-gray-200';
  const barColors = dark ? ['#374151', '#4B5563', '#374151'] : ['#E5E7EB', '#F3F4F6', '#E5E7EB'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Pulse width="260px" height="36px" className="rounded-lg" dark={dark} />
          <Pulse width="340px" height="16px" delay={0.05} dark={dark} />
        </div>
        <div className="flex items-center gap-3">
          <Pulse width="160px" height="40px" className="rounded-xl" delay={0.1} dark={dark} />
          <Pulse width="120px" height="40px" className="rounded-xl" delay={0.15} dark={dark} />
        </div>
      </div>

      {/* 1. Funnel de conversion */}
      <CardShell dark={dark}>
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <Pulse width="200px" height="24px" className="rounded-lg" delay={0.1} dark={dark} />
            <Pulse width="300px" height="14px" delay={0.15} dark={dark} />
          </div>
          <Pulse width="90px" height="28px" className="rounded-full" delay={0.2} dark={dark} />
        </div>
        {/* Funnel bars */}
        <div className="space-y-3 mb-6">
          {[100, 75, 50, 30, 15].map((w, i) => (
            <div key={i} className="flex items-center gap-4">
              <Pulse width="100px" height="14px" delay={0.2 + i * 0.06} dark={dark} />
              <div className="flex-1">
                <motion.div
                  className={`h-10 rounded-xl ${barBg}`}
                  style={{ width: `${w}%` }}
                  animate={{ backgroundColor: barColors }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const, delay: 0.25 + i * 0.06 }}
                />
              </div>
              <Pulse width="50px" height="14px" delay={0.3 + i * 0.06} dark={dark} />
            </div>
          ))}
        </div>
        {/* Area chart placeholder */}
        <div className="flex items-end gap-1 h-[160px] pt-4">
          {Array.from({ length: 5 }).map((_, j) => {
            const h = 30 + Math.round(Math.sin(j * 1.2) * 20 + 30);
            return (
              <motion.div
                key={j}
                className={`flex-1 rounded-t-lg ${barBg}`}
                style={{ height: `${h}%` }}
                animate={{ backgroundColor: barColors }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const, delay: 0.4 + j * 0.06 }}
              />
            );
          })}
        </div>
      </CardShell>

      {/* 2. Engagement par plat (table) */}
      <CardShell dark={dark}>
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <Pulse width="200px" height="24px" className="rounded-lg" delay={0.3} dark={dark} />
            <Pulse width="280px" height="14px" delay={0.35} dark={dark} />
          </div>
        </div>
        {/* Table header */}
        <div className={`flex items-center gap-4 pb-3 mb-1 border-b ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
          {['22%', '14%', '8%', '8%', '8%', '8%', '18%'].map((w, i) => (
            <Pulse key={i} width={w} height="12px" delay={0.35 + i * 0.03} dark={dark} />
          ))}
        </div>
        {/* Table rows */}
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <div
            key={row}
            className={`flex items-center gap-4 py-3.5 border-b last:border-0 ${dark ? 'border-gray-700/50' : 'border-gray-50'}`}
          >
            {['22%', '14%', '8%', '8%', '8%', '8%'].map((w, col) => (
              <Pulse key={col} width={w} height="14px" delay={0.4 + row * 0.05 + col * 0.02} dark={dark} />
            ))}
            {/* Score bar */}
            <div className="flex items-center gap-2" style={{ width: '18%' }}>
              <motion.div
                className={`h-2.5 rounded-full ${barBg}`}
                style={{ width: `${90 - row * 12}%` }}
                animate={{ backgroundColor: barColors }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const, delay: 0.45 + row * 0.05 }}
              />
              <Pulse width="24px" height="12px" delay={0.5 + row * 0.05} dark={dark} />
            </div>
          </div>
        ))}
      </CardShell>

      {/* 3. Peak Hours + 4. Cohorts — side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Peak hours heatmap grid */}
        <CardShell dark={dark}>
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <Pulse width="180px" height="24px" className="rounded-lg" delay={0.5} dark={dark} />
              <Pulse width="240px" height="14px" delay={0.55} dark={dark} />
            </div>
            <Pulse width="180px" height="28px" className="rounded-full" delay={0.6} dark={dark} />
          </div>
          {/* Heatmap grid */}
          <div className="space-y-1.5">
            {[0, 1, 2, 3, 4, 5, 6].map((row) => (
              <div key={row} className="flex items-center gap-1">
                <Pulse width="32px" height="12px" delay={0.6 + row * 0.03} dark={dark} />
                {Array.from({ length: 12 }).map((_, col) => (
                  <motion.div
                    key={col}
                    className={`flex-1 h-7 rounded-md ${barBg}`}
                    animate={{ backgroundColor: barColors }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const, delay: 0.65 + row * 0.03 + col * 0.02 }}
                  />
                ))}
              </div>
            ))}
          </div>
        </CardShell>

        {/* Cohorts bar chart */}
        <CardShell dark={dark}>
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <Pulse width="200px" height="24px" className="rounded-lg" delay={0.5} dark={dark} />
              <Pulse width="220px" height="14px" delay={0.55} dark={dark} />
            </div>
            <Pulse width="140px" height="28px" className="rounded-full" delay={0.6} dark={dark} />
          </div>
          <div className="flex items-end gap-3 h-[240px] pt-4">
            {Array.from({ length: 6 }).map((_, j) => {
              const h1 = 30 + Math.round(Math.sin(j) * 15 + 20);
              const h2 = 15 + Math.round(Math.cos(j) * 10 + 12);
              return (
                <div key={j} className="flex-1 flex flex-col items-center gap-1" style={{ height: '100%', justifyContent: 'flex-end' }}>
                  <motion.div
                    className={`w-full rounded-t-md ${barBg}`}
                    style={{ height: `${h2}%` }}
                    animate={{ backgroundColor: barColors }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const, delay: 0.7 + j * 0.06 }}
                  />
                  <motion.div
                    className={`w-full rounded-t-md ${barBg}`}
                    style={{ height: `${h1}%` }}
                    animate={{ backgroundColor: barColors }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const, delay: 0.7 + j * 0.06 + 0.03 }}
                  />
                </div>
              );
            })}
          </div>
        </CardShell>
      </div>

      {/* 5. QR Analytics */}
      <CardShell dark={dark}>
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <Pulse width="200px" height="24px" className="rounded-lg" delay={0.7} dark={dark} />
            <Pulse width="200px" height="14px" delay={0.75} dark={dark} />
          </div>
          <Pulse width="140px" height="28px" className="rounded-full" delay={0.8} dark={dark} />
        </div>
        {/* Type summary chips */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`rounded-xl p-3 text-center ${dark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <Pulse width="50px" height="10px" className="mx-auto mb-2" delay={0.8 + i * 0.04} dark={dark} />
              <Pulse width="40px" height="20px" className="mx-auto" delay={0.85 + i * 0.04} dark={dark} />
            </div>
          ))}
        </div>
        {/* QR bars */}
        <div className="space-y-2.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Pulse width="120px" height="14px" delay={0.85 + i * 0.05} dark={dark} />
              <Pulse width="52px" height="22px" className="rounded-full" delay={0.88 + i * 0.05} dark={dark} />
              <div className="flex-1">
                <motion.div
                  className={`h-3 rounded-full ${barBg}`}
                  style={{ width: `${90 - i * 15}%` }}
                  animate={{ backgroundColor: barColors }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const, delay: 0.9 + i * 0.05 }}
                />
              </div>
              <Pulse width="40px" height="14px" delay={0.93 + i * 0.05} dark={dark} />
            </div>
          ))}
        </div>
      </CardShell>

      {/* 6. Engagement Score — Top 5 / Bottom 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1].map((col) => (
          <CardShell key={col} dark={dark}>
            <div className="flex items-center gap-2 mb-4">
              <Pulse width="24px" height="24px" className="rounded-md" delay={0.9 + col * 0.1} dark={dark} />
              <Pulse width="220px" height="20px" className="rounded-lg" delay={0.95 + col * 0.1} dark={dark} />
            </div>
            <div className={`divide-y ${dark ? 'divide-gray-700/50' : 'divide-gray-100'}`}>
              {[0, 1, 2, 3, 4].map((row) => (
                <div key={row} className="flex items-center gap-3 py-3">
                  <Pulse width="32px" height="32px" className="rounded-lg" delay={1.0 + col * 0.1 + row * 0.04} dark={dark} />
                  <div className="flex-1 space-y-1.5">
                    <Pulse width="60%" height="14px" delay={1.0 + col * 0.1 + row * 0.04 + 0.02} dark={dark} />
                    <Pulse width="35%" height="10px" delay={1.0 + col * 0.1 + row * 0.04 + 0.04} dark={dark} />
                  </div>
                  <div className="text-right space-y-1">
                    <Pulse width="40px" height="18px" delay={1.0 + col * 0.1 + row * 0.04 + 0.06} dark={dark} />
                    <Pulse width="20px" height="10px" delay={1.0 + col * 0.1 + row * 0.04 + 0.08} dark={dark} />
                  </div>
                </div>
              ))}
            </div>
            {/* Score bars at bottom */}
            {col === 0 && (
              <div className="mt-4 space-y-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Pulse width="70px" height="10px" delay={1.3 + i * 0.03} dark={dark} />
                    <div className="flex-1">
                      <motion.div
                        className={`h-2 rounded-full ${barBg}`}
                        style={{ width: `${95 - i * 15}%` }}
                        animate={{ backgroundColor: barColors }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const, delay: 1.33 + i * 0.03 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Advice box for Bottom 5 */}
            {col === 1 && (
              <div className={`mt-4 rounded-xl p-3 ${dark ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                <Pulse width="100%" height="12px" delay={1.35} dark={dark} />
                <Pulse width="80%" height="12px" className="mt-1.5" delay={1.38} dark={dark} />
              </div>
            )}
          </CardShell>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// Variant "customers" — Matches CustomerTracking.tsx:
//  4 stat cards + chart + table with search
// ============================================================
const CustomersSkeleton = ({ dark }: { dark: boolean }) => {
  const barBg = dark ? 'bg-gray-700' : 'bg-gray-200';
  const barColors = dark ? ['#374151', '#4B5563', '#374151'] : ['#E5E7EB', '#F3F4F6', '#E5E7EB'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Pulse width="220px" height="36px" className="rounded-lg" dark={dark} />
          <Pulse width="340px" height="16px" delay={0.05} dark={dark} />
        </div>
        <div className="flex items-center gap-3">
          <Pulse width="120px" height="40px" className="rounded-xl" delay={0.1} dark={dark} />
          <Pulse width="110px" height="40px" className="rounded-xl" delay={0.15} dark={dark} />
        </div>
      </div>

      {/* 4 Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[0, 1, 2, 3].map((i) => (
          <CardShell key={i} dark={dark}>
            <div className="flex items-start justify-between mb-4">
              <Pulse width="48px" height="48px" className="rounded-xl" delay={i * 0.08} dark={dark} />
            </div>
            <Pulse width="80px" height="32px" className="mb-2 rounded-lg" delay={i * 0.08 + 0.1} dark={dark} />
            <Pulse width="110px" height="14px" delay={i * 0.08 + 0.15} dark={dark} />
          </CardShell>
        ))}
      </div>

      {/* Line chart */}
      <CardShell dark={dark}>
        <Pulse width="200px" height="24px" className="rounded-lg mb-6" delay={0.3} dark={dark} />
        <div className="flex items-end gap-2 h-[240px] pt-4">
          {Array.from({ length: 7 }).map((_, j) => {
            const h = 30 + Math.round(Math.sin(j * 0.9) * 25 + 25);
            return (
              <motion.div
                key={j}
                className={`flex-1 rounded-t-lg ${barBg}`}
                style={{ height: `${h}%` }}
                animate={{ backgroundColor: barColors }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const, delay: 0.35 + j * 0.05 }}
              />
            );
          })}
        </div>
      </CardShell>

      {/* Sessions table */}
      <CardShell dark={dark}>
        <div className="flex items-center justify-between mb-6">
          <Pulse width="180px" height="24px" className="rounded-lg" delay={0.5} dark={dark} />
          <div className="flex items-center gap-3">
            <Pulse width="220px" height="40px" className="rounded-xl" delay={0.55} dark={dark} />
            <Pulse width="100px" height="40px" className="rounded-xl" delay={0.6} dark={dark} />
          </div>
        </div>
        {/* Table header */}
        <div className={`flex items-center gap-4 pb-3 mb-1 border-b ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
          {['25%', '12%', '12%', '15%', '15%', '10%'].map((w, i) => (
            <Pulse key={i} width={w} height="12px" delay={0.6 + i * 0.03} dark={dark} />
          ))}
        </div>
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className={`flex items-center gap-4 py-4 border-b last:border-0 ${dark ? 'border-gray-700/50' : 'border-gray-50'}`}>
            {['25%', '12%', '12%', '15%', '15%'].map((w, col) => (
              <Pulse key={col} width={w} height="14px" delay={0.65 + row * 0.05 + col * 0.02} dark={dark} />
            ))}
            <Pulse width="60px" height="24px" className="rounded-full" delay={0.7 + row * 0.05} dark={dark} />
          </div>
        ))}
      </CardShell>
    </div>
  );
};

// ============================================================
// Composant principal
// ============================================================
interface AdminPageSkeletonProps {
  variant?: 'table' | 'analytics' | 'customers';
}

export const AdminPageSkeleton = ({ variant = 'table' }: AdminPageSkeletonProps) => {
  const dark = isDarkMode();
  if (variant === 'analytics') return <AnalyticsSkeleton dark={dark} />;
  if (variant === 'customers') return <CustomersSkeleton dark={dark} />;
  return <TableSkeleton dark={dark} />;
};

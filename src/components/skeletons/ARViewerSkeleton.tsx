import { motion } from 'framer-motion';

const shimmer = {
  transition: {
    duration: 1.8,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

export const ARViewerSkeleton = () => {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ background: '#000000' }}
    >
      {/* Fond gradient sombre */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />

      {/* Zone 3D centrale : icone cube en pulse */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="flex flex-col items-center gap-3"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span className="text-white/20 text-xs font-medium tracking-wider uppercase">
            Chargement 3D
          </span>
        </motion.div>
      </div>

      {/* HUD Skeleton */}
      <div className="pointer-events-none fixed inset-0 z-50 flex flex-col">

        {/* Bouton retour skeleton (simple chevron, sans cercle) */}
        <motion.div
          className="fixed top-[13px] left-3 z-[60] w-5 h-5 rounded-sm bg-white/10"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ ...shimmer.transition, delay: 0.1 }}
        />

        {/* === Top Bar fine sombre === */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between pl-10 pr-4 py-3.5 bg-black/50 backdrop-blur-sm border-b border-white/10"
        >
          {/* Nom du produit placeholder */}
          <motion.div
            className="h-5 rounded-md"
            style={{ width: '55%', background: 'rgba(255,255,255,0.1)' }}
            animate={{
              background: [
                'rgba(255,255,255,0.06)',
                'rgba(255,255,255,0.14)',
                'rgba(255,255,255,0.06)',
              ],
            }}
            transition={shimmer.transition}
          />
          {/* Prix placeholder */}
          <motion.div
            className="h-5 rounded-md"
            style={{ width: '60px', background: 'rgba(255,255,255,0.1)' }}
            animate={{
              background: [
                'rgba(255,255,255,0.06)',
                'rgba(255,255,255,0.14)',
                'rgba(255,255,255,0.06)',
              ],
            }}
            transition={{ ...shimmer.transition, delay: 0.1 }}
          />
        </motion.div>

        {/* === Centre vide (le cube 3D est déjà positionné en absolute) === */}
        <div className="flex-1" />

        {/* === Section basse === */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="px-4 pb-6 pt-2 space-y-3"
        >
          {/* Ligne pills variantes + bouton AR */}
          <div className="flex items-center gap-2">
            {/* Pills variantes */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-9 rounded-full border border-white/10"
                style={{
                  width: i === 0 ? '52px' : '48px',
                  background: i === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                }}
                animate={{
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  ...shimmer.transition,
                  delay: i * 0.1 + 0.35,
                }}
              />
            ))}

            <div className="flex-1" />

            {/* Bouton AR placeholder (plus large) */}
            <motion.div
              className="h-10 rounded-full border border-white/15"
              style={{ width: '110px', background: 'rgba(255,255,255,0.1)' }}
              animate={{
                background: [
                  'rgba(255,255,255,0.06)',
                  'rgba(255,255,255,0.14)',
                  'rgba(255,255,255,0.06)',
                ],
              }}
              transition={{ ...shimmer.transition, delay: 0.45 }}
            />
          </div>

          {/* Ligne description placeholder */}
          <motion.div
            className="h-3 rounded-full"
            style={{ width: '70%', background: 'rgba(255,255,255,0.05)' }}
            animate={{
              background: [
                'rgba(255,255,255,0.03)',
                'rgba(255,255,255,0.08)',
                'rgba(255,255,255,0.03)',
              ],
            }}
            transition={{ ...shimmer.transition, delay: 0.5 }}
          />

          {/* Bouton Ajouter placeholder */}
          <motion.div
            className="w-full h-12 rounded-2xl border border-white/10"
            style={{ background: 'rgba(255,255,255,0.08)' }}
            animate={{
              background: [
                'rgba(255,255,255,0.05)',
                'rgba(255,255,255,0.12)',
                'rgba(255,255,255,0.05)',
              ],
            }}
            transition={{ ...shimmer.transition, delay: 0.55 }}
          />
        </motion.div>
      </div>
    </div>
  );
};

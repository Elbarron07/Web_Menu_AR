import { motion } from 'framer-motion';

const shimmer = {
  animate: {
    background: [
      'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.08) 100%)',
      'linear-gradient(90deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.14) 100%)',
      'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.08) 100%)',
    ],
  },
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
          {/* Icone cube 3D */}
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

      {/* HUD Overlay skeleton (meme structure que le vrai HUDOverlay) */}
      <div className="pointer-events-none fixed inset-0 z-50 flex flex-col">
        {/* === Top Bar : carte produit === */}
        <div className="p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="backdrop-blur-2xl border rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl bg-white/80 border-white/30"
            style={{
              boxShadow:
                '0 8px 32px 0 rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.3)',
            }}
          >
            <div className="flex justify-between items-start gap-3 sm:gap-4">
              {/* Gauche : nom, description, temps */}
              <div className="flex-1 min-w-0 space-y-2.5">
                {/* Nom du plat */}
                <motion.div
                  className="h-7 sm:h-8 rounded-lg"
                  style={{ width: '65%', background: 'rgba(15,23,42,0.08)' }}
                  animate={{
                    background: [
                      'rgba(15,23,42,0.06)',
                      'rgba(15,23,42,0.12)',
                      'rgba(15,23,42,0.06)',
                    ],
                  }}
                  transition={shimmer.transition}
                />
                {/* Description */}
                <motion.div
                  className="h-4 rounded-md"
                  style={{ width: '85%', background: 'rgba(15,23,42,0.06)' }}
                  animate={{
                    background: [
                      'rgba(15,23,42,0.04)',
                      'rgba(15,23,42,0.09)',
                      'rgba(15,23,42,0.04)',
                    ],
                  }}
                  transition={{ ...shimmer.transition, delay: 0.1 }}
                />
                {/* Temps de preparation */}
                <div className="flex items-center gap-2 mt-1">
                  <motion.div
                    className="w-5 h-5 rounded-full"
                    style={{ background: 'rgba(37,99,235,0.1)' }}
                    animate={{
                      background: [
                        'rgba(37,99,235,0.08)',
                        'rgba(37,99,235,0.15)',
                        'rgba(37,99,235,0.08)',
                      ],
                    }}
                    transition={{ ...shimmer.transition, delay: 0.2 }}
                  />
                  <motion.div
                    className="h-5 rounded-full"
                    style={{ width: '120px', background: 'rgba(15,23,42,0.05)' }}
                    animate={{
                      background: [
                        'rgba(15,23,42,0.04)',
                        'rgba(15,23,42,0.08)',
                        'rgba(15,23,42,0.04)',
                      ],
                    }}
                    transition={{ ...shimmer.transition, delay: 0.25 }}
                  />
                </div>
              </div>

              {/* Droite : prix, calories */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                {/* Prix */}
                <motion.div
                  className="h-8 sm:h-9 rounded-lg"
                  style={{ width: '80px', background: 'rgba(37,99,235,0.1)' }}
                  animate={{
                    background: [
                      'rgba(37,99,235,0.08)',
                      'rgba(37,99,235,0.15)',
                      'rgba(37,99,235,0.08)',
                    ],
                  }}
                  transition={{ ...shimmer.transition, delay: 0.15 }}
                />
                {/* Calories */}
                <motion.div
                  className="h-5 rounded-full"
                  style={{ width: '60px', background: 'rgba(15,23,42,0.05)' }}
                  animate={{
                    background: [
                      'rgba(15,23,42,0.04)',
                      'rgba(15,23,42,0.08)',
                      'rgba(15,23,42,0.04)',
                    ],
                  }}
                  transition={{ ...shimmer.transition, delay: 0.3 }}
                />
              </div>
            </div>
          </motion.div>

          {/* === Bouton Immersion Totale skeleton === */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mt-3 sm:mt-4 flex justify-center"
          >
            <motion.div
              className="w-full sm:w-auto rounded-3xl"
              style={{
                width: '220px',
                height: '52px',
                background: 'rgba(37,99,235,0.15)',
              }}
              animate={{
                background: [
                  'rgba(37,99,235,0.1)',
                  'rgba(37,99,235,0.2)',
                  'rgba(37,99,235,0.1)',
                ],
              }}
              transition={{ ...shimmer.transition, delay: 0.35 }}
            />
          </motion.div>
        </div>

        {/* === Middle Section : boutons taille a gauche === */}
        <div className="flex-1 flex items-center px-4 sm:px-6">
          <motion.div
            className="flex flex-col gap-3 sm:gap-4"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl border-2"
                style={{
                  background: i === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(241,245,249,0.6)',
                  borderColor:
                    i === 0 ? 'rgba(37,99,235,0.3)' : 'rgba(226,232,240,0.5)',
                }}
                animate={{
                  opacity: [0.5, 0.9, 0.5],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.15 + 0.4,
                }}
              />
            ))}
          </motion.div>
        </div>

        {/* === Gesture Hints skeleton === */}
        <motion.div
          className="flex justify-center pb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="rounded-full border bg-white/50 backdrop-blur-xl border-white/20"
            style={{ width: '280px', height: '36px' }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        {/* === Bottom Bar : bouton Commander === */}
        <div className="p-4 sm:p-6 pt-2 sm:pt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="w-full rounded-3xl"
            style={{
              height: '56px',
              background: 'rgba(15,23,42,0.4)',
            }}
          >
            <motion.div
              className="w-full h-full rounded-3xl"
              animate={{
                background: [
                  'rgba(15,23,42,0.35)',
                  'rgba(15,23,42,0.5)',
                  'rgba(15,23,42,0.35)',
                ],
              }}
              transition={{ ...shimmer.transition, delay: 0.5 }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

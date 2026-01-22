import { motion } from 'framer-motion';
import { SkeletonBox, SkeletonCircle } from '../Skeleton';

export const MenuSkeleton = () => {
  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Overlay avec glassmorphism */}
        <div
          className="absolute inset-0 pointer-events-auto"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.2) 0%, rgba(255, 165, 0, 0.2) 50%, rgba(255, 215, 0, 0.15) 100%)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        />

        {/* Skeleton de la roue de menu */}
        <div className="relative pointer-events-auto">
          <motion.div
            className="relative"
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {/* Cercle extérieur avec segments */}
            <div className="relative w-[560px] h-[560px]">
              {/* Segments animés */}
              {Array.from({ length: 8 }).map((_, index) => {
                const angle = (index * 360) / 8;
                return (
                  <motion.div
                    key={index}
                    className="absolute inset-0"
                    style={{
                      transform: `rotate(${angle}deg)`,
                      transformOrigin: 'center',
                    }}
                  >
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2"
                      style={{
                        width: '280px',
                        height: '280px',
                        clipPath: `polygon(50% 50%, 50% 0%, ${50 + 25 * Math.cos(Math.PI / 8)}% ${50 - 25 * Math.sin(Math.PI / 8)}%)`,
                      }}
                    >
                      <SkeletonBox
                        width="100%"
                        height="100%"
                        rounded="none"
                        className="bg-white/10 border border-white/20"
                      />
                    </div>
                  </motion.div>
                );
              })}

              {/* Cercle intérieur */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <SkeletonCircle size="240px" />
              </div>

              {/* Centre avec texte skeleton */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                <SkeletonBox width="80px" height="20px" rounded="md" />
                <SkeletonBox width="60px" height="16px" rounded="md" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

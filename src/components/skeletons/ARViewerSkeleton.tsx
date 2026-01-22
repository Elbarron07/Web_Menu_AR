import { motion } from 'framer-motion';
import { SkeletonBox, SkeletonCircle } from '../Skeleton';

export const ARViewerSkeleton = () => {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#000000' }}>
      {/* Fond noir avec effet de chargement */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />

      {/* Animation de chargement au centre */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          {/* Spinner circulaire animé */}
          <motion.div
            className="relative"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <SkeletonCircle size="80px" />
            <div className="absolute inset-0 border-4 border-transparent border-t-white/30 rounded-full" />
          </motion.div>

          {/* Texte de chargement */}
          <div className="flex flex-col items-center gap-2">
            <SkeletonBox width="200px" height="24px" rounded="md" />
            <SkeletonBox width="150px" height="16px" rounded="md" />
          </div>

          {/* Barre de progression skeleton */}
          <div className="w-64">
            <SkeletonBox width="100%" height="4px" rounded="full" />
          </div>
        </div>
      </div>

      {/* Effet de pulsation subtil */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-white/5 via-transparent to-transparent"
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};

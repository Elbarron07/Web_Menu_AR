import { motion } from 'framer-motion';

interface SkeletonBoxProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const SkeletonBox = ({ 
  width = '100%', 
  height = '1rem', 
  className = '',
  rounded = 'md'
}: SkeletonBoxProps) => {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  };

  return (
    <motion.div
      className={`bg-white/10 backdrop-blur-sm ${roundedClasses[rounded]} ${className}`}
      style={{ width, height }}
      animate={{
        background: [
          'linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.1) 100%)',
          'linear-gradient(90deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.15) 100%)',
          'linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.1) 100%)',
        ],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
};

interface SkeletonCircleProps {
  size?: string | number;
  className?: string;
}

export const SkeletonCircle = ({ size = '2rem', className = '' }: SkeletonCircleProps) => {
  return (
    <motion.div
      className={`bg-white/10 backdrop-blur-sm rounded-full ${className}`}
      style={{ width: size, height: size }}
      animate={{
        background: [
          'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.1) 100%)',
          'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.15) 100%)',
          'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.1) 100%)',
        ],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
};

interface SkeletonTextProps {
  lines?: number;
  width?: string | number;
  className?: string;
}

export const SkeletonText = ({ 
  lines = 1, 
  width = '100%',
  className = ''
}: SkeletonTextProps) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBox
          key={index}
          width={index === lines - 1 ? (typeof width === 'number' ? `${width * 0.7}%` : '70%') : width}
          height="0.875rem"
          rounded="md"
        />
      ))}
    </div>
  );
};

interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard = ({ className = '' }: SkeletonCardProps) => {
  return (
    <div className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <SkeletonCircle size="3rem" />
          <div className="flex-1 space-y-2">
            <SkeletonBox width="60%" height="1rem" />
            <SkeletonBox width="40%" height="0.75rem" />
          </div>
        </div>
        <SkeletonText lines={3} />
        <div className="flex gap-2">
          <SkeletonBox width="30%" height="2rem" rounded="lg" />
          <SkeletonBox width="30%" height="2rem" rounded="lg" />
        </div>
      </div>
    </div>
  );
};

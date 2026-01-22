import { SkeletonBox, SkeletonCircle } from '../Skeleton';

export const ProductSkeleton = () => {
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* HUD Overlay Skeleton */}
      <div className="absolute inset-0 flex flex-col">
        {/* Top Bar Skeleton */}
        <div className="pointer-events-auto p-4 sm:p-6">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <SkeletonCircle size="3rem" />
              <div className="flex-1 space-y-2">
                <SkeletonBox width="200px" height="24px" rounded="md" />
                <SkeletonBox width="150px" height="16px" rounded="md" />
              </div>
              <SkeletonBox width="80px" height="40px" rounded="lg" />
            </div>
          </div>
        </div>

        {/* Bottom Panel Skeleton */}
        <div className="mt-auto pointer-events-auto p-4 sm:p-6">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-6">
            <div className="space-y-4">
              {/* Variants Skeleton */}
              <div className="flex gap-2 overflow-x-auto">
                {Array.from({ length: 3 }).map((_, index) => (
                  <SkeletonBox
                    key={index}
                    width="100px"
                    height="40px"
                    rounded="lg"
                    className="flex-shrink-0"
                  />
                ))}
              </div>

              {/* Price and Add to Cart Skeleton */}
              <div className="flex items-center justify-between gap-4">
                <SkeletonBox width="120px" height="32px" rounded="lg" />
                <SkeletonBox width="150px" height="48px" rounded="xl" />
              </div>

              {/* Additional Info Skeleton */}
              <div className="flex gap-4">
                <SkeletonBox width="80px" height="20px" rounded="md" />
                <SkeletonBox width="80px" height="20px" rounded="md" />
                <SkeletonBox width="80px" height="20px" rounded="md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

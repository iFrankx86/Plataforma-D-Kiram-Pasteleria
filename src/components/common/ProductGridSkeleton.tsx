import React from 'react';

interface ProductGridSkeletonProps {
  count?: number;
}

export const ProductCategorySkeleton: React.FC = () => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar animate-pulse" aria-hidden="true">
      <div className="h-8 w-32 bg-stone-200/80 rounded-xl shrink-0" />
      <div className="h-8 w-24 bg-stone-200/60 rounded-xl shrink-0" />
      <div className="h-8 w-28 bg-stone-200/60 rounded-xl shrink-0" />
      <div className="h-8 w-36 bg-stone-200/60 rounded-xl shrink-0" />
      <div className="h-8 w-24 bg-stone-200/60 rounded-xl shrink-0" />
      <div className="h-8 w-24 bg-stone-200/60 rounded-xl shrink-0" />
    </div>
  );
};

export const ProductGridSkeleton: React.FC<ProductGridSkeletonProps> = ({ count = 8 }) => {
  return (
    <div 
      className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5 animate-pulse"
      role="status"
      aria-label="Cargando productos..."
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs flex flex-col justify-between"
        >
          <div>
            {/* Image Placeholder */}
            <div className="relative aspect-4/3 bg-stone-200/80 overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
              {/* Badge placeholder */}
              <div className="absolute top-2 right-2 w-14 h-4 bg-stone-300/70 rounded-full" />
            </div>

            {/* Title & SKU Placeholder */}
            <div className="p-2.5 sm:p-3 space-y-2">
              <div className="h-3.5 bg-stone-200 rounded-md w-4/5" />
              <div className="h-3.5 bg-stone-200 rounded-md w-3/5" />
              <div className="h-2.5 bg-stone-150 rounded w-2/5 mt-1" />
            </div>
          </div>

          {/* Price & Button Footer Placeholder */}
          <div className="p-2.5 sm:p-3 pt-0">
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-2.5 bg-stone-150 rounded w-8" />
                <div className="h-5 bg-stone-200 rounded-md w-16" />
              </div>
              <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-stone-200 shrink-0" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

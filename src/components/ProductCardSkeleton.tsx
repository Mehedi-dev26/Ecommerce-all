const ProductCardSkeleton = () => (
  <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
    <div className="relative aspect-square overflow-hidden bg-muted">
      <div className="absolute inset-0 animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-foreground/5 to-transparent" />
    </div>
    <div className="space-y-2 p-2.5 sm:p-3">
      <div className="h-2.5 w-1/3 rounded bg-muted" />
      <div className="h-3 w-3/4 rounded bg-muted" />
      <div className="h-2.5 w-1/4 rounded bg-muted" />
      <div className="flex items-center justify-between pt-1">
        <div className="h-4 w-1/3 rounded bg-muted" />
        <div className="h-7 w-7 rounded bg-muted sm:h-8 sm:w-8" />
      </div>
    </div>
  </div>
);

export default ProductCardSkeleton;
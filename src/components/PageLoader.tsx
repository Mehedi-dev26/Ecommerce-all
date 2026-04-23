import brandLogo from "@/assets/brand-logo.png";

interface PageLoaderProps {
  /** When true, fills the whole viewport (used for initial app boot). Otherwise sits inside the page. */
  fullScreen?: boolean;
  message?: string;
}

const PageLoader = ({ fullScreen = false, message = "লোড হচ্ছে" }: PageLoaderProps) => {
  return (
    <div
      className={
        fullScreen
          ? "fixed inset-0 z-[60] flex flex-col items-center justify-center gap-5 bg-background"
          : "flex min-h-[60vh] flex-col items-center justify-center gap-5"
      }
    >
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-primary/40 ring-2 ring-primary/30 animate-[pulse_1s_ease-in-out_infinite]">
          <img src={brandLogo} alt="Surzo Shop logo" className="h-full w-full object-contain" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-brand text-3xl font-bold text-primary">Surzo Shop</span>
          <span className="mt-1 text-[11px] tracking-widest text-primary/80">সেরা পণ্য, সেরা দামে</span>
        </div>
      </div>

      {/* Animated progress bar */}
      <div className="relative h-1 w-52 overflow-hidden rounded-full bg-primary/15">
        <div className="absolute inset-y-0 -left-1/3 w-1/3 rounded-full bg-gradient-to-r from-primary to-primary/60 animate-[loader-slide_1.1s_ease-in-out_infinite]" />
      </div>

      <p className="text-sm font-medium text-primary/90">
        {message}
        <span className="inline-flex w-5 justify-start">
          <span className="animate-[loader-dot_1.4s_infinite_both]">.</span>
          <span className="animate-[loader-dot_1.4s_infinite_both] [animation-delay:.2s]">.</span>
          <span className="animate-[loader-dot_1.4s_infinite_both] [animation-delay:.4s]">.</span>
        </span>
      </p>
    </div>
  );
};

export default PageLoader;

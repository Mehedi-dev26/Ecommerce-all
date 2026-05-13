import type { SVGProps } from "react";

// Hand-sketched style SVG icons — each one resembles its actual product.
// Stroke-based illustrations (like the original line-icon system) but custom-drawn per category.

type IconProps = SVGProps<SVGSVGElement>;

const baseProps = {
  viewBox: "0 0 64 64",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const MangoIcon = (p: IconProps) => (
  <svg {...baseProps} {...p}>
    <path d="M44 18c6 6 6 18-2 26s-22 8-28 0-4-20 4-26 20-6 26 0z" fill="currentColor" fillOpacity="0.15" />
    <path d="M32 12c2-3 6-4 9-3-1 3-3 5-6 6" />
    <path d="M30 14c-1.5 1-2.5 2.5-3 4" opacity="0.6" />
  </svg>
);

const HoneyIcon = (p: IconProps) => (
  <svg {...baseProps} {...p}>
    {/* honey jar */}
    <path d="M20 24h24v4H20z" />
    <path d="M22 28h20l-2 24H24z" fill="currentColor" fillOpacity="0.15" />
    <path d="M22 28h20l-2 24H24z" />
    <path d="M24 18h16v6H24z" />
    {/* honey dipper drip */}
    <path d="M32 34v6" opacity="0.5" />
    <path d="M28 38h8" opacity="0.5" />
  </svg>
);

const DateIcon = (p: IconProps) => (
  <svg {...baseProps} {...p}>
    {/* date fruit oval cluster */}
    <ellipse cx="24" cy="36" rx="8" ry="12" fill="currentColor" fillOpacity="0.15" />
    <ellipse cx="24" cy="36" rx="8" ry="12" />
    <ellipse cx="38" cy="32" rx="8" ry="12" fill="currentColor" fillOpacity="0.15" />
    <ellipse cx="38" cy="32" rx="8" ry="12" />
    {/* stem */}
    <path d="M30 18c2-4 6-6 10-6" />
    <path d="M30 18l-2-4" opacity="0.6" />
  </svg>
);

const LycheeIcon = (p: IconProps) => (
  <svg {...baseProps} {...p}>
    <circle cx="32" cy="36" r="14" fill="currentColor" fillOpacity="0.15" />
    <circle cx="32" cy="36" r="14" />
    {/* bumpy texture */}
    <circle cx="26" cy="32" r="1.5" />
    <circle cx="34" cy="30" r="1.5" />
    <circle cx="38" cy="38" r="1.5" />
    <circle cx="28" cy="42" r="1.5" />
    <circle cx="34" cy="42" r="1.5" />
    {/* stem leaf */}
    <path d="M32 22V14" />
    <path d="M32 16c3-2 6-1 7 1-2 2-5 2-7 0z" fill="currentColor" fillOpacity="0.2" />
  </svg>
);

const JaggeryIcon = (p: IconProps) => (
  <svg {...baseProps} {...p}>
    {/* jaggery block / round patty */}
    <ellipse cx="32" cy="40" rx="18" ry="6" />
    <path d="M14 24c0-3 8-6 18-6s18 3 18 6v16c0 3-8 6-18 6s-18-3-18-6V24z" fill="currentColor" fillOpacity="0.15" />
    <path d="M14 24c0-3 8-6 18-6s18 3 18 6-8 6-18 6-18-3-18-6z" />
    <path d="M14 32c0 3 8 6 18 6s18-3 18-6" opacity="0.5" />
  </svg>
);

const RiceIcon = (p: IconProps) => (
  <svg {...baseProps} {...p}>
    {/* rice grains in bowl */}
    <path d="M12 36c0 8 9 14 20 14s20-6 20-14H12z" fill="currentColor" fillOpacity="0.15" />
    <path d="M12 36c0 8 9 14 20 14s20-6 20-14" />
    <path d="M10 36h44" />
    <ellipse cx="24" cy="28" rx="2" ry="4" transform="rotate(-20 24 28)" />
    <ellipse cx="32" cy="22" rx="2" ry="4" />
    <ellipse cx="40" cy="28" rx="2" ry="4" transform="rotate(20 40 28)" />
  </svg>
);

const VegetableIcon = (p: IconProps) => (
  <svg {...baseProps} {...p}>
    {/* leafy green */}
    <path d="M32 50c-8 0-14-6-14-14 0-2 1-4 2-5-2-1-3-3-3-5 3 0 6 1 8 3 1-3 4-5 7-5s6 2 7 5c2-2 5-3 8-3 0 2-1 4-3 5 1 1 2 3 2 5 0 8-6 14-14 14z" fill="currentColor" fillOpacity="0.15" />
    <path d="M32 50c-8 0-14-6-14-14 0-2 1-4 2-5-2-1-3-3-3-5 3 0 6 1 8 3 1-3 4-5 7-5s6 2 7 5c2-2 5-3 8-3 0 2-1 4-3 5 1 1 2 3 2 5 0 8-6 14-14 14z" />
    <path d="M32 24v26" opacity="0.5" />
  </svg>
);

const NutIcon = (p: IconProps) => (
  <svg {...baseProps} {...p}>
    {/* almond / cashew */}
    <path d="M22 14c8-4 18 0 20 10s-4 22-12 26-18-4-18-14 2-18 10-22z" fill="currentColor" fillOpacity="0.15" />
    <path d="M22 14c8-4 18 0 20 10s-4 22-12 26-18-4-18-14 2-18 10-22z" />
    <path d="M26 22c6 6 8 14 6 22" opacity="0.5" />
  </svg>
);

const OilIcon = (p: IconProps) => (
  <svg {...baseProps} {...p}>
    {/* oil bottle */}
    <path d="M28 10h8v6l4 4v28a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4V20l4-4z" fill="currentColor" fillOpacity="0.15" />
    <path d="M28 10h8v6l4 4v28a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4V20l4-4z" />
    <path d="M24 32h16" />
  </svg>
);

const SpiceIcon = (p: IconProps) => (
  <svg {...baseProps} {...p}>
    {/* chili */}
    <path d="M44 14c-2 4-2 8 0 12-8 0-22 6-26 22 14-2 28-12 30-22 0-4-2-10-4-12z" fill="currentColor" fillOpacity="0.15" />
    <path d="M44 14c-2 4-2 8 0 12-8 0-22 6-26 22 14-2 28-12 30-22 0-4-2-10-4-12z" />
  </svg>
);

const FishIcon = (p: IconProps) => (
  <svg {...baseProps} {...p}>
    <path d="M8 32c8-12 22-14 32-10l8-6v32l-8-6c-10 4-24 2-32-10z" fill="currentColor" fillOpacity="0.15" />
    <path d="M8 32c8-12 22-14 32-10l8-6v32l-8-6c-10 4-24 2-32-10z" />
    <circle cx="36" cy="28" r="1.5" fill="currentColor" />
  </svg>
);

const MeatIcon = (p: IconProps) => (
  <svg {...baseProps} {...p}>
    <path d="M16 28c0-8 6-14 14-14s14 6 14 14l6 4-4 4 2 6-6-2-4 4-4-6c-8 0-18-4-18-10z" fill="currentColor" fillOpacity="0.15" />
    <path d="M16 28c0-8 6-14 14-14s14 6 14 14l6 4-4 4 2 6-6-2-4 4-4-6c-8 0-18-4-18-10z" />
    <circle cx="26" cy="28" r="3" fill="currentColor" fillOpacity="0.3" />
  </svg>
);

const DefaultIcon = (p: IconProps) => (
  <svg {...baseProps} {...p}>
    <path d="M14 22h36l-4 26H18z" fill="currentColor" fillOpacity="0.15" />
    <path d="M14 22h36l-4 26H18z" />
    <path d="M22 22a10 10 0 0 1 20 0" />
  </svg>
);

const map: { keys: string[]; Icon: (p: IconProps) => JSX.Element; tone: string }[] = [
  { keys: ["মধু", "honey"], Icon: HoneyIcon, tone: "from-amber-300 to-yellow-500 text-amber-700" },
  { keys: ["খেজুর", "date"], Icon: DateIcon, tone: "from-amber-700 to-yellow-800 text-amber-900" },
  { keys: ["আম", "mango"], Icon: MangoIcon, tone: "from-orange-300 to-yellow-400 text-orange-700" },
  { keys: ["লিচু", "lychee"], Icon: LycheeIcon, tone: "from-rose-400 to-red-500 text-rose-700" },
  { keys: ["গুড়", "jaggery"], Icon: JaggeryIcon, tone: "from-amber-500 to-orange-700 text-amber-800" },
  { keys: ["চাল", "rice", "ধান"], Icon: RiceIcon, tone: "from-yellow-400 to-amber-500 text-amber-700" },
  { keys: ["সবজি", "vegetable", "শাক"], Icon: VegetableIcon, tone: "from-green-400 to-emerald-600 text-green-700" },
  { keys: ["বাদাম", "nut", "কাজু"], Icon: NutIcon, tone: "from-amber-400 to-orange-500 text-amber-800" },
  { keys: ["মাছ", "fish"], Icon: FishIcon, tone: "from-sky-400 to-blue-600 text-sky-700" },
  { keys: ["মাংস", "meat"], Icon: MeatIcon, tone: "from-rose-500 to-red-700 text-rose-700" },
  { keys: ["তেল", "oil", "ঘি"], Icon: OilIcon, tone: "from-yellow-300 to-amber-500 text-amber-700" },
  { keys: ["মসলা", "spice", "মরিচ"], Icon: SpiceIcon, tone: "from-red-400 to-orange-600 text-red-700" },
];

export function getCategoryIcon(name?: string | null, name_bn?: string | null) {
  const hay = `${name ?? ""} ${name_bn ?? ""}`.toLowerCase();
  const found = map.find((m) => m.keys.some((k) => hay.includes(k.toLowerCase())));
  return found ?? { Icon: DefaultIcon, tone: "from-primary/20 to-accent/20 text-primary" };
}

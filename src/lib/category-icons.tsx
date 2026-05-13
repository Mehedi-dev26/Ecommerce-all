import { Apple, Citrus, Cherry, Grape, Cookie, Sprout, Leaf, Droplets, Palmtree, Wheat, type LucideIcon } from "lucide-react";

const map: { keys: string[]; icon: LucideIcon; tone: string }[] = [
  { keys: ["মধু", "honey"], icon: Droplets, tone: "from-amber-400 to-yellow-500" },
  { keys: ["খেজুর", "date"], icon: Palmtree, tone: "from-amber-700 to-yellow-700" },
  { keys: ["আম", "mango"], icon: Apple, tone: "from-orange-400 to-yellow-500" },
  { keys: ["লিচু", "lychee"], icon: Cherry, tone: "from-rose-500 to-red-500" },
  { keys: ["গুড়", "jaggery"], icon: Cookie, tone: "from-amber-600 to-orange-700" },
  { keys: ["আঙুর", "grape"], icon: Grape, tone: "from-purple-500 to-violet-600" },
  { keys: ["কমলা", "orange", "লেবু", "lemon"], icon: Citrus, tone: "from-orange-400 to-amber-500" },
  { keys: ["চাল", "rice", "ধান"], icon: Wheat, tone: "from-yellow-500 to-amber-600" },
  { keys: ["সবজি", "vegetable", "শাক"], icon: Sprout, tone: "from-green-500 to-emerald-600" },
];

export function getCategoryIcon(name?: string | null, name_bn?: string | null) {
  const hay = `${name ?? ""} ${name_bn ?? ""}`.toLowerCase();
  const found = map.find((m) => m.keys.some((k) => hay.includes(k.toLowerCase())));
  return found ?? { icon: Leaf, tone: "from-primary to-accent" };
}

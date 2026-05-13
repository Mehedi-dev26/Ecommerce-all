// Real, eye-catchy food emoji per category — far more recognizable than abstract line icons.
const map: { keys: string[]; emoji: string; tone: string }[] = [
  { keys: ["মধু", "honey"], emoji: "🍯", tone: "from-amber-300 to-yellow-500" },
  { keys: ["খেজুর", "date"], emoji: "🌰", tone: "from-amber-700 to-yellow-800" },
  { keys: ["আম", "mango"], emoji: "🥭", tone: "from-orange-400 to-yellow-500" },
  { keys: ["লিচু", "lychee"], emoji: "🍒", tone: "from-rose-500 to-red-600" },
  { keys: ["গুড়", "jaggery"], emoji: "🍮", tone: "from-amber-600 to-orange-700" },
  { keys: ["আঙুর", "grape"], emoji: "🍇", tone: "from-purple-500 to-violet-600" },
  { keys: ["কমলা", "orange"], emoji: "🍊", tone: "from-orange-400 to-amber-500" },
  { keys: ["লেবু", "lemon"], emoji: "🍋", tone: "from-yellow-300 to-yellow-500" },
  { keys: ["চাল", "rice", "ধান"], emoji: "🌾", tone: "from-yellow-500 to-amber-600" },
  { keys: ["সবজি", "vegetable", "শাক"], emoji: "🥬", tone: "from-green-500 to-emerald-600" },
  { keys: ["বাদাম", "nut", "কাজু"], emoji: "🥜", tone: "from-amber-500 to-orange-600" },
  { keys: ["মাছ", "fish"], emoji: "🐟", tone: "from-sky-500 to-blue-600" },
  { keys: ["মাংস", "meat"], emoji: "🍖", tone: "from-rose-600 to-red-700" },
  { keys: ["তেল", "oil", "ঘি"], emoji: "🫙", tone: "from-yellow-400 to-amber-500" },
  { keys: ["মসলা", "spice"], emoji: "🌶️", tone: "from-red-500 to-orange-600" },
];

export function getCategoryIcon(name?: string | null, name_bn?: string | null) {
  const hay = `${name ?? ""} ${name_bn ?? ""}`.toLowerCase();
  const found = map.find((m) => m.keys.some((k) => hay.includes(k.toLowerCase())));
  return found ?? { emoji: "🛒", tone: "from-primary to-accent" };
}

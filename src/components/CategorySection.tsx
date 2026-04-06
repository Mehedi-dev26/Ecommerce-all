import { Link } from "react-router-dom";

const mangoCategories = [
  { name: "Langra", name_bn: "ল্যাংড়া", emoji: "🥭", color: "from-yellow-400/20 to-yellow-500/10" },
  { name: "Himsagar", name_bn: "হিমসাগর", emoji: "🍈", color: "from-green-400/20 to-green-500/10" },
  { name: "Gopalbhog", name_bn: "গোপালভোগ", emoji: "🥭", color: "from-amber-400/20 to-amber-500/10" },
  { name: "Amrapali", name_bn: "আম্রপালি", emoji: "🍊", color: "from-orange-400/20 to-orange-500/10" },
  { name: "Fazli", name_bn: "ফজলি", emoji: "🥭", color: "from-lime-400/20 to-lime-500/10" },
  { name: "Khirsapat", name_bn: "ক্ষীরশাপাত", emoji: "🍋", color: "from-yellow-300/20 to-yellow-400/10" },
];

const CategorySection = () => {
  return (
    <section className="py-8 sm:py-14">
      <div className="container mx-auto px-4">
        <div className="mb-5 text-center sm:mb-8">
          <h2 className="mb-1 text-lg font-bold text-foreground sm:text-2xl">🥭 আমের জাত সমূহ</h2>
          <p className="text-xs text-muted-foreground sm:text-sm">পছন্দের জাত থেকে আম বেছে নিন</p>
        </div>

        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-2.5 sm:grid-cols-6 sm:gap-4">
          {mangoCategories.map((cat) => (
            <Link
              key={cat.name}
              to={`/products?category=${cat.name}`}
              className="group flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md sm:gap-3 sm:p-4"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${cat.color} transition-transform duration-200 group-hover:scale-110 sm:h-16 sm:w-16`}>
                <span className="text-2xl sm:text-3xl">{cat.emoji}</span>
              </div>
              <span className="text-center text-[11px] font-semibold leading-tight text-foreground sm:text-sm">
                {cat.name_bn}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;

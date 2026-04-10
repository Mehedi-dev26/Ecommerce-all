import { Link } from "react-router-dom";
import mangoLangra from "@/assets/mango-langra.jpg";
import mangoHimsagar from "@/assets/mango-himsagar.jpg";
import mangoGopalbhog from "@/assets/mango-gopalbhog.jpg";
import mangoAmrapali from "@/assets/mango-amrapali.jpg";
import mangoFazli from "@/assets/mango-fazli.jpg";
import mangoKhirsapat from "@/assets/mango-khirsapat.jpg";

const mangoCategories = [
  { name: "Langra", name_bn: "ল্যাংড়া", image: mangoLangra },
  { name: "Himsagar", name_bn: "হিমসাগর", image: mangoHimsagar },
  { name: "Gopalbhog", name_bn: "গোপালভোগ", image: mangoGopalbhog },
  { name: "Amrapali", name_bn: "আম্রপালি", image: mangoAmrapali },
  { name: "Fazli", name_bn: "ফজলি", image: mangoFazli },
  { name: "Khirsapat", name_bn: "ক্ষীরশাপাত", image: mangoKhirsapat },
];

const CategorySection = () => {
  return (
    <section className="py-8 sm:py-14">
      <div className="container mx-auto px-4">
        <div className="mb-5 text-center sm:mb-8">
          <h2 className="mb-1 text-lg font-bold text-foreground sm:text-2xl">আমের জাত সমূহ</h2>
          <p className="text-xs text-muted-foreground sm:text-sm">পছন্দের জাত থেকে আম বেছে নিন</p>
        </div>

        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-2.5 sm:grid-cols-6 sm:gap-4">
          {mangoCategories.map((cat) => (
            <Link
              key={cat.name}
              to={`/products?category=${cat.name}`}
              className="group flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-2.5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md sm:gap-3 sm:p-4"
            >
              <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-primary/20 transition-transform duration-200 group-hover:scale-110 sm:h-18 sm:w-18">
                <img
                  src={cat.image}
                  alt={cat.name_bn}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                  width={512}
                  height={512}
                  sizes="(max-width: 640px) 20vw, 72px"
                />
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

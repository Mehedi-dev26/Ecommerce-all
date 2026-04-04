import mawraBanner from "@/assets/mawra-banner.jpg";

const HeroSection = () => {
  return (
    <section className="w-full">
      <img
        src={mawraBanner}
        alt="MAWRA Banner"
        className="w-full object-contain"
      />
    </section>
  );
};

export default HeroSection;

import { PageMeta } from "@/components/page/PageMeta";
import {
  CompaniesSection,
  CtaSection,
  HeroSection,
  MethodologySection,
  ServicesSection,
} from "@/components/landing";
import { ROUTES } from "@/constants/routes";
import { getSeo } from "@/constants/seo";

const Home = () => {
  const seo = getSeo(ROUTES.home);

  return (
    <>
      <PageMeta title={seo.title} description={seo.description} />
      <HeroSection />
      <CompaniesSection />
      <ServicesSection />
      <MethodologySection />
      <CtaSection />
    </>
  );
};

export default Home;

import { PageMeta } from "@/components/common/PageMeta";
import {
  CompaniesSection,
  CtaSection,
  HeroSection,
  MethodologySection,
  ServicesSection,
} from "@/components/landing";
import { homeSeo } from "@/constants/landing";

const Home = () => {
  return (
    <>
      <PageMeta title={homeSeo.title} description={homeSeo.description} />
      <HeroSection />
      <CompaniesSection />
      <ServicesSection />
      <MethodologySection />
      <CtaSection />
    </>
  );
};

export default Home;

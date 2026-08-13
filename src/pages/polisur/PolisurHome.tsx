import { PageMeta } from "@/components/page/PageMeta";
import { PolisurHero } from "@/components/polisur/PolisurHero";
import { PolisurAbout } from "@/components/polisur/PolisurAbout";
import { PolisurDivisions } from "@/components/polisur/PolisurDivisions";
import { PolisurCanina } from "@/components/polisur/PolisurCanina";
import { PolisurPreinscriptionCTA } from "@/components/polisur/PolisurPreinscriptionCTA";
import { PolisurCitizenSection } from "@/components/polisur/PolisurCitizenSection";

export default function PolisurHome() {
  return (
    <>
      <PageMeta
        title="POLISUR — Portal institucional"
        description="Portal institucional de POLISUR: seguridad, prevención y servicio ciudadano."
      />
      <PolisurHero />
      <PolisurAbout />
      <PolisurDivisions />
      <PolisurCanina />
      <PolisurPreinscriptionCTA />
      <PolisurCitizenSection />
    </>
  );
}

import { PageMeta } from "@/components/page/PageMeta";
import { PolisurHero } from "@/components/polisur/PolisurHero";
import { PolisurAbout } from "@/components/polisur/PolisurAbout";
import { PolisurDivisions } from "@/components/polisur/PolisurDivisions";
import { PolisurCitizenSection } from "@/components/polisur/PolisurCitizenSection";
import { PolisurNewsSection } from "@/components/polisur/PolisurNewsSection";
import { PolisurPreinscriptionCTA } from "@/components/polisur/PolisurPreinscriptionCTA";

export default function PolisurHome() {
  return (
    <>
      <PageMeta
        title="POLISUR — Portal institucional"
        description="Portal institucional de POLISUR: seguridad ciudadana, prevención y servicio público."
      />
      <PolisurHero />
      <PolisurAbout />
      <PolisurDivisions />
      <PolisurCitizenSection />
      <PolisurNewsSection />
      <PolisurPreinscriptionCTA />
    </>
  );
}

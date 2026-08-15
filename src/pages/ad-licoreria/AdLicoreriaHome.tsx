import { AdPublicHomeView } from "@/components/ad-licoreria/AdPublicHomeView";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

/** Home público — consume únicamente el diseño PUBLICADO. */
export default function AdLicoreriaHome() {
  const { siteDesign, products, presentations, categories } = useAdLicoreria();

  return (
    <AdPublicHomeView
      design={siteDesign}
      products={products}
      presentations={presentations}
      categories={categories}
    />
  );
}

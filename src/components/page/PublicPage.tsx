import type { ReactNode } from "react";
import { PageHero } from "@/components/page/PageHero";
import { PageMeta } from "@/components/page/PageMeta";
import { PageContainer } from "@/components/page/PageContainer";
import type { PageSeo } from "@/types/seo";

type PublicPageProps = {
  seo: PageSeo;
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
  contained?: boolean;
};

function PublicPage({
  seo,
  eyebrow,
  title,
  description,
  children,
  contained = true,
}: PublicPageProps) {
  return (
    <>
      <PageMeta title={seo.title} description={seo.description} />
      <PageHero eyebrow={eyebrow} title={title} description={description} />
      {children ? (
        contained ? <PageContainer>{children}</PageContainer> : children
      ) : null}
    </>
  );
}

export { PublicPage };
export type { PublicPageProps };

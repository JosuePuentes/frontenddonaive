export type CmsContentStatus = "draft" | "published" | "archived";

export type CmsContentItem = {
  id: string;
  title: string;
  slug: string;
  status: CmsContentStatus;
  updatedAt: string;
};

export type ContentBlock = {
  id: string;
  title: string;
  description: string;
};

export type ContentCategory = {
  id: string;
  title: string;
  description: string;
  items: string[];
};

export type ContentStep = {
  id: string;
  number: string;
  title: string;
  description: string;
};

export type ContentPillar = {
  id: string;
  label: string;
};

export type ContactFormField = {
  id: string;
  label: string;
  type: "text" | "email" | "tel" | "select" | "textarea";
  placeholder?: string;
  options?: string[];
  required?: boolean;
};

export type PageContent = {
  eyebrow?: string;
  title: string;
  description: string;
  blocks?: ContentBlock[];
  categories?: ContentCategory[];
  steps?: ContentStep[];
  pillars?: ContentPillar[];
  notes?: string[];
};

export type ContactContent = PageContent & {
  supportingTitle: string;
  supportingDescription: string;
  formIntro: string;
  formNote: string;
  ctaLabel: string;
  closingMessage: string;
  fields: ContactFormField[];
};

export type LegalContent = {
  title: string;
  description: string;
  sections: Array<{
    id: string;
    title: string;
    paragraphs: string[];
  }>;
};

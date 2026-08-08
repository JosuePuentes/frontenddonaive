export type ContentBlock = {
  id: string;
  title: string;
  description: string;
};

export type PageContent = {
  eyebrow?: string;
  title: string;
  description: string;
  blocks?: ContentBlock[];
  notes?: string[];
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

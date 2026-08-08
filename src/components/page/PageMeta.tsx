import { useEffect } from "react";

type PageMetaProps = {
  title: string;
  description: string;
};

function PageMeta({ title, description }: PageMetaProps) {
  useEffect(() => {
    document.title = title;

    let descriptionTag = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );

    if (!descriptionTag) {
      descriptionTag = document.createElement("meta");
      descriptionTag.name = "description";
      document.head.appendChild(descriptionTag);
    }

    descriptionTag.content = description;
  }, [title, description]);

  return null;
}

export { PageMeta };
export type { PageMetaProps };

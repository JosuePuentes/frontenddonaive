import { Badge } from "@/components/ui/Badge";
import type { ServiceCategoryKey } from "@/types/services";
import { SERVICE_CATEGORY_LABELS } from "@/types/services";

type ServiceCategoryBadgeProps = {
  category: ServiceCategoryKey | string;
};

function ServiceCategoryBadge({ category }: ServiceCategoryBadgeProps) {
  const label =
    category in SERVICE_CATEGORY_LABELS
      ? SERVICE_CATEGORY_LABELS[category as ServiceCategoryKey]
      : category;

  return <Badge variant="outline">{label}</Badge>;
}

export { ServiceCategoryBadge };
export type { ServiceCategoryBadgeProps };

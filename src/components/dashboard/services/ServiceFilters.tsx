import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import {
  SERVICE_CATEGORY_KEYS,
  SERVICE_CATEGORY_LABELS,
  type ServiceCategoryKey,
} from "@/types/services";

type ServiceFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  category: ServiceCategoryKey | "all";
  onCategoryChange: (value: ServiceCategoryKey | "all") => void;
  activeOnly: boolean;
  onActiveOnlyChange: (value: boolean) => void;
  className?: string;
};

function ServiceFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  activeOnly,
  onActiveOnlyChange,
  className,
}: ServiceFiltersProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar servicio..."
          aria-label="Buscar servicio"
          className="sm:max-w-sm"
        />
        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(event) => onActiveOnlyChange(event.target.checked)}
            className="size-4 rounded border-border"
          />
          Solo activos
        </label>
      </div>

      <div className="flex flex-wrap gap-2" role="list" aria-label="Categorías">
        <button type="button" onClick={() => onCategoryChange("all")}>
          <Badge
            variant={category === "all" ? "electric" : "outline"}
            className="cursor-pointer"
          >
            Todas
          </Badge>
        </button>
        {SERVICE_CATEGORY_KEYS.map((key) => (
          <button key={key} type="button" onClick={() => onCategoryChange(key)}>
            <Badge
              variant={category === key ? "electric" : "outline"}
              className="cursor-pointer"
            >
              {SERVICE_CATEGORY_LABELS[key]}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}

export { ServiceFilters };
export type { ServiceFiltersProps };

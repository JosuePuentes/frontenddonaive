import { cn } from "@/lib/utils";

type DataTableColumn = {
  key: string;
  label: string;
};

type DataTableProps = {
  columns: DataTableColumn[];
  rows?: Array<Record<string, string>>;
  emptyMessage?: string;
  className?: string;
};

function DataTable({
  columns,
  rows = [],
  emptyMessage = "Sin registros por ahora.",
  className,
}: DataTableProps) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-[var(--radius-lg)] border border-border",
        className,
      )}
    >
      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface-muted/70">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 font-medium text-muted-foreground"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={index} className="border-t border-border">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-foreground">
                    {row[column.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export { DataTable };
export type { DataTableColumn, DataTableProps };

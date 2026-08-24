type BarItem = {
  label: string;
  value: number;
  secondary?: string;
};

type Props = {
  title?: string;
  items: BarItem[];
  formatValue?: (n: number) => string;
  maxBars?: number;
  emptyText?: string;
};

/** Gráfica de barras simple (CSS) — sin dependencias. */
export function DsBarChart({
  title,
  items,
  formatValue = (n) => n.toFixed(0),
  maxBars = 12,
  emptyText = "Sin datos en el período",
}: Props) {
  const data = items.slice(0, maxBars);
  const max = Math.max(...data.map((d) => d.value), 0.0001);

  if (data.length === 0) {
    return (
      <div className="ds-chart">
        {title ? <h3 className="ds-chart__title">{title}</h3> : null}
        <p className="ds-muted" style={{ margin: 0, fontSize: "0.85rem" }}>
          {emptyText}
        </p>
      </div>
    );
  }

  return (
    <div className="ds-chart">
      {title ? <h3 className="ds-chart__title">{title}</h3> : null}
      <div className="ds-chart__bars">
        {data.map((item) => {
          const pct = Math.max(4, (item.value / max) * 100);
          return (
            <div key={item.label} className="ds-chart__row">
              <div className="ds-chart__label" title={item.label}>
                {item.label}
              </div>
              <div className="ds-chart__track">
                <div
                  className="ds-chart__fill"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="ds-chart__value">
                {formatValue(item.value)}
                {item.secondary ? (
                  <span className="ds-muted"> · {item.secondary}</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

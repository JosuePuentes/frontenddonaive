import type { AdPrice } from "@/types/ad-licoreria";

type Props = {
  price: AdPrice;
  /** En POS: USD arriba, Bs abajo. Si false, una sola línea. */
  stacked?: boolean;
  className?: string;
};

/** Precio de venta: siempre USD (BCV) visible; Bs debajo en modo apilado. */
export function AdPriceDisplay({ price, stacked = false, className = "" }: Props) {
  if (stacked) {
    return (
      <span className={`ad-price-stack ${className}`.trim()}>
        <span className="ad-price-stack__usd">${price.usd.toFixed(2)}</span>
        <span className="ad-price-stack__bs">
          Bs{" "}
          {price.bs.toLocaleString("es-VE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </span>
    );
  }
  return (
    <span className={className}>
      ${price.usd.toFixed(2)} · Bs{" "}
      {price.bs.toLocaleString("es-VE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </span>
  );
}

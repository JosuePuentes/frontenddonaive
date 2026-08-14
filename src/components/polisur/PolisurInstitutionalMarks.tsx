import { POLISUR_MEDIA } from "@/content/polisur";
import { PolisurMark } from "@/components/polisur/PolisurMark";

const INSTITUTIONAL_MARKS = [
  {
    src: POLISUR_MEDIA.justiciaPaz,
    alt: "Justicia y Paz",
  },
  {
    src: POLISUR_MEDIA.cuadrantesPaz,
    alt: "Gran Misión Cuadrantes de Paz",
  },
  {
    src: POLISUR_MEDIA.visipol,
    alt: "VISIPOL",
  },
  {
    src: POLISUR_MEDIA.logo,
    alt: "Escudo Policía Municipio San Francisco",
  },
] as const;

type PolisurInstitutionalMarksProps = {
  size?: "sm" | "md";
};

/**
 * Orden institucional: Justicia y Paz → Cuadrantes de Paz → VISIPOL → Escudo.
 * El emblema K-9 no va aquí; pertenece a Unidad Canina.
 */
function PolisurInstitutionalMarks({
  size = "sm",
}: PolisurInstitutionalMarksProps) {
  const box = size === "md" ? "h-11 w-11 sm:h-14 sm:w-14" : "h-9 w-9 sm:h-10 sm:w-10";

  return (
    <ul className="ps-mark-list flex flex-wrap items-center gap-3 sm:gap-5">
      {INSTITUTIONAL_MARKS.map((mark) => (
        <li key={mark.src} className={box}>
          <PolisurMark
            src={mark.src}
            alt={mark.alt}
            className="h-full w-full bg-transparent"
          />
        </li>
      ))}
    </ul>
  );
}

export { PolisurInstitutionalMarks, INSTITUTIONAL_MARKS };

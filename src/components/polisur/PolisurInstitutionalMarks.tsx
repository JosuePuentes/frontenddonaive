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
  const box = size === "md" ? "h-10 w-10 sm:h-12 sm:w-12" : "h-8 w-8 sm:h-9 sm:w-9";

  return (
    <ul className="flex flex-wrap items-center gap-3 sm:gap-4">
      {INSTITUTIONAL_MARKS.map((mark) => (
        <li key={mark.src} className={box}>
          <PolisurMark
            src={mark.src}
            alt={mark.alt}
            className="h-full w-full"
          />
        </li>
      ))}
    </ul>
  );
}

export { PolisurInstitutionalMarks, INSTITUTIONAL_MARKS };

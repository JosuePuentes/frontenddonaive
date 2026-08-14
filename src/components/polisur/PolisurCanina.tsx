import { useState } from "react";
import { Link } from "react-router";
import { POLISUR_ROUTES } from "@/constants/polisur-routes";
import { POLISUR_MEDIA, polisurCopy } from "@/content/polisur";

/**
 * Sección protagonista: binomio (PNG transparente) sobre composición azul marino.
 * No alterar rostros, uniformes ni el canino. Respetar fondo transparente.
 */
function PolisurCanina() {
  const [binomioFailed, setBinomioFailed] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);

  return (
    <section
      id="unidad-canina-home"
      className="ps-canina-stage border-b border-[var(--ps-line)]"
      aria-labelledby="polisur-canina-title"
    >
      <div className="grid lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
        <div className="relative z-[1] flex items-center px-5 py-14 sm:px-10 sm:py-16 lg:px-14 lg:py-20">
          <div className="max-w-md">
            <p className="ps-eyebrow text-[var(--ps-mint)]">
              {polisurCopy.canina.eyebrow}
            </p>
            <h2
              id="polisur-canina-title"
              className="mt-4 text-4xl uppercase leading-[1.05] tracking-wide text-[var(--ps-white)] sm:text-5xl"
            >
              {polisurCopy.canina.title}
            </h2>
            <hr className="ps-gold-rule mt-6" />
            <p className="mt-6 text-[0.95rem] leading-relaxed text-[var(--ps-steel-300)] sm:text-base">
              {polisurCopy.canina.body}
            </p>
            <Link
              to={POLISUR_ROUTES.unidadCanina}
              className="ps-btn ps-btn-gold mt-9"
            >
              {polisurCopy.canina.cta}
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="ps-canina-stage__crest" aria-hidden>
            <img
              src={POLISUR_MEDIA.k9}
              alt=""
              className="h-16 w-16 object-contain opacity-90 sm:h-20 sm:w-20"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>

          <div className="ps-canina-stage__frame">
            {!binomioFailed ? (
              <img
                src={POLISUR_MEDIA.unidadCanina.binomio}
                alt="Unidad Canina: funcionarios y canino de POLISUR"
                className="ps-canina-binomio"
                onError={() => setBinomioFailed(true)}
                loading="lazy"
                decoding="async"
              />
            ) : !sceneFailed ? (
              <img
                src={POLISUR_MEDIA.home.canina}
                alt="Unidad Canina de POLISUR"
                className="h-full min-h-[18rem] w-full object-cover object-[center_35%] sm:min-h-[24rem]"
                onError={() => setSceneFailed(true)}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div
                aria-hidden
                className="h-[18rem] w-full sm:h-[24rem] lg:h-[30rem]"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export { PolisurCanina };

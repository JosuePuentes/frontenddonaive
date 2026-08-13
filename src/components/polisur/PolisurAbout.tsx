function PolisurAbout() {
  return (
    <section
      id="institucion"
      className="scroll-mt-20 border-t border-[var(--polisur-line)] bg-[var(--polisur-navy)]"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--polisur-gold)]">
            Institución
          </p>
          <h2 className="mt-3 text-3xl text-[var(--polisur-white)] sm:text-4xl">
            Al servicio de nuestra comunidad
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[var(--polisur-mist)]/88 sm:text-lg">
            {/* PLACEHOLDER — texto institucional oficial pendiente de validación */}
            PLACEHOLDER: POLISUR trabaja con vocación de servicio público,
            priorizando la prevención, el respeto al ciudadano y la presencia
            institucional responsable. El contenido histórico y normativo
            oficial se incorporará cuando sea proporcionado por la institución.
          </p>
        </div>
      </div>
    </section>
  );
}

export { PolisurAbout };

function PolisurCitizenSection() {
  return (
    <section className="border-t border-[var(--polisur-line)] bg-[var(--polisur-ink)]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--polisur-gold)]">
            Ciudadanía
          </p>
          <h2 className="mt-3 text-3xl text-[var(--polisur-white)] sm:text-4xl">
            Cercanía que genera confianza
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[var(--polisur-mist)]/85">
            Trabajamos con enfoque de servicio, prevención y seguridad, buscando
            una relación cercana y respetuosa con la ciudadanía. La atención
            institucional se orienta a proteger, orientar y acompañar a la
            comunidad.
          </p>
        </div>

        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {["Servicio", "Prevención", "Seguridad", "Cercanía"].map((item) => (
            <li
              key={item}
              className="border border-[var(--polisur-line)] bg-[var(--polisur-slate)]/30 px-4 py-5 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--polisur-mist)]"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export { PolisurCitizenSection };

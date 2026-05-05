import { useEffect } from "react";

const AVIASALES_WIDGET_BASE = "https://tpemb.com/content";
const AVIASALES_CALENDAR_BASE = "https://tpemb.com/content";

function buildWidgetSrc() {
  const params = new URLSearchParams({
    currency: "usd",
    trs: "525471",
    shmarker: "725078",
    show_hotels: "false",
    powered_by: "true",
    locale: "en",
    searchUrl: "www.aviasales.com/search",
    primary_override: "#32a8dd",
    color_button: "#32a8dd",
    color_icons: "#32a8dd",
    dark: "#262626",
    light: "#FFFFFF",
    secondary: "#FFFFFF",
    special: "#C4C4C4",
    color_focused: "#32a8dd",
    border_radius: "0",
    plain: "false",
    promo_id: "7879",
    campaign_id: "100",
    one_way: "true",
    target: "_blank",
  });

  return `${AVIASALES_WIDGET_BASE}?${params.toString()}`;
}

function buildCalendarWidgetSrc() {
  const params = new URLSearchParams({
    currency: "usd",
    trs: "525471",
    shmarker: "725078",
    searchUrl: "www.aviasales.com/search",
    locale: "en",
    powered_by: "true",
    one_way: "true",
    only_direct: "false",
    period: "year",
    range: "7,14",
    primary: "#32a8dd",
    color_background: "#ffffff",
    dark: "#262626",
    light: "#FFFFFF",
    achieve: "#45AD35",
    promo_id: "4041",
    campaign_id: "100",
    show_hotels: "false",
    target: "_blank",
  });

  return `${AVIASALES_CALENDAR_BASE}?${params.toString()}`;
}

export default function SpiritRescuePage() {
  useEffect(() => {
    const container = document.getElementById("widget-container");
    if (!container) return;

    const existingScript = container.querySelector("script[data-aviasales-widget='true']");
    if (existingScript) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = buildWidgetSrc();
    script.charset = "utf-8";
    script.setAttribute("data-aviasales-widget", "true");

    container.innerHTML = "";
    container.appendChild(script);

    return () => {
      if (container.contains(script)) {
        container.removeChild(script);
      }
      container.innerHTML = "";
    };
  }, []);

  useEffect(() => {
    const container = document.getElementById("pricing-calendar-container");
    if (!container) return;

    const existingScript = container.querySelector("script[data-aviasales-pricing-calendar='true']");
    if (existingScript) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = buildCalendarWidgetSrc();
    script.charset = "utf-8";
    script.setAttribute("data-aviasales-pricing-calendar", "true");

    container.innerHTML = "";
    container.appendChild(script);

    return () => {
      if (container.contains(script)) {
        container.removeChild(script);
      }
      container.innerHTML = "";
    };
  }, []);

  return (
    <div className="min-h-dvh bg-white text-neutral-900 antialiased">
      <header className="border-b border-neutral-200/80 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Rescue Center
          </span>
          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600">
            US Domestic
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:px-8 lg:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-neutral-950 sm:text-4xl lg:text-5xl">
            Spirit Airlines Closure: Immediate Flight Rescue Center
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-neutral-600 sm:text-lg">
            We help you surface <span className="font-medium text-neutral-800">Rescue Fares</span>{" "}
            from carriers like Frontier, JetBlue, and Avelo—fast options when your plans need a
            backup.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-2xl sm:mt-12">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-1 shadow-sm ring-1 ring-black/[0.04] sm:p-2">
            <div className="rounded-xl bg-white px-4 py-8 shadow-[0_1px_0_0_rgba(0,0,0,0.04)] sm:px-6 sm:py-10">
              <p className="mb-4 text-center text-sm font-medium text-neutral-500">
                Search rescue fares
              </p>
              <p className="mx-auto mb-4 max-w-md text-center text-xs text-neutral-500">
                One-way rescue search focused on Florida and Texas traffic. You can edit origin
                easily (FLL, MCO, MIA, IAH, DFW, AUS).
              </p>
              <div
                id="travelpayouts-search-widget"
                className="mx-auto w-full max-w-xl rounded-lg border border-dashed border-neutral-200 bg-neutral-50/50 p-3 text-center sm:p-4"
              >
                <div
                  id="widget-container"
                  className="mx-auto flex min-h-[280px] w-full max-w-lg items-center justify-center rounded-md bg-white sm:min-h-[320px]"
                >
                <p className="max-w-xs px-4 text-sm text-neutral-500">
                  Your Travelpayouts widget will load here once the script initializes.
                </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section
          className="mx-auto mt-14 max-w-3xl border-t border-neutral-200 pt-10 sm:mt-16"
          aria-label="Trust signals"
        >
          <div className="mx-auto mb-10 max-w-2xl">
            <p className="mb-3 text-center text-sm font-semibold text-neutral-700">
              Explora las fechas más económicas del mes
            </p>
            <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm sm:p-4">
              <div
                id="pricing-calendar-container"
                className="mx-auto flex min-h-[280px] w-full items-center justify-center rounded-lg bg-neutral-50"
              >
                <p className="px-4 text-center text-sm text-neutral-500">
                  Loading pricing calendar...
                </p>
              </div>
            </div>
          </div>

          <ul className="grid gap-4 sm:grid-cols-3 sm:gap-6">
            <li className="rounded-xl border border-neutral-100 bg-neutral-50/60 px-4 py-4 text-center sm:px-5">
              <p className="text-sm font-semibold text-neutral-900">Official Rescue Partner Data</p>
            </li>
            <li className="rounded-xl border border-neutral-100 bg-neutral-50/60 px-4 py-4 text-center sm:px-5">
              <p className="text-sm font-semibold text-neutral-900">Real-time Availability</p>
            </li>
            <li className="rounded-xl border border-neutral-100 bg-neutral-50/60 px-4 py-4 text-center sm:px-5">
              <p className="text-sm font-semibold text-neutral-900">Under $99 Deals</p>
            </li>
          </ul>
        </section>

        <div className="mx-auto mt-12 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href="#travelpayouts-search-widget"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#1e3a5f] px-8 text-sm font-semibold text-white shadow-sm transition hover:bg-[#152a45] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e3a5f]"
          >
            Start search
          </a>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#c2410c]/25 bg-[#fff7ed] px-8 text-sm font-semibold text-[#9a3412] shadow-sm transition hover:border-[#c2410c]/40 hover:bg-[#ffedd5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ea580c]"
            onClick={() =>
              document.getElementById("travelpayouts-search-widget")?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              })
            }
          >
            View deals
          </button>
        </div>
        <div className="mx-auto mt-3 flex max-w-xl flex-wrap items-center justify-center gap-2">
          {["FLL", "MCO", "MIA", "IAH", "DFW", "AUS"].map((code) => (
            <a
              key={code}
              href={`https://www.aviasales.com/search?origin=${code}&trip_class=Y&one_way=true`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              From {code}
            </a>
          ))}
        </div>
      </main>

      <footer className="border-t border-neutral-200 bg-neutral-50/80 py-8 text-center text-xs text-neutral-500">
        Informational landing — compare options before you book.
      </footer>
    </div>
  );
}

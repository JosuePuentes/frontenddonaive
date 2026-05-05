import { useEffect } from "react";

const AVIASALES_WIDGET_SRC =
  "https://tpemb.com/content?currency=usd&trs=525471&shmarker=725078&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%2332a8dd&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=0&plain=false&promo_id=7879&campaign_id=100";

export default function SpiritRescuePage() {
  useEffect(() => {
    const container = document.getElementById("widget-container");
    if (!container) return;

    const existingScript = container.querySelector("script[data-aviasales-widget='true']");
    if (existingScript) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = AVIASALES_WIDGET_SRC;
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

        <div className="mx-auto mt-10 max-w-2xl sm:mt-12">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-1 shadow-sm ring-1 ring-black/[0.04] sm:p-2">
            <div className="rounded-xl bg-white px-4 py-8 shadow-[0_1px_0_0_rgba(0,0,0,0.04)] sm:px-6 sm:py-10">
              <p className="mb-4 text-center text-sm font-medium text-neutral-500">
                Search rescue fares
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
      </main>

      <footer className="border-t border-neutral-200 bg-neutral-50/80 py-8 text-center text-xs text-neutral-500">
        Informational landing — compare options before you book.
      </footer>
    </div>
  );
}

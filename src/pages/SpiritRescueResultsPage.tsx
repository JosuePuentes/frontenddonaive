import { useMemo } from "react";
import { Link, useLocation } from "react-router";

const AVIASALES_SEARCH_BASE = "https://www.aviasales.com/search";

function buildExternalSearchUrl(search: string) {
  const params = new URLSearchParams(search);
  const finalParams = new URLSearchParams(params);

  if (!finalParams.get("one_way")) finalParams.set("one_way", "true");
  if (!finalParams.get("trip_class")) finalParams.set("trip_class", "Y");

  return `${AVIASALES_SEARCH_BASE}?${finalParams.toString()}`;
}

export default function SpiritRescueResultsPage() {
  const { search } = useLocation();

  const externalSearchUrl = useMemo(() => buildExternalSearchUrl(search), [search]);

  return (
    <div className="min-h-dvh bg-white px-4 py-6 text-neutral-900 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Spirit Rescue Results</h1>
            <p className="text-sm text-neutral-600">
              Results are rendered inside Donaive. You are redirected to the seller only when you
              click purchase.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/spirit-rescue"
              className="inline-flex h-10 items-center rounded-full border border-neutral-200 px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Edit search
            </Link>
            <a
              href={externalSearchUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center rounded-full bg-[#1e3a5f] px-4 text-sm font-semibold text-white hover:bg-[#152a45]"
            >
              Open in new tab
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-2 shadow-sm">
          <div className="overflow-hidden rounded-xl bg-white">
            <iframe
              title="Aviasales Rescue Results"
              src={externalSearchUrl}
              className="h-[75dvh] min-h-[560px] w-full border-0"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-neutral-500">
          If your browser blocks embedded results, use{" "}
          <a href={externalSearchUrl} target="_blank" rel="noreferrer" className="underline">
            Open in new tab
          </a>
          .
        </p>
      </div>
    </div>
  );
}

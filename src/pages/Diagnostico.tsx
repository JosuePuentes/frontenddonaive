import { useEffect, useMemo, useState } from "react";
import type { ApiResult } from "@/services/apiClient";
import { healthService, type HealthLiveResponse } from "@/services/health";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageContainer } from "@/components/page/PageContainer";
import { PageMeta } from "@/components/page/PageMeta";

export default function Diagnostico() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ApiResult<HealthLiveResponse> | null>(
    null,
  );

  const title = useMemo(() => "Diagnóstico — Donaive V2", []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      const res = await healthService.getLive();
      if (cancelled) return;
      setResult(res);
      setLoading(false);
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  const humanStatus = (() => {
    if (loading) return "Conectando con API...";
    if (!result) return "Sin respuesta";
    if (result.ok) return "API conectada";
    return "No se pudo conectar con la API";
  })();

  return (
    <>
      <PageMeta
        title={title}
        description="Prueba de conexión del frontend contra la API de Donaive V2."
      />

      <PageContainer className="pt-10">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline">Diagnóstico</Badge>
            <span className="text-body font-medium">{humanStatus}</span>
          </div>

          <Card variant="outline" className="p-6">
            <div className="space-y-3">
              <div className="text-caption text-muted-foreground">
                Nombre del servicio
              </div>
              <div className="text-body">{result?.ok ? result.data.service : "—"}</div>

              <div className="text-caption text-muted-foreground">Status recibido</div>
              <div className="text-body">
                {result?.ok ? result.data.status : result?.status ?? "—"}
              </div>

              <div className="text-caption text-muted-foreground">Check</div>
              <div className="text-body">{result?.ok ? result.data.check : "—"}</div>

              <div className="text-caption text-muted-foreground">
                Timestamp
              </div>
              <div className="text-body">
                {result?.ok ? result.data.timestamp : "—"}
              </div>

              {!loading && result && !result.ok ? (
                <div className="rounded-md border border-danger/30 bg-danger/5 p-4">
                  <div className="text-body-small font-medium text-danger">
                    Error
                  </div>
                  <div className="mt-2 text-caption text-muted-foreground">
                    {result.error.message}
                  </div>
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}


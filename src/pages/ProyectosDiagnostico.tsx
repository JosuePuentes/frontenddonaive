import { useEffect, useMemo, useState } from "react";
import type { ApiResult } from "@/services/apiClient";
import {
  DEV_TEST_USER_ID,
  projectsService,
  type ProjectsListResponse,
} from "@/services/projects";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageContainer } from "@/components/page/PageContainer";
import { PageMeta } from "@/components/page/PageMeta";

/**
 * TEMPORAL — pantalla de prueba de integración con GET /api/v1/projects.
 * No es el CRM real. No confiar en headers de cliente como auth definitiva.
 */
export default function ProyectosDiagnostico() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ApiResult<ProjectsListResponse> | null>(
    null,
  );

  const title = useMemo(() => "Diagnóstico Projects — Donaive V2", []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      const res = await projectsService.getProjects();
      if (cancelled) return;
      setResult(res);
      setLoading(false);
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  const connectionStatus = (() => {
    if (loading) return "Conectando con API...";
    if (!result) return "Sin respuesta";
    if (result.ok) return "API conectada (projects)";
    return "No se pudo conectar con /api/v1/projects";
  })();

  const projectCount = result?.ok
    ? Array.isArray(result.data.data)
      ? result.data.data.length
      : 0
    : null;

  const jsonPayload = result
    ? JSON.stringify(result.ok ? result.data : result, null, 2)
    : "—";

  return (
    <>
      <PageMeta
        title={title}
        description="Prueba temporal de integración: GET /api/v1/projects"
      />

      <PageContainer className="pt-10">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline">Diagnóstico Projects</Badge>
            <Badge variant="muted">TEMPORAL / DEV-TEST</Badge>
            <span className="text-body font-medium">{connectionStatus}</span>
          </div>

          <Card variant="outline" className="p-6">
            <div className="space-y-4">
              <div>
                <div className="text-caption text-muted-foreground">
                  Endpoint
                </div>
                <div className="text-body-small font-mono">
                  GET /api/v1/projects
                </div>
              </div>

              <div>
                <div className="text-caption text-muted-foreground">
                  Auth temporal (NO definitiva)
                </div>
                <div className="text-body-small font-mono">
                  X-User-Id: {DEV_TEST_USER_ID}
                  <br />
                  X-User-Roles: project_user
                  <br />
                  X-Accessible-Project-Ids: (no enviado)
                </div>
              </div>

              <div>
                <div className="text-caption text-muted-foreground">
                  HTTP status
                </div>
                <div className="text-body">
                  {loading ? "—" : (result?.status ?? "—")}
                </div>
              </div>

              <div>
                <div className="text-caption text-muted-foreground">
                  Cantidad de proyectos
                </div>
                <div className="text-body">
                  {projectCount === null ? "—" : projectCount}
                </div>
              </div>

              {!loading && result && !result.ok ? (
                <div className="rounded-md border border-danger/30 bg-danger/5 p-4">
                  <div className="text-body-small font-medium text-danger">
                    Error exacto
                  </div>
                  <div className="mt-2 text-caption text-muted-foreground whitespace-pre-wrap break-words">
                    {result.error.message}
                    {result.error.details
                      ? `\n${JSON.stringify(result.error.details, null, 2)}`
                      : ""}
                  </div>
                </div>
              ) : null}

              <div>
                <div className="text-caption text-muted-foreground">
                  JSON recibido
                </div>
                <pre className="mt-2 max-h-[28rem] overflow-auto rounded-md border border-border bg-surface-muted/40 p-3 text-caption whitespace-pre-wrap break-words">
                  {jsonPayload}
                </pre>
              </div>
            </div>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}

import { Button } from "@/components/ui/Button";

type ProposalActionsProps = {
  disabled?: boolean;
};

/**
 * CTAs visuales — no ejecutan acciones reales ni persistencia.
 */
function ProposalActions({ disabled = true }: ProposalActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" disabled={disabled} title="Sin envío real">
        Enviar propuesta
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled}
        title="Sin persistencia"
      >
        Editar
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled}
        title="Sin acción real"
      >
        Aceptar
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={disabled}
        title="Sin acción real"
      >
        Rechazar
      </Button>
    </div>
  );
}

export { ProposalActions };
export type { ProposalActionsProps };

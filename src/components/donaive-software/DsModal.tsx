import type { ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  onClose?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
};

export default function DsModal({
  open,
  title,
  onClose,
  children,
  footer,
  wide,
}: Props) {
  if (!open) return null;
  return (
    <div
      className="ds-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`ds-modal${wide ? " ds-modal--wide" : ""}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="ds-modal__head">
          <h2>{title}</h2>
          {onClose ? (
            <button type="button" className="ds-btn" onClick={onClose}>
              Cerrar
            </button>
          ) : null}
        </header>
        <div className="ds-modal__body">{children}</div>
        {footer ? <footer className="ds-modal__foot">{footer}</footer> : null}
      </div>
    </div>
  );
}

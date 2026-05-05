import { useEffect } from "react";

const SCRIPT_SRC = "https://emrldco.com/NTI1NDcx.js?t=525471";
const SCRIPT_MARKER = "data-travelpayouts-drive";

/**
 * Equivalente a next/script strategy="afterInteractive": ejecuta solo en el cliente
 * después del primer paint, sin diferencias servidor/cliente (evita problemas de hidratación).
 */
export function TravelpayoutsDriveScript() {
  useEffect(() => {
    if (document.querySelector(`script[${SCRIPT_MARKER}]`)) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = SCRIPT_SRC;
    script.setAttribute(SCRIPT_MARKER, "525471");
    document.head.appendChild(script);
  }, []);

  return null;
}

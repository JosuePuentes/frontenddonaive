import { useEffect, useState } from "react";
import {
  formatVeNumber,
  parseVeNumber,
  sanitizeNumericTyping,
} from "@/lib/ad-licoreria/number-format";

type Props = {
  value: number;
  onChange: (value: number) => void;
  decimals?: number;
  min?: number;
  max?: number;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
};

/**
 * Input numérico con formato es-VE (10.000,50), sin ceros a la izquierda.
 */
export function AdNumberInput({
  value,
  onChange,
  decimals = 2,
  min,
  max,
  className = "ad-input mt-1",
  placeholder,
  disabled,
  id,
}: Props) {
  const [text, setText] = useState(() =>
    value ? formatVeNumber(value, decimals) : "",
  );
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setText(value ? formatVeNumber(value, decimals) : "");
    }
  }, [value, decimals, focused]);

  function commit(raw: string) {
    const parsed = parseVeNumber(raw);
    if (parsed == null) {
      onChange(0);
      setText("");
      return;
    }
    let next = parsed;
    if (min != null) next = Math.max(min, next);
    if (max != null) next = Math.min(max, next);
    onChange(next);
    setText(next ? formatVeNumber(next, decimals) : "");
  }

  return (
    <input
      id={id}
      className={className}
      inputMode="decimal"
      disabled={disabled}
      placeholder={placeholder}
      value={text}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        commit(text);
      }}
      onChange={(e) => {
        const raw = sanitizeNumericTyping(e.target.value);
        setText(raw);
        const parsed = parseVeNumber(raw);
        if (parsed != null) onChange(parsed);
      }}
    />
  );
}

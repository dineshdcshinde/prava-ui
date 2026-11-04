import { useCallback, useState } from "react";

/** Controlled when `value` is defined; otherwise keeps its own state starting at `defaultValue`. */
export function useControllable<T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: (next: T) => void,
) {
  const [internal, setInternal] = useState(defaultValue);
  const set = useCallback(
    (next: T) => {
      setInternal(next);
      onChange?.(next);
    },
    [onChange],
  );
  return [value === undefined ? internal : value, set] as const;
}

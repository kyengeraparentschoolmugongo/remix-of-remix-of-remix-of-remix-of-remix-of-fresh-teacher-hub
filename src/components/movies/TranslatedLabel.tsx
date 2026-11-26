export function TranslatedLabel({ label }: { label: string | null }) {
  if (!label) return null;
  return (
    <p className="mt-1 flex items-center gap-1.5 px-0.5 text-[11px] font-semibold leading-tight text-primary">
      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      <span className="truncate">{label}</span>
    </p>
  );
}

/** Compact corner pill shown over artwork; capped width keeps most of the image visible. */
export function ThumbnailVjBadge({ label }: { label: string | null }) {
  if (!label) return null;
  const vj = label.includes(" · ") ? label.split(" · ").pop() : label.replace(" Translated", "");
  return (
    <span title={label} className="pointer-events-none absolute bottom-1.5 left-1.5 max-w-[60%] truncate rounded-full bg-background/75 px-2 py-0.5 text-[10px] font-semibold leading-tight text-primary backdrop-blur-sm">
      {vj}
    </span>
  );
}

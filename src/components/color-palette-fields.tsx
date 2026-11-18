export function ColorPaletteFields({
  defaults,
}: {
  defaults?: {
    primary?: string | null;
    secondary?: string | null;
    accent?: string | null;
    light?: string | null;
  };
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <ColorField
        label="Primária"
        name="primary_color"
        defaultValue={defaults?.primary ?? "#171717"}
      />
      <ColorField
        label="Secundária"
        name="secondary_color"
        defaultValue={defaults?.secondary ?? "#737373"}
      />
      <ColorField
        label="Destaque"
        name="accent_color"
        defaultValue={defaults?.accent ?? "#ee7840"}
      />
      <ColorField label="Clara" name="light_color" defaultValue={defaults?.light ?? "#f8f4ef"} />
    </div>
  );
}

function ColorField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-sm text-neutral-500">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="color"
        defaultValue={defaultValue}
        className="h-10 w-full rounded-md border border-neutral-300 bg-white p-1"
      />
    </div>
  );
}

export function Field({
  label,
  name,
  type = "text",
  ...rest
}: {
  label: string;
  name: string;
  type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-sm text-neutral-500">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-fox-orange focus:ring-1 focus:ring-fox-orange"
        {...rest}
      />
    </div>
  );
}

export function TextAreaField({
  label,
  name,
  ...rest
}: {
  label: string;
  name: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-sm text-neutral-500">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-fox-orange focus:ring-1 focus:ring-fox-orange"
        {...rest}
      />
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>
  );
}

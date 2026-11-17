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
      <label htmlFor={name} className="text-sm text-neutral-400">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
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
      <label htmlFor={name} className="text-sm text-neutral-400">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
        {...rest}
      />
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <p className="rounded-md bg-red-950 px-3 py-2 text-sm text-red-300">{message}</p>
  );
}

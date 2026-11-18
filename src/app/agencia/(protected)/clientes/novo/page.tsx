import { NewClientForm } from "./new-client-form";

export default function NovoClientePage() {
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold">Novo cliente</h1>
      <NewClientForm />
    </div>
  );
}

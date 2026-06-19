import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function FindTheBugPage() {
  return (
    <main className="min-h-screen bg-gray-950 px-6 py-12 text-white">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-wide text-orange-400">
            Find the bug
          </p>
          <h1 className="text-3xl font-semibold">Modo temporalmente pausado</h1>
          <p className="text-gray-300">
            Esta ruta queda deshabilitada hasta que exista un schema estable y
            un evaluador aislado en sandbox o worker. No ejecutamos código de
            usuario en el hilo principal de la aplicación.
          </p>
        </div>

        <Button asChild className="w-fit">
          <Link href="/home">Volver al inicio</Link>
        </Button>
      </div>
    </main>
  );
}

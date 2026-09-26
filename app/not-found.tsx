import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center text-center px-6">
      <p className="eyebrow mb-4">404</p>
      <h1 className="display text-[44px]">Esta página no existe.</h1>
      <Link href="/" className="btn btn-primary mt-8">Volver al inicio</Link>
    </main>
  );
}

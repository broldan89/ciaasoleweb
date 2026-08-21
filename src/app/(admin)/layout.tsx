import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Estar logueado no alcanza: hay que ser admin de verdad. El rol vive
  // en `profiles`, protegido por RLS, no en user_metadata (eso es lo que
  // permitía antes autoasignarse un rol desde el navegador).
  const { data: perfil } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (perfil?.rol !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-black text-white p-6">
        <h1 className="text-2xl font-bold mb-8">CIAO SOLE</h1>
        <nav className="space-y-4">
          <a href="/admin/dashboard" className="block hover:text-yellow-400">
            Dashboard
          </a>
          <a href="/admin/productos" className="block hover:text-yellow-400">
            Productos
          </a>
          <a href="/admin/ordenes" className="block hover:text-yellow-400">
            Órdenes de Trabajo
          </a>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}

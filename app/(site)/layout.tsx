import { SiteHeader } from "@/components/SiteHeader";
import { ContadorVisitas } from "@/components/ContadorVisitas";

/**
 * Layout del sitio público: home, Empleo, Inventario predictivo, Aliados y
 * legal. El route group "(site)" no aparece en la URL — sirve para darle
 * header propio a estas rutas sin tocar /admin, que ya tiene el suyo en
 * app/admin/(panel)/layout.tsx.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ContadorVisitas />
      <SiteHeader />
      {children}
    </>
  );
}

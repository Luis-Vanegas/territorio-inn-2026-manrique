import { Hero } from "@/components/Hero";
import { RetoSection } from "@/components/RetoSection";
import { ComunaSection } from "@/components/ComunaSection";
import { EquipoSection } from "@/components/EquipoSection";
import { EnfoqueSection } from "@/components/EnfoqueSection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <RetoSection />
      <ComunaSection />
      <EquipoSection />
      <EnfoqueSection />
      <Footer />
    </main>
  );
}

'use client';

import type { CentralidadMapa } from '@/components/MapaAliados';
import { MapaEstelar, useConstelacionElegida } from '@/components/firmamento/MapaEstelar';

/**
 * El mapa de constelaciones del panel del equipo, con la capa interna de las
 * centralidades del POT (interruptor apagado de entrada). Es `MapaEstelar` con su
 * estado propio: acá no hay lista que encienda una constelación, solo el selector
 * del mapa. Sin aliados individuales: el mapa recibe el arreglo vacío.
 */
export function MapaTerritorio({ centralidades }: { centralidades: CentralidadMapa[] }) {
  const { elegida, fijar, caja } = useConstelacionElegida();
  return (
    <MapaEstelar
      elegida={elegida}
      fijar={fijar}
      caja={caja}
      centralidades={centralidades}
      alto="h-[380px] sm:h-[480px]"
    />
  );
}

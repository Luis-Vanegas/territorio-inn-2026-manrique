'use client';

import { useRouter } from 'next/navigation';

import { BorrarNegocio } from '@/components/BorrarNegocio';
import { borrarFichaDeCuenta } from '@/lib/actions/gestionarEstado';

/**
 * «Borrar mi negocio» dentro del panel: la action revalida la sesión y el
 * negocio por su cuenta; al terminar se recarga el panel, que ya no lo lista
 * (pasa al siguiente negocio de la cuenta o muestra el estado vacío).
 */
export function BorrarFichaPanel({ portafolioId }: { portafolioId: string }) {
  const router = useRouter();
  return (
    <BorrarNegocio borrar={() => borrarFichaDeCuenta(portafolioId)} alBorrar={() => router.refresh()} />
  );
}

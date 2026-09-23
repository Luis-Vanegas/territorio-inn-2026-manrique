import Link from 'next/link';
import type { ReactNode } from 'react';

/** «← Volver a…»: enlace de retorno con objetivo táctil de 44 px. */
export function EnlaceVolver({
  href,
  children,
  className = '',
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[44px] items-center font-mono text-sm text-tinta/70 underline decoration-azul underline-offset-4 hover:text-azul-texto ${className}`}
    >
      {children}
    </Link>
  );
}

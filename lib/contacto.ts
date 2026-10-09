/** Construye el enlace de wa.me a partir de un número tal como lo escribió la persona. */
export function enlaceWhatsapp(numero: string): string {
  const digitos = numero.replace(/\D/g, '');
  // Los números colombianos se escriben sin indicativo. wa.me lo necesita.
  const conPais = digitos.length === 10 ? `57${digitos}` : digitos;
  return `https://wa.me/${conPais}`;
}

/**
 * ¿Es un celular colombiano (10 dígitos que empiezan por 3, o 12 con el 57
 * delante)? Un fijo no tiene WhatsApp: ofrecer el botón con uno abre un chat
 * que no llega a nadie. Lo comprueba scripts/verificar-clientes.mjs.
 */
export function esCelularColombiano(numero: string): boolean {
  const digitos = numero.replace(/\D/g, '');
  return /^3\d{9}$/.test(digitos) || /^573\d{9}$/.test(digitos);
}

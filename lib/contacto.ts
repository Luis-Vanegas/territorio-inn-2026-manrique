/** Construye el enlace de wa.me a partir de un número tal como lo escribió la persona. */
export function enlaceWhatsapp(numero: string): string {
  const digitos = numero.replace(/\D/g, '');
  // Los números colombianos se escriben sin indicativo. wa.me lo necesita.
  const conPais = digitos.length === 10 ? `57${digitos}` : digitos;
  return `https://wa.me/${conPais}`;
}

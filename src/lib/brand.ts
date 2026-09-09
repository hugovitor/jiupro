export const PRODUCT_NAME = "Ponteira";
export const PRODUCT_MARK = "PONTEIRA";
export const PRODUCT_TAGLINE = "Gestão no tatame";
export const PRODUCT_BLURB = "sistema de gestão para academias de Jiu-Jitsu";

export const CONTROLLER_NAME = "Hugo Vitor";
export const CONTROLLER_EMAIL = "hugovitormnunes@gmail.com";
export const ANPD_URL = "https://www.gov.br/anpd/pt-br";

export function productTitle(suffix?: string) {
  return suffix ? `${PRODUCT_NAME} — ${suffix}` : `${PRODUCT_NAME} — ${PRODUCT_BLURB}`;
}

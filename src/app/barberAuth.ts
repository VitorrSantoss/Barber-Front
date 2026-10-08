// A senha do barbeiro é conferida pela API (POST /barbeiros/login), que guarda só o hash
// e bloqueia tentativas em excesso. O front só sabe o tamanho esperado.
export const PIN_LENGTH = 6;

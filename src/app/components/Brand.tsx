// Peças de identidade compartilhadas: letreiro e iniciais.

export function Wordmark({ size = "sm", as: Tag = "p" }: { size?: "sm" | "lg"; as?: "p" | "h1" }) {
  const large = size === "lg";
  return (
    <Tag className="m-0 leading-none">
      <span className={`block font-display tracking-tight text-ink ${large ? "text-5xl sm:text-6xl" : "text-2xl"}`}>
        Barber<span className="text-pole-red">House</span>
      </span>
      <span className={`mt-1 block font-sans font-medium text-ink-soft ${large ? "mt-3 text-base" : "text-xs"}`}>
        Barbearia de bairro · desde 2019
      </span>
    </Tag>
  );
}

export function Initials({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const letters = name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-sm border-2 border-ink bg-ticket font-display text-ink ${
        size === "sm" ? "h-10 w-10 text-base" : "h-12 w-12 text-lg"
      }`}
    >
      {letters}
    </span>
  );
}

/** Named weight steps → CSS numeric values (variable fonts). */
export const WEIGHT_KEYS = [
  "thin",
  "extralight",
  "light",
  "regular",
  "medium",
  "semibold",
  "bold",
  "extrabold",
  "black",
] as const;

export type WeightKey = (typeof WEIGHT_KEYS)[number];

export const WEIGHT_CSS: Record<WeightKey, string> = {
  thin: "100",
  extralight: "200",
  light: "300",
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
  black: "900",
};

export const WEIGHT_OPTIONS = ["inherit", ...WEIGHT_KEYS] as const;

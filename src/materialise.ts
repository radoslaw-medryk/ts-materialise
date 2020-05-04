import * as FLAT from "flatted";
import { Type } from "./types/Type";

function _materialise(flat?: string): Type {
  if (!flat) {
    throw new Error(
      "ts-materialise requires adding TypeScript compiler plugin to work."
    );
  }

  return FLAT.parse(flat);
}

type Materialise = {
  <T>(): Type;
  ["__ts-materialise_func"]?: undefined;
};

export const materialise: Materialise = _materialise;

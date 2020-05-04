import { TypeBase } from "./TypeBase";
import { Type } from "./Type";

export type UnionType = TypeBase & {
  type: "union";
  types: Type[];
};

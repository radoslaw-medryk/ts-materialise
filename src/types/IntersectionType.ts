import { TypeBase } from "./TypeBase";
import { Type } from "./Type";

export type IntersectionType = TypeBase & {
  type: "intersection";
  types: Type[];
};

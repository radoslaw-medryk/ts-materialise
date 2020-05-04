import { TypeBase } from "./TypeBase";
import { Type } from "./Type";

export type ArrayType = TypeBase & {
  type: "array";
  itemsType: Type;
};

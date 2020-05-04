import { TypeBase } from "./TypeBase";

export enum BasicTypeKind {
  Any = "any",
  Unknown = "unknown",
  String = "string",
  Number = "number",
  Boolean = "boolean",
  BigInt = "bigint",
  Symbol = "symbol",
  Undefined = "undefined",
  Null = "null",
  Never = "never",
}

export type BasicType = TypeBase & {
  type: "basic";
  kind: BasicTypeKind;
};

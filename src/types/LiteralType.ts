import { TypeBase } from "./TypeBase";

export enum LiteralTypeKind {
  StringLiteral = "string",
  NumberLiteral = "number",
  BooleanLiteral = "boolean",
  EnumLiteral = "enum",
  BigIntLiteral = "bigint",
}

// TODO [RM]: make more type safe
export type LiteralValue = string | number | boolean;

export type LiteralType = TypeBase & {
  type: "literal";
  kind: LiteralTypeKind;
  value: LiteralValue;
};

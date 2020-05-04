import { ObjectType } from "./ObjectType";
import { ArrayType } from "./ArrayType";
import { UnionType } from "./UnionType";
import { IntersectionType } from "./IntersectionType";
import { BasicType } from "./BasicType";
import { LiteralType } from "./LiteralType";
import { TypeParameterType } from "./TypeParameterType";

export type Type =
  | ObjectType
  | ArrayType
  | UnionType
  | IntersectionType
  | BasicType
  | LiteralType
  | TypeParameterType;

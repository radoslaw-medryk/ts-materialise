import { ObjectType } from "./ObjectType";
import { ArrayType } from "./ArrayType";
import { UnionType } from "./UnionType";
import { IntersectionType } from "./IntersectionType";
import { BasicType } from "./BasicType";
import { LiteralType } from "./LiteralType";
import { TypeParameterType } from "./TypeParameterType";
import { BuiltinType } from "./BuiltinType";

export type Type =
    | ObjectType
    | ArrayType
    | UnionType
    | IntersectionType
    | BasicType
    | LiteralType
    | TypeParameterType
    | BuiltinType;

export function isType(value: unknown): value is Type {
    return (
        typeof value === "object" &&
        !!value &&
        typeof (value as any).str === "string" &&
        typeof (value as any).type === "string" &&
        ["object", "array", "union", "intersection", "basic", "literal", "type-parameter", "builtin"].some(
            q => (value as any).type === q
        )
    );
}

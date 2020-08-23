import { TypeBase } from "./TypeBase";

export enum BuiltinTypeKind {
    Date = "Date",
}

export type BuiltinType = TypeBase & {
    type: "builtin";
    kind: BuiltinTypeKind;
};

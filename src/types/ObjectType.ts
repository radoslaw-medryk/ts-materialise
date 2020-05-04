import { TypeBase } from "./TypeBase";
import { Type } from "./Type";

export type IndexSignature = {
  keyType: "string" | "number";
  valueType: Type | undefined;
};

export type ObjectType = TypeBase & {
  type: "object";
  members: Record<string, Type | undefined>;
  hasCallSignature: boolean;
  indexSignatures: IndexSignature[];
};

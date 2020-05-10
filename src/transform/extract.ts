import * as ts from "typescript";
import { ArrayType } from "../types/ArrayType";
import { ObjectType, IndexSignature } from "../types/ObjectType";
import { BasicTypeKind } from "../types/BasicType";
import { LiteralTypeKind, LiteralValue } from "../types/LiteralType";
import { UnionType } from "../types/UnionType";
import { IntersectionType } from "../types/IntersectionType";
import { Type } from "../types/Type";

type Entry = {
  type: ts.Type;
  base: ObjectType | ArrayType | UnionType | IntersectionType;
  baseMemberName?: string;
  index?: IndexSignature;
};

type Property = {
  name: string;
  tsType: ts.Type;
};

export function extract(checker: ts.TypeChecker, type: ts.Type) {
  const cache: Map<ts.Type, Type> = new Map();

  const base: Type = {
    type: "object",
    str: "__base__",
    members: {},
    hasCallSignature: false,
    indexSignatures: [],
  };

  const stack: Entry[] = [
    {
      type,
      base,
      baseMemberName: "__main__",
    },
  ];

  function resolve(current: Entry, currentType: Type) {
    const { base, index } = current;

    if (base.type === "object" && index) {
      index.valueType = currentType;
      base.indexSignatures.push(index);
      return;
    }

    if (base.type === "object") {
      if (!current.baseMemberName) {
        throw new Error("!current.baseMemberName");
      }
      base.members[current.baseMemberName] = currentType;
      return;
    }

    if (base.type === "array") {
      base.itemsType = currentType;
      return;
    }

    base.types.push(currentType);
  }

  while (stack.length > 0) {
    const current = stack.pop()!;
    const cached = cache.get(current.type);
    if (cached) {
      resolve(current, cached);
      continue;
    }

    const currentType = newType(checker, current.type);
    cache.set(current.type, currentType);
    resolve(current, currentType);

    if (currentType.type === "union" || currentType.type === "intersection") {
      for (const includedType of (current.type as ts.UnionOrIntersectionType)
        .types) {
        stack.push({
          type: includedType,
          base: currentType,
        });
      }
    }

    if (currentType.type === "array") {
      const arrayType = getArrayItemsType(checker, current.type);

      stack.push({
        type: arrayType,
        base: currentType,
      });
    }

    if (currentType.type === "object") {
      const props = getProperties(checker, current.type);
      const indexSignatures = getIndexSignatures(current.type);

      for (const prop of props) {
        stack.push({
          type: prop.tsType,
          base: currentType,
          baseMemberName: prop.name,
        });
      }

      for (const sign of indexSignatures) {
        stack.push({
          type: sign.tsType,
          base: currentType,
          index: sign.index,
        });
      }
    }
  }

  const main = base.members["__main__"];
  if (!main) {
    throw new Error("!main");
  }

  return main;
}

function newType(checker: ts.TypeChecker, tsType: ts.Type): Type {
  const str = checker.typeToString(tsType);

  if ((tsType as ts.Type).isTypeParameter()) {
    return {
      type: "type-parameter",
      str,
    };
  }

  if (tsType.isUnion()) {
    return {
      type: "union",
      str,
      types: [],
    };
  }

  if (tsType.isIntersection()) {
    return {
      type: "intersection",
      str,
      types: [],
    };
  }

  if (isArrayType(checker, tsType)) {
    return {
      type: "array",
      str: checker.typeToString(tsType),
      itemsType: undefined as any,
    };
  }

  const basicTypeKind = getBasicTypeKind(tsType);
  if (basicTypeKind) {
    return {
      type: "basic",
      str: checker.typeToString(tsType),
      kind: basicTypeKind,
    };
  }

  const literalTypeKind = getLiteralTypeKind(tsType);
  if (literalTypeKind) {
    return {
      type: "literal",
      str: checker.typeToString(tsType),
      kind: literalTypeKind,
      value: getLiteralValue(tsType),
    };
  }

  if (isObjectType(tsType)) {
    return {
      type: "object",
      str: checker.typeToString(tsType),
      members: {},
      hasCallSignature: hasCallSignature(tsType),
      indexSignatures: [],
    };
  }

  throw new Error("Failed to process tsType. None of predicates matched.");
}

function isObjectType(tsType: ts.Type) {
  return Boolean(tsType.aliasSymbol || tsType.symbol);
}

function isArrayType(checker: ts.TypeChecker, tsType: ts.Type) {
  const typeNode = checker.typeToTypeNode(tsType);
  return (
    typeNode &&
    (typeNode.kind === ts.SyntaxKind.ArrayType ||
      typeNode.kind === ts.SyntaxKind.TupleType)
  );
}

function getArrayItemsType(checker: ts.TypeChecker, tsType: ts.Type): ts.Type {
  const itemsType = (tsType as any).typeArguments && (tsType as any).typeArguments[0];
  if (!itemsType) {
    throw new Error("!itemsTType");
  }

  return itemsType;
}

function getProperties(checker: ts.TypeChecker, tsType: ts.Type): Property[] {
  const symbol = tsType.aliasSymbol || tsType.symbol;
  const aliasTypeDeclaration = symbol.declarations[0];
  return tsType.getProperties().map((q) => ({
    name: q.name,
    tsType: checker.getTypeOfSymbolAtLocation(q, aliasTypeDeclaration),
  }));
}

function getBasicTypeKind(tsType: ts.Type): BasicTypeKind | undefined {
  if (hasFlag(tsType, ts.TypeFlags.Any)) {
    return BasicTypeKind.Any;
  }

  if (hasFlag(tsType, ts.TypeFlags.Unknown)) {
    return BasicTypeKind.Unknown;
  }

  if (hasFlag(tsType, ts.TypeFlags.String)) {
    return BasicTypeKind.String;
  }

  if (hasFlag(tsType, ts.TypeFlags.Number)) {
    return BasicTypeKind.Number;
  }

  if (hasFlag(tsType, ts.TypeFlags.Boolean)) {
    return BasicTypeKind.Boolean;
  }

  if (hasFlag(tsType, ts.TypeFlags.BigInt)) {
    return BasicTypeKind.BigInt;
  }

  if (
    hasFlag(tsType, ts.TypeFlags.ESSymbol) ||
    hasFlag(tsType, ts.TypeFlags.UniqueESSymbol)
  ) {
    return BasicTypeKind.Symbol;
  }

  if (
    hasFlag(tsType, ts.TypeFlags.Undefined) ||
    hasFlag(tsType, ts.TypeFlags.Void)
  ) {
    return BasicTypeKind.Undefined;
  }

  if (hasFlag(tsType, ts.TypeFlags.Null)) {
    return BasicTypeKind.Null;
  }

  if (hasFlag(tsType, ts.TypeFlags.Never)) {
    return BasicTypeKind.Never;
  }

  return undefined;
}

function getLiteralTypeKind(tsType: ts.Type): LiteralTypeKind | undefined {
  if (hasFlag(tsType, ts.TypeFlags.BigIntLiteral)) {
    return LiteralTypeKind.BigIntLiteral;
  }

  if (hasFlag(tsType, ts.TypeFlags.EnumLiteral)) {
    return LiteralTypeKind.EnumLiteral;
  }

  if (hasFlag(tsType, ts.TypeFlags.NumberLiteral)) {
    return LiteralTypeKind.NumberLiteral;
  }

  if (hasFlag(tsType, ts.TypeFlags.StringLiteral)) {
    return LiteralTypeKind.StringLiteral;
  }

  if (hasFlag(tsType, ts.TypeFlags.BooleanLiteral)) {
    return LiteralTypeKind.BooleanLiteral;
  }

  return undefined;
}

function getLiteralValue(tsType: ts.Type): LiteralValue {
  if (hasFlag(tsType, ts.TypeFlags.BooleanLiteral)) {
    switch ((tsType as any).intrinsicName) {
      case "true":
        return true;

      case "false":
        return false;
    }

    throw new Error(
      `Unsupported tsType.intrinsicName = '${(tsType as any).intrinsicName}'.`
    );
  }

  if (hasFlag(tsType, ts.TypeFlags.BigIntLiteral)) {
    const { negative, base10Value } = (tsType as any).value;
    return `${negative ? "-" : ""}${base10Value}`;
  }

  const value = (tsType as any).value;
  if (value === undefined) {
    throw new Error("value === undefined");
  }

  return value;
}

function hasFlag(tsType: ts.Type, flag: ts.TypeFlags): boolean {
  return Boolean(tsType.flags & flag);
}

function hasCallSignature(tsType: ts.Type) {
  return tsType.getCallSignatures().length > 0;
}

function getIndexSignatures(tsType: ts.Type) {
  const signatures: { tsType: ts.Type; index: IndexSignature }[] = [];

  const strIndexType = tsType.getStringIndexType();
  const numIndexType = tsType.getNumberIndexType();

  if (strIndexType) {
    signatures.push({
      tsType: strIndexType,
      index: {
        keyType: "string",
        valueType: undefined,
      },
    });
  }

  if (numIndexType) {
    signatures.push({
      tsType: numIndexType,
      index: {
        keyType: "number",
        valueType: undefined,
      },
    });
  }

  return signatures;
}

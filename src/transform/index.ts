import * as ts from "typescript";
import { extract } from "./extract";
import * as FLAT from "flatted";

const materialiseName = "materialise";
const magicPropertyName = "__ts-materialise_func";

export type MaterialisePluginOpttions = {
  //
};

export default function transform(
  program: ts.Program,
  opts?: MaterialisePluginOpttions
) {
  return {
    before(ctx: ts.TransformationContext) {
      return getTransformSource(program, ctx);
    },
  };
}

function getTransformSource(
  program: ts.Program,
  ctx: ts.TransformationContext
) {
  return function transformSource(source: ts.SourceFile): ts.SourceFile {
    if (!hasMaterialiseFuncImport(program, ctx, source)) {
      return source;
    }

    const visitor = getVisitor(program, ctx);
    return ts.visitEachChild(source, visitor, ctx);
  };
}

function getVisitor(program: ts.Program, ctx: ts.TransformationContext) {
  const checker = program.getTypeChecker();

  return function visitor(node: ts.Node): ts.Node {
    if (
      ts.isCallExpression(node) &&
      node.expression.getText() === materialiseName
    ) {
      if (node.arguments.length > 0) {
        throw new Error("Call to 'materialise' already contains arguments.");
      }

      if (!node.typeArguments || node.typeArguments.length !== 1) {
        throw new Error(
          "Call to 'materialise' must contains exactly one type argument."
        );
      }

      const tp = node.typeArguments[0];
      const t = checker.getTypeFromTypeNode(tp);

      const type = extract(checker, t);
      const flat = FLAT.stringify(type);

      const clonedNode = ts.getMutableClone(node);
      clonedNode.arguments = ts.createNodeArray([ts.createStringLiteral(flat)]);

      return clonedNode;
    }
    return ts.visitEachChild(node, visitor, ctx);
  };
}

function hasMaterialiseFuncImport(
  program: ts.Program,
  ctx: ts.TransformationContext,
  source: ts.SourceFile
): boolean {
  const checker = program.getTypeChecker();

  let isMaterialiseImportFound = false;

  function visitor(node: ts.Node): ts.Node {
    if (isMaterialiseImportFound) {
      return node;
    }

    if (isMaterialiseFuncImport(checker, node)) {
      isMaterialiseImportFound = true;
      return node;
    }

    return ts.visitEachChild(node, visitor, ctx);
  }

  ts.visitEachChild(source, visitor, ctx);
  return isMaterialiseImportFound;
}

function isMaterialiseFuncImport(
  checker: ts.TypeChecker,
  node: ts.Node
): boolean {
  if (ts.isNamedImports(node)) {
    for (const element of node.elements) {
      const type = checker.getTypeAtLocation(element);
      const magicProperty = type.getProperty(magicPropertyName);
      if (magicProperty) {
        return true;
      }
    }
  }
  return false;
}

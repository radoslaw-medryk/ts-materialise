import * as ts from "typescript";
import { extract } from "./extract";
import * as FLAT from "flatted";
import { magicPropertyName } from "../magicPropertyName";

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
    const visitor = getVisitor(program, ctx);
    return ts.visitEachChild(source, visitor, ctx);
  };
}

function getVisitor(program: ts.Program, ctx: ts.TransformationContext) {
  const checker = program.getTypeChecker();

  return function visitor(node: ts.Node): ts.Node {
    if (
      ts.isCallExpression(node) &&
      isMagicPropertyCallExpression(checker, node)
    ) {
      if (!node.typeArguments || node.typeArguments.length !== 1) {
        throw new Error(
          "Call to function processed by 'withType(...)' must contain exactly one type argument."
        );
      }

      const tp = node.typeArguments[0];
      const t = checker.getTypeFromTypeNode(tp);

      const type = extract(checker, t);
      const flat = FLAT.stringify(type);

      const clonedNode = ts.getMutableClone(node);
      clonedNode.arguments = ts.createNodeArray([
        ts.createStringLiteral(flat),
        ...node.arguments,
      ]);

      return clonedNode;
    }
    return ts.visitEachChild(node, visitor, ctx);
  };
}

function isMagicPropertyCallExpression(
  checker: ts.TypeChecker,
  node: ts.CallExpression
): boolean {
  const type = checker.getTypeAtLocation(node.expression);
  const magicProperty = type.getProperty(magicPropertyName);
  return Boolean(magicProperty);
}

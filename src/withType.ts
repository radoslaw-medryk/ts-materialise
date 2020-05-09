import { magicPropertyName } from "./magicPropertyName";
import { Type, isType } from "./types";
import { WithoutFirstParameter } from "./utils/WithoutFirstParameter";
import * as FLAT from "flatted";

export type HasMagicProperty = {
  [magicPropertyName]: unknown;
};

type WithGeneric<TFunc extends (...args: any[]) => any> = {
  <T>(...args: Parameters<TFunc>): ReturnType<TFunc>;
};

export function withType<TFunc extends (type: Type, ...args: any[]) => any>(
  func: TFunc
): WithGeneric<WithoutFirstParameter<TFunc>> & HasMagicProperty {
  return function wrappedFunc(typeStr: unknown, ...args: any[]) {
    // TODO [RM]: add instructions link to error message:
    const error = new Error(
      "ts-materialise requires typescript configuring typescript compiler plugin to work."
    );

    if (typeof typeStr !== "string") {
      throw error;
    }

    let type: unknown;
    try {
      type = FLAT.parse(typeStr);
    } catch (e) {
      throw error;
    }

    if (!isType(type)) {
      throw error;
    }

    return func(type, ...args);
  } as any;
}

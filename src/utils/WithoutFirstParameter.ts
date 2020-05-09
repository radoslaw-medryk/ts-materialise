import { WithoutFirstElement } from "./WithoutFirstElement";

export type WithoutFirstParameter<TFunc extends (...args: any[]) => any> = (
  ...args: WithoutFirstElement<Parameters<TFunc>>
) => ReturnType<TFunc>;

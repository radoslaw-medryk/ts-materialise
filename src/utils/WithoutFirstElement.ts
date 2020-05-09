export type WithoutFirstElement<
  TTuple extends any[]
> = TTuple["length"] extends 0
  ? []
  : ((...b: TTuple) => void) extends (a: any, ...b: infer I) => void
  ? I
  : [];

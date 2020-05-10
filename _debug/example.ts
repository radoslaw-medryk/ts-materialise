import { materialise } from "../src/materialise";

type Test = {
  arr: number[];
};

const t = materialise<Test>();
console.log(t);

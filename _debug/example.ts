import { materialise } from "../src/materialise";

type Test = {
  date: Date;
};

const t = materialise<Test>();
console.log(t);

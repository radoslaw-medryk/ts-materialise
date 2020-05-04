import { materialise } from "../src/materialise";

type Test<T> = {
  value: T;
};

function x<T>() {
  const type = materialise<Test<T>>();
  console.log("### MATERIALISED: ###", type);
}

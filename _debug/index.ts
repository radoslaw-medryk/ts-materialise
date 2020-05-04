import * as ts from "typescript";
import transform from "../src/transform";

const program = ts.createProgram({
  rootNames: ["./_example.ts"],
  options: {
    alwaysStrict: true,
    strictNullChecks: true,
    outDir: "_out",
  },
});

program.emit(undefined, undefined, undefined, undefined, {
  before: [transform(program).before],
});

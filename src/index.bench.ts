import { bench } from "vitest";
import { generate, parse, validate } from "./index";

function getRandomPrefix(): string {
  return Array.from({ length: 13 }, () =>
    String.fromCharCode(97 + Math.floor(Math.random() * 26)),
  ).join("");
}

let randomPrefix: string = getRandomPrefix();
let randomId: string = generate(randomPrefix);

bench(
  "generate",
  () => {
    generate(randomPrefix);
  },
  {
    setup: () => {
      randomPrefix = getRandomPrefix();
    },
  },
);

bench(
  "parse",
  () => {
    parse(randomId);
  },
  {
    setup: () => {
      randomPrefix = getRandomPrefix();
      randomId = generate(randomPrefix);
    },
  },
);

bench(
  "validate",
  () => {
    validate(randomId, "perf");
  },
  {
    setup: () => {
      randomPrefix = getRandomPrefix();
      randomId = generate(randomPrefix);
    },
  },
);

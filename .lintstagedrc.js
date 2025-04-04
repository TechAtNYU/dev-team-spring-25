import { relative } from "path";

const buildEslintCommand = (filenames) =>
  `next lint --fix --file ${filenames
    .map((f) => relative(process.cwd(), f))
    .join(" --file ")}`;

const buildPrettierCommand = (filenames) =>
  `prettier --ignore-unknown --write ${filenames
    .map((f) => relative(process.cwd(), f))
    .join(" ")}`;

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  "*.{js,jsx}": [buildEslintCommand, buildPrettierCommand],
  "*.{ts,tsx}": [
    () => "tsc --skipLibCheck --noEmit",
    buildEslintCommand,
    buildPrettierCommand,
  ],
  "*.{json,yml,yaml,md}": [buildPrettierCommand],
};

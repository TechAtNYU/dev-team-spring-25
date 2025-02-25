import { relative } from "path";

const buildEslintCommand = (filenames) =>
  `next lint --file ${filenames
    .map((f) => relative(process.cwd(), f))
    .join(" --file ")}`;

const buildPrettierCommand = (filenames) =>
  `prettier --ignore-unknown --check ${filenames
    .map((f) => relative(process.cwd(), f))
    .join(" ")}`;

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  "*.{js,jsx,ts,tsx}": [buildEslintCommand, buildPrettierCommand],
  "*.{json,yml,yaml,md}": [buildPrettierCommand],
};

import { string } from "rollup-plugin-string";

export default {
  input: "./eye/pl",
  output: {
    file: "eye/eye.pl.ts"
  },
  plugins: [
    string({
      // Required to be specified
      include: "**/*.pl",
    }),
  ],
};

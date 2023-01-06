import { string } from "rollup-plugin-string";

export default {
  input: "./eye/pl",
  output: {
    file: "lib/eye.pl.ts"
  },
  plugins: [
    string({
      // Required to be specified
      include: "**/*.pl",
    }),
  ],
};

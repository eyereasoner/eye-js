import { string } from "rollup-plugin-string";

export default {
  input: "./eye/pvm",
  output: {
    file: "lib/eye.pvm.ts"
  },
  plugins: [
    string({
      // Required to be specified
      include: "**/*.pvm",
    }),
  ],
};

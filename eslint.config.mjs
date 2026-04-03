import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const config = [
  { ignores: [".velite/"] },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // React 19 added strict rules that flag intentional patterns used throughout
      // the codebase (setState in effects for external system sync, dynamic MDX
      // components, ref reads in render for computed positions). These are working
      // patterns, not bugs -- downgrade to warnings for visibility without blocking.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/refs": "warn",
    },
  },
];

export default config;

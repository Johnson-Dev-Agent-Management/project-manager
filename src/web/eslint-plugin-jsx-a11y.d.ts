// Typed contract for the ESLint-10-compatible HTML Academy npm alias.
// The upstream DefinitelyTyped package depends on unsupported ESLint 9.
declare module 'eslint-plugin-jsx-a11y' {
  import type { ESLint, Linter } from 'eslint';
  const plugin: ESLint.Plugin & {
    flatConfigs: {
      recommended: Linter.Config;
      strict: Linter.Config;
    };
  };
  export default plugin;
}

import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: "../tmp/schema.graphql",
  documents: "js/gql/**/*.graphql",
  generates: {
    "js/gql/generated.tsx": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-apollo",
      ]
    },
  }
};

export default config;

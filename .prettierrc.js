import oclifPrettierConfig from "@oclif/prettier-config";

export default {
    ...oclifPrettierConfig,
    semi: true,
    singleQuote: true,
    printWidth: 150,
    bracketSpacing: true,
    endOfLine: "lf",
    tabWidth: 4
};

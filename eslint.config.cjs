module.exports = [
    {
        files: ["src/**/*.js", "src/*.js", "*.js"],
        languageOptions: {
            globals: {
                require: "readonly",
                module: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
                process: "readonly",
                console: "readonly"
            },
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "script"
            }
        },
        rules: {
            indent: ["error", "tab"],
            "linebreak-style": ["error", "unix"],
            quotes: ["error", "double"],
            semi: ["error", "always"]
        }
    },
    {
        ignores: ["node_modules/**"]
    }
];
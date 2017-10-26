module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true
    },
    "extends": ["standard", "standard-jsx"],
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        },
        "sourceType": "module"
    },
    "rules": {
        "indent": [
            "error",
            2
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "never"
        ],
        "camelcase": [
            0,
            "never"
        ],
        "no-new": [
            0,
            "never"
        ],
        "no-constant-condition": [
          0,
          "never"
        ],
        "no-console": [
          0,
          "never"
        ],
        "no-throw-literal":  [
          0,
          "never"
        ],
        "no-undef": [
          0,
          "never"
        ],
        "no-undef-init": [
          0,
          "never"
        ],
        "no-unused-vars": [
          0,
          "never"
        ]
    }
};

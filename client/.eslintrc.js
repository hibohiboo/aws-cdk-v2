module.exports = {
  ignorePatterns: ['!.eslintrc.js', 'public'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'react-app',
    'react-app/jest',
  ],
  parser: '@typescript-eslint/parser',
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true,
  },
  // https://chaika.hatenablog.com/entry/2022/01/17/083000
  plugins: ['unused-imports', 'import'],

  rules: {
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'commma-dangle': 'off',
    'no-duplicate-case': 'off',
    'no-undef': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    'react/display-name': 'off',
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
    'import/order': [
      'error',
      {
        // グループごとの並び順
        groups: [
          'builtin', // 1. fsや path などの node "builtin" のモジュール
          'external', // 2. npm install したパッケージ
          'internal', // 3. webpack などでパス設定したモジュール
          ['parent', 'sibling'], // 4. 親階層と小階層のファイル
          'object', // object"-imports
          'type', // 型だけをインポートする type imports
          'index', // 同階層のファイル
        ],
        // グループごとに改行を入れる
        'newlines-between': 'never', // "never" を指定すると改行なし
        pathGroupsExcludedImportTypes: ['builtin'],
        // アルファベット順・大文字小文字を区別しない
        alphabetize: { order: 'asc', caseInsensitive: true },
        pathGroups: [
          // react 関連を external より前にする
          {
            pattern: 'react**',
            group: 'external',
            position: 'before',
          },
          {
            pattern: '{@/store/**,@/domain/**}',
            group: 'internal',
            position: 'before',
          },
          // `@/components` の import をグルーピング
          {
            pattern: '{@/components/**,./**.style}',
            group: 'internal',
            position: 'before',
          },
        ],
      },
    ],
  },
}

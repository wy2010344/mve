export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'core',
        'dom',
        'helper',
        'dom-helper',
        'daisy-mobile-helper',
        'api',
        'types',
        'utils',
        'deps',
      ],
    ],
  },
};

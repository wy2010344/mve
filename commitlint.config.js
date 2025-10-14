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
        'demo',
        'website',
        'api',
        'types',
        'utils',
        'deps',
        'workspace',
      ],
    ],
  },
}

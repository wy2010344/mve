export default {
  '**/*.{ts,tsx,js,jsx}': ['prettier --write', 'eslint --fix'],
  '**/*.{json,md}': ['prettier --write'],
};

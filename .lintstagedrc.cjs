module.exports = {
  // Only run on specific directories - node_modules won't be matched by these patterns
  '{src,test,migrations}/**/*.js': [
    'eslint --fix --ignore-path .eslintignore',
    'prettier --write --ignore-path .prettierignore',
  ],
  // Root level JS files (like server.js) - exclude files in unwanted directories
  '*.js': (files) => {
    const filtered = files.filter(file =>
      !file.includes('node_modules/') &&
      !file.includes('coverage/') &&
      !file.includes('.wrangler/') &&
      !file.includes('.husky/')
    );
    if (filtered.length === 0) return [];
    return [
      `eslint --fix --ignore-path .eslintignore ${filtered.join(' ')}`,
      `prettier --write --ignore-path .prettierignore ${filtered.join(' ')}`
    ];
  },
  // JSON/MD files in source directories
  '{src,test,migrations}/**/*.{json,md}': [
    'prettier --write --ignore-path .prettierignore',
  ],
  // Root level JSON/MD files - exclude package-lock.json and unwanted directories
  '*.{json,md}': (files) => {
    const filtered = files.filter(file =>
      !file.includes('node_modules/') &&
      !file.includes('coverage/') &&
      !file.includes('.wrangler/') &&
      !file.includes('.husky/') &&
      file !== 'package-lock.json'
    );
    if (filtered.length === 0) return [];
    return [`prettier --write --ignore-path .prettierignore ${filtered.join(' ')}`];
  },
  'package.json': ['npm pkg validate'],
};

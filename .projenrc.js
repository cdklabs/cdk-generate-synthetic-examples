const { typescript } = require('projen');

const project = new typescript.TypeScriptProject({
  defaultReleaseBranch: 'main',
  name: 'cdk-generate-synthetic-examples',
  srcdir: 'lib',
  repository: 'https://github.com/cdklabs/cdk-generate-synthetic-examples',
  authorEmail: 'aws-cdk-dev@amazon.com',
  authorName: 'Amazon Web Servies',
  authorOrganization: true,
  description: 'Generate synthetic examples for CDK libraries',
  deps: [
    '@jsii/spec',
    'jsii-reflect',
    'jsii-rosetta',
    'fs-extra',
    'yargs',
  ],
  devDeps: [
    '@types/jest',
    '@types/yargs',
    'jest',
    'typescript',
  ],
  projenUpgradeSecret: 'PROJEN_GITHUB_TOKEN',
  releaseToNpm: true,
  gitignore: ['*.js', '*.d.ts'],
});

project.synth();

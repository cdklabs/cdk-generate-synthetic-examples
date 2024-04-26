import { CdklabsTypeScriptProject } from 'cdklabs-projen-project-types';

const project = new CdklabsTypeScriptProject({
  projenrcTs: true,
  private: false,
  defaultReleaseBranch: 'main',
  name: 'cdk-generate-synthetic-examples',
  repository: 'https://github.com/cdklabs/cdk-generate-synthetic-examples',
  description: 'Generate synthetic examples for CDK libraries',
  deps: [
    '@jsii/spec',
    'jsii-reflect',
    'jsii-rosetta',
    'yargs',
  ],
  devDeps: [
    '@types/jest',
    '@types/yargs',
    'cdklabs-projen-project-types',
    'jest',
    'jsii',
    'typescript',
  ],
  releaseToNpm: true,
  gitignore: ['*.js', '*.d.ts'],
  workflowNodeVersion: '18.x',
  enablePRAutoMerge: true,
  setNodeEngineVersion: false,
});

project.synth();

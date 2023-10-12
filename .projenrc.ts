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
    'jsii',
    'fs-extra',
    'yargs',
  ],
  devDeps: [
    'cdklabs-projen-project-types',
    '@types/jest',
    '@types/yargs',
    'jest',
    '@types/fs-extra',
    'typescript',
  ],
  releaseToNpm: true,
  gitignore: ['*.js', '*.d.ts'],
  workflowNodeVersion: '16.x',
  minNodeVersion: '16.0.0',
  enablePRAutoMerge: true,
  setNodeEngineVersion: false,
});

project.synth();

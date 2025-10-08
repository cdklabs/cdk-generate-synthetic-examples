import { CdklabsTypeScriptProject } from 'cdklabs-projen-project-types';
import { RosettaPeerDependency, RosettaVersionLines } from './projenrc/rosetta';

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
    'yargs',
  ],
  devDeps: [
    '@types/semver',
    '@types/jest',
    '@types/yargs',
    'cdklabs-projen-project-types',
    'jest',
    'jsii',
    'typescript',
  ],
  tsconfig: {
    compilerOptions: {
      skipLibCheck: true,
    },
  },
  releaseToNpm: true,
  gitignore: ['*.js', '*.d.ts'],
  workflowNodeVersion: '20.x',
  enablePRAutoMerge: true,
  setNodeEngineVersion: false,
});

// Add the new version line here
new RosettaPeerDependency(project, {
  supportedVersions: {
    [RosettaVersionLines.V1_X]: '^1.85.0',
    [RosettaVersionLines.V5_0]: false,
    [RosettaVersionLines.V5_1]: '~5.1.2',
    [RosettaVersionLines.V5_2]: '~5.2.0',
    [RosettaVersionLines.V5_3]: '~5.3.0',
    [RosettaVersionLines.V5_4]: '~5.4.0',
    [RosettaVersionLines.V5_5]: '~5.5.0',
    [RosettaVersionLines.V5_6]: '~5.6.0',
    [RosettaVersionLines.V5_7]: '~5.7.0',
    [RosettaVersionLines.V5_8]: '~5.8.0',
    [RosettaVersionLines.V5_9]: '~5.9.0',
  },
});

project.synth();

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
    'aws-cdk-lib', // To run tests against
    '@aws-cdk/mixins-preview@2.230.0-alpha.0', // To run tests against
  ],
  tsconfig: {
    compilerOptions: {
      skipLibCheck: true,
    },
  },
  releaseToNpm: true,
  gitignore: ['*.js', '*.d.ts'],
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

// jsii-rosetta 5.9.67+ loads the ESM-only `stream-json` v3 with a dynamic
// `import()`, which jest only supports with --experimental-vm-modules. Older
// rosetta versions must run without it: under the flag, 5.1.x fails to load
// assemblies. So only set it when the installed rosetta needs it.
const vmModulesIfNeeded = [
  '$(node -e "',
  "const { satisfies } = require('semver');",
  "const v = require('jsii-rosetta/package.json').version;",
  "process.stdout.write(satisfies(v, '>=5.9.67') ? '--experimental-vm-modules' : '')",
  '")',
].join(' ');
project.tasks.tryFind('test')?.updateStep(0, {
  exec: `NODE_OPTIONS="$NODE_OPTIONS ${vmModulesIfNeeded}" jest --passWithNoTests --updateSnapshot`,
  receiveArgs: true,
});

project.synth();

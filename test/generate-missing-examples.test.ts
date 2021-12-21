import * as path from 'path';
import * as fs from 'fs-extra';

import { LanguageTablet, TargetLanguage } from 'jsii-rosetta';
import { generateMissingExamples } from '../lib/generate-missing-examples';
import { DUMMY_ASSEMBLY_TARGETS, AssemblyFixture } from './testutil';

test('@aws-cdk/core special case', async () => {
  const assembly = await AssemblyFixture.fromSource(
    {
      'index.ts': `
      export interface MyClassProps {
        readonly someString: string;
        readonly someNumber: number;
      }

      export class MyClass {
        constructor(value: string, props: MyClassProps) {
          Array.isArray(value);
          Array.isArray(props);
        }
      }
    `,
    },
    {
      name: '@aws-cdk/core',
      jsii: DUMMY_ASSEMBLY_TARGETS,
    },
  );
  try {
    await generateMissingExamples([assembly.directory], {});

    const generatedFixture = path.join(assembly.directory, 'rosetta', '_generated.ts-fixture');

    const file = await fs.readFile(generatedFixture, 'utf-8');
    expect(file.startsWith('import { Construct } from "@aws-cdk/core";')).toBeTruthy();
  } finally {
    await assembly.cleanup();
  }
});

test('test end-to-end and translation to Python', async () => {
  const assembly = await AssemblyFixture.fromSource(
    {
      'index.ts': `
      export interface MyClassProps {
        readonly someString: string;
        readonly someNumber: number;
      }

      export class MyClass {
        constructor(value: string, props: MyClassProps) {
          Array.isArray(value);
          Array.isArray(props);
        }
      }
    `,
    },
    {
      name: 'my_assembly',
      jsii: DUMMY_ASSEMBLY_TARGETS,
    },
  );
  try {
    const outputTablet = path.join(assembly.directory, 'test.tbl.json');

    await generateMissingExamples([assembly.directory], {
      extractOptions: {
        cache: outputTablet,
      },
    });

    const tablet = await LanguageTablet.fromFile(outputTablet);

    const pythons = tablet.snippetKeys
      .map((key) => tablet.tryGetSnippet(key)!)
      .map((snip) => snip.get(TargetLanguage.PYTHON)?.source);

    const classInstantiation = pythons.find((s) => s?.includes('= my_assembly.MyClass('));
    expect(classInstantiation).toEqual([
      '# The code below shows an example of how to instantiate this type.',
      '# The values are placeholders you should change.',
      'import example_test_demo as my_assembly',
      '',
      'my_class = my_assembly.MyClass(\"value\",',
      '    some_number=123,',
      '    some_string=\"someString\"',
      ')',
    ].join('\n'));
  } finally {
    await assembly.cleanup();
  }
});
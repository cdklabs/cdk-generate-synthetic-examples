import * as fs from 'fs';
import * as path from 'path';
import { SPEC_FILE_NAME, SPEC_FILE_NAME_COMPRESSED } from '@jsii/spec';

import { LanguageTablet, TargetLanguage } from 'jsii-rosetta';
import { DUMMY_ASSEMBLY_TARGETS, AssemblyFixture, DUMMY_ASSEMBLY_DEPS } from './testutil';
import { generateMissingExamples } from '../src/generate-missing-examples';

// these tests need to install an npm package
jest.setTimeout(30000);

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
      jsiiRosetta: DUMMY_ASSEMBLY_DEPS,
    },
  );
  try {
    await generateMissingExamples([assembly.directory], {});

    const generatedFixture = path.join(assembly.directory, 'rosetta', '_generated.ts-fixture');

    const file = fs.readFileSync(generatedFixture, { encoding: 'utf-8' });
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
      jsiiRosetta: DUMMY_ASSEMBLY_DEPS,
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

test('test end-to-end and translation to Python with compressed assembly', async () => {
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
      jsiiRosetta: DUMMY_ASSEMBLY_DEPS,
    },
    {
      compressAssembly: true,
    },
  );
  try {
    // ensure the compressed assembly exists and the file at SPEC_FILE_NAME is a redirect schema
    expect(fs.existsSync(path.join(assembly.directory, SPEC_FILE_NAME_COMPRESSED))).toBeTruthy();
    const schema = JSON.parse(fs.readFileSync(path.join(assembly.directory, SPEC_FILE_NAME), { encoding: 'utf-8' }));
    expect(schema).toEqual({
      schema: 'jsii/file-redirect',
      compression: 'gzip',
      filename: SPEC_FILE_NAME_COMPRESSED,
    });

    const outputTablet = path.join(assembly.directory, 'test.tbl.json');

    await generateMissingExamples([assembly.directory], {
      extractOptions: {
        cache: outputTablet,
      },
    });

    // ensure the file at SPEC_FILE_NAME is still a redirect schema
    expect(JSON.parse(fs.readFileSync(path.join(assembly.directory, SPEC_FILE_NAME), { encoding: 'utf-8' }))).toEqual({
      schema: 'jsii/file-redirect',
      compression: 'gzip',
      filename: SPEC_FILE_NAME_COMPRESSED,
    });

    // ensure translations still work as expected
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

test('test deeply nested submodule imports', async () => {
  const assembly = await AssemblyFixture.fromSource(
    {
      'index.ts': `
      export * as nested from './nested';
      `,
      'nested/index.ts': `
      export * as interfaces from './interfaces';
      `,
      'nested/interfaces/index.ts': `
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
      jsiiRosetta: DUMMY_ASSEMBLY_DEPS,
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

    for (const snippetKey of tablet.snippetKeys) {
      const snippet = tablet.tryGetSnippet(snippetKey);
      const js = snippet?.originalSource.source;
      const python = snippet?.get(TargetLanguage.PYTHON)?.source;
      expect(js).toContain("import { interfaces as nested_interfaces } from 'my_assembly/nested';");
      expect(python).toContain('from example_test_demo.nested import interfaces as nested_interfaces');
    }
    expect(tablet.snippetKeys.length).toBe(2);
  } finally {
    await assembly.cleanup();
  }
});

test('can import multiple nested submodules of the same name', async () => {
  const assembly = await AssemblyFixture.fromSource(
    {
      'index.ts': `
      export * as interfaces from './interfaces';
      export * as aws_s3 from './aws-s3';
      `,
      'interfaces/index.ts': `
      export * as aws_s3 from './aws-s3';
      `,
      'interfaces/aws-s3.ts': `
      export interface MyClassProps {
        readonly someProps: MyClassProps;
      }
    `,
      'aws-s3/index.ts': `
      import { MyClassProps } from '../interfaces/aws-s3';

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
      jsiiRosetta: DUMMY_ASSEMBLY_DEPS,
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

    for (const snippetKey of tablet.snippetKeys) {
      const snippet = tablet.tryGetSnippet(snippetKey);
      const js = snippet?.originalSource.source;
      const python = snippet?.get(TargetLanguage.PYTHON)?.source;
      expect(js).toContain("import { aws_s3 as interfaces_s3 } from 'my_assembly/interfaces';");
      expect(python).toContain('from example_test_demo.interfaces import aws_s3 as interfaces_s3');
    }
    expect(tablet.snippetKeys.length).toBe(2);
  } finally {
    await assembly.cleanup();
  }
});

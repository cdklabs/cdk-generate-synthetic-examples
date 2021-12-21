/* eslint-disable no-console */
import { promises as fs } from 'fs';
import { Assembly, ClassType, InterfaceType, TypeSystem } from 'jsii-reflect';

import { extractSnippets } from 'jsii-rosetta/lib/commands/extract';
import { insertExample, replaceAssembly, addFixtureToRosetta } from './assemblies';
import { generateAssignmentStatement } from './generate';

const COMMENT_WARNING = [
  '// The code below shows an example of how to instantiate this type.',
  '// The values are placeholders you should change.',
];

export const FIXTURE_NAME = '_generated';

export interface ExtractOptions {
  readonly cache?: string;
  readonly directory?: string;
}

export interface GenerateExamplesOptions {
  readonly extractOptions?: ExtractOptions;
}

export async function generateMissingExamples(assemblyLocations: string[], options: GenerateExamplesOptions) {
  const typesystem = new TypeSystem();

  // load all assemblies into typesystem
  const loadedAssemblies = await Promise.all(assemblyLocations.map(async (assemblyLocation) => {
    if (!(await statFile(assemblyLocation))?.isDirectory) {
      throw new Error(`Assembly location not a directory: ${assemblyLocation}`);
    }

    return { assemblyLocation, assembly: await typesystem.load(assemblyLocation, { validate: false }) };
  }));

  loadedAssemblies.flatMap(({ assembly, assemblyLocation }) => {
    // Classes and structs
    const documentableTypes: Array<ClassType | InterfaceType> = [];
    for (const m of [assembly, ...assembly.allSubmodules]) {
      documentableTypes.push(...m.classes.filter(c => !c.docs.example));
      documentableTypes.push(...m.interfaces.filter(c => !c.docs.example && c.datatype));
    }

    // add fixture to assembly's rosetta folder if it doesn't exist yet
    const fixture = generateFixture(assembly);
    addFixtureToRosetta(
      assemblyLocation,
      `${FIXTURE_NAME}.ts-fixture`,
      fixture,
    );

    console.log(`${assembly.name}: ${documentableTypes.length} classes to document`);
    if (documentableTypes.length === 0) { return []; }

    const failed = new Array<string>();
    const generatedSnippets = documentableTypes.flatMap((classType) => {
      const example = generateAssignmentStatement(classType);
      if (!example) {
        failed.push(classType.name);
        return [];
      }

      const visibleSource = [
        ...COMMENT_WARNING,
        ...example.renderDeclarations(),
        example.renderCode(),
      ].join('\n').trimLeft();

      insertExample(visibleSource, classType.spec);
      return [visibleSource];
    });

    console.log([
      `${assembly.name}: annotated ${generatedSnippets.length} classes`,
      ...(failed.length > 0 ? [`failed: ${failed.join(', ')}`] : []),
    ].join(', '));

    return generatedSnippets;
  });

  console.log(`Saving ${loadedAssemblies.length} assemblies`);
  await Promise.all((loadedAssemblies).map(({ assembly, assemblyLocation }) =>
    replaceAssembly(assembly.spec, assemblyLocation)));

  // extract snippets if extract flag is set.
  if (options.extractOptions) {
    if (options.extractOptions.directory) {
      process.chdir(options.extractOptions.directory);
    }

    console.log(`Extracting snippets from ${assemblyLocations.length} assemblies`);
    await extractSnippets(assemblyLocations, {
      cacheFromFile: options.extractOptions.cache,
      cacheToFile: options.extractOptions.cache,
      includeCompilerDiagnostics: true,
    });
  }
}

async function statFile(fileName: string) {
  try {
    return await fs.stat(fileName);
  } catch (e: any) {
    if (e.code === 'ENOENT') { return undefined; }
    throw e;
  }
}

function correctConstructImport(assembly: Assembly) {
  if (assembly.name === 'monocdk') {
    return 'import { Construct } from "monocdk";';
  }

  if (assembly.name === '@aws-cdk/core' ||
    assembly.dependencies.some(d => d.assembly.name === '@aws-cdk/core')) {
    return 'import { Construct } from "@aws-cdk/core";';
  }

  return 'import { Construct } from "constructs";';
}

function generateFixture(assembly: Assembly): string {
  return [
    correctConstructImport(assembly),
    'class MyConstruct extends Construct {',
    'constructor(scope: Construct, id: string) {',
    'super(scope, id);',
    '/// here',
    '} }',
  ].join('\n').trimLeft();
}

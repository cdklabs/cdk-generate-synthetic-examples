import * as os from 'os';
import * as path from 'path';
import { writeAssembly } from '@jsii/spec';
import * as fs from 'fs-extra';
import { PackageInfo, compileJsiiForTest } from 'jsii';

export type MultipleSources = { [key: string]: string; 'index.ts': string };

export interface AssemblyFixtureOptions {
  /**
   * Whether or not to compress the assembly
   */
  readonly compressAssembly?: boolean;
}

export class AssemblyFixture {
  public static async fromSource(
    source: string | MultipleSources,
    packageInfo: Partial<PackageInfo> & { name: string },
    options: AssemblyFixtureOptions = {},
  ) {
    const { assembly, files } = compileJsiiForTest(source, {
      packageJson: packageInfo,
      compressAssembly: options.compressAssembly,
    });

    // The following is silly, however: the helper has compiled the given source to
    // an assembly, and output files, and then removed their traces from disk.
    // But for the purposes of Rosetta, we need those files back on disk. So write
    // them back out again >_<
    //
    // In fact we will drop them in 'node_modules/<name>' so they can be imported
    // as if they were installed.
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jsii-rosetta'));
    const modDir = path.join(tmpDir, 'node_modules', packageInfo.name);
    await fs.ensureDir(modDir);

    writeAssembly(modDir, assembly, { compress: options.compressAssembly });
    await fs.writeJSON(path.join(modDir, 'package.json'), {
      name: packageInfo.name,
      jsii: packageInfo.jsii,
    });
    for (const [fileName, fileContents] of Object.entries(files)) {
      // eslint-disable-next-line no-await-in-loop
      await fs.writeFile(path.join(modDir, fileName), fileContents);
    }

    return new AssemblyFixture(modDir);
  }

  private constructor(public readonly directory: string) {}

  public async cleanup() {
    await fs.remove(this.directory);
  }
}

export const DUMMY_ASSEMBLY_TARGETS = {
  targets: {
    dotnet: {
      namespace: 'Example.Test.Demo',
      packageId: 'Example.Test.Demo',
    },
    go: { moduleName: 'example.test/demo' },
    java: {
      maven: {
        groupId: 'example.test',
        artifactId: 'demo',
      },
      package: 'example.test.demo',
    },
    python: {
      distName: 'example-test.demo',
      module: 'example_test_demo',
    },
  },
};

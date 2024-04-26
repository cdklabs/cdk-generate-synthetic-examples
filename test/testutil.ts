import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { writeAssembly } from '@jsii/spec';
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
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsii-rosetta'));
    const modDir = path.join(tmpDir, 'node_modules', packageInfo.name);
    if (!fs.existsSync(modDir)) {
      fs.mkdirSync(modDir, { recursive: true });
    }

    writeAssembly(modDir, assembly, { compress: options.compressAssembly });
    fs.writeFileSync(path.join(modDir, 'package.json'), JSON.stringify({
      name: packageInfo.name,
      jsii: packageInfo.jsii,
    }, null, 2));
    for (const [fileName, fileContents] of Object.entries(files)) {
      // eslint-disable-next-line no-await-in-loop
      fs.writeFileSync(path.join(modDir, fileName), fileContents);
    }

    return new AssemblyFixture(modDir);
  }

  private constructor(public readonly directory: string) {}

  public cleanup() {
    fs.rmSync(this.directory, { recursive: true });
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

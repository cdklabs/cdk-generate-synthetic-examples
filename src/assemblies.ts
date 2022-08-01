import * as path from 'path';
import { Assembly, Type, writeAssembly, compressedAssemblyExists } from '@jsii/spec';
import * as fs from 'fs-extra';
import { FIXTURE_NAME } from './generate-missing-examples';

/**
 * Replaces the file where the original assembly file *should* be found with a new assembly file.
 * Detects whether or not there is a compressed assembly, and if there is, compresses the new assembly also.
 */
export function replaceAssembly(assembly: Assembly, directory: string) {
  writeAssembly(directory, _fingerprint(assembly), { compress: compressedAssemblyExists(directory) });
}

export function addFixtureToRosetta(directory: string, fileName: string, fixture: string) {
  const rosettaPath = path.join(directory, 'rosetta');
  if (!fs.existsSync(rosettaPath)) {
    fs.mkdirSync(rosettaPath);
  }
  const filePath = path.join(rosettaPath, fileName);
  if (fs.existsSync(filePath)) {
    return;
  }
  fs.writeFileSync(filePath, fixture);
}

/**
 * Replaces the old fingerprint with '***********'.
 *
 * @rmuller says fingerprinting is useless, as we do not actually check
 * if an assembly is changed. Instead of keeping the old (wrong) fingerprint
 * or spending extra time calculating a new fingerprint, we replace with '**********'
 * that demonstrates the fingerprint has changed.
 */
function _fingerprint(assembly: Assembly): Assembly {
  assembly.fingerprint = '*'.repeat(10);
  return assembly;
}

/**
 * Insert an example into the docs of a type
 */
export function insertExample(visibleSource: string, type: Type): void {
  if (type.docs) {
    type.docs.example = visibleSource;
  } else {
    type.docs = {
      example: visibleSource,
    };
  }
  if (type.docs.custom) {
    type.docs.custom.exampleMetadata = `fixture=${FIXTURE_NAME}`;
  } else {
    type.docs.custom = {
      exampleMetadata: `fixture=${FIXTURE_NAME}`,
    };
  }
}

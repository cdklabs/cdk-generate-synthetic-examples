import * as path from 'path';
import { Type } from '@jsii/spec';
import * as fs from 'fs-extra';
import { FIXTURE_NAME } from './generate-missing-examples';

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

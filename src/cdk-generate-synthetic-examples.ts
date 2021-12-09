import * as yargs from 'yargs';

import { generateMissingExamples } from './generate-missing-examples';

async function main() {
  const args = await yargs
    .usage('$0 [ASSEMBLY..]')
    .option('directory', {
      alias: 'd',
      type: 'string',
      describe: 'Directory to run the compilation in (with dependencies set up)',
      requiresArg: true,
      default: undefined,
    })
    .option('extract', {
      alias: 'e',
      type: 'boolean',
      describe: 'Appends a call to rosetta:extract after generating examples',
      default: false,
    })
    .option('extract-cache', {
      alias: 'c',
      type: 'string',
      describe: 'Send a cache into extract',
    })
    .option('extract-directory', {
      alias: 'd',
      type: 'string',
      describe: 'Working directory for extract (for require() etc)',
    })
    .help()
    .strictOptions()
    .showHelpOnFail(false)
    .argv;

  const assemblyDirs = args._.map(x => `${x}`);

  // Only configure extractOptions if we are asked to extract.
  const extractOptions = args.extract ? {
    cache: args['extract-cache'],
    directory: args['extract-directory'],
  } : undefined;

  await generateMissingExamples(assemblyDirs.length > 0 ? assemblyDirs : ['.'], {
    extractOptions,
  });
}

main().catch(e => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});
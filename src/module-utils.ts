import * as reflect from 'jsii-reflect';
import { DirTrackingTypeSystem } from './dir-tracking-typesystem';

/**
 * Represents how we will access a type, both the import and the expression
 *
 * ```
 * import { <sourceSymbol> as <targetSymbol> } from '<importSource>';
 *           ^^^^^ may be '*'
 *
 * const x: <expression>;
 * ```
 */
export interface TypeAccess {
  readonly importSource: string;
  readonly sourceSymbol: string;
  readonly targetSymbol: string;
  readonly expression: string;
}

/**
 * Determine how we're going to import and reference this type
 *
 * We're going to choose to import entire namespaces, so that it's
 * clear where every symbol is coming from and also so that imports
 * can be reused between a variety of symbols (we don't have import
 * merging).
 *
 * ```
 * NO:    import { Type } from 'assembly/submodule';  Type
 *
 * YES:   import { submodule } from 'assembly';       submodule.Type
 * YES:   import * as asm from 'assembly';            asm.Type
 * ```
 */
export function typeAccess(type: reflect.Type): TypeAccess {
  const loc = typeLocation(type);

  // We will be importing the last submodule from the next-to-last-submodule.
  // Pretend the assembly is submodule-ish so the code below becomes kinda
  // regular.
  const mods = [...loc.submodules];
  mods.unshift({
    fileName: loc.assemblyName,
    fqn: loc.assemblyName,
    identifier: '*',
  });

  const last = mods.length - 1;
  const parent = Math.max(last - 1, 0); // Potentially the same as 'last' if we only have the assembly

  const alias = moduleImportIdentifier(mods[last].fqn, mods.length === 1 ? [loc.assemblyName] : loc.submodules.map(s => s.identifier));
  const expression = [alias, ...loc.namespaceNameParts, loc.simpleName].join('.');

  return {
    importSource: mods[parent].fileName,
    sourceSymbol: mods[last].identifier,
    targetSymbol: alias,
    expression,
  };
}

const KEYWORDS = ['function', 'default', 'arguments', 'enum'];

export function escapeIdentifier(ident: string): string {
  return KEYWORDS.includes(ident) ? `${ident}_` : ident;
}

/**
 * The location where we find a type.
 *
 * Returns as much information as possible so `typeAccess` can freely
 * make whatever choices it wants to render the type access.
 */
interface TypeLocation {
  readonly assemblyName: string;
  readonly namespaceNameParts: string[];
  readonly submodules: SubmoduleLocation[];
  readonly simpleName: string;
}

interface SubmoduleLocation {
  readonly fqn: string;
  readonly identifier: string;
  readonly fileName: string;
}


/**
 * Analyze a type name and return its constituent pats.
 *
 * Turns `asm.b.c.d.Type` into
 *
 * - Assembly: asm
 * - Submodules: [b, c] (if `b.c` are both submodules)
 * - Namespace: d       (if `b.c` are submodulesss. `d` is then a class)
 * - Simplename: Type
 *
 * We find all containing submodules so the caller can make a
 * decision about the purdiest import.
 */
function typeLocation(type: reflect.Type): TypeLocation {
  const containingSubmod = findContainingSubmodule(type.assembly, type.fqn);
  const namespaceNameParts = containingSubmod
    ? type.fqn.slice(containingSubmod.fqn.length + 1).split('.').slice(0, -1)
    : type.fqn.split('.').slice(1, -1);

  // Find all containing submodules, so that
  const submodules: SubmoduleLocation[] = [];
  let submod = containingSubmod;
  while (submod) {
    const parts = submod.fqn.split('.');
    const fileInAssembly = submod.spec.symbolId ? guessModuleFilename(submod) : undefined;

    // Add from the start
    submodules.unshift({
      fqn: submod.fqn,
      identifier: parts.slice(-1)[0],
      fileName: fileInAssembly ? `${type.assembly.name}/${fileInAssembly}` : parts.join('/'),
    });

    submod = findContainingSubmodule(type.assembly, submod.fqn);
  }

  return {
    assemblyName: type.assembly.name, // asm
    submodules,
    namespaceNameParts,
    simpleName: type.name, // Type
  };
}

/**
 * Find the container -- either the assembly itself or a submodule
 */
function findContainingSubmodule(assembly: reflect.Assembly, fqn: string): reflect.Submodule | undefined {
  // For type 'asm.b.c.d.Type' contains ['asm', 'b', 'c', 'd']
  const nsParts = fqn.split('.').slice(0, -1);

  const moduleFqns = new Map(assembly.allSubmodules.map((s) => [s.fqn, s]));

  let split = nsParts.length;
  while (split > 1) {
    const mod = moduleFqns.get(nsParts.slice(0, split).join('.'));
    if (mod) {
      return mod;
    }
    split--;
  }

  return undefined;
}

/**
 * Guess the file name that defines a symbol based on a symbolId
 *
 * What we plan to use this filename for lives outside the domain of jsii, and
 * fully in the domain of the JS/TS module, so we employ some heuristics.
 *
 * In the past, we just guessed that we could transform the FQN into a file path
 * by replacing the `.` with `/`, but that doesn't work for example when we
 * should map `aws_s3` to `aws-s3` (how do we know that?).
 *
 * ## What we'll do
 *
 * In short: we extract the filename from the submodule's `symbolId`, then
 * correlate that with the library's export table in `package.json` (if
 * present).
 *
 * A symbolId has the form `<filename>:<identifier>` (for a submodule
 * <identifier> is empty). So we will extract the filename, and if it ends
 * in `/index` we will strip that.
 *
 * If all else fails we'll fall back to sticking the identifiers together
 * with a `/` in between.
 */
function guessModuleFilename(submod: reflect.Submodule): string | undefined {
  const fileName = (submod.spec.symbolId ?? '').split(':')[0];
  const ts = DirTrackingTypeSystem.from(submod.system);
  const asm = ts.findAssembly(submod.fqn.split('.')[0]); // Silly this isn't easier
  const pj = ts.readPackageJson(asm);

  if (!pj.exports) {
    // If there are no exports, found given file name is the "real" one. Strip `/index` from end
    // for a nicer look.
    return fileName.replace(/\/index$/, '');
  }

  // Otherwise, look up the module from the exports table. Exports table keys and values
  // must always start with `./`; the symbolId will not have that.
  for (const [publicName, privateFile] of Object.entries(pj.exports)) {
    if (`./${fileName}.js` === privateFile) {
      return publicName.slice(2);
    }
  }
  return undefined;
}

/**
 * Generate an import identifier for the given assembly or submodule.
 *
 * Takes into account some well-known aliases for certain specific modules, otherwise
 * builds an identifier from the submodule path.
 */
function moduleImportIdentifier(fqn: string, containingIdentifiers: string[]): string {
  switch (fqn) {
    case 'aws-cdk-lib': return 'cdk';
    case '@aws-cdk/core': return 'cdk';
    case '@aws-cdk/aws-applicationautoscaling': return 'appscaling';
    case '@aws-cdk/aws-elasticloadbalancing': return 'elb';
    case '@aws-cdk/aws-elasticloadbalancingv2': return 'elbv2';
    case 'aws-cdk-lib.aws_applicationautoscaling': return 'appscaling';
    case 'aws-cdk-lib.aws_elasticloadbalancing': return 'elb';
    case 'aws-cdk-lib.aws_elasticloadbalancingv2': return 'elbv2';
  }

  // Escape the identifier path
  const idents = containingIdentifiers
    .filter(x => x)
    .map(ident => ident
      .replace(/^@aws-cdk\//, '')
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^aws_/g, ''));
  return escapeIdentifier(idents.join('_'));
}

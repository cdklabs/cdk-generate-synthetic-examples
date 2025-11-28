import * as reflect from 'jsii-reflect';

import { Code } from './code';
import { typeAccess, escapeIdentifier, TypeAccess } from './module-utils';

/**
 * Return the local part for how we're going to refer to this type
 *
 * This returns a `Code` object that automatically brings its own imports.
 */
export function typeReference(type: reflect.Type) {
  const access = typeAccess(type);
  return new Code(access.expression, [new Import(access)]);
}

export abstract class Declaration {
  constructor(public readonly sortKey: Array<number | string>) {}

  public abstract equals(rhs: Declaration): boolean;
  public abstract render(): string;
}

/**
 * An Import statement that will get rendered at the top of the code snippet.
 */
export class Import extends Declaration {
  public static forType(type: reflect.Type): Import {
    const access = typeAccess(type);

    return new Import(access);
  }

  public constructor(private readonly access: TypeAccess) {
    super([0, access.importSource, access.sourceSymbol]);
  }

  public equals(rhs: Declaration): boolean {
    return this.render() === rhs.render();
  }

  public render(): string {
    let what;
    if (this.access.sourceSymbol === '*') {
      what = `* as ${this.access.targetSymbol}`;
    } else if (this.access.sourceSymbol === this.access.targetSymbol) {
      what = `{ ${this.access.sourceSymbol} }`;
    } else {
      what = `{ ${this.access.sourceSymbol} as ${this.access.targetSymbol} }`;
    }
    return `import ${what} from '${this.access.importSource}';`;
  }
}

/**
 * A declared constant that will be rendered at the top of the code snippet after the imports.
 *
 * Does not automatically bring an `Import`, that needs to be added additionally.
 */
export class Assumption extends Declaration {
  public constructor(private readonly type: reflect.Type, private readonly name: string) {
    super([1, name]);

    if (name !== escapeIdentifier(name)) {
      throw new Error('The name of this variable is a special keyword. call "escapeIdentifier" to escape the keyword.');
    }
  }

  public equals(rhs: Declaration): boolean {
    return this.render() === rhs.render();
  }

  public render(): string {
    return `declare const ${this.name}: ${typeAccess(this.type).expression};`;
  }
}

export class IntersectionAssumption extends Declaration {
  public constructor(private readonly types: reflect.Type[], private readonly name: string) {
    super([1, name]);

    if (name !== escapeIdentifier(name)) {
      throw new Error('The name of this variable is a special keyword. call "escapeIdentifier" to escape the keyword.');
    }
  }

  public equals(rhs: Declaration): boolean {
    return this.render() === rhs.render();
  }

  public render(): string {
    return `declare const ${this.name}: ${this.types.map((t) => `${typeAccess(t).expression}`).join(' & ')};`;
  }
}

/**
 * An assumption for an 'any' time. This will be treated the same as 'Assumption' but with a
 * different render result.
 */
export class AnyAssumption extends Declaration {
  public constructor(private readonly name: string) {
    super([1, name]);

    if (name !== escapeIdentifier(name)) {
      throw new Error('The name of this variable is a special keyword. call "escapeIdentifier" to escape the keyword.');
    }
  }

  public equals(rhs: Declaration): boolean {
    return this.render() === rhs.render();
  }

  public render(): string {
    return `declare const ${this.name}: any;`;
  }
}

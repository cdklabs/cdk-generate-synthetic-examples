import * as fs from 'fs';
import * as path from 'path';
import { Assembly, TypeSystem } from 'jsii-reflect';

/**
 * A TypeSystem subclass that tracks disk locations for the benefit of finding package.json
 *
 * This is temporarily necessary until <https://github.com/aws/jsii/pull/4991>
 * becomes available.
 */
export class DirTrackingTypeSystem extends TypeSystem {
  public static from(x: TypeSystem): DirTrackingTypeSystem {
    if (!(x instanceof DirTrackingTypeSystem)) {
      throw new Error(`${x.constructor.name} is not a DirTrackingTypeSystem`);
    }
    return x;
  }

  public readonly directories = new WeakMap<Assembly, string>();
  private readonly pjCache = new Map<string, any>();

  constructor() {
    super();

    const originalLoadAssembly = (this as any).loadAssembly;
    (this as any).loadAssembly = ((file: string, validate?: boolean, supportedFeatures?: string[]) => {
      const asm = originalLoadAssembly.call(this, file, validate, supportedFeatures);
      this.directories.set(asm, path.dirname(file));
      return asm;
    });
  }

  public readPackageJson(asm: Assembly): PackageJson {
    const dir = this.directories.get(asm);
    if (!dir) {
      throw new Error(`Could not find source directory for assembly: ${asm.name}`);
    }

    const pj = this.pjCache.get(dir);
    if (pj) {
      return pj;
    }

    try {
      const ret = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'));
      this.pjCache.set(dir, ret);
      return ret;
    } catch (e) {
      throw new Error(`Error reading ${dir}/package.json: ${e}`);
    }
  }
}

export interface PackageJson {
  // Actually more complex than this. but this is all we use.
  readonly exports?: Record<string, string>;
}
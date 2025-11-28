import { TypeSystem } from 'jsii-reflect';
import { DirTrackingTypeSystem } from '../src/dir-tracking-typesystem';
import { generateExample } from '../src/generate';


describe('with aws-cdk-lib', () => {
  let ts: DirTrackingTypeSystem;
  beforeEach(async () => {
    ts = new DirTrackingTypeSystem();
    await ts.load('node_modules/aws-cdk-lib', { validate: false });
  });

  test('generate example for doubly nested type', () => {
    const type = findFqn(ts, 'aws-cdk-lib.interfaces.aws_s3.BucketReference');
    const visibleSource = generateExample(type);
    expect(visibleSource).toContain('import { aws_s3 as interfaces_s3 } from \'aws-cdk-lib/interfaces\'');
  });
});

describe('with @aws-cdk/mixins-preview', () => {
  let ts: DirTrackingTypeSystem;
  beforeEach(async () => {
    ts = new DirTrackingTypeSystem();
    await ts.load('node_modules/@aws-cdk/mixins-preview', { validate: false });
  });

  test('generate example alexa mixin', () => {
    const type = findFqn(ts, '@aws-cdk/mixins-preview.aws_sam.mixins.CfnFunctionPropsMixin.AlexaSkillEventProperty');

    const visibleSource = generateExample(type);
    expect(visibleSource).toContain('import { mixins as sam_mixins } from \'@aws-cdk/mixins-preview/aws_sam\';');
  });
});

function findFqn(ts: TypeSystem, fqn: string) {
  const type = ts.findFqn(fqn);
  if (!type.isClassType() && !type.isInterfaceType()) {
    throw new Error('Must be class or interface');
  }
  return type;
}
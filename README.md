## CDK Generate Synthetic Examples

This tool will find all classes in the JSII assembly that don't yet have
any example code associated with them, and will generate a synthetic
example that shows how to instantiate the type. This is a method of last
resort: we'd obviously prefer hand-written examples, but this will make sure
all classes get something usable (which otherwise would not have any
examples at all). It is designed to run during the build of a CDK Construct
Library.

### Install

This tool is published as an npm module, so it can be either installed
locally or globally via:

```bash
npm i -g cdk-generate-synthetic-examples
```

### Usage

Suppose you are in the base directory of your CDK construct, `aws-construct`.
After a successful build, you have a `.jsii` file.
`cdk-generate-synthetic-examples` will generate examples for types without
doc examples and directly modify the assembly.

As part of the command, a `_generated.ts-fixture` file will be added to your
project's `rosetta` directory. This fixture contains the necessary imports
that will ensure compilation when `rosetta:extract` is run.

```bash
npx cdk-generate-synthetic-examples .jsii
```

### With [Rosetta:Extract](https://www.npmjs.com/package/jsii-rosetta)

A common workflow is to run `cdk-generate-synthetic-examples` and then
[`rosetta:extract`](https://www.npmjs.com/package/jsii-rosetta) immediately after to compile and translate the synthetic
examples. The `--extract` flag calls `rosetta` for you and immediately
translates the examples into your directory's `.tabl.json` file.

```bash
npx cdk-generate-synthetic-examples .jsii --extract
```

You can send common `rosetta:extract` options through
`cdk-generate-synthetic-examples` as well.

```bash
npx cdk-generate-synthetic-examples \
  path/to/cdk/directory/.jsii \
  --extract \
  --extract-cache='rosetta-cache.tabl.json' \
  --extract-directory='path/to/cdk/directory'
```

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more
information.

## License

This project is licensed under the Apache-2.0 License.

## CDK Generate Synthetic Examples

This tool will find all classes in the JSII assembly that don't yet have
any example code associated with them, and will generate a synthetic
example that shows how to instantiate the type. This is a method of last
resort: we'd obviously prefer hand-written examples, but this will make sure
all classes get something usable (which otherwise would not have any
examples at all). It is designed to run during the build of a CDK Construct
Library.

### Example

Suppose you are in the base directory of your CDK construct, `aws-construct`.
After a successful build, you have a `.jsii` file. `generate-examples` will
generate examples for types without doc examples and directly modify the
assembly.

```bash
npx cdk-generate-synthetic-examples
```

### Important Flags

Use `append-to` to save translations to an existing tablet file.

```bash
npx cdk-generate-synthetic-examples .jsii --append-to samples.tabl.json
```

Use `cache-from` to resuse translations from the given tablet file.

```bash
npx cdk-generate-synthetic-examples .jsii --cache-from cache.tabl.json
```

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the Apache-2.0 License.


# AWS Parameter Store JSON Writer

[![Build Status](https://travis-ci.org/MattLloyd101/aws-parameter-store-json-writer.svg?branch=master)](https://travis-ci.org/MattLloyd101/aws-parameter-store-json-writer)
[![npm version](https://badge.fury.io/js/aws-parameter-store-json-writer.svg)](https://badge.fury.io/js/aws-parameter-store-json-writer)

A Node.js library that stores JSON in to AWS Parameter Store.

## Usage

```javascript
const AwsParameterStoreJsonWriter = require('aws-parameter-store-json-writer');

const parameterWriter = new AwsParameterStoreJsonWriter({
	"keyId": "arn:aws:kms:us-east-2:123456789012:key/1a2b3c4d-1a2b-1a2b-1a2b-1a2b3c4d5e",
	"prefix": "/ContentManagement/ContentManagementAggregator",
	"secrets": [ /\/ContentManagement\/ContentManagementAggregator\/(dev|prod)\/db\/password/ ],
	"retryOptions": {
		"retries": 5,
		"factor": 3,
		"minTimeout": 1 * 1000,
		"maxTimeout": 60 * 1000
	}
});

const config = {
	"dev": {
		"db": {
			"username": "dev-user",
			"password": "secret-password"
		},
		"tags": ["dev", "database"],
		"ids": [12, 42, 128],
		"objs": [{ "entry": 1 }, { "entry": 2 }, { "entry": 3 }]
	},
	"prod": {
		"db": {
			"username": "prod-user",
			"password": "super-secret-password"
		}
	}
};

async function writeConfig(config) {
	return await parameterWriter.write(config);
}

writeConfig(config);
```

The above will yield the following parameters added:

| Name | Type | Key ID | Value |
| ---- | ---- | ------ | ----- |
| `/ContentManagement/ContentManagementAggregator/dev/db/username` | String | - | dev-user |
| `/ContentManagement/ContentManagementAggregator/dev/db/password` | SecureString | arn:aws:kms:us-east-2:123456789012:key/1a2b3c4d-1a2b-1a2b-1a2b-1a2b3c4d5e | secret-password |
| `/ContentManagement/ContentManagementAggregator/dev/tags` | StringList | - | "dev", "database" |
| `/ContentManagement/ContentManagementAggregator/dev/ids` | StringList | - | "12", "42", "128" |
| `/ContentManagement/ContentManagementAggregator/dev/objs/0/entry` | String | - | "1" |
| `/ContentManagement/ContentManagementAggregator/dev/objs/1/entry` | String | - | "2" |
| `/ContentManagement/ContentManagementAggregator/dev/objs/2/entry` | String | - | "3" |
| `/ContentManagement/ContentManagementAggregator/prod/db/username` | String | - | prod-user |
| `/ContentManagement/ContentManagementAggregator/prod/db/password` | SecureString | arn:aws:kms:us-east-2:123456789012:key/1a2b3c4d-1a2b-1a2b-1a2b-1a2b3c4d5e | super-secret-password |

## Parameter Store Json Writer Configuration

**keyId** – The AWS KMS Key Id you wish to encrypt your secrets with.  
**prefix** – The prefix where you wish to store your JSON.  
**secrets** – A set of Regular Expressions or Strings which match the paths of the keys you wish to be secret.  
**retryOptions** - The Parameter Store Json Writer uses [retry](https://github.com/tim-kos/node-retry) as it's exponential backoff mechanism.

## Versioning

This library uses the [Semver](https://semver.org/) versioning system. The numbers do not relate to maturity but the number of breaking changes introduced.

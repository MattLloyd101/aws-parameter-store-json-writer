# AWS Parameter Store JSON Writer

[![Build Status](https://travis-ci.org/MattLloyd101/aws-parameter-store-json-writer.svg?branch=master)](https://travis-ci.org/MattLloyd101/aws-parameter-store-json-writer)

A Node.js library that stores JSON in to AWS Parameter Store.

## Usage

```javascript
const AwsParameterStoreJsonWriter = require('aws-parameter-store-json-writer');

const parameterWriter = new AwsParameterStoreJsonWriter({
	"keyId": "arn:aws:kms:us-east-2:123456789012:key/1a2b3c4d-1a2b-1a2b-1a2b-1a2b3c4d5e",
	"prefix": "/ContentManagement/ContentManagementAggregator",
	"secrets": [ /\/ContentManagement\/ContentManagementAggregator\/(dev|prod)\/db\/password/ ]
});

const config = {
	"dev": {
		"db": {
			"username": "dev-user",
			"password": "secret-password"
		}
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

## Parameter Store Json Writer Configuration

**keyId** – The AWS KMS Key Id you wish to encrypt your secrets with.  
**prefix** – The prefix where you wish to store your JSON.
**secrets** – A set of Regular Expressions or Strings which match the paths of the keys you wish to be secret.
# AWS Parameter Store JSON Writer

[![Build Status](https://travis-ci.org/MattLloyd101/aws-parameter-store-json-writer.svg?branch=master)](https://travis-ci.org/MattLloyd101/aws-parameter-store-json-writer)

A Node.js library that stores JSON in to AWS Parameter Store.

## Usage as a library

```javascript
const AwsParameterStoreJsonWriter = require('aws-parameter-store-json-writer');

const parameterWriter = new AwsParameterStoreJsonWriter({
	"keyId": "arn:aws:kms:us-east-2:123456789012:key/1a2b3c4d-1a2b-1a2b-1a2b-1a2b3c4d5e",
	"prefix": "/ContentManagement/ContentManagementAggregator",
	"secrets": [ /\/ContentManagement/ContentManagementAggregator\/(dev|prod)\/db\/password/ ]
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

await parameterWriter.write(config);
```
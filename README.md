# AWS Parameter Store JSON Writer

[![Build Status](https://travis-ci.org/MattLloyd101/aws-parameter-store-json-writer.svg?branch=master)](https://travis-ci.org/MattLloyd101/aws-parameter-store-json-writer)
[![npm version](https://badge.fury.io/js/aws-parameter-store-json-writer.svg)](https://badge.fury.io/js/aws-parameter-store-json-writer)
[![dependencies Status](https://david-dm.org/MattLloyd101/aws-parameter-store-json-writer/status.svg)](https://david-dm.org/MattLloyd101/aws-parameter-store-json-writer)
[![devDependencies Status](https://david-dm.org/MattLloyd101/aws-parameter-store-json-writer/dev-status.svg)](https://david-dm.org/MattLloyd101/aws-parameter-store-json-writer?type=dev)

A Node.js library that stores JSON in to AWS Parameter Store.

Meant to be used in conjunction with [aws-parameter-store-json-reader](https://github.com/MattLloyd101/aws-parameter-store-json-reader).

## Installation

via [npm](https://github.com/npm/npm)

```bash
npm install aws-parameter-store-json-writer
```

## Usage

```javascript
const AwsParameterStoreJsonWriter = require('aws-parameter-store-json-writer');

const parameterWriter = new AwsParameterStoreJsonWriter({
    "keyId": "arn:aws:kms:us-east-2:123456789012:key/1a2b3c4d-1a2b-1a2b-1a2b-1a2b3c4d5e",
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
    const prefix = "/ContentManagement/ContentManagementAggregator";
    return await parameterWriter.write(prefix, config);
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

**apiVersion** – (optional) The version of the AWS API you wish to be using.  
**keyId** – (optional) The AWS KMS Key Id you wish to encrypt your secrets with.  
**secrets** – (optional) A set of Regular Expressions or Strings which match the paths of the keys you wish to be secret.  
**retryOptions** - (optional) The Parameter Store Json Writer uses [retry](https://github.com/tim-kos/node-retry) as it's exponential backoff mechanism.

## Versioning

This library uses the [Semver](https://semver.org/) versioning system. The numbers do not relate to maturity but the number of breaking changes introduced.

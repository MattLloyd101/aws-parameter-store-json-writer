"use strict";

const retry = require('retry');
const AWS = require('aws-sdk');

module.exports = class AwsParameterStoreJsonWriter {

    static isStringType(value) {
        const type = typeof value;
        return type === "string" ||
            type === "boolean" ||
            type === "number" ||
            type === "symbol" ||
            value instanceof Date;
    }

    static containsComma(value) {
        return value.toString().indexOf(',') !== -1;
    }

    static isStringList(array) {
        // everything must be a stringable type and nothing can contain a comma.
        return array.every(this.isStringType) && !array.some(this.containsComma);
    }

    static stringValue(value) {
        const isDate = value instanceof Date;
        if(isDate) {
            return value.toISOString();
        }

        return value.toString();
    }

    constructor(configuration) {
        this.configuration = configuration;
        const ssmConfiguration = configuration ? { "apiVersion": configuration.apiVersion } : undefined;

        this.ssm = new AWS.SSM(ssmConfiguration);
    }

    isSecretString(key) {
        const containsSecrets = 'secrets' in this.configuration;
        return containsSecrets && this.configuration.secrets.some((regex) => key.match(regex));
    }

    prepareParameters(params) {
        const overwrite = this.configuration.overwrite === false ? false : true
        return Object.assign(params, {
            "KeyId": this.configuration.keyId,
            "Overwrite": overwrite
        })
    }

    async write(prefix, data) {
        return await this.handleObjectValue(prefix, data);
    }

    async handleObjectValue(prefix, object) {
        const entries = Object.entries(object);

        return Promise.all(entries.map(async (tuple) => {
            const [key, value] = tuple;
            const prefixedKey = prefix + "/" + key;

            return await this.handleEntry(prefixedKey, value);
        }));
    }

    async handleEntry(prefixedKey, value) {
        if(Array.isArray(value)) {
            if(AwsParameterStoreJsonWriter.isStringList(value)) {
                return await this.handleStringListValue(prefixedKey, value);
            } else {
                return await this.handleArrayValue(prefixedKey, value);
            }
        }

        const isDate = value instanceof Date;

        if(typeof value === "object" && !isDate) {
            return await this.handleObjectValue(prefixedKey, value);
        }

        return await this.handleStringValue(prefixedKey, value);
    }

    putParameter(parameters) {
        var operation = retry.operation(this.configuration.retryConfig);
        const This = this;
        return new Promise((resolve, reject) => {

            operation.attempt(function () {
                return This.ssm.putParameter(parameters, function (err, data) {
                    if(err) {
                        const isThrottled = err.code === "ThrottlingException";
                        const shouldRetry = operation.retry(err)
                        if (isThrottled && shouldRetry) {
                            return
                        } else {
                            operation.stop();
                            return reject(err);
                        }
                    }

                    resolve(data);
                });
            });

        });
    }

    async handleStringValue(key, value) {
        const isSecret = this.isSecretString(key);
        
        const parameters = this.prepareParameters({
            "Name": key,
            "Type": isSecret ? "SecureString" : "String",
            "Value": AwsParameterStoreJsonWriter.stringValue(value)
        });

        return this.putParameter(parameters);
    }

    async handleStringListValue(key, stringList) {
        const stringListValue = stringList.map(AwsParameterStoreJsonWriter.stringValue).join(',');
        
        const parameters = this.prepareParameters({
            "Name": key,
            "Type": "StringList",
            "Value": stringListValue
        });

        return this.putParameter(parameters);
    }

    async handleArrayValue(prefix, array) {
        return Promise.all(array.map(async (value, index) => {
            const prefixedKey = prefix + "/" + index;
            return await this.handleEntry(prefixedKey, value);
        }));
    }
};
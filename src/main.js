"use strict";

const AwsParameterStoreJsonWriter = require('./AwsParameterStoreJsonWriter');

const parameterWriter = new AwsParameterStoreJsonWriter({
	"prefix": "/Test",
	"secrets": [ "/dev/db/password", "/prod/db/password" ]
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

const write = async function () {
	try {
		const response = await parameterWriter.write(config);
		return response;
	}
	catch (err) {
		console.log("Oops!", err);
	}
}

write();
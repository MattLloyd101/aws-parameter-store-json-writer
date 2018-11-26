const chai = require('chai')
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.should();
chai.use(sinonChai);

const AWS = require('aws-sdk');
const AwsParameterStoreJsonWriter = require('../src/AwsParameterStoreJsonWriter');

const realSSM = AWS.SSM;

async function withSSMStub() {
	let body, fakeSSMInstance;
	if(arguments.length === 1) {
		body = arguments[0];
		fakeSSMInstance = {
			putParameter: function () {}
		};
	} else if(arguments.length === 2) {
		fakeSSMInstance = arguments[0];
		body = arguments[1];
	}

	const stub = AWS.SSM = sinon.stub(AWS.SSM, 'constructor').returns(fakeSSMInstance);
	
	if (body[Symbol.toStringTag] === 'AsyncFunction') {
		await body(stub, fakeSSMInstance);
	} else {
		body(stub, fakeSSMInstance);
	}
};

function containsNameValueType(ssm, name, type, value) {
	ssm.putParameter.should.have.been.calledWith(sinon.match.has("Name", name));
	ssm.putParameter.should.have.been.calledWith(sinon.match.has("Type", type));
	ssm.putParameter.should.have.been.calledWith(sinon.match.has("Value", value));
}

describe('AwsParameterStoreJsonWriter', () => {
	const configuration = {
		"keyId": "arn:aws:kms:us-east-2:123456789012:key/1a2b3c4d-1a2b-1a2b-1a2b-1a2b3c4d5e",
		"apiVersion": '2014-11-06',
		"secrets": [ /\/path\/\d+\/password/ ]
	};

	after(() => {
		AWS.SSM = realSSM;
	});

	describe('constructor()', () => {

		it('should not return null', () => {
			AwsParameterStoreJsonWriter.should.not.be.null
		});
		it('should assign the configuration', () => {
			const parameterWriter = new AwsParameterStoreJsonWriter(configuration);
			parameterWriter.configuration.should.equal(configuration);
		});
		it('should instanciate an AWS SSM instance with config', async () => {
			await withSSMStub((stub, ssm) => {

				const parameterWriter = new AwsParameterStoreJsonWriter(configuration);

				stub.should.have.been.calledWithNew;
				stub.getCall(0).args[0].should.be.equal(configuration.apiVersion);
				parameterWriter.ssm.should.be.equal(ssm);
			});
		});
		it('should instanciate an AWS SSM instance without config', async () => {
			await withSSMStub((stub, ssm) => {
				const parameterWriter = new AwsParameterStoreJsonWriter();

				stub.should.have.been.calledWithNew;
				expect(stub.getCall(0).args[0]).to.be.undefined;
				parameterWriter.ssm.should.be.equal(ssm);
			});
		});
	});

	describe('isStringList()', () => {
		it('should return true for arrays of strings', () => {
			const result = AwsParameterStoreJsonWriter.isStringList(["a", "b", "c"]);
			result.should.be.true;
		});

		it('should return true for arrays of symbols', () => {
			const result = AwsParameterStoreJsonWriter.isStringList([Symbol("a"), Symbol("b"), Symbol("c")]);
			result.should.be.true;
		});

		it('should return true for arrays of integers', () => {
			const result = AwsParameterStoreJsonWriter.isStringList([1, 2, 3]);
			result.should.be.true;
		});

		it('should return true for arrays of Numbers', () => {
			const result = AwsParameterStoreJsonWriter.isStringList([1.0, 2.0, 3.0]);
			result.should.be.true;
		});

		it('should return true for arrays of booleans', () => {
			const result = AwsParameterStoreJsonWriter.isStringList([true, false]);
			result.should.be.true;
		});

		it('should return true for arrays of Dates', () => {
			const result = AwsParameterStoreJsonWriter.isStringList([new Date(), new Date()]);
			result.should.be.true;
		});

		it('should return true for mixed arrays', () => {
			const result = AwsParameterStoreJsonWriter.isStringList(["a", 1, 1.0, true, new Date()]);
			result.should.be.true;
		});

		it('should return false if it contains an object', () => {
			const result = AwsParameterStoreJsonWriter.isStringList(["a", 1, 1.0, {}, true, new Date()]);
			result.should.be.false;
		});
	});

	describe('write()', () => {
		let ssm;
		let parameterWriter;

		beforeEach(() => {
			const putParameterStub = function (data, callback) {
				callback(null, { "Version": 1 });
			};
			ssm = { putParameter: sinon.spy(putParameterStub) };
		});

		it('should call putParameter with the keyId', async () => {
			await withSSMStub(ssm, async (stub) => {
				parameterWriter = new AwsParameterStoreJsonWriter(configuration);
				const simpleJson = {
					"key": "value"
				};

				await parameterWriter.write(simpleJson);

				ssm.putParameter.should.have.been.calledWith(sinon.match.has("KeyId", configuration.keyId));
			});
		});

		it('should call putParameter with Overwrite enabled by default', async () => {
			await withSSMStub(ssm, async (stub) => {
				parameterWriter = new AwsParameterStoreJsonWriter(configuration);
				const simpleJson = {
					"key": "value"
				};

				await parameterWriter.write(simpleJson);

				ssm.putParameter.should.have.been.calledWith(sinon.match.has("Overwrite", true));
			});
		});

		it('should call putParameter with Overwrite overridden', async () => {
			await withSSMStub(ssm, async (stub) => {
				const overwriteConfiguration = Object.assign({ "overwrite": false }, configuration)
				parameterWriter = new AwsParameterStoreJsonWriter(overwriteConfiguration);
				const simpleJson = {
					"key": "value"
				};

				await parameterWriter.write(simpleJson);

				ssm.putParameter.should.have.been.calledWith(sinon.match.has("Overwrite", false));
			});
		});

		it('should call putParameter with a prefix value', async () => {
			await withSSMStub(ssm, async (stub) => {
				const prefixConfiguration = Object.assign({ "prefix": "/ContentManagement/ContentManagementAggregator" }, configuration)
				parameterWriter = new AwsParameterStoreJsonWriter(prefixConfiguration);
				const simpleJson = {
					"key": "value"
				};

				await parameterWriter.write(simpleJson);

				containsNameValueType(ssm, "/ContentManagement/ContentManagementAggregator/key", "String", "value");
			});
		});

		it('should call putParameter once for a simple string value', async () => {
			await withSSMStub(ssm, async (stub) => {
				parameterWriter = new AwsParameterStoreJsonWriter(configuration);
				const simpleJson = {
					"key": "value"
				};

				await parameterWriter.write(simpleJson);

				containsNameValueType(ssm, "/key", "String", "value");
			});
		});

		it('should call putParameter once for a simple boolean value', async () => {
			await withSSMStub(ssm, async (stub) => {
				parameterWriter = new AwsParameterStoreJsonWriter(configuration);
				const simpleJson = {
					"key": true
				};

				await parameterWriter.write(simpleJson);

				containsNameValueType(ssm, "/key", "String", "true");
			});
		});

		it('should handle regular expressions for secrets', async () => {
			await withSSMStub(ssm, async (stub) => {
				parameterWriter = new AwsParameterStoreJsonWriter(configuration);
				const simpleJson = {
					"path": [{ "password": "a" }, { "password": "b" }, { "password": "c" }]
				};

				await parameterWriter.write(simpleJson);

				ssm.putParameter.should.have.been.calledThrice

				containsNameValueType(ssm, "/path/0/password", "SecureString", "a");
				containsNameValueType(ssm, "/path/1/password", "SecureString", "b");
				containsNameValueType(ssm, "/path/2/password", "SecureString", "c");
			});
		});

		it('should call putParameter once for a simple int value', async () => {
			await withSSMStub(ssm, async (stub) => {
				parameterWriter = new AwsParameterStoreJsonWriter(configuration);
				const simpleJson = {
					"integer": 42
				};

				await parameterWriter.write(simpleJson);

				containsNameValueType(ssm, "/integer", "String", "42");
			});
		});

		it('should call putParameter once for a date value', async () => {
			await withSSMStub(ssm, async (stub) => {
				parameterWriter = new AwsParameterStoreJsonWriter(configuration);
				const now = new Date();
				const simpleJson = {
					"date": now
				};

				await parameterWriter.write(simpleJson);

				containsNameValueType(ssm, "/date", "String", now.toISOString());
			});
		});

		it('should call putParameter once for a string list', async () => {
			await withSSMStub(ssm, async (stub) => {
				parameterWriter = new AwsParameterStoreJsonWriter(configuration);
				const simpleJson = {
					"string-list": ["a", "b", "c"]
				};

				await parameterWriter.write(simpleJson);

				containsNameValueType(ssm, "/string-list", "StringList", "a,b,c");
			});
		});

		it('should handle nested json keys', async () => {
			await withSSMStub(ssm, async (stub) => {
				parameterWriter = new AwsParameterStoreJsonWriter(configuration);
				const simpleJson = {
					"path1": {
						"path2": {
							"path3": "value"
						}
					}
				};

				await parameterWriter.write(simpleJson);

				containsNameValueType(ssm, "/path1/path2/path3", "String", "value");
			});
		});

		it('should handle Arrays with nested json keys', async () => {
			await withSSMStub(ssm, async (stub) => {
				parameterWriter = new AwsParameterStoreJsonWriter(configuration);
				const simpleJson = {
					"path": [{ "db": "a" }, { "db": "b" }, { "db": "c" }]
				};

				await parameterWriter.write(simpleJson);

				ssm.putParameter.should.have.been.calledThrice

				containsNameValueType(ssm, "/path/0/db", "String", "a");
				containsNameValueType(ssm, "/path/1/db", "String", "b");
				containsNameValueType(ssm, "/path/2/db", "String", "c");
			});
		});
	});
});
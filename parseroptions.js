"use strict";

module.exports = [ {
	name: 'version',
	type: 'bool',
	help: 'Print version and exit.'
}, {
	names: [ 'help', 'h' ],
	type: 'bool',
	help: 'Print this help and exit.'
}, {
	names: [ 'verbose', 'v' ],
	type: 'bool',
	help: 'Enable verbose output.'
}, {
	name: 'token',
	type: 'string',
	env: 'DO_TOKEN',
	help: 'Specifies your DO API token.',
	helpArg: 'TOKEN'
}, {
	name: 'fromfile',
	type: 'arrayOfString',
	help: 'Allows you to read a given value from a file, eg: --fromfile=userdata,~/user-data'
}, {
	name: 'json',
	type: 'bool',
	help: 'Output responses in raw JSON.'
}, {
	name: 'pretty',
	type: 'bool',
	help: 'If set, will output more human-readable JSON.'
}, {
	name: 'stdin',
	type: 'bool',
	help: 'If set, will read the request body from stdin.'
}, {
	name: 'wait',
	type: 'bool',
	help: 'If set, will wait for the created action to complete. Eg: when creating a droplet will wait for successful creation.'
} ];
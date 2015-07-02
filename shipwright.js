#!/usr/bin/env node
"use strict";

var async = require( 'async' );
var dashdash = require( 'dashdash' );
var fs = require( 'fs' );
var osenv = require( 'osenv' );
var path = require( 'path' );
var prettyjson = require( 'prettyjson' );
var req = require( 'request' ).defaults( {
	baseUrl: 'https://api.digitalocean.com/v2/',
	json: true
} );
var untildify = require( 'untildify' );
var val = require( './val' );

var scriptName = path.basename( __filename );

var parserOptions = require( './parseroptions' );

var parser = dashdash.createParser( {
	options: parserOptions
} );

try {
	var opts = parser.parse( process.argv );
}
catch ( exception ) {
	console.error( exception.message );
	process.exit( 1 );
}

var args = opts._args;

if ( opts.version ) {
	var pkg = require( './package.json' );
	console.log( scriptName + ' v' + pkg.version );
	process.exit( 0 );
}

if ( opts.help || args.length < 2 ) {
	var help = parser.help( {
		includeEnv: true
	} ).trimRight();

	console.log( 'usage: node ' + scriptName + ' [OPTIONS] OPERATION RESOURCE [ARGS]\n' + 'options:\n' + help );
	process.exit( 0 );
}

var operationAliases = {
	'create': 'POST',
	'destroy': 'DELETE'
};

var operation = args.shift();
operation = operationAliases[ operation.toLowerCase() ] || operation;

var resource = args.shift();
var requestData = null;
var responseData = null;
var finalQuery = null;
var output = null;

async.series( [

	// check if we need to read token from disk
	function( next ) {
		if ( opts.token ) {
			next();
			return;
		}

		var tokenFile = path.join( osenv.home(), '.digitalocean.token' );
		if ( !fs.existsSync( tokenFile ) ) {
			next();
			return;
		}

		var tokenFileContent = fs.readFileSync( tokenFile, 'utf8' );
		if ( !tokenFileContent ) {
			next();
			return;
		}

		var lines = tokenFileContent.split( '\n' );
		if ( !lines.length ) {
			next();
			return;
		}

		opts.token = lines[ 0 ].trim();
		next();
	},

	// check if we have a token
	function( next ) {
		if ( !opts.token ) {
			next( 'You must specify a DigitalOcean API token, either via the --token option, the DO_TOKEN environment variable or in ~/.digitalocean.token' );
			return;
		}

		next();
	},

	// see if we need to read the request body from stdin
	function( next ) {
		if ( !( opts.stdin || !process.stdin.isTTY ) ) {
			next();
			return;
		}

		var input = '';

		process.stdin.setEncoding( 'utf8' );

		process.stdin.on( 'readable', function() {
			var chunk = process.stdin.read();
			if ( chunk !== null ) {
				input += chunk;
			}
		} );

		process.stdin.on( 'end', function() {
			var error = null;
			try {
				requestData = JSON.parse( input );
			} catch( exception ) {
				error = exception.message;
			}

			next( error );
		} );
	},

	// check for parameters to add to request data
	function( next ) {
		var nameValueRegex = new RegExp( /^(.*?)=(.*)$/ );

		var arg = args.shift();
		while( arg ) {
			var match = nameValueRegex.exec( arg );
			if ( !match || match.length !== 3 ) {
				next( 'Unparsable parameter: ' + arg );
				return;
			}

			var name = match[ 1 ];
			var value = val( match[ 2 ] );

			requestData = requestData || {};
			requestData[ name ] = value;

			arg = args.shift();
		}

		next();
	},

	// check if we need to read any parameters from files
	function( next ) {
		if ( !opts.fromfile ) {
			next();
			return;
		}

		var paramsFromFiles = opts.fromfile;
		var nameValueRegex = new RegExp( /^(.*?),(.*)$/ );

		var paramFromFile = paramsFromFiles.shift();
		while( paramFromFile ) {
			var match = nameValueRegex.exec( paramFromFile );
			if ( !match || match.length !== 3 ) {
				next( 'Unparsable fromfile parameter: ' + paramFromFile );
				return;
			}

			var name = match[ 1 ];
			var filename = path.resolve( untildify( match[ 2 ] ) );

			if ( !fs.existsSync( filename ) ) {
				next( 'File does not exist: ' + filename );
				return;
			}

			var value = fs.readFileSync( filename, 'utf8' );
			requestData = requestData || {};
			requestData[ name ] = value ? value.trim() : null;

			paramFromFile = paramsFromFiles.shift();
		}

		next();
	},

	// make the request to DO
	function( next ) {
		var request = {
			method: operation.toUpperCase(),
			uri: resource,
			headers: {
				'Authorization': 'Bearer ' + opts.token
			}
		};

		if ( opts.verbose ) {
			console.log( "Request data: " );
			console.log( JSON.stringify( requestData, null, 4 ) );
		}

		if ( requestData ) {
			if ( operation.toUpperCase() === 'GET' ) {
				request.qs = requestData;
			}
			else {
				request.body = requestData;
			}
		}

		req( request, function( error, response, body ) {
			if ( error ) {
				next( error );
				return;
			}

			if ( response.statusCode >= 400 && response.statusCode < 600 ) {
				next( body );
				return;
			}

			if ( !body ) {
				next( 'no response body' );
				return;
			}

			responseData = body;

			output = opts.json ? JSON.stringify( responseData, null, opts.pretty ? 4 : 0 ) : prettyjson.render( responseData, {} );

			next();
		} );
	},

	function( next ) {
		if ( !opts.wait ) {
			next();
			return;
		}

		var action = responseData.links.actions[ 0 ];

		var request = {
			method: 'GET',
			uri: 'actions/' + action.id,
			headers: {
				'Authorization': 'Bearer ' + opts.token
			}
		};

		(function checkAction() {
			req( request, function( error, response, body ) {
				if ( error ) {
					next( error );
					return;
				}

				if ( body.action.status.toLowerCase() === 'completed' ) {
					finalQuery = body.action.resource_type + 's/' + body.action.resource_id; // note the pluralization before the slash
					next();
					return;
				}

				if ( body.action.status.toLowerCase() === 'errored' ) {
					next( 'Action errored!' );
					return;
				}

				setTimeout( checkAction, 1000 );
			} );
		})();
	},

	// check if we have a final query to put into the output
	function( next ) {
		if ( !finalQuery ) {
			next();
			return;
		}

		var request = {
			method: 'GET',
			uri: finalQuery,
			headers: {
				'Authorization': 'Bearer ' + opts.token
			}
		};

		req( request, function( error, response, body ) {
			if ( error ) {
				next( error );
				return;
			}

			responseData = body;

			output = opts.json ? JSON.stringify( responseData, null, opts.pretty ? 4 : 0 ) : prettyjson.render( responseData, {} );

			next();
		} );
	}
], function( error ) {
	if ( error ) {
		console.error( error );
		process.exit( 1 );
	}

	if ( output ) {
		console.log( output );
	}

	process.exit( 0 );
} );

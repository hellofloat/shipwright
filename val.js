"use strict";

var conversions = [ {
	match: /^\d+$/,
	transform: function( str ) {
		return parseInt( str, 10 );
	}
}, {
	match: /^\d+\.\d+$/,
	transform: function( str ) {
		return parseFloat( str, 10 );
	}
}, {
	match: /^true$/i,
	transform: function() {
		return true;
	}
}, {
	match: /^false$/i,
	transform: function() {
		return false;
	}
}, {
	match: /^(null|NULL)$/,
	transform: function() {
		return null;
	}
}, {
	match: /^\[.*?\]$/,
	transform: function( str ) {
		return str.substring( 1, str.length - 1 ).split( ',' );
	}
} ];

module.exports = function( str ) {
	var value = str;
	
	conversions.some( function( conversion ) {
		if ( conversion.match.test( str ) ) {
			value = conversion.transform( str );
			return true;
		}
		
		return false;
	} );

	return value;
};
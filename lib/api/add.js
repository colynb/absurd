module.exports = function(API) {
	var checkAndExecutePlugin = function(selector, prop, value, stylesheet) {
		var plugin = API.getPlugins()[prop];
		if(typeof plugin !== 'undefined') {
			var pluginResponse = plugin(API, value);
			if(pluginResponse) {
				addRule(selector, pluginResponse, stylesheet);
			}
			return true;
		} else {
			return false;
		}
	}
	var clearing = function(props) {
		// plugins
		var plugins = API.getPlugins();
		for(var prop in props) {
			if(typeof plugins[prop] !== 'undefined') {
				props[prop] = false;
			}
		}
		// pseudo classes
		for(var prop in props) {
			if(prop.charAt(0) === ":") {
				props[prop] = false;
			}
		}
		// ampersand 
		for(var prop in props) {
			if(/&/g.test(prop)) {
				props[prop] = false;
			}
		}
	}
	var checkForNesting = function(selector, props, stylesheet) {
		for(var prop in props) {
			if(typeof props[prop] === 'object') {
				// check for pseudo classes
				if(prop.charAt(0) === ":") {
					addRule(selector + prop, props[prop], stylesheet);
			    // check for ampersand operator
				} else if(/&/g.test(prop)) {
					addRule(prop.replace(/&/g, selector), props[prop], stylesheet);
				// check for media query
				} else if(prop.indexOf("@media") === 0 || prop.indexOf("@supports") === 0) {
					addRule(selector, props[prop], prop);
				// check for plugins
				} else if(checkAndExecutePlugin(selector, prop, props[prop], stylesheet) === false) {
					addRule(selector + " " + prop, props[prop], stylesheet);
				}
				props[prop] = false;
			} else if(typeof props[prop] === 'function') {
				props[prop] = props[prop]();
				checkForNesting(selector, props, stylesheet);
			} else {
				if(checkAndExecutePlugin(selector, prop, props[prop], stylesheet)) {
					props[prop] = false;
				}
			}
		}
	}
	var addRule = function(selector, props, stylesheet) {

		// if array is passed as props
		if(typeof props.length !== 'undefined' && typeof props === "object") {
			for(var i=0; prop=props[i]; i++) {
				addRule(selector, prop, stylesheet);
			}
			return;
		}
 
		// check for plugin
		if(checkAndExecutePlugin(null, selector, props, stylesheet)) {
			return;	
		}

		// if the selector is already there
		if(typeof API.getRules(stylesheet || "mainstream")[selector] == 'object') {
			var current = API.getRules(stylesheet || "mainstream")[selector];
			for(var propNew in props) {
				// overwrite already added value
				if(typeof props[propNew] != 'object') {
					current[propNew] = props[propNew];
				}
			}
		// no, the selector is still not added
		} else {
			API.getRules(stylesheet || "mainstream")[selector] = props;
		}

		checkForNesting(selector, props, stylesheet || "mainstream");
		clearing(props);
		
	}
	var extend = function(destination, source) {
		for (var key in source) {
			if (hasOwnProperty.call(source, key)) {
				destination[key] = source[key];
			}
		}
		return destination;
	};
	var prepareRules = function(obj) {
		if(obj instanceof Array) {
			for(var i=0; i<obj.length; i++) {
				prepareRules(obj[i]);
			}
			return;
		}
		for(var prop in obj) {
			var value = obj[prop];
			if(typeof value == 'object') {
				prepareRules(value);
			}
			if(/, ?/g.test(prop)) {
				var parts = prop.replace(/, /g, ',').split(',');
				for(var i=0; i<parts.length, p=parts[i]; i++) {
					obj[p] = extend({}, value);
				}
				delete obj[prop];
			}
		}
	}
	var add = function(rules, stylesheet) {
		API.numOfAddedRules += 1;
		prepareRules(rules);
		for(var selector in rules) {
			if(rules[selector] instanceof Array) {
				for(var i=0; i<rules[selector].length, r=rules[selector][i]; i++) {
					addRule(selector, r, stylesheet || "mainstream");
				}
			} else {
				addRule(selector, rules[selector], stylesheet || "mainstream");
			}
		}
		return API;
	}
	return add;
}
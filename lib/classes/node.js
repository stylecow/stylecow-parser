"use strict";

var stylecow = require('../index');
var _parent = Symbol('Parent');

/**
 * Class with common methods for nodes
 */
class Node {
	constructor(type, className) {
		this.type = type;
		this.class = className || type;
		this.data = {};
	}

	clone (data) {
		var clone = new stylecow[this.class]();

		if (data !== true) {
			clone.data = this.data;
		}

		return clone;
	}

	cloneBefore () {
		var clone = this.clone();
		this.before(clone);
		return clone;
	}

	cloneAfter () {
		var clone = this.clone();
		this.after(clone);
		return clone;
	}

	is (match) {
		if (!match) {
			return true;
		}

		if (typeof match === 'string') {
			return equals(this.type, match);
		}

		if (match instanceof Function) {
			return match.call(this);
		}

		for (var k in match) {
			if (k === 'string') {
				if (!equals(this.toString(), match.string)) {
					return false;
				}
			} else if ((this[k] !== undefined) && !equals(this[k], match[k])) {
				return false;
			}
		}

		return true;
	}

	getParent (match) {
		if (this[_parent]) {
			if (!match || this[_parent].is(match)) {
				return this[_parent];
			}

			return this[_parent].getParent(match);
		}
	}

	hasParent (match) {
		return (this[_parent] && (!match || this[_parent].is(match)));
	}

	setParent (parent) {
		this[_parent] = parent;
	}

	getSiblings (match) {
		var parent = this[_parent];
		var result = new Collection();

		if (!parent) {
			return result;
		}

		for (var i = 0, t = parent.length; i < t; ++i) {
			if (parent[i] !== this && parent[i].is(match)) {
				result.push(this[i]);
			}
		};

		return result;
	}

	hasSibling (match) {
		var parent = this[_parent];

		if (!parent) {
			return false;
		}

		for (var i = 0, t = parent.length; i < t; ++i) {
			if (parent[i] !== this && parent[i].is(match)) {
				return true;
			}
		}

		return false;
	}

	getSibling (match) {
		var parent = this[_parent];

		if (parent) {
			for (var i = 0, t = parent.length; i < t; ++i) {
				if (parent[i] !== this && parent[i].is(match)) {
					return parent[i];
				}
			}
		}
	}

	setSource (token) {
		this.data.line = token.curr[1];
		this.data.col = token.curr[2];
		this.data.file = token.file;

		return this;
	}

	getData (key) {
		if (key in this.data) {
			return this.data[key];
		}

		if (this[_parent]) {
			return this[_parent].getData(key);
		}
	}

	getAllData (key, result) {
		result = result || [];

		if (key in this.data) {
			result.push(this.data[key]);
		}

		if (this[_parent]) {
			this[_parent].getAllData(key, result);
		}

		return result;
	}

	setData (key, value) {
		this.data[key] = value;

		return this;
	}

	index () {
		if (this[_parent]) {
			return this[_parent].indexOf(this);
		}

		return -1;
	}

	next () {
		var index = this.index();

		if (index !== -1) {
			return this[_parent][index + 1];
		}
	}

	prev () {
		var index = this.index();

		if (index > 0) {
			return this[_parent][index - 1];
		}
	}

	before (child) {
		var index = this.index();

		if (index !== -1) {
			return this[_parent].splice(index, 0, child);
		}
	}

	after (child) {
		var index = this.index();

		if (index !== -1) {
			if (index === this[_parent].length) {
				return this[_parent].push(child);
			}

			return this[_parent].splice(index + 1, 0, child);
		}
	}

	replaceWith (child) {
		var index = this.index();

		if (index !== -1) {
			var parent = this[_parent];
			this.remove();

			return parent.splice(index, 0, child);
		}
	}

	remove () {
		return this.detach();
	}

	detach () {
		if (this[_parent]) {
			var index = this.index();

			if (index !== -1) {
				this[_parent].splice(index, 1);
				this[_parent] = null;
			}
		}

		return this;
	}

	toAst () {
		var object = {
			class: this.class
		};

		if ('name' in this) {
			object.name = (this.name === undefined) ? null : this.name;
		}

		if ('vendor' in this) {
			object.vendor = (this.vendor === undefined) ? null : this.vendor;
		}

		if (this instanceof Array) {
			object.children = [];

			this.forEach(function (child) {
				object.children.push(child.toAst());
			});
		}

		return object;
	}

	getContextVendor () {
		if (('vendor' in this) && this.vendor) {
			return this.vendor;
		}

		if (this instanceof Collection) {
			var vendor;

			for (var i = 0, t = this.length; i < t; i++) {
				if (this[i].type !== 'Block' && this[i].type !== 'Comment') {
					vendor = this[i].getContextVendor();

					if (vendor) {
						return vendor;
					}
				}
			}
		}
	}

	normalizeVendors (vendor) {
		if (vendor === undefined) {
			vendor = this.getContextVendor() || null;
		}

		var k = 0;

		while (this[k]) {
			var child = this[k];

			if (child.type === 'Block') {
				child.normalizeVendors(vendor);
			} else if (child.type !== 'Comment') {
				let contextVendor = child.getContextVendor();

				if (contextVendor && vendor && (contextVendor !== vendor)) {
					child.detach();
					continue;
				}

				child.normalizeVendors(contextVendor || vendor);
			}

			++k;
		}

		return this;
	}
}

function equals (value, needle) {
	if (needle === true) {
		return value ? true : false;
	}

	if (needle === false) {
		return value ? false : true;
	}

	if (typeof needle === 'string') {
		return (needle === value);
	}

	if (needle instanceof Array) {
		return (needle.indexOf(value) !== -1);
	}

	if (needle instanceof RegExp) {
		return needle.test(value);
	}

	return true;
}

module.exports = Node;
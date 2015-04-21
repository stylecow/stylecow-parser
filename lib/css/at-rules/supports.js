(function (stylecow) {

	stylecow.Supports = function () {
		this.class = 'Supports';
		this.type = 'AtRule';
		this.name = 'supports';
		this.data = {};
	};

	stylecow.Supports.create = function (reader) {
		var t = stylecow.Tokens;

		if (reader.currToken[0] === t.AT && reader.nextToken[0] === t.NAME && reader.nextToken[3] === 'supports') {
			var element = (new stylecow.Supports()).setSource(reader);
			reader.move();
			reader.move();

			element.push(stylecow.ConditionalSelector.create(reader) || reader.error());
			element.push(stylecow.Block.create(reader) || reader.error());

			return element;
		}
	};

	stylecow.Supports.prototype = Object.create(stylecow.prototypes.NodeCollectionWithName, {
		toString: {
			value: function () {
				return '@' + this.name + ' ' + this.join(' ');
			}
		},

		toCode: {
			value: function (code) {
				code.appendStyle('at-rule-before');
				code.append('@' + this.name + ' ', this);

				this.forEach(function (child, k) {
					child.toCode(code);
				});
				code.appendStyle('at-rule-after');
			}
		}
	});

})(require('../../index'));
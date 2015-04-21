(function (stylecow) {

	stylecow.ConditionalSelector = function () {
		this.class = 'ConditionalSelector';
		this.type = 'ConditionalSelector';
		this.data = {};
	};

	stylecow.ConditionalSelector.create = function (reader) {
		var t = stylecow.Tokens;
		var element = (new stylecow.ConditionalSelector()).setSource(reader);

		// not|only operators
		if (reader.currToken[0] === t.NAME && (reader.currToken[3].toLowerCase() === 'only' || reader.currToken[3].toLowerCase() === 'not')) {
			element.push(stylecow.Keyword.create(reader) || reader.error());
		}

		while (reader.currToken[0] !== t.EOT) {
			element.push(stylecow.ConditionalExpression.create(reader) || reader.error());

			// and|or
			if (reader.currToken[0] === t.NAME && (reader.currToken[3].toLowerCase() === 'and' || reader.currToken[3].toLowerCase() === 'or')) {
				element.push(stylecow.Keyword.create(reader) || reader.error());
			} else {
				break;
			}
		}

		return element;
	};

	stylecow.ConditionalSelector.prototype = Object.create(stylecow.prototypes.NodeCollection, {
		toString: {
			value: function () {
				return this.join(' ');
			}
		},

		toCode: {
			value: function (code) {
				var latest = this.length - 1;

				this.forEach(function (child, k) {
					child.toCode(code);

					if (k !== latest) {
						code.append(' ');
					}
				});
			}
		}
	});
})(require('../../index'));
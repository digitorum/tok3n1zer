(function (root, fabric) {
    if (typeof root.define === 'function' && root.define.amd) {
        root.define('tok3n1zer/lib/produce', ['tok3n1zer/lib/States'], fabric);
    } else if (typeof module != 'undefined' && module.exports) {
        module.exports = fabric(require('./parserStates.js'));
    } else {
        root.Tok3n1zerProduce = fabric(root.Tok3n1zerStates);
    }
})(
    this,
    function (States) {

        /**
         * Обработчик результата
         *
         * @constructor
         * @param {any} result
         */
        function Produce(result) {
            this._data = result;
        }

        /**
         * Получить исходную строку
         *
         * @returns {string}
         */
        Produce.prototype.getSourceString = function () {
            return this._data.map(function (v) {
                return v.value;
            }).join("");
        }

        /**
         * Получить псевдокод результата
         *
         * @returns {string}
         */
        Produce.prototype.getPseudoCode = function () {
            return this._data.map(function (v) {
                switch (v.state) {
                    case States.STATE_TAG_FULL:
                        return ' {TAG} ';
                        break;
                    case States.STATE_TEXT_QUOTE_OPEN:
                        return ' {OPEN_QUOTE} ';
                        break;
                    case States.STATE_TEXT_QUOTE_CLOSE:
                        return ' {CLOSE_QUOTE} ';
                        break;
                    case States.STATE_TEXT_SENTENCE_END:
                        return ' {SENTENCE_POSSIBLE_END} ';
                        break;
                    case States.STATE_TEXT_NOT_LETTER:
                        return ' {CHAR} ';
                        break;
                    default:
                        return v.value;
                }
            }).join("").replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
        }
        
        return Produce;
    }
);
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
                    case States.STATE_TEXT_HTML_ENTITY:
                        return ' {ENTITY} ';
                    case States.STATE_TEXT_SPACE:
                        return ' ';
                        break;
                        break;
                    default:
                        return v.value;
                }
            }).join("").replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
        }

        /**
         * Собрать набор предложений внутри текста.
         *
         * @returns {array}
         */
        Produce.prototype.getSentencesList = function () {
            // Обходим текст с конца.
            var len = this._data.length;
            var sentence = [];
            var list = [];

            for (var i = len - 1; i >= 0; --i) {
                var buff = this._data[i];

                if (buff.state == States.STATE_TEXT_QUOTE_CLOSE) {
                    var qpos = 0;

                    // Найдена закрывающая кавычка.
                    // Нужно пройти от текущего элемента до самой дальней открывающей кавычки, но не должно быть пересещения с закрывающими кавычками.
                    for (var j = i - 1; j >= 0; --j) {
                        var search = this._data[j];

                        if (search.state == States.STATE_TEXT_QUOTE_CLOSE) {
                            // Нашли закрывающую кавычку.
                            break;
                        } else if (search.state == States.STATE_TEXT_QUOTE_OPEN) {
                            qpos = j;
                        }
                    }
                    while (i > qpos) {
                        sentence.unshift(this._data[i]);
                        --i;
                    }
                    sentence.unshift(this._data[i]);
                    continue;
                } else if (buff.state == States.STATE_TEXT_SENTENCE_END) {
                    // Нашли конец предложения.
                    if (sentence.length) {
                        list.unshift(new Produce(sentence));
                        sentence = [];
                    }
                }
                sentence.unshift(buff);
            }

            // Добавляем последний элемент
            if (sentence) {
                list.unshift(new Produce(sentence));
            }

            return list;
        }

        return Produce;
    }
);
(function (root, fabric) {
    if (typeof root.define === 'function' && root.define.amd) {
        root.define('tok3n1zer/lib/produce', ['tok3n1zer/lib/parserStates'], fabric);
    } else if (typeof module != 'undefined' && module.exports) {
        module.exports = fabric(require('./parserStates.js'));
    } else {
        root.Tok3n1zerProduce = fabric(root.Tok3n1zerParserStates);
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
                    case States.STATE_TEXT_OPEN_ROUND_BRACKET:
                    case States.STATE_TEXT_CLOSE_ROUND_BRACKET:
                    case States.STATE_TEXT_OPEN_SQUARE_BRACKET:
                    case States.STATE_TEXT_CLOSE_SQUARE_BRACKET:
                        return ' {BRACKET} ';
                        break;
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
         * Найти самую дальнюю от текущего элемента позицию инвертированной кавычки
         *
         * @param i
         * @param self
         * @param find
         */
        Produce.prototype.getGreedyQuotePosition = function (i, self, find) {
            var qpos = -1;

            for (var j = i - 1; j >= 0; --j) {
                var search = this._data[j];

                if (search.state == self) {
                    // Нашли тот же элемент
                    if (qpos != -1) {
                        break;
                    }
                } else if (search.state == find) {
                    qpos = j;
                }
            }
            if (qpos < 0) {
                qpos = 0;
            }
            return qpos;
        }

        /**
         * Найти позицию инвертированной скобки
         *
         * @param i
         * @param self
         * @param find
         */
        Produce.prototype.getGreedyBracketPosition = function (i, self, find) {
            for (var j = i - 1; j >= 0; --j) {
                var search = this._data[j];

                switch (search.state) {
                    case States.STATE_TEXT_QUOTE_CLOSE:
                        // Нашли кавычку. Нужно забрать все, что внутри "цитаты"
                        j = this.getGreedyQuotePosition(j, States.STATE_TEXT_QUOTE_CLOSE, States.STATE_TEXT_QUOTE_OPEN);
                        break;
                    case States.STATE_TEXT_CLOSE_ROUND_BRACKET:
                        // Нашли вложенную скобку. Забираем все до следующей инвертированной скобки.
                        j = this.getGreedyBracketPosition(j, States.STATE_TEXT_CLOSE_ROUND_BRACKET, States.STATE_TEXT_OPEN_ROUND_BRACKET);
                        break;
                    case States.STATE_TEXT_CLOSE_ROUND_BRACKET:
                        // Нашли вложенную скобку. Забираем все до следующей инвертированной скобки.
                        j = this.getGreedyBracketPosition(j, States.STATE_TEXT_CLOSE_SQUARE_BRACKET, States.STATE_TEXT_OPEN_SQUARE_BRACKET);
                        break;
                    case find:
                        // Нашли цель.
                        return j;
                        break;
                }
            }
            return 0;
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
            var that = this;
            var semantic = 0;

            function unshift(i, qpos) {
                while (i > qpos) {
                    sentence.unshift(that._data[i]);
                    --i;
                }
                sentence.unshift(that._data[i]);
                return i;
            }

            for (var i = len - 1; i >= 0; --i) {
                var buff = this._data[i];

                if (buff.state == States.STATE_TEXT_QUOTE_CLOSE) {
                    i = unshift(i, this.getGreedyQuotePosition(i, States.STATE_TEXT_QUOTE_CLOSE, States.STATE_TEXT_QUOTE_OPEN))
                    continue;
                } else if (buff.state == States.STATE_TEXT_CLOSE_ROUND_BRACKET) {
                    i = unshift(i, this.getGreedyBracketPosition(i, States.STATE_TEXT_CLOSE_ROUND_BRACKET, States.STATE_TEXT_OPEN_ROUND_BRACKET))
                    continue;
                } else if (buff.state == States.STATE_TEXT_CLOSE_SQUARE_BRACKET) {
                    i = unshift(i, this.getGreedyBracketPosition(i, States.STATE_TEXT_CLOSE_SQUARE_BRACKET, States.STATE_TEXT_OPEN_SQUARE_BRACKET))
                    continue;
                } else if (buff.state == States.STATE_TEXT_SENTENCE_END) {
                    // Нашли конец предложения.
                    if (sentence.length && semantic > 0) {
                        list.unshift(new Produce(sentence));
                        semantic = 0;
                        sentence = [];
                    }
                }
                sentence.unshift(buff);
                // Проверяем был ли это значимый элемент.
                // Значимый: не пробел и не HTML разметка.
                if (buff.state != States.STATE_TAG_FULL && buff.state != States.STATE_TEXT_SPACE) {
                    semantic++;
                }
            }

            // Добавляем последний элемент
            if (sentence) {
                list.unshift(new Produce(sentence));
            }

            return list;
        }

        /**
         * Получить количество слов в результате.
         *
         * @returns {Number}
         */
        Produce.prototype.getWordsCount = function () {
            var len = this._data.length;
            var words = 0;

            for (var i = len - 1; i >= 0; --i) {
                var buff = this._data[i];

                if (buff.state == States.STATE_TEXT_WORD) {
                    words++;
                }
            }
            return words;
        }

        /**
         * Получить дилну исходной строки
         *
         * @returns {Number}
         */
        Produce.prototype.getLength = function () {
            return this.getSourceString().length;
        }

        /**
         * Получить количество символов в буфере
         *
         * @returns {Number}
         */
        Produce.prototype.getCharactersCount = function () {
            var len = this._data.length;
            var characters = 0;

            for (var i = len - 1; i >= 0; --i) {
                var buff = this._data[i];

                switch (buff.state) {
                    case States.STATE_TEXT_SPACE:
                    case States.STATE_TEXT_HTML_ENTITY:
                        // пробельные символы и html entities считаются как один символ
                        characters++;
                        break;
                    case States.STATE_TAG_FULL:
                        // тэги не учитываем
                        break;
                    default:
                        characters += buff.value.length;
                        break;
                }
            }
            return characters;
        }

        return Produce;
    }
);
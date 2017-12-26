(function (root, fabric) {
    if (typeof root.define === 'function' && root.define.amd) {
        root.define('tok3n1zer/lib/parser', ['tok3n1zer/lib/parserStates', 'tok3n1zer/lib/produce'], fabric);
    } else if (typeof module != 'undefined' && module.exports) {
        module.exports = fabric(require('./parserStates.js'), require('./produce.js'));
    } else {
        root.Tok3n1zerParser = fabric(root.Tok3n1zerParserStates, root.Tok3n1zerProduce);
    }
})(
    this,
    function (States, Produce) {

        //#region Наборы символов

        var EL = /[a-z_\-]/i;                       // Все что может содержать тэг или атрибут
        var SP = /[\n\r\s\t]/;                      // Пробоельные символы
        var NL = /[^A-Za-z0-9_\u0400-\u04FF]/;      // Не "сивольные" символы
        var Q = /["«»„“]/;                          // Кавычки
        var END = /[\.\?!]/;                        // Символы, которые могут заканчивать предложение

        //#endregion

        /**
         * Токенайзер для разбора входного текста на токены.
         *
         * @constructor
         */
        function Parser() {
            this._state = null;
            this._buffers = null;
        }

        //#region Работа с буферами

        /**
         * Добавить знечение в буффер
         *
         * @param char
         */
        Parser.prototype.appendToBuffer = function (char) {
            var buffer = this._buffers[this._buffers.length - 1];
            var inUnstackable = false;
            var unstackable = [States.STATE_TEXT_QUOTE_CLOSE, States.STATE_TEXT_QUOTE_OPEN, States.STATE_TEXT_OPEN_ROUND_BRACKET, States.STATE_TEXT_CLOSE_ROUND_BRACKET, States.STATE_TEXT_OPEN_SQUARE_BRACKET, States.STATE_TEXT_CLOSE_SQUARE_BRACKET];

            // indexOf
            for (var i = 0; i < unstackable.length; ++i) {
                if (unstackable[i] == buffer.state) {
                    inUnstackable = true;
                    break;
                }
            }

            // Бафер с кавычками и скобками не должен стакаться, кавычки должны идти отдельно.
            if (buffer.state == this._state && !inUnstackable) {
                buffer.value += char;
            } else {
                this._buffers.push({ state: this._state, value: char });
            }
        }

        /**
         * Получить последний символ из последнего буфера для текущего состояния
         *
         * @returns {string}
         */
        Parser.prototype.lastCharacter = function () {
            var buffer = this._buffers[this._buffers.length - 1];

            if (buffer.state == this._state) {
                if (buffer.value != "") {
                    return buffer.value.substr(-1);
                }
            }
            return "";
        }

        /**
         * Получить значение последнего буффера
         *
         * @returns {string}
         */
        Parser.prototype.getBufferVal = function () {
            var buffer = this._buffers[this._buffers.length - 1];

            if (buffer.state == this._state) {
                return buffer.value;
            }
            return "";
        }

        /**
         * Обновить буффер
         *
         * @param state
         * @param value
         * @returns {string}
         */
        Parser.prototype.replaceBuffer = function (state, value) {
            var buffer = this._buffers[this._buffers.length - 1];

            buffer.state = state;
            buffer.value = value;
        }

        /**
         * Заменить тип буффера
         *
         * @param state
         */
        Parser.prototype.replaceBufferType = function (state) {
            this._buffers[this._buffers.length - 1].state = state;
        }

        /**
         * Получить тип последнего буффера
         *
         * @returns {Number}
         */
        Parser.prototype.getLastBufferType = function (ignore) {
            var len = this._buffers.length;

            for (var i = len - 1; i >= 0; --i) {
                var buff = this._buffers[i];

                if (buff.state == ignore) {
                    continue;
                }
                return buff.state;
            }
            return null;
        }

        //#endregion

        //#region Перформеры для работы с составными частями HTML тэга

        /**
         * Обработчик состояния States.STATE_TAG_ATTRIBUTE_VALUE_DQ_STRING и States.STATE_TAG_ATTRIBUTE_VALUE_SQ_STRING
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype.stateStringPerformer = function (quote, char, code) {
            if (char == quote) {
                var lc = this.lastCharacter();

                this.appendToBuffer(char);
                if (lc != "\\") {
                    return { code: States.STATE_TAG_ATTRIBUTES };
                }
            } else {
                this.appendToBuffer(char);
            }
            return { code: code };
        }

        /**
         * Обработчик состояния States.STATE_TAG_ATTRIBUTE_VALUE_DQ_STRING
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TAG_ATTRIBUTE_VALUE_DQ_STRING] = function (char) {
            return this.stateStringPerformer("\"", char, States.STATE_TAG_ATTRIBUTE_VALUE_DQ_STRING);
        }

        /**
         * Обработчик состояния States.STATE_TAG_ATTRIBUTE_VALUE_SQ_STRING
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TAG_ATTRIBUTE_VALUE_SQ_STRING] = function (char) {
            return this.stateStringPerformer("'", char, States.STATE_TAG_ATTRIBUTE_VALUE_SQ_STRING);
        }

        /**
         * Обработчик состояния States.STATE_TAG_ATTRIBUTE_VALUE
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TAG_ATTRIBUTE_VALUE] = function (char) {
            if (SP.test(char) || char == "/" || char == ">") {
                // Пробельный символ - значение сформировано
                return { code: States.STATE_TAG_ATTRIBUTE, backward: 1 };
            } else if (char == "\"") {
                // Строка в двойных кавычках
                this.appendToBuffer(char);
                return { code: States.STATE_TAG_ATTRIBUTE_VALUE_DQ_STRING };
            } else if (char == "'") {
                // Строка в одинарных кавычках
                this.appendToBuffer(char);
                return { code: States.STATE_TAG_ATTRIBUTE_VALUE_SQ_STRING };
            } else {
                // Просто добавляем элемент в буфер
                this.appendToBuffer(char);
            }
            return { code: States.STATE_TAG_ATTRIBUTE_VALUE };
        }

        /**
         * Обработчик состояния States.STATE_TAG_ATTRIBUTE
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TAG_ATTRIBUTE] = function (char) {
            if (char == "=") {
                // Нашли кавычку - переходим в состоняние анализа значения атрибута
                this.appendToBuffer(char);
                return { code: States.STATE_TAG_ATTRIBUTE_VALUE };
            } else if (char == "/") {
                // Тэг не требующий закрытия (<label/>)
                return { code: States.STATE_TAG_ATTRIBUTES, backward: 1 };
            } else if (char == ">") {
                // Нашли символ "закрывающий тэг"
                return { code: States.STATE_TAG_ATTRIBUTES, backward: 1 };
            } else if (SP.test(char)) {
                // Пробельный символ - везвращаемся в состояние поиска атрибутов
                return { code: States.STATE_TAG_ATTRIBUTES, backward: 1 };
            } else {
                // Добавляем в буфер текущий символ
                this.appendToBuffer(char);
            }
            return { code: States.STATE_TAG_ATTRIBUTE };
        }

        /**
         * Обработчик состояния States.STATE_TAG_ATTRIBUTES
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TAG_ATTRIBUTES] = function (char) {
            if (SP.test(char)) {
                // Пробельные символы - просто добавляем в буфер
                this.appendToBuffer(char);
            } else if (char == "/") {
                // Тэг не требующий закрытия (<label/>)
                this.appendToBuffer(char);
            } else if (char == ">") {
                // Нашли символ "закрывающий тэг"
                return { code: States.STATE_TAG_CLOSE, backward: 1 };
            } else if (EL.test(char)) {
                // Нашли символ - начинается название атрибута
                return { code: States.STATE_TAG_ATTRIBUTE, backward: 1 };
            } else {
                throw "States.STATE_TAG_ATTRIBUTES: Unexpected char `" + char + "`";
            }
            return { code: States.STATE_TAG_ATTRIBUTES };
        }

        /**
         * Обработчик состояния States.STATE_TAG_OPEN
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TAG_OPEN] = function (char) {
            if (char == "<") {
                // Открывающий тэг найден
                this.appendToBuffer(char);
            } else if (char == ">") {
                // Закрывающий тэг найден
                return { code: States.STATE_TAG_CLOSE, backward: 1 };
            } else if (char == " ") {
                // Нашли пробельный символ, дальше будут идти атрибуты
                this.appendToBuffer(char);
                return { code: States.STATE_TAG_ATTRIBUTES };
            } else {
                // Идем вдоль название тэга
                this.appendToBuffer(char);
            }
            // По умолчанию продолжаем идти по тому же состоянию.
            return { code: States.STATE_TAG_OPEN };
        }

        /**
         * Обработчик состояния States.STATE_TAG_CLOSE
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TAG_CLOSE] = function (char) {
            this.appendToBuffer(char);

            //#region Объединение буфферов

            // Объединяем все буфферы связанные с тэгом в одну сущность
            var value = "";
            var merge = true;

            while (merge) {
                var buffer = this._buffers.pop();

                value = buffer.value + value;
                merge = (buffer.state != States.STATE_TAG_OPEN);
            }
            this._buffers.push({ state: States.STATE_TAG_FULL, value: value });

            //#endregion

            return { code: States.STATE_TEXT };
        }

        //#endregion

        /**
         * Проанализировать state предыдущего буфера что бы понять является ли кавычка открывающей
         *
         * @param btype
         * @returns {bool}
         */
        Parser.prototype.isOpenQuote = function (btype) {
            return btype === null
                || btype == States.STATE_TEXT
                || btype == States.STATE_TEXT_SPACE
                || btype == States.STATE_TEXT_OPEN_ROUND_BRACKET
                || btype == States.STATE_TEXT_OPEN_SQUARE_BRACKET;
        }

        //#region Перформеры для работы с текстом

        /**
         * Обработчик состояния States.STATE_TEXT_NOT_LETTER (не числобуквенные символы)
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TEXT_NOT_LETTER] = function (char) {
            if (char == "(") {
                this.appendToBuffer(char);
                this.replaceBufferType(States.STATE_TEXT_OPEN_ROUND_BRACKET);
                return { code: States.STATE_TEXT };
            } else if (char == ")") {
                this.appendToBuffer(char);
                this.replaceBufferType(States.STATE_TEXT_CLOSE_ROUND_BRACKET);
                return { code: States.STATE_TEXT };
            } else if (char == "[") {
                this.appendToBuffer(char);
                this.replaceBufferType(States.STATE_TEXT_OPEN_SQUARE_BRACKET);
                return { code: States.STATE_TEXT };
            } else if (char == "]") {
                this.appendToBuffer(char);
                this.replaceBufferType(States.STATE_TEXT_CLOSE_SQUARE_BRACKET);
                return { code: States.STATE_TEXT };
            } else if (char == "&") {
                // Амперсанд
                return { code: States.STATE_TEXT_STACK_HTML_ENTITY, backward: 1 };
            } else if (char == "<") {
                // Нашли открывающий тэг
                return { code: States.STATE_TAG_OPEN, backward: 1 };
            } else if (END.test(char)) {
                // Потенциальный символ конца предложения
                return { code: States.STATE_TEXT_SENTENCE_END, backward: 1 };
            } else if (SP.test(char)) {
                // Пробельные символы
                return { code: States.STATE_TEXT_SPACE, backward: 1 };
            } else if (Q.test(char)) {
                // Кавычка.
                var btype = this.getLastBufferType(States.STATE_TAG_FULL);
                
                if (this.isOpenQuote(btype)) {
                    // Открывающая кавычка
                    return { code: States.STATE_TEXT_QUOTE_OPEN, backward: 1 };
                } else {
                    // Закрывающая кавычка
                    return { code: States.STATE_TEXT_QUOTE_CLOSE, backward: 1 };
                }
                this.appendToBuffer(char);
            } else {
                // Странный символ, коотрый неудовлетворяет ни одному условию.
                this.appendToBuffer(char);
            }
            // Возвращается состояние TEXT, так как предполагается что это бул один символ.
            return { code: States.STATE_TEXT };
        }

        /**
         * Обработчик состояния States.STATE_TEXT_SENTENCE_END (Конец предложения)
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TEXT_SENTENCE_END] = function (char) {
            if (END.test(char)) {
                this.appendToBuffer(char);
                return { code: States.STATE_TEXT_SENTENCE_END };
            }
            return { code: States.STATE_TEXT, backward: 1 };
        }

        /**
         * Обработчик состояния States.STATE_TEXT_QUOTE_OPEN (Открвающая кавычка)
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TEXT_QUOTE_OPEN] = function (char) {
            this.appendToBuffer(char);
            return { code: States.STATE_TEXT };
        }

        /**
         * Обработчик состояния States.STATE_TEXT_QUOTE_CLOSE (Закрывающая кавычка)
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TEXT_QUOTE_CLOSE] = function (char) {
            this.appendToBuffer(char);
            return { code: States.STATE_TEXT };
        }

        /**
         * Обработчик состояния "States.STATE_TEXT_SPACE" (Группировка пробельных символов)
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TEXT_SPACE] = function (char) {
            if (SP.test(char)) {
                this.appendToBuffer(char);
            } else {
                return { code: States.STATE_TEXT, backward: 1 };
            }
            return { code: States.STATE_TEXT_SPACE };
        }

        /**
         * Обработчик состояния States.STATE_TEXT_WORD
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TEXT_WORD] = function (char) {
            if (NL.test(char)) {
                return { code: States.STATE_TEXT_NOT_LETTER, backward: 1 };
            } else {
                this.appendToBuffer(char);
            }
            return { code: States.STATE_TEXT_WORD };
        }

        /**
         * Обработчик состояния States.STATE_TEXT
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TEXT] = function (char) {
            if (NL.test(char)) {
                // Не символ
                return { code: States.STATE_TEXT_NOT_LETTER, backward: 1 };
            } else {
                // Предположительно это слово
                return { code: States.STATE_TEXT_WORD, backward: 1 };
            }
        }

        /**
         * Обработчик состояния States.STATE_TEXT_STACK_HTML_ENTITY
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TEXT_STACK_HTML_ENTITY] = function (char) {
            if (char == '&' || char == "<" || SP.test(char)) {
                // Кейсы:
                //  * Нашелся открывающий тэг.
                //  * Нашелся пробел.
                // Переходим к анализу не числобуквенных символов с откатом назад.
                var val = this.getBufferVal();
                
                if (char == '&' && (!val || !val.length)) {
                    // Первый амперсанд
                    this.appendToBuffer(char);
                } else {
                    this.replaceBuffer(States.STATE_TEXT_NOT_LETTER, val.substr(0, 1));
                    return { code: States.STATE_TEXT, backward: val.substr(1).length + 1 };
                }
            } else if (char == ";") {
                // Элемент "закрылся".
                this.appendToBuffer(char);
                switch (this.getBufferVal()) {
                    case '&nbsp;':
                        // Неразрывный пробел
                        this.replaceBufferType(States.STATE_TEXT_SPACE);
                        break;
                    // Все кавычки.
                    // Обрабатываем все единым образом.
                    // Открывающие кавычки
                    case '&laquo;':
                    case '&lsaquo;':
                    case '&bdquo;':
                    case '&sbquo;':
                    // Закрывающие кавычки
                    case '&raquo;':
                    case '&rsaquo;':
                    // Неоределенные кавычки
                    case '&lsquo;':
                    case '&ldquo;':
                    case '&quot;':
                    case '&rdquo;':
                    case '&rsquo;':
                        var matching = true;
                        var shift = 2;

                        while (matching) {
                            var buffer = this._buffers[this._buffers.length - shift];

                            shift++;
                            if (buffer.state != States.STATE_TAG_FULL) {
                                var btype = buffer.state;

                                if (this.isOpenQuote(buffer.state)) {
                                    this.replaceBufferType(States.STATE_TEXT_QUOTE_OPEN);
                                    matching = false;
                                } else {
                                    this.replaceBufferType(States.STATE_TEXT_QUOTE_CLOSE);
                                    matching = false;
                                }
                            }
                        }
                        break;
                }
                if (this.getLastBufferType() == States.STATE_TEXT_STACK_HTML_ENTITY) {
                    // Завершили набор ENTITY
                    this.replaceBufferType(States.STATE_TEXT_HTML_ENTITY);
                }
                return { code: States.STATE_TEXT };
            } else if (EL.test(char)) {
                this.appendToBuffer(char);
            } else {
                throw "States.STATE_TEXT_STACK_HTML_ENTITY: Unexpected char `" + char + "`";
            }
            return { code: States.STATE_TEXT_STACK_HTML_ENTITY };
        }

        //#endregion

        /**
         * Разбить строку на токены
         *
         * @param str
         * @returns {array}
         */
        Parser.prototype.parseString = function (str) {
            var arr = str.split('');
            var len = arr.length;

            try {
                this._state = States.STATE_TEXT;
                this._buffers = [{ state: this._state, value: "" }];
                for (var i = 0; i < len; ++i) {
                    var char = arr[i];
                    var state = this['state' + this._state].apply(this, [char]);
                    
                    // Проверяем изменение состояния
                    if (state.code != this._state) {
                        this._state = state.code;
                    }
                    // Проверяем нужно ли откатиться назад
                    if (state.backward) {
                        i -= state.backward;
                    }
                }
            } catch (e) {
                console.log(e);
            }

            return (new Produce(this._buffers)).setOffset(0);
        }

        return Parser;
    }
);
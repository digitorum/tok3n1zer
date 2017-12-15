﻿(function (root, fabric) {
    if (typeof root.define === 'function' && root.define.amd) {
        root.define('tok3n1zer/lib/parser', ['tok3n1zer/lib/parserStates'], fabric);
    } else if (typeof module != 'undefined' && module.exports) {
        module.exports = fabric(require('./parserStates.js'));
    } else {
        root.Tok3n1zerParser = fabric(root.Tok3n1zerParserStates);
    }
})(
    this,
    function (States) {

        //#region Наборы символов

        var EL = /[a-z_\-]/i;   // Все что может содержать тэг или атрибут
        var SP = /[\n\r\s\t]/;  // Пробоельные символы
        var NL = /\W/;          // Не "сивольные" символы
        var Q = /["«»„“]/;      // Кавычки
        var END = /[\.\?!]/;    // Символы, которые могут заканчивать предложение

        //#endregion

        /**
         * Токенайзер для разбора входного текста на токены.
         *
         * @constructor
         */
        function Parser() {
            this._state = States.STATE_TEXT;
            this._buffers = [{ state: this._state, value: "" }];
        }

        //#region Работа с буферами

        /**
         * Добавить знечение в буффер
         *
         * @param char
         */
        Parser.prototype.appendToBuffer = function (char) {
            var buffer = this._buffers[this._buffers.length - 1];

            if (buffer.state == this._state) {
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
            if (SP.test(char)) {
                // Пробельный символ - значение сформировано
                return { code: States.STATE_TAG_ATTRIBUTE };
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

        //#region Перформеры для работы с текстом

        /**
         * Обработчик состояния States.STATE_TEXT_NOT_LETTER (не числобуквенные символы)
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TEXT_NOT_LETTER] = function (char) {
            if (char == "<") {
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

                if (btype == States.STATE_TEXT_SPACE || btype === null) {
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
            return this._buffers;
        }

        return Parser;
    }
);
(function (root, fabric) {
    if (typeof root.define === 'function' && root.define.amd) {
        root.define('tok3n1zer/lib/parser', ['tok3n1zer/lib/parserStates', 'tok3n1zer/lib/produce', 'tok3n1zer/lib/boost/initials'], fabric);
    } else if (typeof module != 'undefined' && module.exports) {
        module.exports = fabric(require('./parserStates.js'), require('./produce.js'), require('./boost/initials.js'));
    } else {
        root.Tok3n1zerParser = fabric(root.Tok3n1zerParserStates, root.Tok3n1zerProduce, root.Tok3n1zerBoostInitials);
    }
})(
    this,
    function (States, Produce, BoostInitials) {

        /**
         * Токенайзер для разбора входного текста на токены.
         *
         * @constructor
         */
        function Parser() {
            this._stack = null;
            this._state = null;
            this._buffers = null;
            this._abbreviations = null;
            this._abbrIteration = null;
        }

        //#region Наборы символов

        /**
         * Все что может содержать тэг или имя атрибута
         *
         * @type {RegExp}
         */
        Parser.prototype.EL = /[a-z_\-]/i;

        /**
         * Пробоельные символы
         *
         * @type {RegExp}
         */
        Parser.prototype.SP = /[\n\r\s\t]/;

        /**
         * Не "сивольные" символы
         *
         * @type {RegExp}
         */
        Parser.prototype.NL = /[^A-Za-z0-9_\u0400-\u04FF]/;

        /**
         * Заглавные буквы
         *
         * @type {RegExp}
         */
        Parser.prototype.CAP = /[A-Z\u0400-\u042F]/;

        /**
         * Кавычки
         *
         * @type {RegExp}
         */
        Parser.prototype.Q = /["«»„“]/;

        /**
         * Символы, которые могут заканчивать предложение
         *
         * @type {RegExp}
         */
        Parser.prototype.END = /[\.\?!]/;

        /**
         * Символы с которых начинаются сокращения
         *
         * @type {RegExp}
         */
        Parser.prototype.ABBR = null;

        //#endregion

        //#region Работа со стэком

        /**
         * Добавить состояние в стэк
         *
         * @param state
         */
        Parser.prototype.stackAdd = function (state) {
            this._stack.push(state);
        }

        /**
         * Откатить состояния назад
         *
         * @param i
         * @returns {number}
         */
        Parser.prototype.stackBackward = function (i) {
            if (!this._stack.length) {
                throw "Stack length exception";
            }
            if (typeof (i) == 'undefined') {
                i = 1;
            }
            while (i > 0) {
                this._stack.pop()
                i--;
            }
            return this._stack[this._stack.length - 1];
        }

        /**
         * Откатить состояния назад до состония предшествующего state
         *
         * @param state
         * @returns {number}
         */
        Parser.prototype.stackBackwardTo = function (state) {
            var cstate = null;

            while (cstate != state) {
                cstate = this._stack.pop();
            }
            return this._stack[this._stack.length - 1];
        }

        //#endregion

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
         * @param shift
         * @returns {string}
         */
        Parser.prototype.getBufferVal = function (shift) {
            if (typeof (shift) == 'undefined') {
                shift = 1;
            }

            var buffer = this._buffers[this._buffers.length - shift];

            if (buffer.state == this._state) {
                return buffer.value;
            }
            return "";
        }

        /**
         * Получить первый буфер с конца типа state
         *
         * @param offset
         * @param state
         * @param filter
         * @returns {object?}
         */
        Parser.prototype.getLastWithType = function (offset, state, filter) {
            var len = this._buffers.length;

            for (var j = len - offset; j > 0; --j) {
                var buffer = this._buffers[j];

                if (!filter(buffer)) {
                    return null;
                }
                if (buffer.state == state) {
                    return buffer.value;
                }
            }
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
         * Заменить типы буфферов
         *
         * @param i
         * @param state
         * @param filter
         */
        Parser.prototype.replaceBuffersType = function (i, state, filter) {
            var len = this._buffers.length;

            for (var j = len - 1; j > 0; --j) {
                var buffer = this._buffers[j];

                if (filter(buffer)) {
                    this._buffers[j].state = state;
                }
                i--;
                if (i == 0) {
                    break;
                }
            }
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

        /**
         * Получить строковое значение текста без тэгов
         *
         * @param i
         * @returns {string}
         */
        Parser.prototype.getBuffersMergedValues = function (i) {
            var text = "";

            for (var j = this._buffers.length - 1; j > 0; --j) {
                var buffer = this._buffers[j];

                switch (buffer.state) {
                    case States.STATE_TEXT_SPACE:
                        text = " " + text;
                        break;
                    default:
                        // Полностью игнорируем тэги
                        if (buffer.state != States.STATE_TAG_FULL) {
                            text = buffer.value + text;
                        }
                }
                i--;
                if (i == 0) {
                    return text.replace("/\s+/g", " "); // удаляем лишние пробелы
                }
            }
        }

        //#endregion

        //#region Системное

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

        /**
         * Указать список сокращений
         *
         * @param list
         * @returns {Parser}
         */
        Parser.prototype.setAbbreviations = function (list) {
            var len = list.length;
            var letters = [];

            this._abbreviations = list.map(function (str) {
                return str.toLowerCase();
            });
            for (var i = 0; i < len; ++i) {
                var letter = list[i].substr(0, 1).toLowerCase();

                if (letters.indexOf(letter) == -1) {
                    letters.push(letter);
                }
            }
            this.ABBR = new RegExp("[" + letters.join("") + "]", "i");
            return this;
        }

        //#endregion

        //#region Перформеры для работы с сокращениями

        /**
         * Состояние матчинга сокращений
         *
         * @TODO: Пределать на "дерево разбора". В виду ограниченного количества времени на данный момент используем неоптимальный вариант поиска по подстрокам.
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_ABBREVIATION] = function (char) {
            this._abbrIteration++;

            if (this._abbrIteration > 0) {
                var abbrCount = this._abbreviations.length;
                var text = this.getBuffersMergedValues(this._abbrIteration).toLowerCase();
                var textLength = text.length;
                var possibilities = 0;

                for (var i = 0; i < abbrCount; ++i) {
                    var abbr = this._abbreviations[i];
                    var abbrLength = abbr.length;

                    if (textLength > abbrLength) {
                        // Не подходит по длинне
                        continue;
                    }
                    if (text == abbr) {
                        // Сокращение найдено. Помечаем буферы как "{ABBR}".
                        // Обработку на прекращаем, так как могут быть более длинные сокращения.
                        this.replaceBuffersType(this._abbrIteration, States.STATE_ABBREVIATION, function (buff) {
                            return buff.state != States.STATE_TAG_FULL && buff.state != States.STATE_TEXT_SPACE;
                        });
                    }
                    if (abbr.substr(0, textLength) == text) {
                        // Найдено потенциальное совпадение
                        possibilities++;
                    }
                }
                if (possibilities == 0) {
                    // Откатываем состояние назад.
                    // Все вхождения имеют правльные стэйты (если было короткое совпадение - оно уже помечено как {ABBR}, все остальные имеют пометки "{WORD}" или "{SPACE}").
                    return { code: this.stackBackward(), backward: 1 };
                }
            }

            if (this.NL.test(char)) {
                // Не символ
                return { code: States.STATE_TEXT_NOT_LETTER, backward: 1, deep: true };
            } else {
                // Предположительно это слово
                return { code: States.STATE_TEXT_WORD, backward: 1, deep: true };
            }
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
                    return { code: this.stackBackward(3) };
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
            if (this.SP.test(char) || char == "/" || char == ">") {
                // Пробельный символ - значение сформировано
                return { code: this.stackBackward(), backward: 1 };
            } else if (char == "\"") {
                // Строка в двойных кавычках
                this.appendToBuffer(char);
                return { code: States.STATE_TAG_ATTRIBUTE_VALUE_DQ_STRING, deep: true };
            } else if (char == "'") {
                // Строка в одинарных кавычках
                this.appendToBuffer(char);
                return { code: States.STATE_TAG_ATTRIBUTE_VALUE_SQ_STRING, deep: true };
            }
            // Просто добавляем элемент в буфер
            this.appendToBuffer(char);
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
                return { code: States.STATE_TAG_ATTRIBUTE_VALUE, deep: true };
            } else if (char == "/") {
                // Тэг не требующий закрытия (<label/>)
                return { code: this.stackBackward(), backward: 1 };
            } else if (char == ">") {
                // Нашли символ "закрывающий тэг"
                return { code: this.stackBackward(), backward: 1 };
            } else if (this.SP.test(char)) {
                // Пробельный символ - везвращаемся в состояние поиска атрибутов
                return { code: this.stackBackward(), backward: 1 };
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
            if (this.SP.test(char)) {
                // Пробельные символы - просто добавляем в буфер
                this.appendToBuffer(char);
            } else if (char == "/") {
                // Тэг не требующий закрытия (<label/>)
                this.appendToBuffer(char);
            } else if (char == ">") {
                // Нашли символ "закрывающий тэг"
                return { code: States.STATE_TAG_CLOSE, backward: 1, deep: true };
            } else if (this.EL.test(char)) {
                // Нашли символ - начинается название атрибута
                return { code: States.STATE_TAG_ATTRIBUTE, backward: 1, deep: true };
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
                return { code: States.STATE_TAG_CLOSE, backward: 1, deep: true };
            } else if (char == " ") {
                // Нашли пробельный символ, дальше будут идти атрибуты
                this.appendToBuffer(char);
                return { code: States.STATE_TAG_ATTRIBUTES, deep: true };
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
            // Удаляем из стэка все вмерженные состояния
            this.stackBackwardTo(States.STATE_TAG_OPEN);
            // откатываемся на шаг назад.
            return { code: this.stackBackward() };
        }

        //#endregion

        //#region Перформеры для работы с текстом

        /**
         * Обработчик состояния States.STATE_TEXT
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TEXT] = function (char) {
            if (this.NL.test(char)) {
                // Не символ
                return { code: States.STATE_TEXT_NOT_LETTER, backward: 1, deep: true };
            } else if (this.ABBR && this.ABBR.test(char)) {
                // Предположительно это "сокращение"
                this._abbrIteration = -1;
                return { code: States.STATE_ABBREVIATION, backward: 1, deep: true };
            } else {
                // Предположительно это слово
                return { code: States.STATE_TEXT_WORD, backward: 1, deep: true };
            }
        }

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
                return { code: this.stackBackward() };
            } else if (char == ")") {
                this.appendToBuffer(char);
                this.replaceBufferType(States.STATE_TEXT_CLOSE_ROUND_BRACKET);
                return { code: this.stackBackward() };
            } else if (char == "[") {
                this.appendToBuffer(char);
                this.replaceBufferType(States.STATE_TEXT_OPEN_SQUARE_BRACKET);
                return { code: this.stackBackward() };
            } else if (char == "]") {
                this.appendToBuffer(char);
                this.replaceBufferType(States.STATE_TEXT_CLOSE_SQUARE_BRACKET);
                return { code: this.stackBackward() };
            } else if (char == "&") {
                // Амперсанд
                return { code: States.STATE_TEXT_STACK_HTML_ENTITY, backward: 1, deep: true };
            } else if (char == "<") {
                // Нашли открывающий тэг
                return { code: States.STATE_TAG_OPEN, backward: 1, deep: true };
            } else if (this.END.test(char)) {
                // Потенциальный символ конца предложения
                return { code: States.STATE_TEXT_SENTENCE_END, backward: 1, deep: true };
            } else if (this.SP.test(char)) {
                // Пробельные символы
                return { code: States.STATE_TEXT_SPACE, backward: 1, deep: true };
            } else if (this.Q.test(char)) {
                // Кавычка.
                var btype = this.getLastBufferType(States.STATE_TAG_FULL);
                
                if (this.isOpenQuote(btype)) {
                    // Открывающая кавычка
                    return { code: States.STATE_TEXT_QUOTE_OPEN, backward: 1, deep: true };
                } else {
                    // Закрывающая кавычка
                    return { code: States.STATE_TEXT_QUOTE_CLOSE, backward: 1, deep: true };
                }
            }
            // Странный символ, коотрый неудовлетворяет ни одному условию.
            this.appendToBuffer(char);
            // Возвращается состояние TEXT, так как предполагается что это был один символ.
            return { code: this.stackBackward() };
        }

        /**
         * Обработчик состояния States.STATE_TEXT_SENTENCE_END (Конец предложения)
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TEXT_SENTENCE_END] = function (char) {
            if (this.END.test(char)) {
                this.appendToBuffer(char);
                return { code: States.STATE_TEXT_SENTENCE_END };
            }
            return { code: this.stackBackward(2), backward: 1 };
        }

        /**
         * Обработчик состояния States.STATE_TEXT_QUOTE_OPEN (Открвающая кавычка)
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TEXT_QUOTE_OPEN] = function (char) {
            this.appendToBuffer(char);
            return { code: this.stackBackward(2) };
        }

        /**
         * Обработчик состояния States.STATE_TEXT_QUOTE_CLOSE (Закрывающая кавычка)
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TEXT_QUOTE_CLOSE] = function (char) {
            this.appendToBuffer(char);
            return { code: this.stackBackward(2) };
        }

        /**
         * Обработчик состояния "States.STATE_TEXT_SPACE" (Группировка пробельных символов)
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TEXT_SPACE] = function (char) {
            if (this.SP.test(char)) {
                this.appendToBuffer(char);
                return { code: States.STATE_TEXT_SPACE };
            }
            return { code: this.stackBackward(2), backward: 1 };
        }

        /**
         * Обработчик состояния States.STATE_TEXT_STACK_HTML_ENTITY
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TEXT_STACK_HTML_ENTITY] = function (char) {
            if (char == '&' || char == "<" || this.SP.test(char)) {
                // Кейсы:
                //  * Нашелся открывающий тэг.
                //  * Нашелся пробел.
                // Переходим к анализу не числобуквенных символов с откатом назад.
                var val = this.getBufferVal();

                if (char == '&' && (!val || !val.length)) {
                    // Первый амперсанд
                    this.appendToBuffer(char);
                } else {
                    this.replaceBuffer(this.stackBackward(), val.substr(0, 1)); // символ
                    return { code: this.stackBackward(), backward: val.substr(1).length + 1 }; // возвращаемся к анализу текста
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
                return { code: this.stackBackward(2) };
            } else if (this.EL.test(char)) {
                this.appendToBuffer(char);
            } else {
                // Исключительная ситуация.
                // Считаем что первый символ был "{CHAR}", все остальное пересканируем.
                var val = this.getBufferVal();

                this.replaceBuffer(this.stackBackward(), val.substr(0, 1)); // символ
                return { code: this.stackBackward(), backward: val.substr(1).length + 1 }; // возвращаемся к анализу текста
            }
            return { code: States.STATE_TEXT_STACK_HTML_ENTITY };
        }

        /**
         * Обработчик состояния States.STATE_TEXT_WORD
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TEXT_WORD] = function (char) {
            if (this.NL.test(char)) {
                return { code: this.stackBackward(), backward: 1 };
            }
            this.appendToBuffer(char);
            return { code: States.STATE_TEXT_WORD };
        }

        //#endregion

        /**
         * Пост обработка буферов
         *
         * @param state
         */
        Parser.prototype.postprocess = function (state) {
            var list = this['postprocessing' + state] || [];
            var len = list.length;
            
            for (var i = 0; i < len; ++i) {
                list[i](this);
            }
        }

        /**
         * Разбить строку на токены
         *
         * @param str
         * @returns {Produce}
         */
        Parser.prototype.parseString = function (str) {
            var arr = str.split('');
            var len = arr.length;

            try {
                this._stack = [];
                this._state = States.STATE_TEXT;
                this._buffers = [{ state: this._state, value: "" }];
                this.stackAdd(this._state);
                for (var i = 0; i < len; ++i) {
                    var char = arr[i];
                    var state = this['state' + this._state].apply(this, [char]);

                    if (state.deep) {
                        this.stackAdd(state.code);
                    }
                    // Проверяем изменение состояния
                    if (state.code != this._state) {
                        this.postprocess(this._state);
                        this._state = state.code;
                    }
                    // Проверяем нужно ли откатиться назад
                    if (state.backward) {
                        i -= state.backward;
                    }
                }

                // Сворачиваем все до состояния STATE_TEXT
                while (this._stack.length > 1) {
                    this['state' + this.stackBackward()].apply(this, [""]);
                }
            } catch (e) {
                console.log(e);
            }
            return (new Produce(this._buffers)).setOffset(0);
        }

        // Расширяем класс.
        BoostInitials(Parser);

        return Parser;
    }
);

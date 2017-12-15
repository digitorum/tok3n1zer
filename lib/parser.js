(function (root, fabric) {
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

        //#region ������ ��������

        var EL = /[a-z_\-]/i;   // ��� ��� ����� ��������� ��� ��� �������
        var SP = /[\n\r\s\t]/;  // ����������� �������
        var NL = /\W/;          // �� "���������" �������
        var Q = /["����]/;      // �������
        var END = /[\.\?!]/;    // �������, ������� ����� ����������� �����������

        //#endregion

        /**
         * ���������� ��� ������� �������� ������ �� ������.
         *
         * @constructor
         */
        function Parser() {
            this._state = States.STATE_TEXT;
            this._buffers = [{ state: this._state, value: "" }];
        }

        //#region ������ � ��������

        /**
         * �������� �������� � ������
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
         * �������� ��������� ������ �� ���������� ������ ��� �������� ���������
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
         * �������� �������� ���������� �������
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
         * �������� ��� �������
         *
         * @param state
         */
        Parser.prototype.replaceBufferType = function (state) {
            this._buffers[this._buffers.length - 1].state = state;
        }

        /**
         * �������� ��� ���������� �������
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

        //#region ���������� ��� ������ � ���������� ������� HTML ����

        /**
         * ���������� ��������� States.STATE_TAG_ATTRIBUTE_VALUE_DQ_STRING � States.STATE_TAG_ATTRIBUTE_VALUE_SQ_STRING
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
         * ���������� ��������� States.STATE_TAG_ATTRIBUTE_VALUE_DQ_STRING
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TAG_ATTRIBUTE_VALUE_DQ_STRING] = function (char) {
            return this.stateStringPerformer("\"", char, States.STATE_TAG_ATTRIBUTE_VALUE_DQ_STRING);
        }

        /**
         * ���������� ��������� States.STATE_TAG_ATTRIBUTE_VALUE_SQ_STRING
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TAG_ATTRIBUTE_VALUE_SQ_STRING] = function (char) {
            return this.stateStringPerformer("'", char, States.STATE_TAG_ATTRIBUTE_VALUE_SQ_STRING);
        }

        /**
         * ���������� ��������� States.STATE_TAG_ATTRIBUTE_VALUE
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TAG_ATTRIBUTE_VALUE] = function (char) {
            if (SP.test(char)) {
                // ���������� ������ - �������� ������������
                return { code: States.STATE_TAG_ATTRIBUTE };
            } else if (char == "\"") {
                // ������ � ������� ��������
                this.appendToBuffer(char);
                return { code: States.STATE_TAG_ATTRIBUTE_VALUE_DQ_STRING };
            } else if (char == "'") {
                // ������ � ��������� ��������
                this.appendToBuffer(char);
                return { code: States.STATE_TAG_ATTRIBUTE_VALUE_SQ_STRING };
            } else {
                // ������ ��������� ������� � �����
                this.appendToBuffer(char);
            }
            return { code: States.STATE_TAG_ATTRIBUTE_VALUE };
        }

        /**
         * ���������� ��������� States.STATE_TAG_ATTRIBUTE
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TAG_ATTRIBUTE] = function (char) {
            if (char == "=") {
                // ����� ������� - ��������� � ���������� ������� �������� ��������
                this.appendToBuffer(char);
                return { code: States.STATE_TAG_ATTRIBUTE_VALUE };
            } else if (SP.test(char)) {
                // ���������� ������ - ������������ � ��������� ������ ���������
                return { code: States.STATE_TAG_ATTRIBUTES, backward: 1 };
            } else {
                // ��������� � ����� ������� ������
                this.appendToBuffer(char);
            }
            return { code: States.STATE_TAG_ATTRIBUTE };
        }

        /**
         * ���������� ��������� States.STATE_TAG_ATTRIBUTES
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TAG_ATTRIBUTES] = function (char) {
            if (SP.test(char)) {
                // ���������� ������� - ������ ��������� � �����
                this.appendToBuffer(char);
            } else if (char == ">") {
                // ����� ������ "����������� ���"
                return { code: States.STATE_TAG_CLOSE, backward: 1 };
            } else if (EL.test(char)) {
                // ����� ������ - ���������� �������� ��������
                return { code: States.STATE_TAG_ATTRIBUTE, backward: 1 };
            } else {
                throw "States.STATE_TAG_ATTRIBUTES: Unexpected char `" + char + "`";
            }
            return { code: States.STATE_TAG_ATTRIBUTES };
        }

        /**
         * ���������� ��������� States.STATE_TAG_OPEN
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TAG_OPEN] = function (char) {
            if (char == "<") {
                // ����������� ��� ������
                this.appendToBuffer(char);
            } else if (char == ">") {
                // ����������� ��� ������
                return { code: States.STATE_TAG_CLOSE, backward: 1 };
            } else if (char == " ") {
                // ����� ���������� ������, ������ ����� ���� ��������
                this.appendToBuffer(char);
                return { code: States.STATE_TAG_ATTRIBUTES };
            } else {
                // ���� ����� �������� ����
                this.appendToBuffer(char);
            }
            // �� ��������� ���������� ���� �� ���� �� ���������.
            return { code: States.STATE_TAG_OPEN };
        }

        /**
         * ���������� ��������� States.STATE_TAG_CLOSE
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TAG_CLOSE] = function (char) {
            this.appendToBuffer(char);

            //#region ����������� ��������

            // ���������� ��� ������� ��������� � ����� � ���� ��������
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

        //#region ���������� ��� ������ � �������

        /**
         * ���������� ��������� States.STATE_TEXT_NOT_LETTER (�� �������������� �������)
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TEXT_NOT_LETTER] = function (char) {
            if (char == "<") {
                // ����� ����������� ���
                return { code: States.STATE_TAG_OPEN, backward: 1 };
            } else if (END.test(char)) {
                // ������������� ������ ����� �����������
                return { code: States.STATE_TEXT_SENTENCE_END, backward: 1 };
            } else if (SP.test(char)) {
                // ���������� �������
                return { code: States.STATE_TEXT_SPACE, backward: 1 };
            } else if (Q.test(char)) {
                // �������.
                var btype = this.getLastBufferType(States.STATE_TAG_FULL);

                if (btype == States.STATE_TEXT_SPACE || btype === null) {
                    // ����������� �������
                    return { code: States.STATE_TEXT_QUOTE_OPEN, backward: 1 };
                } else {
                    // ����������� �������
                    return { code: States.STATE_TEXT_QUOTE_CLOSE, backward: 1 };
                }
                this.appendToBuffer(char);
            } else {
                // �������� ������, ������� ��������������� �� ������ �������.
                this.appendToBuffer(char);
            }
            // ������������ ��������� TEXT, ��� ��� �������������� ��� ��� ��� ���� ������.
            return { code: States.STATE_TEXT };
        }

        /**
         * ���������� ��������� States.STATE_TEXT_SENTENCE_END (����� �����������)
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
         * ���������� ��������� States.STATE_TEXT_QUOTE_OPEN (���������� �������)
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TEXT_QUOTE_OPEN] = function (char) {
            this.appendToBuffer(char);
            return { code: States.STATE_TEXT };
        }

        /**
         * ���������� ��������� States.STATE_TEXT_QUOTE_CLOSE (����������� �������)
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TEXT_QUOTE_CLOSE] = function (char) {
            this.appendToBuffer(char);
            return { code: States.STATE_TEXT };
        }

        /**
         * ���������� ��������� "States.STATE_TEXT_SPACE" (����������� ���������� ��������)
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
         * ���������� ��������� States.STATE_TEXT_WORD
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
         * ���������� ��������� States.STATE_TEXT
         *
         * @param char
         * @returns {object}
         */
        Parser.prototype['state' + States.STATE_TEXT] = function (char) {
            if (NL.test(char)) {
                // �� ������
                return { code: States.STATE_TEXT_NOT_LETTER, backward: 1 };
            } else {
                // ���������������� ��� �����
                return { code: States.STATE_TEXT_WORD, backward: 1 };
            }
        }

        //#endregion

        /**
         * ������� ������ �� ������
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

                    // ��������� ��������� ���������
                    if (state.code != this._state) {
                        this._state = state.code;
                    }
                    // ��������� ����� �� ���������� �����
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
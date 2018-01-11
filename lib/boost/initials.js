(function (root, fabric) {
    if (typeof root.define === 'function' && root.define.amd) {
        root.define('tok3n1zer/lib/boost/initials', ['tok3n1zer/lib/parserStates'], fabric);
    } else if (typeof module != 'undefined' && module.exports) {
        module.exports = fabric(require('../parserStates.js'));
    } else {
        root.Tok3n1zerBoostInitials = fabric(root.Tok3n1zerParserStates);
    }
})(
    this,
    function (States) {
        return function (Parser) {

            if (!Parser.prototype['postprocessing' + States.STATE_TEXT_SENTENCE_END]) {
                Parser.prototype['postprocessing' + States.STATE_TEXT_SENTENCE_END] = [];
            }

            Parser.prototype['postprocessing' + States.STATE_TEXT_SENTENCE_END].push(function (parser) {
                // ОЧЕНЬ специфический способ найти инициалы в тексте.
                // Счетаем что любое слово длинной один заглавный символ и точка после него - инициалы.
                if (parser.getBufferVal() == ".") {
                    // Значение текущего буфера равно точке, вроверяем длину предыдущего буфера и регистр.
                    var prev = parser.getLastWithType(2, States.STATE_TEXT_WORD, function (buff) {
                        return buff.state == States.STATE_TAG_FULL || buff.state == States.STATE_TEXT_SPACE || buff.state == States.STATE_TEXT_WORD;
                    });
                    if (prev) {
                        // Если предшественник найден, проверяем его на длину и "заглавность".
                        if (prev.length == 1 && parser.CAP.test(prev)) {
                            // Заменяем одну заглавную букву с точкой как {STATE_ABBREVIATION_NAME}.
                            parser.replaceBuffersType(2, States.STATE_ABBREVIATION_NAME, function (buff) {
                                return buff.state != States.STATE_TAG_FULL && buff.state != States.STATE_TEXT_SPACE;
                            });
                        }
                    }
                }
            });
        };
    }
)
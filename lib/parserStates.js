(function (root, fabric) {
    if (typeof root.define === 'function' && root.define.amd) {
        root.define('tok3n1zer/lib/parserStates', fabric);
    } else if (typeof module != 'undefined' && module.exports) {
        module.exports = fabric();
    } else {
        root.Tok3n1zerParserStates = fabric();
    }
})(
    this,
    function () {
        return {
            STATE_TEXT: 1,
            STATE_TEXT_SPACE: 1.1,
            STATE_TEXT_WORD: 1.2,
            STATE_TEXT_NOT_LETTER: 1.3,
            STATE_TEXT_SENTENCE_END: 1.4,
            STATE_TEXT_QUOTE_OPEN: 1.51,
            STATE_TEXT_QUOTE_CLOSE: 1.52,
            STATE_TEXT_HTML_ENTITY: 1.6,
            STATE_TEXT_STACK_HTML_ENTITY: 1.61,
            STATE_TEXT_OPEN_ROUND_BRACKET: 1.71,
            STATE_TEXT_CLOSE_ROUND_BRACKET: 1.72,
            STATE_TEXT_OPEN_SQUARE_BRACKET: 1.73,
            STATE_TEXT_CLOSE_SQUARE_BRACKET: 1.74,
            STATE_TAG_FULL: 2,
            STATE_TAG_OPEN: 2.1,
            STATE_TAG_CLOSE: 2.2,
            STATE_TAG_ATTRIBUTES: 2.3,
            STATE_TAG_ATTRIBUTE: 2.4,
            STATE_TAG_ATTRIBUTE_VALUE: 2.51,
            STATE_TAG_ATTRIBUTE_VALUE_DQ_STRING: 2.52,
            STATE_TAG_ATTRIBUTE_VALUE_SQ_STRING: 2.53,
            STATE_ABBREVIATION: 3
        }
    }
);
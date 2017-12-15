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
            STATE_TEXT_QUOTE_OPEN: 1.5,
            STATE_TEXT_QUOTE_CLOSE: 1.6,
            STATE_TEXT_HTML_ENTITY: 1.7,
            STATE_TAG_FULL: 2,
            STATE_TAG_OPEN: 2.1,
            STATE_TAG_CLOSE: 2.2,
            STATE_TAG_ATTRIBUTES: 2.3,
            STATE_TAG_ATTRIBUTE: 2.4,
            STATE_TAG_ATTRIBUTE_VALUE: 2.5,
            STATE_TAG_ATTRIBUTE_VALUE_DQ_STRING: 2.6,
            STATE_TAG_ATTRIBUTE_VALUE_SQ_STRING: 2.7,
        }
    }
);
var Parser = require("./lib/parser.js");
var ParserStates = require("./lib/parserStates.js");
var parser = new Parser();
var buffers = parser.parseString('<p>An? Ancient<span>!</span> talisman. <em>An ancient talisman? <b style="display: block; border: none;">depicting</b> a <u>"</u>holy symbol "bestowed" upon the #Warriors of Sunlight...</em></p>');

console.log("Source:", "\n");
console.log(buffers.map(function (v) {
    return v.value;
}).join(""));
console.log("\n", "Tokenized:", "\n");
console.log(buffers.map(function (v) {
    switch (v.state) {
        case ParserStates.STATE_TAG_FULL:
            return '';
            break;
        case ParserStates.STATE_TEXT_QUOTE_OPEN:
            return ' {OPEN_QUOTE} ';
            break;
        case ParserStates.STATE_TEXT_QUOTE_CLOSE:
            return ' {CLOSE_QUOTE} ';
            break;
        case ParserStates.STATE_TEXT_SENTENCE_END:
            return ' {SENTENCE_POSSIBLE_END} ';
            break;
        case ParserStates.STATE_TEXT_NOT_LETTER:
            return ' {CHAR} ';
            break;
        default:
            return v.value;
    }
}).join("").replace(/\s+/g, ' '));
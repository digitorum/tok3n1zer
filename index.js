var Parser = require("./lib/parser.js");
var ParserStates = require("./lib/parserStates.js");
var parser = new Parser();
var result = parser.setAbbreviations([
    "a",
    "a ab"
]).parseString('Hello world A and world A Ab');

console.log("Source:\n");
console.log(result.getSourceString());
console.log("\nTokenized:\n");
console.log(result.getPseudoCode());
console.log("\nSentences:\n");
console.log(result.getSentencesList().map(function (v, k) {
    return v.getSourceString().replace(/^\s+|\s+$/g, '');
}).join("\n"));
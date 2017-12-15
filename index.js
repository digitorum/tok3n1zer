var Parser = require("./lib/parser.js");
var ParserStates = require("./lib/parserStates.js");
var parser = new Parser();
var result = parser.parseString('Компания <strong>"ООО "<u>Рога и копыта</u>"</strong> производит рога и копыта... Цитата: <span style=\"colcor: red;\">"</span>Покупайте наших слонов! Наши слоны самые слонистые слоны в мире!" говорит о том, что советские МФ лучшие в мире!');

console.log("Source:\n");
console.log(result.getSourceString());
console.log("\nTokenized:\n");
console.log(result.getPseudoCode());
console.log("\nSentences:\n");
console.log(result.getSentencesList().map(function (v, k) {
    return v.getSourceString().replace(/^\s+|\s+$/g, '');
}).join("\n"));
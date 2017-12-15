var Parser = require("./lib/parser.js");
var ParserStates = require("./lib/parserStates.js");
var parser = new Parser();
var result = parser.parseString('Компания "ООО "Рога и копыта" производит рога и копыта... Цитата: "Покупайте наших слонов! Наши слоны самые слонистые слоны в мире!" говорит о том, что советские МФ лучшие в мире!');

console.log("Source:\n");
console.log(result.getSourceString());
console.log("\nTokenized:\n");
console.log(result.getPseudoCode());
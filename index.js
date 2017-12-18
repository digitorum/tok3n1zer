var Parser = require("./lib/parser.js");
var ParserStates = require("./lib/parserStates.js");
var parser = new Parser();
var result = parser.parseString('Компания <strong>ООО &nbsp;&quot;<u>Рога & копыта</u>&raquo;</strong> производит рога и копыта... Цитата:&nbsp;<span style=\"colcor: red;\">&quot;</span>Покупайте наших слонов! Наши слоны самые слонистые слоны в мире!&quot; говорит о том, что советские МФ лучшие в мире!');

console.log("Source:\n");
console.log(result.getSourceString());
console.log("\nTokenized:\n");
console.log(result.getPseudoCode());
console.log("\nSentences:\n");
console.log(result.getSentencesList().map(function (v, k) {
    return v.getSourceString().replace(/^\s+|\s+$/g, '');
}).join("\n"));
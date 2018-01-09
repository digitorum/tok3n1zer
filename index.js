var Parser = require("./lib/parser.js");
var parser = new Parser();
var result = parser.setAbbreviations([
    "ул."
]).parseString('1823—24 — ул. Итальянская (с 1880 — Пушкинская), 13. В доме, восстановленном после войны, расположен Одесский музей А. С. Пушкина, возле дома установлен памятник, на доме — мемориальная доска.');

console.log("Source:\n");
console.log(result.getSourceString());
console.log("\nTokenized:\n");
console.log(result.getPseudoCode());
console.log("\nSentences:\n");
console.log(result.getSentencesList().map(function (v, k) {
    return v.getSourceString().replace(/^\s+|\s+$/g, '');
}).join("\n"));
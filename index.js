var Parser = require("./lib/parser.js");
var ParserStates = require("./lib/parserStates.js");
var parser = new Parser();
var result = parser.parseString('<p>An? Ancient<span>!</span> talisman. <em>An ancient talisman? <b style="display: block; border: none;">depicting</b> a <u>"</u>holy symbol "bestowed" upon the #Warriors of Sunlight...</em></p>');

console.log("Source:\n");
console.log(result.getSourceString());
console.log("\nTokenized:\n");
console.log(result.getPseudoCode());
# tok3n1zer

Простой разборщик текста на составные элементы.

Инициализация:
```
var parser = new (require("./lib/parser.js"));
```

Разобрать текст на составные части:

```
var result = parser.parseString('Компания <strong>"ООО "<u>Рога и копыта</u>"</strong> производит рога и копыта... Цитата: <span style=\"colcor: red;\">"</span>Покупайте наших слонов! Наши слоны самые слонистые слоны в мире!" говорит о том, что советские МФ лучшие в мире!');
```

В результате вернется инстанс `Produce` содержащий в себе все чанки:

```
[ { state: 1, value: '' },
  { state: 1.2, value: 'Компания' },
  { state: 1.1, value: ' ' },
  { state: 2, value: '<strong>' },
  { state: 1.5, value: '"' },
  { state: 1.2, value: 'ООО' },
  { state: 1.1, value: ' ' },
  { state: 1.5, value: '"' },
  { state: 2, value: '<u>' },
  { state: 1.2, value: 'Рога' },
  { state: 1.1, value: ' ' },
  { state: 1.2, value: 'и' },
  { state: 1.1, value: ' ' },
  { state: 1.2, value: 'копыта' },
  { state: 2, value: '</u>' },
  { state: 1.6, value: '"' },
  { state: 2, value: '</strong>' },
  { state: 1.1, value: ' ' },
  { state: 1.2, value: 'производит' },
  { state: 1.1, value: ' ' },
  { state: 1.2, value: 'рога' },
  { state: 1.1, value: ' ' },
  { state: 1.2, value: 'и' },
  { state: 1.1, value: ' ' },
  { state: 1.2, value: 'копыта' },
  { state: 1.4, value: '...' },
  { state: 1.1, value: ' ' },
  { state: 1.2, value: 'Цитата' },
  { state: 1.3, value: ':' },
  { state: 1.1, value: ' ' },
  { state: 2, value: '<span style="colcor: red;">' },
  { state: 1.5, value: '"' },
  { state: 2, value: '</span>' },
  { state: 1.2, value: 'Покупайте' },
  { state: 1.1, value: ' ' },
  { state: 1.2, value: 'наших' },
  { state: 1.1, value: ' ' },
  { state: 1.2, value: 'слонов' },
  { state: 1.4, value: '!' },
  { state: 1.1, value: ' ' },
  { state: 1.2, value: 'Наши' },
  { state: 1.1, value: ' ' },
  { state: 1.2, value: 'слоны' },
  { state: 1.1, value: ' ' },
  { state: 1.2, value: 'самые' },
  { state: 1.1, value: ' ' },
  { state: 1.2, value: 'слонистые' },
  { state: 1.1, value: ' ' },
  { state: 1.2, value: 'слоны' },
  { state: 1.1, value: ' ' },
  { state: 1.2, value: 'в' },
  { state: 1.1, value: ' ' },
  { state: 1.2, value: 'мире' },
  { state: 1.4, value: '!' },
  { state: 1.6, value: '"' },
  { state: 1.1, value: ' ' },
  { state: 1.2, value: 'говорит' },
  { state: 1.1, value: ' ' },
  { state: 1.2, value: 'о' },
  { state: 1.1, value: ' ' },
  { state: 1.2, value: 'том' },
  { state: 1.3, value: ',' },
  { state: 1.1, value: ' ' },
  { state: 1.2, value: 'что' },
  { state: 1.1, value: ' ' },
  { state: 1.2, value: 'советские' },
  { state: 1.1, value: ' ' },
  { state: 1.2, value: 'МФ' },
  { state: 1.1, value: ' ' },
  { state: 1.2, value: 'лучшие' },
  { state: 1.1, value: ' ' },
  { state: 1.2, value: 'в' },
  { state: 1.1, value: ' ' },
  { state: 1.2, value: 'мире' },
  { state: 1.4, value: '!' } ]
```

Коды state описаны в файле `./lib/parserStates.js`.

## Методы Produce:

* string getSourceString() - вернет исходный текст
* string getPseudoCode() - вернет сформированный "псевдокод"
* array getSentencesList() - вернет список предложений в тексте
* number getWordsCount() - вернет количество слов в тексте
* number getCharactersCount() - вернет количество символов в тексте

Пример:
```
var ParserStates = require("./lib/parserStates.js");
var parser = new (require("./lib/parser.js"));
var result = parser.parseString('Компания "ООО "Рога и копыта" производит рога и копыта... Цитата: "Покупайте наших слонов! Наши слоны самые слонистые слоны в мире!" говорит о том, что советские МФ лучшие в мире!');

console.log("Source:\n");
console.log(result.getSourceString());
console.log("\nTokenized:\n");
console.log(result.getPseudoCode());
console.log("\nSentences:\n");
console.log(result.getSentencesList().map(function (v, k) {
    return v.getSourceString().replace(/^\s+|\s+$/g, '');
}).join("\n"));
```

Результат:
```
Source:

Компания <strong>"ООО "<u>Рога и копыта</u>"</strong> производит рога и копыта... Цитата: <span style="colcor: red;">"</span>Покупайте наших слонов! Наши слоны самые слонистые слоны в мире!" говорит о том, что советские МФ лучшие в мире!

Tokenized:

Компания {TAG} {OPEN_QUOTE} ООО {OPEN_QUOTE} {TAG} Рога и копыта {TAG} {CLOSE_QUOTE} {TAG} производит рога и копыта {SENTENCE_POSSIBLE_END} Цитата {CHAR} {TAG} {OPEN_QUOTE} {TAG} Покупайте наших слонов {SENTENCE_POSSIBLE_END} Наши слоны самые слонистые слоны в мире {SENTENCE_POSSIBLE_END} {CLOSE_QUOTE} говорит о том {CHAR} что советские МФ лучшие в мире {SENTENCE_POSSIBLE_END}

Sentences:

Компания <strong>"ООО "<u>Рога и копыта</u>"</strong> производит рога и копыта...
Цитата: <span style="colcor: red;">"</span>Покупайте наших слонов! Наши слоны самые слонистые слоны в мире!" говорит о том, что советские МФ лучшие в мире!
```
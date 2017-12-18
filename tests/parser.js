var assert = require('assert');
var parser = new (require('../lib/parser.js'));

//#region Генераторы тестов

/**
 * Сделать набор тест кейсов для проверки результата парсинга
 *
 * @param {any} description
 * @param {any} source
 * @param {any} pseudocode
 */
function makeTestCases(description, source, pseudocode) {
    describe(description, function () {
        var result = parser.parseString(source);
        
        it('Produse serialization equal to source', function () {
            assert.equal(result.getSourceString(), source);
        });
        it('Produse pseudocode', function () {
            assert.equal(result.getPseudoCode(), pseudocode);
        });
    });
}

/**
 * Сделать набор тест кейсов для проверки результата парсинга кавычек
 *
 * @param {any} quote
 * @param {any} open
 * @param {any} close
 */
function makeQuoteTestCases(quote, open, close) {
    makeTestCases("Кавычка `" + quote + "`", quote, open);
    makeTestCases("Кавычка `" + quote + "` (обернутая в тэг)", "<i>" + quote + "</i>", ['{TAG}', open, '{TAG}'].join(" "));
    makeTestCases("Две кавычки `" + quote + "` (первая обернута в тэг)", "<i>" + quote + "</i>" + quote, ['{TAG}', open, '{TAG}', close].join(" "));
    makeTestCases("Две кавычки `" + quote + "` (вторая обернута в тэг)", quote + "<i>" + quote + "</i>", [open, '{TAG}', close, '{TAG}'].join(" "));
    makeTestCases("Три кавычки `" + quote + "` (...)", quote + quote + quote, [open, close, close].join(" "));
    makeTestCases("Три кавычки `" + quote + "` (. ..)", quote + " " + quote + quote, [open, open, close].join(" "));
    makeTestCases("Три кавычки `" + quote + "` (.. .)", quote + quote + " " + quote, [open, close, open].join(" "));
    makeTestCases("Три кавычки `" + quote + "` (. . .)", quote + " " + quote + " " + quote, [open, open, open].join(" "));
    makeTestCases("Три кавычки `" + quote + "` (.&..)", quote + "&nbsp;" + quote + quote, [open, open, close].join(" "));
    makeTestCases("Три кавычки `" + quote + "` (..&.)", quote + quote + "&nbsp;" + quote, [open, close, open].join(" "));
    makeTestCases("Три кавычки `" + quote + "` (.&.&.)", quote + "&nbsp;" + quote + "&nbsp;" + quote, [open, open, open].join(" "));
    makeTestCases("Три кавычки `" + quote + "` (.&<.>&.)", quote + "&nbsp;<i>" + quote + "</i>&nbsp;" + quote, [open, '{TAG}', open, '{TAG}', open].join(" "));
    makeTestCases("Три кавычки `" + quote + "` (.e..)", quote + "&mdash;" + quote + quote, [open, '{ENTITY}', close, close].join(" "));
    makeTestCases("Три кавычки `" + quote + "` (..e.)", quote + quote + "&mdash;" + quote, [open, close, '{ENTITY}', close].join(" "));
    makeTestCases("Три кавычки `" + quote + "` (.e.e.)", quote + "&mdash;" + quote + "&mdash;" + quote, [open, '{ENTITY}', close, '{ENTITY}', close].join(" "));
    makeTestCases("Три кавычки `" + quote + "` (.e<.>e.)", quote + "&mdash;<i>" + quote + "</i>&mdash;" + quote, [open, '{ENTITY}', '{TAG}', close, '{TAG}', '{ENTITY}', close].join(" "));
}

/**
 * Сделать набор тест кейсов для проверки результата парсинга предложений
 *
 * @param {any} description
 * @param {any} source
 * @param {any} pseudocode
 */
function makeSentencesTestCase(description, source, pseudocode) {
    describe(description, function () {
        var result = parser.parseString(source);

        it('Matching sentences', function (done) {
            var errors = [];

            result.getSentencesList().map(function (v, k) {
                var pcode = v.getPseudoCode();

                if (pseudocode[k] != pcode) {
                    errors.push(pcode + " != " + pseudocode[k]);
                }
            });
            if (errors.length) {
                done(errors.join("\n"));
            } else {
                done();
            }
        });
    });
}

//#endregion

// Проверки на правильность парсинга тэгов.
describe('Разбор HTML и XHTML', function () {
    makeTestCases("XHTML tag", "<BR/>", "{TAG}");
    makeTestCases("XHTML tag (+sp)", "<BR />", "{TAG}");
    makeTestCases("XHTML tag: Атрибут без значения (-sp)", "<BR readonly/>", "{TAG}");
    makeTestCases("XHTML tag: Атрибут без значения (+sp)", "<BR readonly />", "{TAG}");
    makeTestCases("XHTML tag: Атрибут со значением без кавычек (-sp)", "<BR readonly=on/>", "{TAG}");
    makeTestCases("XHTML tag: Атрибут со значением без кавычек (+sp)", "<BR readonly=on />", "{TAG}");
    makeTestCases("XHTML tag: Атрибут со значением в одинарных кавычках (-sp)", "<BR readonly='on'/>", "{TAG}");
    makeTestCases("XHTML tag: Атрибут со значением в одинарных кавычках (+sp)", "<BR readonly='on' />", "{TAG}");
    makeTestCases("XHTML tag: Атрибут со значением в двойных кавычках (-sp)", "<BR readonly=\"on\"/>", "{TAG}");
    makeTestCases("XHTML tag: Атрибут со значением в двойных кавычках (+sp)", "<BR readonly=\"on\" />", "{TAG}");
    makeTestCases("XHTML tag: Набор Атрибутов", "<BR attr1=Привет attr2=\"Привет\" attr3='привет'/>", "{TAG}");
    makeTestCases("HTML tag", "<BR>", "{TAG}");
    makeTestCases("HTML tag (+sp)", "<BR >", "{TAG}");
    makeTestCases("HTML tag: Атрибут без значения (-sp)", "<BR readonly>", "{TAG}");
    makeTestCases("HTML tag: Атрибут без значения (+sp)", "<BR readonly >", "{TAG}");
    makeTestCases("HTML tag: Атрибут со значением без кавычек (-sp)", "<BR readonly=on>", "{TAG}");
    makeTestCases("HTML tag: Атрибут со значением без кавычек (+sp)", "<BR readonly=on >", "{TAG}");
    makeTestCases("HTML tag: Атрибут со значением в одинарных кавычках (-sp)", "<BR readonly='on'>", "{TAG}");
    makeTestCases("HTML tag: Атрибут со значением в одинарных кавычках (+sp)", "<BR readonly='on' >", "{TAG}");
    makeTestCases("HTML tag: Атрибут со значением в двойных кавычках (-sp)", "<BR readonly=\"on\">", "{TAG}");
    makeTestCases("HTML tag: Атрибут со значением в двойных кавычках (+sp)", "<BR readonly=\"on\" >", "{TAG}");
    makeTestCases("HTML tag: Набор Атрибутов", "<BR attr1=Привет attr2=\"Привет\" attr3='привет'>", "{TAG}");
    makeTestCases("HTML tag: Пустой", "<p></p>", "{TAG} {TAG}");
    makeTestCases("HTML tag: Пустой с набором атрибутов", "<p class='first class second-class' class-dq=\"first class second-class\" data-attr=1 readonly></p>", "{TAG} {TAG}");
    makeTestCases("HTML tag: С текстои", "<p>Hello world!</p>", "{TAG} Hello world {SENTENCE_POSSIBLE_END} {TAG}");
    makeTestCases("HTML tag: С текстом и набором атрибутов", "<p class='first class second-class' class-dq=\"first class second-class\" data-attr=1 readonly>Hello world!</p>", "{TAG} Hello world {SENTENCE_POSSIBLE_END} {TAG}");
});

// Проверки на правлиьность парчинга кавычек.
describe('Кавычки', function () {
    makeTestCases("Одинарная кавычка", "'", "{CHAR}");
    makeTestCases("Две одинарные кавычки", "'", "{CHAR}");
    makeQuoteTestCases("\"", "{OPEN_QUOTE}", "{CLOSE_QUOTE}");
    makeQuoteTestCases("&quot;", "{OPEN_QUOTE}", "{CLOSE_QUOTE}");
    makeQuoteTestCases("&laquo;", "{OPEN_QUOTE}", "{OPEN_QUOTE}");
    makeQuoteTestCases("&bdquo;", "{OPEN_QUOTE}", "{OPEN_QUOTE}");
    makeQuoteTestCases("&raquo;", "{CLOSE_QUOTE}", "{CLOSE_QUOTE}");
    makeQuoteTestCases("&ldquo;", "{CLOSE_QUOTE}", "{CLOSE_QUOTE}");
});

// Проверки на правлиьность разбора предложений.
describe('Предложения', function () {
    makeSentencesTestCase("Одно предложение `.`", "A.", ["A {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Одно предложение `?`", "A?", ["A {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Одно предложение `!`", "A!", ["A {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Одно предложение `...`", "A...", ["A {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Два предложения `.`", "A. B.", ["A {SENTENCE_POSSIBLE_END}", "B {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Два предложения `.`, последнее не завершается символом конца предложения", "A. B", ["A {SENTENCE_POSSIBLE_END}", "B"]);
    makeSentencesTestCase("Два предложения `?`", "A? B.", ["A {SENTENCE_POSSIBLE_END}", "B {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Два предложения `!`", "A! B.", ["A {SENTENCE_POSSIBLE_END}", "B {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Два предложения `...`", "A... B.", ["A {SENTENCE_POSSIBLE_END}", "B {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Два предложения с цитатой", "A \"B?! C...\". B.", ["A {OPEN_QUOTE} B {SENTENCE_POSSIBLE_END} C {SENTENCE_POSSIBLE_END} {CLOSE_QUOTE} {SENTENCE_POSSIBLE_END}", "B {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Два предложения с цитатой (вложенной с одной стороны)", "A \"B?! \"C...\". B.", ["A {OPEN_QUOTE} B {SENTENCE_POSSIBLE_END} {OPEN_QUOTE} C {SENTENCE_POSSIBLE_END} {CLOSE_QUOTE} {SENTENCE_POSSIBLE_END}", "B {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Два предложения с цитатой (вложенной)", "A \"B?! \"C...\" D!\". B.", ["A {OPEN_QUOTE} B {SENTENCE_POSSIBLE_END} {OPEN_QUOTE} C {SENTENCE_POSSIBLE_END} {CLOSE_QUOTE} D {SENTENCE_POSSIBLE_END} {CLOSE_QUOTE} {SENTENCE_POSSIBLE_END}", "B {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Три предложения, второе с цитатой (вложенной)", "E! A \"B?! \"C...\" D!\". B.", ["E {SENTENCE_POSSIBLE_END}", "A {OPEN_QUOTE} B {SENTENCE_POSSIBLE_END} {OPEN_QUOTE} C {SENTENCE_POSSIBLE_END} {CLOSE_QUOTE} D {SENTENCE_POSSIBLE_END} {CLOSE_QUOTE} {SENTENCE_POSSIBLE_END}", "B {SENTENCE_POSSIBLE_END}"]);
});

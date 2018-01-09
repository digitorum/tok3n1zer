var assert = require('assert');
var parser = new (require('../lib/parser.js'));

parser.setAbbreviations([
    "т. к.",
    "т. о."
]);

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
    open = open || "{OPEN_QUOTE}";
    close = close || "{CLOSE_QUOTE}";

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

/**
 * Сделать набор тестов по подсчету количества слов или символов в сущностях
 *
 * @param {any} description
 * @param {any} method
 * @param {any} list
 * @param {any} results
 */
function makeCountsTestCase(description, method, list, results) {
    describe(description, function () {
        it('Matching count', function (done) {
            var errors = [];

            for (var i = 0; i < list.length; ++i) {
                var item = list[i];
                var count = item[method]();
                var expected = results[i];

                if (count != expected) {
                    errors.push(item.getSourceString() + ' count `' + count + '` expected `' + expected + '`');
                }
            }
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
    makeQuoteTestCases("\"");
    makeQuoteTestCases("&quot;");
    makeQuoteTestCases("&laquo;");
    makeQuoteTestCases("&bdquo;");
    makeQuoteTestCases("&raquo;");
    makeQuoteTestCases("&ldquo;");
});

// Проверки на правлиьность разбора предложений.
describe('Предложения', function () {
    makeSentencesTestCase("Одно предложение `.`", "a.", ["a {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Одно предложение `?`", "a?", ["a {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Одно предложение `!`", "a!", ["a {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Одно предложение `...`", "a...", ["a {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Одно предложение `.` со скобками `[`", "a [b.].", ["a {BRACKET} b {SENTENCE_POSSIBLE_END} {BRACKET} {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Одно предложение `.` со скобками `(`", "a (b.).", ["a {BRACKET} b {SENTENCE_POSSIBLE_END} {BRACKET} {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Одно предложение `.` с вложенными скобками `(->(`", "a ((b.) c.).", ["a {BRACKET} {BRACKET} b {SENTENCE_POSSIBLE_END} {BRACKET} c {SENTENCE_POSSIBLE_END} {BRACKET} {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Одно предложение `.` с вложенными скобками `(->[`", "a ([b.] c.).", ["a {BRACKET} {BRACKET} b {SENTENCE_POSSIBLE_END} {BRACKET} c {SENTENCE_POSSIBLE_END} {BRACKET} {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Одно предложение `.` с вложенными скобками `[->[`", "a [[b.] c.].", ["a {BRACKET} {BRACKET} b {SENTENCE_POSSIBLE_END} {BRACKET} c {SENTENCE_POSSIBLE_END} {BRACKET} {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Одно предложение `.` с вложенными скобками `[->(`", "a [(b.) c.].", ["a {BRACKET} {BRACKET} b {SENTENCE_POSSIBLE_END} {BRACKET} c {SENTENCE_POSSIBLE_END} {BRACKET} {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Одно предложение `.` с вложенными скобками `[->(->[`", "a [(b. []) c.].", ["a {BRACKET} {BRACKET} b {SENTENCE_POSSIBLE_END} {BRACKET} {BRACKET} {BRACKET} c {SENTENCE_POSSIBLE_END} {BRACKET} {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Одно предложение `.` с вложенными скобками `(->[->(`", "a ([b. ()] c.).", ["a {BRACKET} {BRACKET} b {SENTENCE_POSSIBLE_END} {BRACKET} {BRACKET} {BRACKET} c {SENTENCE_POSSIBLE_END} {BRACKET} {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Одно предложение `.` с вложенными скобками `(->\"[->(\"` и цитатой.", "a (\"[b. \"()] c.\").", ["a {BRACKET} {OPEN_QUOTE} {BRACKET} b {SENTENCE_POSSIBLE_END} {OPEN_QUOTE} {BRACKET} {BRACKET} {BRACKET} c {SENTENCE_POSSIBLE_END} {CLOSE_QUOTE} {BRACKET} {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Одно предложение `.` с вложенными скобками `[->\"(->[\"` и цитатой.", "a [\"(b. \"[]) c.\"].", ["a {BRACKET} {OPEN_QUOTE} {BRACKET} b {SENTENCE_POSSIBLE_END} {OPEN_QUOTE} {BRACKET} {BRACKET} {BRACKET} c {SENTENCE_POSSIBLE_END} {CLOSE_QUOTE} {BRACKET} {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Два предложения `.`", "a. b.", ["a {SENTENCE_POSSIBLE_END}", "b {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Два предложения `.`, последнее не завершается символом конца предложения", "a. b", ["a {SENTENCE_POSSIBLE_END}", "b"]);
    makeSentencesTestCase("Два предложения `?`", "a? b.", ["a {SENTENCE_POSSIBLE_END}", "b {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Два предложения `!`", "a! b.", ["a {SENTENCE_POSSIBLE_END}", "b {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Два предложения `...`", "a... b.", ["a {SENTENCE_POSSIBLE_END}", "b {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Два предложения с цитатой", "a \"b?! c...\". b.", ["a {OPEN_QUOTE} b {SENTENCE_POSSIBLE_END} c {SENTENCE_POSSIBLE_END} {CLOSE_QUOTE} {SENTENCE_POSSIBLE_END}", "b {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Два предложения с цитатой (вложенной с одной стороны)", "a \"b?! \"c...\". b.", ["a {OPEN_QUOTE} b {SENTENCE_POSSIBLE_END} {OPEN_QUOTE} c {SENTENCE_POSSIBLE_END} {CLOSE_QUOTE} {SENTENCE_POSSIBLE_END}", "b {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Два предложения с цитатой (вложенной)", "a \"b?! \"c...\" d!\". b.", ["a {OPEN_QUOTE} b {SENTENCE_POSSIBLE_END} {OPEN_QUOTE} c {SENTENCE_POSSIBLE_END} {CLOSE_QUOTE} d {SENTENCE_POSSIBLE_END} {CLOSE_QUOTE} {SENTENCE_POSSIBLE_END}", "b {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Три предложения, второе с цитатой (вложенной)", "E! a \"b?! \"c...\" d!\". b.", ["E {SENTENCE_POSSIBLE_END}", "a {OPEN_QUOTE} b {SENTENCE_POSSIBLE_END} {OPEN_QUOTE} c {SENTENCE_POSSIBLE_END} {CLOSE_QUOTE} d {SENTENCE_POSSIBLE_END} {CLOSE_QUOTE} {SENTENCE_POSSIBLE_END}", "b {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Одно предложение с сокращением", "a т. к. b.", ["a т. к. b {SENTENCE_POSSIBLE_END}"]);
    makeSentencesTestCase("Одно предложение с сокращениями", "a т. к. b т. о. С.", ["a т. к. b т. о. С {SENTENCE_POSSIBLE_END}"]);
});

// Количество слов
describe('Количество слов', function () {
    var text = parser.parseString("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.");
    var html = parser.parseString("<p>Lorem ipsum dolor sit amet, consectetur <span class='strong'>adipiscing</span> elit, sed do eiusmod <br/> tempor incididunt ut labore et dolore magna aliqua.Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>");

    makeCountsTestCase("Простой текст", 'getWordsCount', [text], [36]);
    makeCountsTestCase("Простой текст с разбивкой на предложения", 'getWordsCount', text.getSentencesList(), [19, 17]);
    makeCountsTestCase("Html", 'getWordsCount', [html], [36]);
    makeCountsTestCase("Html с разбивкой на предложения", 'getWordsCount', html.getSentencesList(), [19, 17]);
});

// Количество символов
describe('Количество символов, длина и смещение', function () {
    var text = parser.parseString("Привет мир! Мой мир самый лучший потому что это МОЙ мир...");
    var text1 = parser.parseString("Привет  мир!   Мой мир самый   лучший   потому  что  это  МОЙ  мир...");
    var text2 = parser.parseString("Привет  мир!   Мой&nbsp;мир&nbsp;самый   лучший   потому  что  это  МОЙ  мир...");
    var html = parser.parseString("<p>Привет мир! <b>Мой</b> мир самый лучший <u style='font-weight: bold;'>потому что это МОЙ</u> мир...</p>");
    var html1 = parser.parseString("<p>Привет мир! <b>Мой</b> мир самый лучший <u style='font-weight: bold;'>потому что это МОЙ</u> мир... Третье предложение</p>");

    makeCountsTestCase("Простой текст", 'getCharactersCount', [text], [58]);
    makeCountsTestCase("Простой текст (длина)", 'getLength', [text], [58]);
    makeCountsTestCase("Простой текст (смещение)", 'getOffset', [text], [0]);
    makeCountsTestCase("Простой текст c лишними пробельными символами", 'getCharactersCount', [text1], [58]);
    makeCountsTestCase("Простой текст c лишними пробельными символами (длина)", 'getLength', [text1], [69]);
    makeCountsTestCase("Простой текст c лишними пробельными символами и entities", 'getCharactersCount', [text2], [58]);
    makeCountsTestCase("Простой текст c лишними пробельными символами и entities (длина)", 'getLength', [text2], [79]);
    makeCountsTestCase("Простой текст с разбивкой на предложения", 'getCharactersCount', text.getSentencesList(), [11, 47]);
    makeCountsTestCase("Простой текст с разбивкой на предложения (длина)", 'getLength', text.getSentencesList(), [11, 47]);
    makeCountsTestCase("Простой текст с разбивкой на предложения (смещение)", 'getOffset', text.getSentencesList(), [0, 11]);
    makeCountsTestCase("Html", 'getCharactersCount', [html], [58]);
    makeCountsTestCase("Html (длина)", 'getLength', [html], [106]);
    makeCountsTestCase("Html с разбивкой на предложения (2)", 'getCharactersCount', html.getSentencesList(), [11, 47]);
    makeCountsTestCase("Html с разбивкой на предложения (2) (длина)", 'getLength', html.getSentencesList(), [14, 92]);
    makeCountsTestCase("Html с разбивкой на предложения (3) (длина)", 'getLength', html1.getSentencesList(), [14, 88, 23]);
    makeCountsTestCase("Html с разбивкой на предложения (2) (смещение)", 'getOffset', html.getSentencesList(), [0, 14]);
    makeCountsTestCase("Html с разбивкой на предложения (3) (смещение)", 'getOffset', html1.getSentencesList(), [0, 14, 102]);
});
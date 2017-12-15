var assert = require('assert');
var parser = new (require('../lib/parser.js'));

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

// Простые проверки на парсинг тэгов
describe('Parser', function () {
    makeTestCases("XHTML tag", "<BR/>", "{TAG}");
    makeTestCases("XHTML tag with attributes {single quote, double quote, without quote, without value}", "<BR class='first-class second-class' class-dq=\"first-class second-class\" data-attr=1 readonly/>", "{TAG}");
    makeTestCases("HTML tag (single)", "<BR>", "{TAG}");
    makeTestCases("HTML tag (single) with attributes {single quote, double quote, without quote, without value}", "<BR class='first class second-class' class-dq=\"first class second-class\" data-attr=1 readonly>", "{TAG}");
    makeTestCases("HTML tag (empty)", "<p></p>", "{TAG} {TAG}");
    makeTestCases("HTML tag (empty) with attributes {single quote, double quote, without quote, without value}", "<p class='first class second-class' class-dq=\"first class second-class\" data-attr=1 readonly></p>", "{TAG} {TAG}");
    makeTestCases("HTML tag (with inner text)", "<p>Hello world!</p>", "{TAG} Hello world {SENTENCE_POSSIBLE_END} {TAG}");
    makeTestCases("HTML tag (with inner text) with attributes {single quote, double quote, without quote, without value}", "<p class='first class second-class' class-dq=\"first class second-class\" data-attr=1 readonly>Hello world!</p>", "{TAG} Hello world {SENTENCE_POSSIBLE_END} {TAG}");
});

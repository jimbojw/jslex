/**
 * test.js - Unit tests for the jslex library.
 */

module("jslex");

test("basic availability", function() {
    expect(1);
    ok(window.jslex, "window.jslex");
});

test("jslex()", function() {
    expect(1);
    throwing(function() {
        jslex();
    }, "no specification supplied", "jslex()");
});

test("jslex( { } )", function() {
    expect(1);
    var lexer = jslex({});
    ok(lexer, "lexer = jslex({})");
});

/**
 * Creates a simple numeric expression lexer for testing.
 */
function getExpressionLexer() {
    var lexer = new jslex( {
        "start": {
            "[0-9]+": function() {
                return parseInt(this.text, 10);
            },
            "[-+\n]": function() {
                return this.text;
            },
            "[ \t\r]": null,
            ".": function() {
                throw "Invalid character '" + this.text + "' (line:" + (1 + this.line) + ", column:" + this.column + ")";
            }
        }
    } );
    return lexer;
}

test("jslex.lex(good_input)", function() {

    expect(4);
    
    var lexer = getExpressionLexer();
    ok(lexer, "lexer = jslex({simple})");
    
    // Collect the token stream from a given lex pass
    function collectTokens( input ) {
        var tokens = [];
        function collect(token) {
            tokens[tokens.length] = token;
        }
        lexer.lex(input, collect);
        return tokens;
    }
    
    // Asserts that a given input lexes out the expected token stream 
    function assertLexed( input, expected, msg ) {
        var tokens = collectTokens(input);
        ok(QUnit.equiv(tokens, expected), msg + ': ' + input);
    }
    
    assertLexed("0123456789", [123456789], "Simple numeric string");
    assertLexed("1+1\n2-1", [1, "+", 1, "\n", 2, "-", 1], "Complex expression");
    assertLexed("10 + 2000 - 15", [10, "+", 2000, "-", 15], "Complex expression");
    
});

test("jslex.lex(bad_input)", function() {

    expect(4);
    
    var lexer = getExpressionLexer();
    ok(lexer, "lexer = jslex({simple})");
    
    throwing(function(){
        lexer.lex("");
    }, "no callback provided", "lexer.lex() with no callback");

    // Collect the token stream from a given lex pass
    function collectTokens( input ) {
        var tokens = [];
        function collect(token) {
            tokens[tokens.length] = token;
        }
        lexer.lex(input, collect);
        return tokens;
    }
    
    throwing(function(){
        collectTokens("1 + y");
    }, "Invalid character 'y' (line:1, column:4)", "Invalid expression");

    throwing(function(){
        collectTokens("1 + 1\n2 - z");
    }, "Invalid character 'z' (line:2, column:4)", "Invalid expression");

});

test("jslex.collect(good_input)", function() {

    expect(4);

    var lexer = getExpressionLexer();
    ok(lexer, "lexer = jslex({simple})");
    
    function assertCollected( input, expected, msg ) {
        var tokens = lexer.collect(input);
        ok(QUnit.equiv(tokens, expected), msg + ': ' + input);
    }

    assertCollected("0123456789", [123456789], "Simple numeric string");
    assertCollected("1+1\n2-1", [1, "+", 1, "\n", 2, "-", 1], "Complex expression");
    assertCollected("10 + 2000 - 15", [10, "+", 2000, "-", 15], "Complex expression");
    
});

test("jslex.collect(bad_input)", function() {

    expect(4);

    var lexer = getExpressionLexer();
    ok(lexer, "lexer = jslex({simple})");
    
    var tokens = lexer.collect("z");
    ok(tokens.length === 1, "exactly one token returned for 'z' input");
    
    var err = tokens[0];
    ok(err instanceof Error, "token is an instance of Error");
    equals(err.message, "Invalid character 'z' (line:1, column:0)", "Correct error message");
    
});

// TODO: Write tests for all api methods (this.reject(), this.begin(), this.less(), etc.)


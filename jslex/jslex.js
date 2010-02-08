/**
 * jslex - A lexer in JavaScript.
 * @author Jim R. Wilson (jimbojw)
 */

(function( exports ){

var undefined;

/**
 * jslex constructor.
 * @param {object} spec Lexer specification.
 * @return {object} 
 */
function jslex( spec ) {

    if (spec === undefined) {
        throw "no specification supplied";
    }
    
    var
        
        // jslex object
        lexer = new JSLex(),
            
        // specification
        specification = lexer.specification = {}
        
        // list of states
        states = lexer.states = [];
                
    
    // establish list of states
    for (var k in spec) {
        states[states.length] = k;
    }
    
    // build out internal representation of the provided spec
    for (var i=0, l=states.length; i<l; i++) {

        var
            s = states[i],
            state = spec[s];

        if (specification[s]) {
            throw "Duplicate state declaration encountered for state '" + s + "'";
        }
        
        var rules = specification[s] = [];
        
        for (var k in state) {
            try {
                var re = new RegExp('^' + k);
            } catch(err) {
                throw "Invalid regexp '" + k + "' in state '" + s + "' (" + err.message + ")";
            }
            rules[rules.length] = {
                re: re,
                action: state[k]
            };
        }
    }
    
    // return jslex object
    return lexer;
}

// End of File marker
var EOF = {};

/**
 * Utility function for comparing two matches.
 * @param {object} m1 Left-hand side match.
 * @param {object} m2 Right-hand side match.
 * @return {int} Difference between the matches.
 */
function matchcompare( m1, m2 ) {
    return m2.len - m1.len || m1.index - m2.index;
}

/**
 * JSLex prototype.
 */
function JSLex() { }
JSLex.prototype = {

    /**
     * Scanner function - makes a new scanner object which is used to get tokens one at a time.
     * @param {string} input Input text to tokenize.
     * @param {function} Scanner function.
     */
    scanner: function scanner( input ) {
    
        var
            
            // avoid ambiguity between the lexer and the api object
            lexer = this,
            states = lexer.states,
            specification = lexer.specification,
            
            // position within input stream
            pos = 0,
            
            // current line number
            line = 0,
            
            // curret column number
            col = 0,
            
            offset,
            less,
            go,
            newstate,
            inputlen = input.length,
            nlre = /\n/g,
        
            // initial state
            state = states[0];
        
        /**
         * The api bject will be set to "this" when executing spec callbacks.
         */ 
        var api = {
            
            /**
             * Analogous to yytext and yyleng in lex - will be set during scan.
             */
            text: null,
            leng: null,
        
            /**
             * Position of in stream, line number and column number of match.
             */
            pos: null,
            line: null,
            column: null,
        
            /**
             * Analogous to input() in lex.
             * @return {string} The next character in the stream.
             */
            input: function(){
                return input.charAt(pos + this.leng + offset++);
            },
            
            /**
             * Similar to unput() in lex, but does not allow modifying the stream.
             * @return {int} The offset position after the operation.
             */
            unput: function(){
                return offset = offset > 0 ? offset-- : 0;
            },
            
            /**
             * Analogous to yyless(n) in lex - retains the first n characters from this pattern, and returns 
             * the rest to the input stream, such that they will be used in the next pattern-matching operation.
             * @param {int} n Number of characters to retain.
             * @return {int} Length of the stream after the operation has completed.
             */
            less: function(n) {
                less = n;
                offset = 0;
                this.text = this.text.substr(0, n);
                return this.leng = this.text.length;
            },
            
            /**
             * Like less(), but instead of retaining the first n characters, it chops off the last n.
             * @param {int} n Number of characters to chop.
             * @return {int} Length of the stream after the operation has completed.
             */
            pushback: function(n) {
                return this.less(this.leng - n);
            },
            
            /**
             * Similar to REJECT in lex, except it doesn't break the current execution context.
             * TIP: reject() should be the last instruction in a spec callback.
             */
            reject: function() {
                go = true;
            },
            
            /**
             * Analogous to BEGIN in lex - sets the named state (start condition).
             * @param {string|int} state Name of state to switch to, or ordinal number (0 is first, etc).
             * @return {string} The new state on successful switch, throws exception on failure.
             */
            begin: function(state) {
                if (specification[state]) {
                    return newstate = state;
                }
                var s = states[parseInt(state)];
                if (s) {
                    return newstate = s;
                }
                throw "Unknown state '" + state + "' requested";
            },
            
            /**
             * Simple accessor for reading in the current state.
             * @return {string} The current state.
             */
            state: function(){
                return state;
            }
            
        };
        
        /**
         * Scan method to be returned to caller - grabs the next token and fires appropriate calback.
         * @return {string} The next token extracted from the stream.
         */
        function scan() {
        
            if (pos >= inputlen) {
                return EOF;
            }
            api.pos = pos;
            api.line = line;
            api.column = col;
            var
                str = pos ? input.substr(pos) : input,
                rules = specification[state],
                matches = [];
            for (var i=0, l=rules.length; i<l; i++) {
                var
                    rule = rules[i],
                    m = str.match(rule.re);
                if (m && m[0].length) {
                    matches[matches.length] = {
                        index: i,
                        text: m[0],
                        len: m[0].length,
                        rule: rule
                    };
                }
            }
            if (!matches.length) {
                var ch = str.charAt(0);
                pos++;
                if (ch=="\n") {
                    line++;
                    col = 0;
                } else {
                    col++;
                }
                return ch;
            }
            matches.sort(matchcompare);
            go = true;
            for (var j=0, n=matches.length; j<n && go; j++) {
                var
                    offset = 0,
                    less = null,
                    go = false,
                    newstate = null,
                    result,
                    m = matches[j],
                    action = m.rule.action;
                api.text = m.text;
                api.leng = m.len;
                if (!action) {
                    break;
                }
                var result = action.call(api);
                if (newstate && newstate != state) {
                    state = newstate;
                    break;
                }
            }
            var
                text = less===null ? m.text : m.text.substr(0, less),
                len = text.length;
            pos += len + offset;
            var nlm = text.match(nlre);
            if (nlm) {
                line += nlm.length;
                col = len - text.lastIndexOf("\n") - 1;
            } else {
                col += len;
            }
            if (result !== undefined) {
                return result;
            }
        }
        
        return scan;
    },
    
    /**
     * Similar to lex's yylex() function, consumes all input, calling calback for each token.
     * @param {string} input Text to lex.
     * @param {function} callback Function to execute for each token.
     */
    lex: function lex( input, callback ) {
        if (callback === undefined) {
            throw "no callback provided";
        }
        var
            token,
            scanner = this.scanner(input);
        while (true) {
            token = scanner();
            if (token === EOF) {
                return;
            }
            if (token !== undefined) {
                callback(token);
            }
        }
    },
    
    /**
     * Consumes all input, collecting tokens along the way.
     * @param {string} input Text to lex.
     * @return {array} List of tokens, may contain an Error at the end.
     */
    collect: function collect( input ) {
        var tokens = [];
        function callback( token ) {
            tokens[tokens.length] = token;
        }
        try {
            this.lex(input, callback);
        } catch (err) {
            if (!(err instanceof Error)) {
                err = new Error(err + '');
            }
            tokens[tokens.length] = err;
        }
        return tokens;
    }
    
};
    
// Provide jslex to exports
exports.jslex = jslex;

})(
    // Use exports object if defined, otherwise punt to "this" (window in browser, global elsewhere)
    typeof exports === 'object' ? exports : this
);


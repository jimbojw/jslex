## jslex

Lexical analyzer JavaScript library.  Similar to [lex](http://en.wikipedia.org/wiki/Lex_%28software%29) and [flex](http://en.wikipedia.org/wiki/Flex_lexical_analyser).

### Developed by
* Jim R. Wilson (jimbojw)

### GitHub repository
* [http://github.com/jimbojw/jslex/](http://github.com/jimbojw/jslex/)

### License
This project is released under [The MIT License](http://www.opensource.org/licenses/mit-license.php).

### Usage

The best way to understand how to use jslex is via illustrative example.

First, create a lexer:

<pre class="sh_javascript">
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
</pre>

The above lexer has one state, called "start", which contains 4 patterns:
* one for numbers,
* one for plus, minus, or new lines,
* one for uninteresting whitespace characters, and 
* one for anything else.

To use the lexer on an input string, you can use the lex() method:

<pre class="sh_javascript">
function callback( token ) {
  // Do something with returned token
}

lexer.lex( "1 + 2", callback );
</pre>

In the above example, the callback() function will be called three times:
* first with the number 1, 
* then with the string "+", and
* lastly with the number 2.

A very common use case for the lexer is to simply collect all the tokens in an input stream.  For this, use the collect() function:

<pre class="sh_javascript">
var tokens = lexer.collect( "1 + 2" );
</pre>

After executing the above snippet, the tokens variable would have three elements: [1, "+", 2].



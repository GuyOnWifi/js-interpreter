// Implements the lexer (converts source this.code into token stream)
module.exports = class Lexer {
    constructor(code) {
        this.code = code;
        this.pos = 0;
        this.line = 0;
    }

    // Returns next token
    next() {
        const CHAR_RE = /[a-zA-Z]/;
        const VAR_RE = /[a-zA-Z0-9_]/;
        const NUM_RE = /[0-9]/;
        const OP_RE = /^(\.|!|\+|-|\*|\/|==|!=|&&|\|\||<|>|<=|>=|=|!=)$/;
        const KEYWORD_RE = /^(let|const|if|else|while|function|return)$/;

        let token = {
            type: "",
            value: "",
        }

        if (this.pos >= this.code.length) {
            token.type = "EOF";
            token.value = null;
        }

        while (this.pos < this.code.length) {
            // assumes LF and not CRLF
            if (this.code[this.pos] === "\n") {
                this.line++;
            } else if (this.code[this.pos].match(CHAR_RE)) {
                // parse identifier
                token.type = "identifier"
                // repeat as long as matching
                while (this.code[this.pos].match(VAR_RE)) {
                    token.value += this.code[this.pos];
                    this.pos++;
                }

                if (token.value.match(KEYWORD_RE)) token.type = "keyword";
                break;
            } else if (this.code[this.pos].match(NUM_RE)) {
                token.type = "number";
                // repeat as long as matching
                while (this.code[this.pos].match(NUM_RE)) {
                    token.value += this.code[this.pos];
                    this.pos++;
                }

                token.value = parseInt(token.value);
                break;
            } else if (this.code[this.pos] === "\"" || this.code[this.pos] === "\'") {
                // store which type started this string
                let start = this.code[this.pos];
                this.pos++;
                token.type = "string";
                while (this.code[this.pos] !== start) {
                    token.value += this.code[this.pos];
                    this.pos++;
                }
                // consume the string end
                this.pos++;
                break;
            } else if (this.code[this.pos].match(OP_RE)) {
                token.type = "operator"
                // check for double character operators
                const peek = (this.code[this.pos] + this.code[this.pos + 1])
                if ((peek).match(OP_RE)) {
                    token.value = peek;
                    this.pos += 2;
                } else {
                    token.value = this.code[this.pos];
                    this.pos++;
                }
                break;
            } else if (this.code[this.pos] === ";") {
                token.type = "semicolon";
                token.value = this.code[this.pos];
                this.pos++;
                break;
            } else if (this.code[this.pos] === "(" || this.code[this.pos] === ")") {
                token.type = "parentheses";
                token.value = this.code[this.pos];
                this.pos++;
                break;
            } else if (this.code[this.pos] === "{" || this.code[this.pos] === "}") {
                token.type = "codeblock";
                token.value = this.code[this.pos];
                this.pos++;
                break;
            } else if (this.code[this.pos] === ",") {
                token.type = "comma";
                token.value = this.code[this.pos];
                break;
            }

            this.pos++;
        }

        if (token.type === "") {
            token.type = "EOF";
            token.value = null;
        } 
        
        return token;

    }
}
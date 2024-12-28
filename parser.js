const process = require("node:process");

// Parses our token stream and converts it into an Abstract Syntax Tree
module.exports = class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
        this.ast = {
            type: "Program",
            body: []
        };
    }
    
    match(type, val = null) {
        const tk = this.tokens[this.pos]
        if (val) {
            if (type === tk.type && val == tk.value) {
                this.pos++;
                return tk;
            } else {
                console.error(`Expected ${type} "${val}", got ${tk.type} "${tk.value}" (Line ${tk.line})`);
                process.exit(1);
            }
        } else {
            if (type === tk.type) {
                this.pos++;
                return tk;
            } else {
                console.error(`Expected ${type}, got ${tk.type} ${tk.value} (Line ${tk.line})`);
                process.exit(1);
            }
        }
    }

    codeBlock() {
        let node = {
            type: "BlockStatement",
            body: []
        };
        
        let n = this.line();
        node.body.push(n);
        // account for eof
        while (n && this.pos < this.tokens.length - 1) {
            n = this.line();
            if (n) {
                node.body.push(n);
            }
        }
        return node;
    }

    varDecl() {
        let tk = this.tokens[this.pos];
        const node = {
            type: "VariableDeclaration",
            kind: tk.value,
            identifier: "",
            value: null
        }
        this.pos++;

        tk = this.match("identifier");
        node.identifier = tk.value;

        tk = this.tokens[this.pos];
        if (tk.type === "operator" && tk.value === "=") {
            this.pos++;

            tk = this.tokens[this.pos];
            if (tk.type === "number" || tk.type === "string") {
                node.value = tk.value;
                this.pos++;
            } else {
                node.value = this.expr();
            }
        }

        this.match("semicolon");
        return node;
    }

    paramDecl() {
        let params = []
        let tk = this.match("identifier");
        params.push(tk.value);
        
        while (this.tokens[this.pos].type === "comma") {
            // more identifiers to parse
            this.pos++;
            let tk = this.match("identifier");
            params.push(tk.value);
        }
        
        return params;
    }

    funcDecl() {
        this.pos++;
        let tk = this.match("identifier");

        let node = {
            type: "FunctionDeclaration",
            identifier: tk.value,
            body: [],
            params: []
        }

        this.match("parentheses", "(");
        node.params = this.paramDecl();
        this.match("parentheses", ")");

        this.match("codeblock", "{");
        node.body = this.codeBlock();
        this.match("codeblock", "}");

        return node;
    }

    funcArg() {
        let args = [];
        let e = this.expr();
        while (e) {
            args.push(e);
            let tk = this.tokens[this.pos];
            if (tk.type === "comma") {
                this.match("comma");
                e = this.expr();
            } else {
                return args;
            }
        }
        console.error("Expected arguments after comma");
        process.exit(1);
    }

    group() {
        let tk = this.tokens[this.pos];
        if (tk.type === "number" || tk.type === "string") {
            this.pos++;
            return tk.value;
        } else if (tk.type === "identifier") {
            this.pos++;
            // if there are brackets its a function call
            if (this.tokens[this.pos].type === "parentheses" && this.tokens[this.pos].value === "(") {
                let node = {
                    type: "CallExpression",
                    arguments: [],
                    callee: tk.value
                }
                this.match("parentheses", "(");
                node.arguments = this.funcArg();
                this.match("parentheses", ")");
                return node;
            }

            return {
                type: "Identifier",
                name: tk.value
            }
        } else if (tk.type === "parentheses" && tk.value === "(") {
            this.match("parentheses", "(");
            let val = this.expr();
            this.match("parentheses", ")");
            return val;
        } else {
            return;
        }
    }

    unary() {
        let tk = this.tokens[this.pos];
        if (tk.type === "operator" && tk.value.match(/^(\+|-)$/)) {
            this.match("operator");
            return {
                type: "BinaryExpression",
                operator: tk.value,
                arguent: this.group()
            }
        } else {
            return this.group();
        }
    }

    factor() {
        let left = this.unary();

        let tk = this.tokens[this.pos];
        if (tk.type === "operator" && tk.value.match(/^(\*|\/)$/)) {
            this.match("operator");
            let right = this.factor();
            return {
                type: "BinaryExpression",
                operator: tk.value,
                left: left,
                right: right
            }
        } else {
            return left;
        }
    }

    term() {
        let left = this.factor();

        let tk = this.tokens[this.pos];
        if (tk.type === "operator" && tk.value.match(/^(\+|-)$/)) {
            this.match("operator");
            let right = this.term();
            return {
                type: "BinaryExpression",
                operator: tk.value,
                left: left,
                right: right
            }
        } else {
            return left;
        }
    }

    comparisonExpr() {
        let left = this.term();

        let tk = this.tokens[this.pos];
        if (tk.type === "operator" && tk.value.match(/^(<|>|<=|>=)$/)) {
            this.match("operator");
            let right = this.comparisonExpr();
            return {
                type: "ComparisonExpression",
                operator: tk.value,
                left: left,
                right: right
            }
        } else {
            return left;
        }
    }

    equalityExpr() {
        let left = this.comparisonExpr();

        let tk = this.tokens[this.pos];
        if (tk.type === "operator" && tk.value.match(/^(==|!=)$/)) {
            this.match("operator");
            let right = this.equalityExpr();
            return {
                type: "ComparisonExpression",
                operator: tk.value,
                left: left,
                right: right
            }
        } else {
            return left;
        }
    }

    logicalAnd() {
        let left = this.equalityExpr();

        let tk = this.tokens[this.pos];
        if (tk.type === "operator" && tk.value === "&&") {
            this.match("operator", "&&");
            let right = this.logicalAnd();
            return {
                type: "LogicalExpression",
                operator: "&&",
                left: left,
                right: right
            }
        } else {
            return left;
        }
    }

    logicalOr() {
        let left = this.logicalAnd();
        
        let tk = this.tokens[this.pos];
        if (tk.type === "operator" && tk.value === "||") {
            this.match("operator", "||");
            let right = this.logicalOr();
            return {
                type: "LogicalExpression",
                operator: "||",
                left: left,
                right: right
            }
        } else {
            return left;
        }
    }

    expr() {
        let tk = this.tokens[this.pos];
        let next = this.tokens[this.pos + 1];
        if (tk.type === "identifier" && next.type === "operator" && next.value === "=") {
            tk = this.match("identifier");
            this.match("operator", "=")
            return {
                type: "AssignmentExpression",
                left: tk.value,
                right: this.logicalOr(),
                operator: "="
            }
        } else {
            return this.logicalOr();
        }
    }

    if_sm() {
        let node = {
            type: "IfStatement",
            consequent: {},
            alternate: {},
            test: {}
        }

        this.match("keyword", "if");
        this.match("parentheses", "(");
        node.test = this.expr();
        this.match("parentheses", ")");

        this.match("codeblock", "{");
        node.consequent = this.codeBlock();
        this.match("codeblock", "}");
        
        return node;
    }

    if_chain_sm() {
        let node = this.if_sm();

        let tk = this.tokens[this.pos]
        if (tk.type === "keyword" && tk.value === "else") {
            this.pos++;

            let tk = this.tokens[this.pos];

            if (tk.type === "keyword" && tk.value === "if") {
                node.alternate = this.if_chain_sm();
            } else {
                this.match("codeblock", "{");
                node.alternate = this.codeBlock();
                this.match("codeblock", "}");
            }
        }

        return node;
    }

    while_sm() {
        let node = {
            type: "WhileStatement",
            test: "",
            body: {}
        }

        this.match("keyword", "while");
        this.match("parentheses", "(");
        node.test = this.expr();
        this.match("parentheses", ")");
        
        this.match("codeblock", "{");
        node.body = this.codeBlock();
        this.match("codeblock", "}");

        return node;
    }

    return_sm() {
        let node = {
            type: "ReturnStatement",
            argument: ""
        }
        this.match("keyword", "return");
        node.argument = this.expr();
        this.match("semicolon", ";");
        
        return node;
    }

    statement() {
        let tk = this.tokens[this.pos];

        if (tk.type === "keyword" && tk.value === "if") {
            return this.if_chain_sm();
        } else if (tk.type === "keyword" && tk.value === "while") {
            return this.while_sm();
        } else if (tk.type === "keyword" && tk.value === "return") {
            return this.return_sm();
        }
        
        const e = this.expr();
        if (e) {
            this.match("semicolon", ";");
            return e;
        } 
        return;
    }

    line() {
        const tk = this.tokens[this.pos];
        if (tk.type === "keyword") {
            if (tk.value === "let" || tk.value === "const") {
                return this.varDecl();
            } else if (tk.value === "function") {
                return this.funcDecl();
            } else if (tk.value === "print") {
                // consumm the print and the next val
                this.pos += 2;
                return {
                    type: "Print",
                    value: this.expr()
                }
            } else {
                return this.statement();
            }
        } else {
            return this.statement();
        }
    }

    createTree() {
        // account for EOF
        this.ast.body = this.codeBlock().body;

        return this.ast;
    }
}
const fs = require("node:fs");
const Lexer = require("./lexer");
const Parser = require("./parser");
const Executor = require("./executor");

let code;
try {
    code = fs.readFileSync("./code.txt", "utf8");
} catch (err) {
    console.error(err);
}

// Lexing
const lexer = new Lexer(code);

let tokens = [];
tokens.push(lexer.next());

while (tokens[tokens.length - 1].type !== "EOF") {
    tokens.push(lexer.next());
}

console.log(tokens);

// Parsing
const parser = new Parser(tokens);
const ast = parser.createTree();

console.dir(ast, {depth: null});

// Executing
const executor = new Executor(ast);
executor.execute();

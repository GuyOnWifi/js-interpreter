const fs = require("node:fs");
const Lexer = require("./lexer");
const Parser = require("./parser");

let code;
try {
    code = fs.readFileSync("./code.txt", "utf8");
} catch (err) {
    console.error(err);
}

const lexer = new Lexer(code);

let tokens = [];
tokens.push(lexer.next());

while (tokens[tokens.length - 1].type !== "EOF") {
    tokens.push(lexer.next());
}

console.log(tokens);

const parser = new Parser(tokens);
const ast = parser.createTree();

console.dir(ast, {depth: null});
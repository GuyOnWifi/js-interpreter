Simple interpreter for a JS-like language

# About
This project was inspired by [Write a C compiler](https://github.com/lotabout/write-a-C-interpreter)

However, I absolutely despise the C language and wanted to make interpret my favourite coding language, Javascript. This project was really fun and showed that writing a simple interpreter was not that hard. Just a little bit of theory and a lot of recursion.

## How I built it

The interpreter is split up into 3 main parts: the lexer, the parser and the executer.

The lexer is responsible for converting the source code into a token stream. This handles the bulk of the whitespace, string/number differentiation, and keyword recognition. It simplifies the task for the parser by reducing down the code into its most important aspects, which is represented as a token stream.

The parser then takes this token tree and validates the grammar rules. If it follows all the syntax correctly, it spits out an Abstract Syntax Tree (AST). It's an intermediate representation of the code that structures it in a way that is manageable by our executer.

The last step of the interpreter is the execution. It takes the AST generated by our parser and executes the code. (This step is still a WIP, stay tuned!)

# Resources

- https://www.2am.tech/blog/building-a-language-interpreter-in-javascript
- https://daily.dev/blog/javascript-interpreter-basics-for-developers
module.exports = class Executor {
    constructor(ast) {
        this.ast = ast;
        this.variables = [];
        this.functions = [];
    }

    searchIdentifiers(id) {
        // Loop backwards (like a stack)
        for (let i = this.variables.length - 1; i >= 0; i--) {
            if (this.variables[i].identifier === id) {
                return this.variables[i];
            }
        }
        return null;
    }

    execNode(node, inFunctionCall = false) {
        if (node === undefined) return;
        if (node.type === "VariableDeclaration") {
            if (this.searchIdentifiers(node.identifier)) {
                console.error(`Duplicate identifier ${node.identifier}`);
                process.exit(1);
            }
            this.variables.push({
                identifier: node.identifier,
                kind: node.kind,
                value: node.value
            });
            return;
        } else if (node.type === "FunctionDeclaration") {
            this.functions.push({
                identifier: node.identifier,
                body: node.body,
                params: node.params
            })
            return;
        } else if (node.type === "IfStatement") {
            if (this.execNode(node.test)) {
                this.execNode(node.consequent);
            } else {
                this.execNode(node.alternate);
            }
            return;
        } else if (node.type === "WhileStatement") {
            while (this.execNode(node.test)) {
                this.execNode(node.body);
            }
            return;
        } else if (node.type === "BlockStatement") {
            for (const n of node.body) {
                const val = this.execNode(n, inFunctionCall);
                if (val && val.type === "return") {
                    return val.value;
                }
            }
            return;
        } else if (node.type === "CallExpression") {
            const func = this.functions.find(f => f.identifier === node.callee);
            if (!func) {
                console.error(`Undefined function ${node.callee}`);
                process.exit(1);
            }

            // push the arguments into variables
            const basePointer = this.variables.length;
            for (let i = 0; i < func.params.length; i++) {
                this.variables.push({
                    identifier: func.params[i],
                    value: node.arguments[i],
                    kind: "let"
                })
            }

            const res = this.execNode(func.body, true);

            // remove the arguments
            this.variables.splice(basePointer, this.variables.length - 1);

            return res;
        } else if (node.type === "ReturnStatement") {
            if (!inFunctionCall) {
                console.error("Return outside of function call");
                process.exit(1);
            }
            return {
                type: "return",
                value: this.execNode(node.argument)
            };
        } else if (node.type === "Print") {
            return console.log(this.execNode(node.value));
        } else if (node.type === "Identifier") {
            const id = this.searchIdentifiers(node.name);
            if (!id) {
                console.error(`Identifier ${node.name} does not exist`);
                process.exit(1);
            }

            return id.value;
        } else if(node.type === "AssignmentExpression") {
            const id = this.searchIdentifiers(node.left);
            if (!id) {
                console.error(`Identifier ${node.left} does not exist`);
                process.exit(1);
            }
            if (id.type === "const") {
                console.error(`Assignment on const identifier ${id.identifier}`)
                process.exit(1);
            }
            id.value = this.execNode(node.right);
        } else if (node.type === "UnaryExpression") {
            if (node.operator === "+") {
                return this.execNode(node.argument);
            } else if (node.operator === "-") {
                return -this.execNode(node.argument);
            } else if (node.operator === "!") {
                return !this.execNode(node.argument);
            } 
        } else if (node.type === "BinaryExpression") {
            if (node.operator === "+") {
                return this.execNode(node.left) + this.execNode(node.right);
            } else if (node.operator === "-") {
                return this.execNode(node.left) - this.execNode(node.right);
            } else if (node.operator === "*") {
                return this.execNode(node.left) * this.execNode(node.right);
            } else if (node.operator === "/") {
                return this.execNode(node.left) / this.execNode(node.right);
            }
        } else if (node.type === "ComparisonExpression") {
            if (node.operator === ">") {
                return this.execNode(node.left) > this.execNode(node.right);
            } else if (node.operator === ">=") {
                return this.execNode(node.left) >= this.execNode(node.right);
            } else if (node.operator === "<") {
                return this.execNode(node.left) < this.execNode(node.right);
            } else if (node.operator === "<=") {
                return this.execNode(node.left) <= this.execNode(node.right);
            }
        } else if (node.type === "LogicalExpression") {
            if (node.operator === "&&") {
                return this.execNode(node.left) && this.execNode(node.right);
            } else if (node.operator === "||") {
                return this.execNode(node.left) || this.execNode(node.right);
            } 
        }
        
        return node;
        
    }

    execute() {
        if (this.ast.type !== "Program") {
            console.error("Invalid ast");
            process.exit(1);
        }

        for (const n of this.ast.body) {
            this.execNode(n);
        }
    }
}
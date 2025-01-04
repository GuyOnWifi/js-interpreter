import { useState } from 'react'
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView, EditorState } from '@uiw/react-codemirror';

// @ts-ignore
import Lexer from "./interpreter/lexer.js";
// @ts-ignore
import Parser from "./interpreter/parser.js";
// @ts-ignore
import Executor from "./interpreter/executor.js";

import './App.css'

function App() {
  const [code, setCode] = useState(
    `function countToTen() {
    let i = 0;
    while (i < 10) {
        print i;
        i = i + 1;
    }
}

countToTen();`
  );
  
  const [output, setOutput] = useState(`Output will show up here...`);

  function runCode() {
    setOutput("");
    // Lexing
    const lexer = new Lexer(code);
    
    let tokens = [];
    tokens.push(lexer.next());

    while (tokens[tokens.length - 1].type !== "EOF") {
        tokens.push(lexer.next());
    }

    // Parsing
    const parser = new Parser(tokens);
    let ast;
    try {
      ast = parser.createTree();
    } catch(err : any) {
      return setOutput("Error: " + err.message);
    }

    console.dir(ast, {depth: null});

    // Executing
    const executor = new Executor(ast, setOutput);
    try {
      executor.execute();
    } catch(err : any) {
      return setOutput("Error: " + err.message);
    }
  }

  return (
    <>
      <div className="flex flex-row h-[100vh] w-[100vw] max-h-[100vh] max-w-[100vw] gap-4 p-4">

        <div className="flex-1 flex flex-col max-w-[50%]">
          <div className="h-10 flex flex-row items-center">
            <span className="bg-[#1e1e1e] self-end p-2 font-bold">Code</span>
            <span className="ml-auto bg-green-500 px-4 py-2 rounded hover:bg-green-400 cursor-pointer" onClick={runCode}>Run</span>
          </div>
          <CodeMirror
            id="code"
            value={code}
            theme={[vscodeDark, javascript()]}
            basicSetup={{
              autocompletion: false,
            }}
            extensions={[EditorView.lineWrapping]}
            className="grow overflow-scroll"
            onChange={setCode}
          />
        </div>

        <div className="flex-1 flex flex-col max-w-[50%]">
          <div className="h-10 flex flex-row items-center">
            <span className="bg-[#1e1e1e] self-end p-2 font-bold">Output</span>
          </div>
          <CodeMirror
            id="console"
            value={output}
            theme={[vscodeDark]}
            basicSetup={{
              lineNumbers: false,
              highlightActiveLine: false,
              highlightActiveLineGutter: false
            }}
            extensions={[EditorView.editable.of(false), EditorState.readOnly.of(true), EditorView.lineWrapping]}
            className="grow overflow-scroll"
          />
        </div>

      </div>
    </>

  )
}

export default App;

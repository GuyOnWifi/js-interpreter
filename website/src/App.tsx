import { useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
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
  
  const [display, setDisplay] = useState("");
  const [mode, setMode] = useState("output");

  const [output, setOutput] = useState(`Output will show up here...`);
  const [tokens, setTokens] = useState("[]")
  const [ast, setAST] = useState("{}");

  function runCode() {
    setOutput("");
    // Lexing
    const lexer = new Lexer(code);
    
    let tks = [];
    tks.push(lexer.next());

    while (tks[tks.length - 1].type !== "EOF") {
        tks.push(lexer.next());
    }
    
    setTokens(JSON.stringify(tks, null, 2));

    // Parsing
    const parser = new Parser(tks);
    let tree;
    try {
      tree = parser.createTree();
    } catch(err : any) {
      return setOutput("Error: " + err.message);
    }
    setAST(JSON.stringify(tree, null, 2));

    // Executing
    const executor = new Executor(tree, setOutput);
    try {
      executor.execute();
    } catch(err : any) {
      return setOutput("Error: " + err.message);
    }
  }

  useEffect(() => {
    if (mode === "output") {
      setDisplay(output);
    } else if (mode === "tokens") {
      setDisplay(tokens)
    } else if (mode === "ast") {
      setDisplay(ast);
    }
  }, [mode, output, tokens, ast])


  return (
    <>
      <div className="flex flex-col md:flex-row h-[100vh] w-[100vw] max-h-[100vh] max-w-[100vw] gap-4 p-4">

        <div className="flex-1 flex flex-col md:max-w-[50%]">
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

        <div className="flex-1 flex flex-col md:max-w-[50%]">
          <div className="h-10 flex flex-row items-center gap-2">
            <span className="bg-[#1e1e1e] self-end p-2 font-bold border-gray-600 border-[1px] border-b-0 cursor-pointer hover:brightness-125" onClick={() => {setMode("output")}} style={{filter: (mode === "output" ? "brightness(150%)" : "")}}>Output</span>
            <span className="bg-[#1e1e1e] self-end p-2 font-bold border-gray-600 border-[1px] border-b-0 cursor-pointer hover:brightness-125" onClick={() => {setMode("ast")}} style={{filter: (mode === "ast" ? "brightness(150%)" : "")}}>AST</span>
            <span className="bg-[#1e1e1e] self-end p-2 font-bold border-gray-600 border-[1px] border-b-0 cursor-pointer hover:brightness-125" onClick={() => {setMode("tokens")}} style={{filter: (mode === "tokens" ? "brightness(150%)" : "")}}>Token Stream</span>
          </div>
          <CodeMirror
            id="console"
            value={display}
            theme={[vscodeDark, json()]}
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

import { Editor as MonacoEditor } from "@monaco-editor/react";
import { useRef } from "react";

function Editor({ value, onChange, onRun, onMonacoMount }) {
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;


    if (onMonacoMount) {
      onMonacoMount(monaco);
    }


    monaco.languages.registerCompletionItemProvider("javascript", {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        return {
          suggestions: [
            // 🎯 CONSOLE.LOG SHORTCUTS
            {
              label: "clg",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "console.log(${1});",
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "Console.log shortcut",
              detail: "console.log()",
              range: range,
            },
            {
              label: "cle",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "console.error(${1});",
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "Console.error shortcut",
              detail: "console.error()",
              range: range,
            },
            {
              label: "clw",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "console.warn(${1});",
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "Console.warn shortcut",
              detail: "console.warn()",
              range: range,
            },

            // 🎯 BUCLES
            {
              label: "for",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                "for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {",
                "\t${3:// código}",
                "}",
              ].join("\n"),
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "For loop básico",
              detail: "for (let i = 0; i < array.length; i++)",
              range: range,
            },
            {
              label: "forof",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                "for (const ${1:item} of ${2:array}) {",
                "\t${3:// código}",
                "}",
              ].join("\n"),
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "For...of loop",
              detail: "for (const item of array)",
              range: range,
            },
            {
              label: "forin",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                "for (const ${1:key} in ${2:object}) {",
                "\t${3:// código}",
                "}",
              ].join("\n"),
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "For...in loop",
              detail: "for (const key in object)",
              range: range,
            },
            {
              label: "while",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                "while (${1:condition}) {",
                "\t${2:// código}",
                "}",
              ].join("\n"),
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "While loop",
              detail: "while (condition)",
              range: range,
            },

            // 🎯 FUNCIONES
            {
              label: "func",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                "function ${1:nombre}(${2:parámetros}) {",
                "\t${3:// código}",
                "\treturn ${4:resultado};",
                "}",
              ].join("\n"),
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "Función básica",
              detail: "function nombre(parámetros)",
              range: range,
            },
            {
              label: "arrow",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText:
                "const ${1:nombre} = (${2:parámetros}) => ${3:expresión};",
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "Arrow function",
              detail: "const nombre = (parámetros) => expresión",
              range: range,
            },

            // 🎯 ESTRUCTURAS DE DATOS
            {
              label: "arr",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "const ${1:array} = [${2:elementos}];",
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "Array declaration",
              detail: "const array = [elementos]",
              range: range,
            },
            {
              label: "obj",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                "const ${1:objeto} = {",
                "\t${2:propiedad}: ${3:valor}",
                "};",
              ].join("\n"),
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "Object declaration",
              detail: "const objeto = { propiedad: valor }",
              range: range,
            },

            // 🎯 CONDICIONALES
            {
              label: "if",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                "if (${1:condition}) {",
                "\t${2:// código}",
                "}",
              ].join("\n"),
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "If statement",
              detail: "if (condition)",
              range: range,
            },
            {
              label: "ifelse",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: [
                "if (${1:condition}) {",
                "\t${2:// código}",
                "} else {",
                "\t${3:// código alternativo}",
                "}",
              ].join("\n"),
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "If...else statement",
              detail: "if (condition) { } else { }",
              range: range,
            },

            // 🎯 MÉTODOS DE ARRAY COMUNES
            {
              label: "map",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "${1:array}.map(${2:item} => ${3:transformación});",
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "Array map method",
              detail: "array.map(item => transformación)",
              range: range,
            },
            {
              label: "filter",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "${1:array}.filter(${2:item} => ${3:condición});",
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "Array filter method",
              detail: "array.filter(item => condición)",
              range: range,
            },
          ],
        };
      },
    });

    // Configuración JavaScript (igual que antes)
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      allowJs: true,
    });

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      noSuggestionDiagnostics: false,
    });

    // Shortcut Ctrl+Enter (igual que antes)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (onRun) {
        onRun();
      }
    });

    // 🎯 NUEVOS SHORTCUTS EN EL EDITOR
    // Ctrl+/ para comentar/descomentar
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
      editor.trigger("keyboard", "editor.action.commentLine", {});
    });

    // Ctrl+D para duplicar línea
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
      editor.trigger("keyboard", "editor.action.copyLinesDownAction", {});
    });

    // Alt+Up/Down para mover líneas
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.UpArrow, () => {
      editor.trigger("keyboard", "editor.action.moveLinesUpAction", {});
    });

    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.DownArrow, () => {
      editor.trigger("keyboard", "editor.action.moveLinesDownAction", {});
    });

    editor.focus();
  };

  // Opciones del editor (mejoradas)
  const editorOptions = {
    fontSize: 14,
    fontFamily: "JetBrains Mono, Fira Code, SF Mono, monospace",
    lineHeight: 20,
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: "on",
    lineNumbers: "on",
    folding: true,
    // 🎯 MEJORAR AUTOCOMPLETADO
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: "on",
    tabCompletion: "on",
    quickSuggestions: {
      other: true,
      comments: false,
      strings: true,
    },
    quickSuggestionsDelay: 100, // Más rápido
    // 🎯 MEJORAR FORMATO
    formatOnPaste: true,
    formatOnType: true,
    autoIndent: "full",
    // 🎯 MEJORAR UX
    multiCursorModifier: "ctrlCmd",
    selectionHighlight: true,
    occurrencesHighlight: true,
    smoothScrolling: true,
    cursorSmoothCaretAnimation: true,
    // 🎯 SNIPPETS
    snippetSuggestions: "top", // Mostrar snippets primero
    tabIndex: 0,
  };

  return (
    <div
      className="h-full flex flex-col border-r theme-transition"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <div
        className="border-b px-4 py-2 flex-shrink-0 theme-transition"
        style={{
          backgroundColor: "var(--theme-background)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <h2 className="text-xs font-medium flex items-center space-x-2 theme-transition">
          <i
            className="fas fa-code"
            style={{ color: "var(--theme-secondary)" }}
          ></i>
          <span style={{ color: "var(--color-white)" }}>Editor</span>
        </h2>
      </div>

      <div className="flex-1">
        <MonacoEditor
          height="100%"
          language="javascript"
          value={value}
          onChange={onChange}
          onMount={handleEditorDidMount}
          options={editorOptions}
          loading={
            <div
              className="flex items-center justify-center h-full theme-transition"
              style={{ color: "var(--color-gray-light)" }}
            >
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Loading Editor...
            </div>
          }
        />
      </div>
    </div>
  );
}

export default Editor;

// src/components/Editor.jsx - Con borde derecho incluido
import { Editor as MonacoEditor } from "@monaco-editor/react";
import { useRef } from "react";

function Editor({ value, onChange, onRun }) {
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Tema personalizado con fondo más claro
    monaco.editor.defineTheme("evangelion", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6b7280", fontStyle: "italic" },
        { token: "keyword", foreground: "8bd450", fontStyle: "bold" },
        { token: "string", foreground: "965fd4" },
        { token: "number", foreground: "8bd450" },
        { token: "function", foreground: "8bd450" },
        { token: "variable", foreground: "ffffff" },
      ],
      colors: {
        "editor.background": "#1a1a2e", // Más claro que negro
        "editor.foreground": "#ffffff",
        "editor.lineHighlightBackground": "#25253d",
        "editor.selectionBackground": "#3d3d5c",
        "editorCursor.foreground": "#8bd450",
        "editorLineNumber.foreground": "#6b7280",
        "editorLineNumber.activeForeground": "#8bd450",
        "editorGutter.background": "#1a1a2e",
        "editor.selectionHighlightBackground": "#3d3d5c50",
      },
    });

    monaco.editor.setTheme("evangelion");

    // Configuración JavaScript
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

    // Shortcut Ctrl+Enter
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (onRun) {
        onRun();
      }
    });

    editor.focus();
  };

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
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: "on",
    tabCompletion: "on",
    quickSuggestions: {
      other: true,
      comments: false,
      strings: true,
    },
    formatOnPaste: true,
    formatOnType: true,
    autoIndent: "full",
    multiCursorModifier: "ctrlCmd",
    selectionHighlight: true,
    occurrencesHighlight: true,
    smoothScrolling: true,
    cursorSmoothCaretAnimation: true,
  };

  return (
    <div className="h-full flex flex-col border-r border-eva-gray">
      {/* Header minimalista pegado al top */}
      <div className="bg-eva-dark border-b border-eva-gray px-4 py-2 flex-shrink-0">
        <h2 className="text-xs font-medium text-eva-light-gray flex items-center space-x-2">
          <i className="fas fa-code text-eva-lime"></i>
          <span>Editor</span>
        </h2>
      </div>

      {/* Editor Monaco - SIN bordes ni padding extra */}
      <div className="flex-1">
        <MonacoEditor
          height="100%"
          language="javascript"
          value={value}
          onChange={onChange}
          onMount={handleEditorDidMount}
          options={editorOptions}
          loading={
            <div className="flex items-center justify-center h-full text-eva-light-gray">
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Loading Monaco Editor...
            </div>
          }
        />
      </div>
    </div>
  );
}

export default Editor;

import { useState, useEffect } from "react";
import Editor from "./components/Editor";
import Console from "./components/Console";
import ResizablePanels from "./components/ResizablePanels";
import { useCleanRunner } from "./hooks/useIncrementalRunner";

function App() {
  // Estado del código en el editor
  const [code, setCode] = useState('console.log("¡Bienvenido a BuggyJS!");');

  // Hook del runner limpio
  const {
    runCode,
    output,
    isRunning,
    isAutoRunEnabled,
    hasOutput,
    clearOutput,
    resetContext,
    toggleAutoRun,
  } = useCleanRunner();

  /**
   * Maneja la ejecución manual del código
   */
  const handleRunCode = async () => {
    await runCode(code);
  };

  /**
   * Maneja cambios en el código del editor
   */
  const handleCodeChange = (newCode) => {
    setCode(newCode);

    // Auto-run deshabilitado por ahora
    // if (isAutoRunEnabled) {
    //   triggerAutoRun(newCode);
    // }
  };

  /**
   * Maneja el atajo de teclado Ctrl+Enter para ejecutar
   */
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleRunCode();
    }
  };

  // Event listener para atajos de teclado
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [code]);

  /**
   * Limpia output (ya no necesario un botón separado)
   */
  const handleClearAll = () => {
    clearOutput();
  };

  return (
    <div className="h-screen bg-eva-darker text-white font-sans flex flex-col">
      {/* Header simplificado */}
      <header className="bg-eva-dark border-b border-eva-gray flex items-center justify-between flex-shrink-0">
        {/* Lado izquierdo: Logo + Pestañas */}
        <div className="flex items-center">
          {/* Logo */}
          <div className="px-4 py-3 flex items-center space-x-3 border-r border-eva-gray">
            <h1 className="text-lg font-semibold text-eva-lime font-mono">
              BuggyJS
            </h1>
          </div>

          {/* Pestañas de archivos */}
          <div className="flex items-center">
            <div className="px-4 py-3 bg-eva-darker border-r text-sm text-eva-light-gray border-b-2 border-eva-lime">
              untitled.js
            </div>
            <button className="px-3 py-3 text-eva-light-gray hover:text-eva-lime hover:bg-eva-darker/50 transition-colors text-sm">
              <i className="fas fa-plus"></i>
            </button>
          </div>
        </div>

        {/* Lado derecho: Solo el botón Run pequeño */}
        <div className="flex items-center space-x-3 px-4">
          {/* Info del lenguaje */}
          <div className="flex items-center space-x-2 text-xs text-eva-light-gray">
            <span>JavaScript</span>
            <span>•</span>
            <span>UTF-8</span>
            <span>•</span>
            <span title="Press Ctrl+Enter to run code">Ctrl+Enter</span>
          </div>

          {/* Botón Run pequeño estilo auto-run */}
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all ${
              isRunning
                ? "bg-eva-light-gray text-eva-gray cursor-not-allowed"
                : "bg-eva-lime hover:bg-eva-lime/90 text-eva-dark hover:scale-105"
            }`}
            title="Run code (Ctrl+Enter)"
          >
            <i
              className={`fas ${
                isRunning ? "fa-spinner fa-spin" : "fa-play"
              } text-xs`}
            ></i>
            <span>{isRunning ? "Running" : "Run"}</span>
          </button>

          {/* Botón Settings */}
          <button className="text-eva-light-gray hover:text-eva-lime p-2 transition-colors">
            <i className="fas fa-cog text-sm"></i>
          </button>
        </div>
      </header>

      {/* Paneles redimensionables */}
      <div className="flex-1 min-h-0">
        <ResizablePanels>
          {/* Panel Editor */}
          <Editor
            value={code}
            onChange={handleCodeChange}
            onRun={handleRunCode}
          />

          {/* Panel Console */}
          <Console
            output={output}
            onClear={clearOutput}
            isRunning={isRunning}
            isAutoRunEnabled={isAutoRunEnabled}
          />
        </ResizablePanels>
      </div>
    </div>
  );
}

export default App;

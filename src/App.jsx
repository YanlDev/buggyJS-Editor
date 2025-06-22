import { useState, useEffect } from "react";
import Editor from "./components/Editor";
import Console from "./components/Console";
import ResizablePanels from "./components/ResizablePanels";
import { useCleanRunner } from "./hooks/useIncrementalRunner";

// En App.jsx - Shortcuts globales
function App() {
  const [code, setCode] = useState("");

  const { runCode, output, isRunning, hasOutput, clearOutput, resetContext } =
    useCleanRunner();

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
  };

  /**
   * 🎯 SHORTCUTS GLOBALES DE LA APLICACIÓN
   */
  const handleGlobalKeyDown = (e) => {
    // Ctrl+Enter: Ejecutar código
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleRunCode();
      return;
    }

    // Ctrl+Backspace: Limpiar consola
    if ((e.ctrlKey || e.metaKey) && e.key === "Backspace") {
      e.preventDefault();
      clearOutput();
      return;
    }


    // Ctrl+K: Limpiar consola (alternativo)
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      clearOutput();
      return;
    }

    // Escape: Cancelar ejecución si está corriendo
    if (e.key === "Escape" && isRunning) {
      e.preventDefault();
      return;
    }
  };

  // Event listener para shortcuts globales
  useEffect(() => {
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [code, isRunning]); // Dependencias necesarias

  return (
    <div className="h-screen bg-eva-darker text-white font-sans flex flex-col">
      {/* Header con indicadores de shortcuts */}
      <header className="bg-eva-dark border-b border-eva-gray flex items-center justify-between flex-shrink-0">
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
          </div>
        </div>

        {/* Lado derecho: Info con shortcuts */}
        <div className="flex items-center space-x-3 px-4">
          {/* Info del lenguaje con shortcuts */}
          <div className="flex items-center space-x-2 text-xs text-eva-light-gray">
            <span>JavaScript</span>
            <span>•</span>
            <span title="Ejecutar código">Ctrl+Enter</span>
            <span>•</span>
            <span title="Limpiar consola">Ctrl+⌫</span>
          </div>

          {/* Botón Run */}
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
          <Editor
            value={code}
            onChange={handleCodeChange}
            onRun={handleRunCode}
          />
          <Console
            output={output}
            onClear={clearOutput}
            isRunning={isRunning}
            isAutoRunEnabled={false}
          />
        </ResizablePanels>
      </div>
    </div>
  );
}

export default App;

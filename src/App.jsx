// App.jsx - Con Auto-Run integrado
import { useState } from "react";
import Editor from "./components/Editor";
import Console from "./components/Console";
import ResizablePanels from "./components/ResizablePanels";
import { useCodeRunner } from "./hooks/useCodeRunner";
import { useAutoRun } from "./hooks/useAutoRun";

function App() {
  // Estado del código en el editor
  const [code, setCode] = useState('console.log("¡Bienvenido a BuggyJS!");');

  // Hook para ejecutar código
  const {
    output,
    isRunning,
    hasOutput,
    runCode,
    clearOutput,
    cancelExecution,
  } = useCodeRunner();

  // Hook para auto-run con cache inteligente
  const {
    isAutoRunEnabled,
    isAutoRunning,
    toggleAutoRun,
    cancelAutoRun,
    hasAutoRunPending,

    // Cache inteligente
    smartModeEnabled,
    toggleSmartMode,
    lastCacheDecision,
    clearCache,
    getCacheStats,
  } = useAutoRun(code, (code) => runCode(code, "auto"), isRunning);

  /**
   * Maneja la ejecución manual del código
   */
  const handleRunCode = async () => {
    // Cancelar cualquier auto-run pendiente
    cancelAutoRun();
    await runCode(code, "manual");
  };

  /**
   * Maneja cambios en el código del editor
   */
  const handleCodeChange = (newCode) => {
    setCode(newCode);
    // El auto-run se activa automáticamente via useAutoRun hook
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

  // Agregar event listener para atajos de teclado
  useState(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [code]);

  return (
    <div className="h-screen bg-eva-darker text-white font-sans flex flex-col">
      {/* Header principal */}
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
            <div className="px-4 py-3 bg-eva-darker border-r  text-sm text-eva-light-gray border-b-2 border-eva-lime">
              untitled.js
            </div>
            {/* Botón para nueva pestaña */}
            <button className="px-3 py-3 text-eva-light-gray hover:text-eva-lime hover:bg-eva-darker/50 transition-colors text-sm">
              <i className="fas fa-plus"></i>
            </button>
          </div>
        </div>

        {/* Lado derecho: Controles */}
        <div className="flex items-center space-x-3 px-4">
          {/* Info del lenguaje */}
          <div className="flex items-center space-x-2 text-xs text-eva-light-gray">
            <span>JavaScript</span>
            <span>•</span>
            <span>UTF-8</span>
            <span>•</span>
            <span title="Press Ctrl+Enter to run code">Ctrl+Enter</span>
          </div>

          {/* Toggle Auto-Run */}
          <div className="flex items-center space-x-2 border-l border-eva-gray pl-3">
            <span className="text-xs text-eva-light-gray">Auto-Run:</span>
            <button
              onClick={toggleAutoRun}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                isAutoRunEnabled
                  ? "bg-eva-lime/20 text-eva-lime border border-eva-lime/30"
                  : "bg-eva-gray text-eva-light-gray border border-eva-gray hover:border-eva-light-gray"
              }`}
              title={`Auto-run is ${isAutoRunEnabled ? "enabled" : "disabled"}`}
            >
              <i
                className={`fas fa-bolt ${
                  isAutoRunEnabled ? "text-eva-lime" : "text-eva-light-gray"
                }`}
              ></i>
              <span>{isAutoRunEnabled ? "ON" : "OFF"}</span>
              {/* Indicador de auto-running */}
              {isAutoRunning && (
                <i className="fas fa-spinner fa-spin text-eva-warning ml-1"></i>
              )}
            </button>

            {/* Toggle Smart Mode */}
            {isAutoRunEnabled && (
              <button
                onClick={toggleSmartMode}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                  smartModeEnabled
                    ? "bg-eva-purple/20 text-eva-purple border border-eva-purple/30"
                    : "bg-eva-gray text-eva-light-gray border border-eva-gray hover:border-eva-light-gray"
                }`}
                title={`Smart mode: ${
                  smartModeEnabled
                    ? "Avoid duplicate executions"
                    : "Always execute"
                }`}
              >
                <i
                  className={`fas fa-brain ${
                    smartModeEnabled ? "text-eva-purple" : "text-eva-light-gray"
                  }`}
                ></i>
                <span className="hidden sm:inline">
                  {smartModeEnabled ? "Smart" : "Basic"}
                </span>
              </button>
            )}

            {/* Indicador de decisión de cache */}
            {lastCacheDecision && isAutoRunEnabled && smartModeEnabled && (
              <div className="text-xs text-eva-light-gray flex items-center space-x-1">
                {lastCacheDecision.shouldExecute ? (
                  <span className="text-eva-success flex items-center space-x-1">
                    <i className="fas fa-check-circle"></i>
                    <span className="hidden md:inline">Executed</span>
                  </span>
                ) : (
                  <span className="text-eva-warning flex items-center space-x-1">
                    <i className="fas fa-archive"></i>
                    <span className="hidden md:inline">Cached</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Botón Run Manual */}
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className={`px-4 py-2 rounded font-medium transition-all flex items-center space-x-2 text-sm ${
              isRunning
                ? "bg-eva-light-gray text-eva-gray cursor-not-allowed"
                : "bg-eva-lime hover:bg-eva-lime/90 text-eva-dark hover:scale-105"
            }`}
            title="Run code manually (Ctrl+Enter)"
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
            isAutoRunning={isAutoRunning}
            hasAutoRunPending={hasAutoRunPending}
            lastCacheDecision={lastCacheDecision}
            smartModeEnabled={smartModeEnabled}
          />
        </ResizablePanels>
      </div>
    </div>
  );
}

export default App;

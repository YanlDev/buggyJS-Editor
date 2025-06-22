import { useState, useEffect } from "react";
import Editor from "./components/Editor";
import ExpandableConsole from "./components/ExpandableConsole";
import ResizablePanels from "./components/ResizablePanels";
import ThemeSelector from "./components/ThemeSelector";
import { useCleanRunner } from "./hooks/useIncrementalRunner";
import { useTheme } from "./hooks/useTheme";
import "./styles/themes.css";

function App() {
  const [code, setCode] = useState("");
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);

  // Hooks
  const { runCode, output, isRunning, hasOutput, clearOutput, resetContext } =
    useCleanRunner();
  const { currentTheme, currentThemeData, changeTheme, registerMonaco } =
    useTheme();

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
   * Maneja el cambio de tema
   */
  const handleThemeChange = (themeId, themeData) => {
    changeTheme(themeId);
  };

  /**
   * 🎯 SHORTCUTS MÍNIMOS GLOBALES (solo para cuando no está en el editor)
   */
  const handleGlobalKeyDown = (e) => {
    // Solo manejar Escape para cerrar theme selector
    if (e.key === "Escape") {
      e.preventDefault();
      if (isThemeSelectorOpen) {
        setIsThemeSelectorOpen(false);
      }
      return;
    }
  };

  // Event listener solo para Escape
  useEffect(() => {
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isThemeSelectorOpen]);

  return (
    <div
      className="h-screen text-white font-sans flex flex-col theme-transition"
      style={{ backgroundColor: "var(--theme-background)" }}
    >
      {/* Header con indicadores de shortcuts */}
      <header
        className="border-b flex items-center justify-between flex-shrink-0 theme-transition"
        style={{
          backgroundColor: "var(--theme-background)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div className="flex items-center">
          {/* Logo */}
          <div
            className="px-4 py-3 flex items-center space-x-3 border-r theme-transition"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <div className="flex items-center space-x-2">
              <h1
                className="text-lg font-semibold font-mono "
                style={{
                  background: "var(--theme-gradient-primary)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                BuggyJS
              </h1>
            </div>
          </div>

          {/* Pestañas de archivos */}
          <div className="flex items-center">
            <div
              className="px-4 py-3 border-r text-sm border-b-2 theme-transition relative"
              style={{
                backgroundColor: "var(--theme-background)",
                borderRightColor: "var(--border-subtle)",
                borderBottomColor: "var(--theme-secondary)",
                color: "var(--color-white)",
              }}
            >
              <div className="flex items-center space-x-2">
                <i
                  className="fab fa-js-square text-xs"
                  style={{ color: "var(--theme-accent)" }}
                ></i>
                <span>untitled.js</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lado derecho: Info con shortcuts */}
        <div className="flex items-center space-x-4 px-4">
          {/* 🎯 SHORTCUTS SIMPLES */}
          <div
            className="flex items-center space-x-2 text-xs theme-transition"
            style={{ color: "var(--color-gray-light)" }}
          >
            <span style={{ color: "var(--theme-primary)" }}>•</span>
            <span title="Ejecutar código">Ctrl+Enter</span>
            <span style={{ color: "var(--theme-primary)" }}>•</span>
            <span title="Limpiar consola">Ctrl+Del</span>
          </div>

          {/* Botón Run */}
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all  ${
              isRunning
                ? "bg-green-600 opacity-50 cursor-not-allowed"
                : "bg-green-600 hover:scale-105"
            }`}
            title="Ejecutar código (Ctrl+Enter)"
          >
            <i
              className={`fas ${
                isRunning ? "fa-spinner fa-spin" : "fa-play"
              } text-xs`}
            ></i>
            <span>{isRunning ? "Running" : "Run"}</span>
          </button>

          {/* Botón Settings con dropdown de temas */}
          <div className="relative">
            <button
              onClick={() => setIsThemeSelectorOpen(!isThemeSelectorOpen)}
              className={`p-2 rounded-md transition-all theme-hover ${
                isThemeSelectorOpen ? "theme-glow" : ""
              }`}
              style={{
                color: "var(--color-gray-light)",
                backgroundColor: isThemeSelectorOpen
                  ? "var(--border-subtle)"
                  : "transparent",
              }}
              title="Configuración y temas"
            >
              <i
                className={`fas fa-cog text-sm ${
                  isThemeSelectorOpen ? "fa-spin" : ""
                }`}
              ></i>
            </button>

            {/* Theme Selector Dropdown */}
            <ThemeSelector
              currentTheme={currentTheme}
              onThemeChange={handleThemeChange}
              isOpen={isThemeSelectorOpen}
              onClose={() => setIsThemeSelectorOpen(false)}
            />
          </div>
        </div>
      </header>

      {/* Paneles redimensionables */}
      <div className="flex-1 min-h-0">
        <ResizablePanels>
          <Editor
            value={code}
            onChange={handleCodeChange}
            onRun={handleRunCode} 
            onClear={clearOutput}
            onMonacoMount={registerMonaco}
          />
          <ExpandableConsole
            output={output}
            onClear={clearOutput}
            isRunning={isRunning}
          />
        </ResizablePanels>
      </div>
    </div>
  );
}

export default App;

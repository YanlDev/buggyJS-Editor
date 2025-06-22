// src/components/Console.jsx - Con soporte completo de temas
function Console({ output, onClear, isRunning, isAutoRunEnabled }) {
  return (
    <div className="h-full flex flex-col theme-transition">
      {/* Header con colores temáticos */}
      <div
        className="border-b px-4 py-2 flex items-center justify-between flex-shrink-0 theme-transition"
        style={{
          backgroundColor: "var(--theme-background)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <h2 className="text-xs font-medium flex items-center space-x-2 theme-transition">
          <i
            className={`fas fa-terminal theme-transition${
              isRunning ? "animate-pulse" : ""
            }`}
            style={{ color: "var(--theme-primary)" }}
          ></i>
          <span style={{ color: "var(--console-text)" }}>Console</span>

          {/* Contador de líneas activas con colores de tema */}
          {output.length > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded theme-transition theme-glow"
              style={{
                backgroundColor: "var(--border-medium)",
                color: "var(--theme-primary)",
              }}
            >
              {output.length} lines
            </span>
          )}

          {/* Indicador de auto-run con colores de tema */}
          {isAutoRunEnabled && (
            <span
              className="text-xs px-2 py-0.5 rounded flex items-center space-x-1 theme-transition theme-glow"
              style={{
                backgroundColor: "var(--border-medium)",
                color: "var(--theme-secondary)",
              }}
            >
              <i className="fas fa-bolt text-xs"></i>
              <span className="hidden sm:inline">Auto</span>
            </span>
          )}

          {/* Indicador de ejecución con colores de tema */}
          {isRunning && (
            <span
              className="text-xs px-2 py-0.5 rounded flex items-center space-x-1 theme-transition theme-glow"
              style={{
                backgroundColor: "var(--border-medium)",
                color: "var(--theme-accent)",
              }}
            >
              <i className="fas fa-spinner fa-spin text-xs synthwave-glow"></i>
              <span className="hidden sm:inline">Running</span>
            </span>
          )}
        </h2>

        {/* Botón Clear con efectos de tema */}
        {output.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs transition-all flex items-center space-x-1 theme-hover theme-ripple px-2 py-1 rounded"
            style={{ color: "var(--console-text)" }}
            title="Clear console output"
          >
            <i className="fas fa-trash text-xs"></i>
            <span className="hidden lg:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Área del console con fondo temático */}
      <div
        className="flex-1 overflow-y-auto theme-transition"
        style={{ backgroundColor: "var(--console-bg)" }}
      >
        <div className="p-4 font-mono text-sm space-y-1">
          {/* Estado vacío con colores de tema */}
          {output.length === 0 ? (
            <div className="text-xs space-y-1 theme-transition">
              <p style={{ color: "var(--console-text)", opacity: 0.7 }}>
                <i
                  className="fas fa-terminal mr-2"
                  style={{ color: "var(--theme-primary)" }}
                ></i>
                Console ready...
              </p>
              <div
                className="text-xs opacity-50 space-y-0.5 ml-6"
                style={{ color: "var(--console-text)" }}
              ></div>
            </div>
          ) : (
            /* Output con colores dinámicos según el tema */
            <div className="space-y-1">
              {output.map((line) => (
                <div
                  key={line.id}
                  className="flex items-start space-x-3 group min-h-[20px] py-0.5 rounded px-1 transition-all theme-transition hover:theme-glow"
                  style={{
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--theme-primary)10";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {/* Número de línea del código con color de tema */}
                  <span
                    className="text-xs mt-0.5 font-medium opacity-40 group-hover:opacity-70 transition-opacity w-6 flex-shrink-0 text-right theme-transition"
                    style={{ color: "var(--theme-primary)" }}
                  >
                    {line.lineNumber}
                  </span>

                  {/* Icono según tipo con colores específicos */}
                  <span className="text-xs mt-0.5 flex-shrink-0">
                    {line.type === "error" && (
                      <i
                        className="fas fa-exclamation-circle"
                        style={{ color: "var(--console-error)" }}
                      ></i>
                    )}
                    {line.type === "warn" && (
                      <i
                        className="fas fa-exclamation-triangle"
                        style={{ color: "var(--console-warning)" }}
                      ></i>
                    )}
                    {line.type === "info" && (
                      <i
                        className="fas fa-info-circle"
                        style={{ color: "var(--console-info)" }}
                      ></i>
                    )}
                    {line.type === "log" && (
                      <i
                        className="fas fa-chevron-right opacity-50"
                        style={{ color: "var(--console-success)" }}
                      ></i>
                    )}
                  </span>

                  {/* Contenido del mensaje con colores por tipo */}
                  <span
                    className="flex-1 break-words leading-tight theme-transition"
                    style={{
                      color:
                        line.type === "error"
                          ? "var(--console-error)"
                          : line.type === "warn"
                          ? "var(--console-warning)"
                          : line.type === "info"
                          ? "var(--console-info)"
                          : "var(--console-success)",
                    }}
                  >
                    {line.content}
                  </span>

                  {/* Timestamp en hover con color de tema */}
                  <span
                    className="text-xs mt-0.5 opacity-0 group-hover:opacity-60 transition-opacity theme-transition"
                    style={{ color: "var(--theme-primary)" }}
                  >
                    {line.timestamp}
                  </span>
                </div>
              ))}

              {/* Línea de ejecución activa con efectos especiales */}
              {isRunning && (
                <div
                  className="flex items-center space-x-3 py-1 opacity-60 theme-glow"
                  style={{ color: "var(--theme-secondary)" }}
                >
                  <span className="w-6 text-right text-xs">•</span>
                  <i className="fas fa-spinner fa-spin text-xs synthwave-glow"></i>
                  <span className="text-xs italic">executing...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Console;

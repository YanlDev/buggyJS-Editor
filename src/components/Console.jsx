// src/components/Console.jsx - Con líneas persistentes como RunJS
function Console({ output, onClear, isRunning, isAutoRunEnabled }) {
  return (
    <div className="h-full flex flex-col">
      {/* Header simple */}
      <div className="bg-eva-dark border-b border-eva-gray px-4 py-2 flex items-center justify-between flex-shrink-0">
        <h2 className="text-xs font-medium text-eva-light-gray flex items-center space-x-2">
          <i
            className={`fas fa-terminal text-eva-purple ${
              isRunning ? "animate-pulse" : ""
            }`}
          ></i>
          <span>Console</span>

          {/* Contador de líneas activas */}
          {output.length > 0 && (
            <span className="text-xs bg-eva-purple/20 text-eva-purple px-2 py-0.5 rounded">
              {output.length} lines
            </span>
          )}

          {/* Indicador de auto-run */}
          {isAutoRunEnabled && (
            <span className="text-xs bg-eva-lime/20 text-eva-lime px-2 py-0.5 rounded flex items-center space-x-1">
              <i className="fas fa-bolt text-xs"></i>
              <span className="hidden sm:inline">Auto</span>
            </span>
          )}

          {/* Indicador de ejecución */}
          {isRunning && (
            <span className="text-xs bg-eva-warning/20 text-eva-warning px-2 py-0.5 rounded flex items-center space-x-1">
              <i className="fas fa-spinner fa-spin text-xs"></i>
              <span className="hidden sm:inline">Running</span>
            </span>
          )}
        </h2>

        {/* Botón Clear */}
        {output.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-eva-light-gray hover:text-eva-error transition-colors flex items-center space-x-1"
            title="Clear console output"
          >
            <i className="fas fa-trash text-xs"></i>
            <span className="hidden lg:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Área del console */}
      <div className="flex-1 bg-eva-darker overflow-y-auto">
        <div className="p-4 font-mono text-sm space-y-1">
          {/* Estado vacío */}
          {output.length === 0 ? (
            <div className="text-eva-light-gray italic text-xs space-y-1">
              <p>Console ready...</p>
              <div className="text-xs opacity-50 space-y-0.5">
                <p>• Each statement shows output on its own line</p>
                <p>• Lines update in place as you type</p>
                <p>• Variables persist between executions</p>
                {isAutoRunEnabled && (
                  <p className="text-eva-lime">• Auto-run: ON</p>
                )}
              </div>
            </div>
          ) : (
            /* Output con líneas fijas como RunJS */
            <div className="space-y-1">
              {output.map((line) => (
                <div
                  key={line.id}
                  className="flex items-start space-x-3 group min-h-[20px] py-0.5 hover:bg-eva-gray/20 rounded px-1 transition-colors"
                >
                  {/* Número de línea del código */}
                  <span className="text-eva-light-gray text-xs mt-0.5 font-medium opacity-40 group-hover:opacity-70 transition-opacity w-6 flex-shrink-0 text-right">
                    {line.lineNumber}
                  </span>

                  {/* Icono según tipo */}
                  <span className="text-xs mt-0.5 flex-shrink-0">
                    {line.type === "error" && (
                      <i className="fas fa-exclamation-circle text-eva-error"></i>
                    )}
                    {line.type === "warn" && (
                      <i className="fas fa-exclamation-triangle text-eva-warning"></i>
                    )}
                    {line.type === "info" && (
                      <i className="fas fa-info-circle text-eva-purple"></i>
                    )}
                    {line.type === "log" && (
                      <i className="fas fa-chevron-right text-eva-success opacity-50"></i>
                    )}
                  </span>

                  {/* Contenido del mensaje */}
                  <span
                    className={`flex-1 ${
                      line.type === "error"
                        ? "text-eva-error"
                        : line.type === "warn"
                        ? "text-eva-warning"
                        : line.type === "info"
                        ? "text-eva-purple italic"
                        : "text-eva-success"
                    } break-words leading-tight`}
                  >
                    {line.content}
                  </span>

                  {/* Timestamp en hover */}
                  <span className="text-eva-light-gray text-xs mt-0.5 opacity-0 group-hover:opacity-60 transition-opacity">
                    {line.timestamp}
                  </span>
                </div>
              ))}

              {/* Línea de ejecución activa */}
              {isRunning && (
                <div className="flex items-center space-x-3 py-1 text-eva-lime opacity-60">
                  <span className="w-6 text-right text-xs">•</span>
                  <i className="fas fa-spinner fa-spin text-xs"></i>
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

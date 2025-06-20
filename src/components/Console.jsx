// src/components/Console.jsx - Con indicadores de cache inteligente
function Console({
  output,
  onClear,
  isRunning,
  isAutoRunning,
  hasAutoRunPending,
  lastCacheDecision,
  smartModeEnabled,
}) {
  return (
    <div className="h-full flex flex-col">
      {/* Header minimalista pegado al top */}
      <div className="bg-eva-dark border-b border-eva-gray px-4 py-2 flex items-center justify-between flex-shrink-0">
        <h2 className="text-xs font-medium text-eva-light-gray flex items-center space-x-2">
          <i
            className={`fas fa-terminal text-eva-purple ${
              isRunning ? "animate-pulse" : ""
            }`}
          ></i>
          <span>Console</span>
          {output.length > 0 && (
            <span className="text-xs bg-eva-purple/20 text-eva-purple px-2 py-0.5 rounded">
              {output.length}
            </span>
          )}

          {/* Indicador de auto-run */}
          {isAutoRunning && (
            <span className="text-xs bg-eva-warning/20 text-eva-warning px-2 py-0.5 rounded flex items-center space-x-1">
              <i className="fas fa-bolt text-xs"></i>
              <span>Auto-running...</span>
            </span>
          )}

          {hasAutoRunPending && !isAutoRunning && (
            <span className="text-xs bg-eva-lime/20 text-eva-lime px-2 py-0.5 rounded flex items-center space-x-1">
              <i className="fas fa-clock text-xs"></i>
              <span>Pending...</span>
            </span>
          )}

          {/* Indicador de cache decision */}
          {lastCacheDecision &&
            smartModeEnabled &&
            !isRunning &&
            !isAutoRunning && (
              <span
                className={`text-xs px-2 py-0.5 rounded flex items-center space-x-1 ${
                  lastCacheDecision.shouldExecute
                    ? "bg-eva-success/20 text-eva-success"
                    : "bg-eva-warning/20 text-eva-warning"
                }`}
              >
                <i
                  className={`fas ${
                    lastCacheDecision.shouldExecute ? "fa-check" : "fa-archive"
                  } text-xs`}
                ></i>
                <span className="hidden lg:inline">
                  {lastCacheDecision.shouldExecute ? "Executed" : "Cached"}
                </span>
              </span>
            )}
        </h2>

        {/* Botón Clear */}
        {output.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-eva-light-gray hover:text-eva-error transition-colors"
            title="Clear console output"
          >
            <i className="fas fa-trash text-xs"></i>
          </button>
        )}
      </div>

      {/* Área del console - SIN bordes ni padding extra */}
      <div className="flex-1 bg-eva-darker overflow-y-auto">
        <div className="p-4 font-mono text-sm space-y-2">
          {/* Estado vacío */}
          {output.length === 0 ? (
            <div className="text-eva-light-gray italic text-xs space-y-1">
              <p>
                <i className="fas fa-rocket text-eva-lime mr-1"></i> Run code to
                see output...
              </p>
              <p className="text-xs opacity-50">
                • console.log() messages will appear here
              </p>
              <p className="text-xs opacity-50">
                • Errors and warnings will be highlighted
              </p>
              <p className="text-xs opacity-50">
                • Enable Auto-Run for instant feedback
              </p>
              {smartModeEnabled && (
                <p className="text-xs opacity-50 text-eva-purple">
                  • Smart mode avoids duplicate executions
                </p>
              )}
            </div>
          ) : (
            /* Mostrar mensajes del output */
            output.map((line) => (
              <div key={line.id} className="flex items-start space-x-3 group">
                {/* Timestamp */}
                <span className="text-eva-light-gray text-xs mt-0.5 font-medium opacity-60 group-hover:opacity-100 transition-opacity">
                  {line.timestamp}
                </span>

                {/* Icono según el tipo */}
                <span className="text-xs mt-0.5">
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
                    <i className="fas fa-info-circle text-eva-success opacity-50"></i>
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
                  } break-words`}
                >
                  {line.content}
                </span>
              </div>
            ))
          )}

          {/* Indicador de que está ejecutando manualmente */}
          {isRunning && !isAutoRunning && (
            <div className="flex items-center space-x-2 text-eva-lime opacity-75">
              <i className="fas fa-spinner fa-spin text-xs"></i>
              <span className="text-xs italic">Executing code manually...</span>
            </div>
          )}

          {/* Indicador de que está auto-ejecutando */}
          {isAutoRunning && (
            <div className="flex items-center space-x-2 text-eva-warning opacity-75">
              <i className="fas fa-bolt text-xs"></i>
              <i className="fas fa-spinner fa-spin text-xs"></i>
              <span className="text-xs italic">Auto-executing code...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Console;

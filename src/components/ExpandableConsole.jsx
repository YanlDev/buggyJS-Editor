import { useState } from "react";

function ThemedExpandableConsole({
  output,
  onClear,
  isRunning,
  isAutoRunEnabled,
}) {
  const [expandedItems, setExpandedItems] = useState(new Set());

  const toggleExpand = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const formatValue = (value, depth = 0, parentId = "", index = "") => {
    const maxDepth = 4;
    const itemId = `${parentId}-${index}-${depth}`;

    if (depth > maxDepth) {
      return (
        <span style={{ color: "var(--console-text)", opacity: 0.5 }}>...</span>
      );
    }

    // 🎯 NULL/UNDEFINED
    if (value === null) {
      return (
        <span style={{ color: "var(--theme-accent)", opacity: 0.8 }}>null</span>
      );
    }
    if (value === undefined) {
      return (
        <span style={{ color: "var(--theme-accent)", opacity: 0.8 }}>
          undefined
        </span>
      );
    }

    // 🎯 STRINGS
    if (typeof value === "string") {
      return (
        <span
          style={{
            color:
              depth === 0 ? "var(--console-success)" : "var(--theme-secondary)",
          }}
        >
          "{value}"
        </span>
      );
    }

    // 🎯 NUMBERS
    if (typeof value === "number") {
      return <span style={{ color: "var(--theme-accent)" }}>{value}</span>;
    }

    // 🎯 BOOLEANS
    if (typeof value === "boolean") {
      return (
        <span style={{ color: "var(--theme-primary)" }}>{String(value)}</span>
      );
    }

    // 🎯 FUNCTIONS
    if (typeof value === "function") {
      return (
        <span style={{ color: "var(--console-info)" }}>
          ƒ {value.name || "anonymous"}()
        </span>
      );
    }

    // 🎯 ARRAYS
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span style={{ color: "var(--console-text)" }}>[]</span>;
      }

      const isExpanded = expandedItems.has(itemId);

      return (
        <div className="inline-block">
          <button
            onClick={() => toggleExpand(itemId)}
            className="flex items-center text-left theme-hover px-1 rounded transition-all"
            style={{ backgroundColor: "transparent" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--theme-primary)10";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <i
              className={`fas fa-chevron-${
                isExpanded ? "down" : "right"
              } text-xs mr-2`}
              style={{ color: "var(--theme-primary)", opacity: 0.7 }}
            ></i>
            <span style={{ color: "var(--console-text)" }}>
              Array({value.length})
            </span>
            {!isExpanded && (
              <span
                style={{ color: "var(--console-text)", opacity: 0.5 }}
                className="ml-2"
              >
                [
                {value
                  .slice(0, 3)
                  .map((_, i) => "{...}")
                  .join(", ")}
                {value.length > 3 ? ", ..." : ""}]
              </span>
            )}
          </button>

          {isExpanded && (
            <div
              className="ml-4 mt-1 pl-3 theme-transition"
              style={{
                borderLeft: `1px solid var(--border-subtle)`,
              }}
            >
              {value.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 py-0.5 group"
                >
                  <button
                    onClick={() => toggleExpand(`${itemId}-${index}`)}
                    className="theme-hover px-1 rounded transition-all min-w-8 text-right"
                    style={{
                      color: "var(--theme-primary)",
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
                    {typeof item === "object" && item !== null ? (
                      <i
                        className={`fas fa-chevron-${
                          expandedItems.has(`${itemId}-${index}`)
                            ? "down"
                            : "right"
                        } text-xs mr-1`}
                      ></i>
                    ) : (
                      ""
                    )}
                    <span className="text-sm">{index}:</span>
                  </button>
                  <div className="flex-1">
                    {formatValue(item, depth + 1, itemId, index)}
                  </div>
                </div>
              ))}
              <div
                className="text-xs mt-1 opacity-50"
                style={{ color: "var(--console-text)" }}
              >
                length: {value.length}
              </div>
              <div
                className="text-xs opacity-40"
                style={{ color: "var(--console-text)" }}
              >
                [[Prototype]]: Array(0)
              </div>
            </div>
          )}
        </div>
      );
    }

    // 🎯 OBJECTS
    if (typeof value === "object" && value !== null) {
      const keys = Object.keys(value);

      if (keys.length === 0) {
        return <span style={{ color: "var(--console-text)" }}>{"{}"}</span>;
      }

      const isExpanded = expandedItems.has(itemId);
      const objectConstructor = value.constructor?.name || "Object";

      return (
        <div className="inline-block">
          <button
            onClick={() => toggleExpand(itemId)}
            className="flex items-center text-left theme-hover px-1 rounded transition-all"
            style={{ backgroundColor: "transparent" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--theme-primary)10";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <i
              className={`fas fa-chevron-${
                isExpanded ? "down" : "right"
              } text-xs mr-2`}
              style={{ color: "var(--theme-primary)", opacity: 0.7 }}
            ></i>
            <span style={{ color: "var(--console-text)" }}>
              {objectConstructor}
            </span>
            {!isExpanded && (
              <span
                style={{ color: "var(--console-text)", opacity: 0.5 }}
                className="ml-2"
              >
                {"{"}
                {keys
                  .slice(0, 3)
                  .map((key) => {
                    const val = value[key];
                    if (typeof val === "string") {
                      return `${key}: "${
                        val.length > 10 ? val.substring(0, 10) + "..." : val
                      }"`;
                    } else if (typeof val === "object") {
                      return `${key}: {...}`;
                    } else {
                      return `${key}: ${val}`;
                    }
                  })
                  .join(", ")}
                {keys.length > 3 ? ", ..." : ""}
                {"}"}
              </span>
            )}
          </button>

          {isExpanded && (
            <div
              className="ml-4 mt-1 pl-3 theme-transition"
              style={{
                borderLeft: `1px solid var(--border-subtle)`,
              }}
            >
              {keys.map((key) => (
                <div
                  key={key}
                  className="flex items-start space-x-3 py-0.5 group"
                >
                  <button
                    onClick={() => toggleExpand(`${itemId}-${key}`)}
                    className="theme-hover px-1 rounded transition-all"
                    style={{
                      color: "var(--theme-primary)",
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
                    {typeof value[key] === "object" && value[key] !== null ? (
                      <i
                        className={`fas fa-chevron-${
                          expandedItems.has(`${itemId}-${key}`)
                            ? "down"
                            : "right"
                        } text-xs mr-1`}
                      ></i>
                    ) : (
                      ""
                    )}
                    <span className="text-sm">{key}:</span>
                  </button>
                  <div className="flex-1">
                    {formatValue(value[key], depth + 1, itemId, key)}
                  </div>
                </div>
              ))}
              <div
                className="text-xs mt-1 opacity-40"
                style={{ color: "var(--console-text)" }}
              >
                [[Prototype]]: {objectConstructor}
              </div>
            </div>
          )}
        </div>
      );
    }

    // 🎯 FALLBACK
    return (
      <span style={{ color: "var(--console-success)" }}>{String(value)}</span>
    );
  };

  const parseConsoleContent = (content) => {
    // 🎯 Si el contenido ya es un objeto, array, etc. (raw data)
    if (typeof content === "object" && content !== null) {
      return [content];
    }

    // 🎯 Si es un string, intentar parsearlo inteligentemente
    if (typeof content === "string") {
      try {
        // Buscar patrones como "texto: {objeto}" o "texto: [array]"
        const match = content.match(/^(.+?):\s*(\{.+\}|\[.+\])$/s);
        if (match) {
          const [, prefix, jsonPart] = match;
          try {
            const parsed = JSON.parse(jsonPart);
            return [prefix + ":", parsed];
          } catch (e) {
            return [content]; // Si no se puede parsear, devolver como string
          }
        }

        // Intentar parsear todo como JSON si parece JSON
        if (
          (content.startsWith("{") && content.endsWith("}")) ||
          (content.startsWith("[") && content.endsWith("]"))
        ) {
          const parsed = JSON.parse(content);
          return [parsed];
        }

        // Para otros strings, devolverlos tal cual
        return [content];
      } catch (e) {
        return [content];
      }
    }

    // 🎯 Para otros tipos (number, boolean, etc.)
    return [content];
  };

  return (
    <div className="h-full flex flex-col theme-transition">
      {/* Header con colores temáticos - MANTENER DISEÑO ORIGINAL */}
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
              isRunning ? " animate-pulse" : ""
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
            </div>
          ) : (
            /* Output con funcionalidad expandible + diseño original */
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

                  {/* Contenido del mensaje CON FUNCIONALIDAD EXPANDIBLE */}
                  <div className="flex-1 break-words leading-tight theme-transition">
                    {parseConsoleContent(line.content).map((arg, argIndex) => (
                      <span key={argIndex}>
                        {argIndex > 0 && " "}
                        {formatValue(arg, 0, `line-${line.id}-arg-${argIndex}`)}
                      </span>
                    ))}
                  </div>

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

export default ThemedExpandableConsole;

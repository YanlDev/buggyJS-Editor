import { useState, useRef, useCallback, useEffect } from "react";

export const ResizablePanels = ({ children }) => {
  const [leftWidth, setLeftWidth] = useState(50); // Porcentaje
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const startResize = useCallback((e) => {
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const stopResize = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resize = useCallback(
    (e) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth =
        ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Límites: mínimo 20%, máximo 80%
      if (newLeftWidth >= 20 && newLeftWidth <= 80) {
        setLeftWidth(newLeftWidth);
      }
    },
    [isDragging]
  );

  // useEffect para manejar los event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", resize);
      document.addEventListener("mouseup", stopResize);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", resize);
      document.removeEventListener("mouseup", stopResize);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, resize, stopResize]);

  return (
    <div ref={containerRef} className="flex h-full">
      {/* Panel izquierdo */}
      <div
        style={{
          width: `${leftWidth}%`,
          backgroundColor: "var(--color-background)",
        }}
        className="theme-transition"
      >
        {children[0]}
      </div>

      {/* Divisor redimensionable */}
      <div
        className={`w-1 cursor-col-resize transition-all duration-200 theme-transition ${
          isDragging ? "theme-glow" : ""
        }`}
        style={{
          backgroundColor: isDragging
            ? "var(--color-secondary)"
            : "var(--color-gray)",
        }}
        onMouseDown={startResize}
        onMouseEnter={(e) => {
          if (!isDragging) {
            e.currentTarget.style.backgroundColor = "var(--color-secondary)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            e.currentTarget.style.backgroundColor = "var(--color-gray)";
          }
        }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div
            className="w-0.5 h-8 rounded-full opacity-50"
            style={{ backgroundColor: "var(--color-gray-light)" }}
          ></div>
        </div>
      </div>

      {/* Panel derecho */}
      <div
        style={{
          width: `${100 - leftWidth}%`,
          backgroundColor: "var(--color-gray)",
        }}
        className="theme-transition"
      >
        {children[1]}
      </div>
    </div>
  );
};

export default ResizablePanels;

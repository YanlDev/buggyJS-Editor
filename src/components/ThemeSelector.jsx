import { useState, useEffect, useRef } from "react";

const THEMES = {
  synthwave: {
    name: "Synthwave 84",
    description: "Retro cyberpunk vibes",
    colors: {
      primary: "#ff7edb",
      secondary: "#72f1b8",
      background: "#241b2f",
      accent: "#ffc600",
    },
    monacoTheme: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "7c3aed", fontStyle: "italic" },
        { token: "keyword", foreground: "ff7edb", fontStyle: "bold" },
        { token: "string", foreground: "72f1b8" },
        { token: "number", foreground: "ffc600" },
        { token: "function", foreground: "ff7edb" },
        { token: "variable", foreground: "ffffff" },
        { token: "type", foreground: "36f9f6" },
        { token: "operator", foreground: "ff7edb" },
      ],
      colors: {
        "editor.background": "#241b2f",
        "editor.foreground": "#ffffff",
        "editor.lineHighlightBackground": "#2a1e3a",
        "editor.selectionBackground": "#ff7edb33",
        "editorCursor.foreground": "#ff7edb",
        "editorLineNumber.foreground": "#7c3aed",
        "editorLineNumber.activeForeground": "#ff7edb",
        "editorGutter.background": "#241b2f",
        "editor.selectionHighlightBackground": "#ff7edb22",
      },
    },
  },

  onedark: {
    name: "One Dark Pro",
    description: "The classic dark theme",
    colors: {
      primary: "#61afef",
      secondary: "#98c379",
      background: "#282c34",
      accent: "#e06c75",
    },
    monacoTheme: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "5c6370", fontStyle: "italic" },
        { token: "keyword", foreground: "c678dd", fontStyle: "bold" },
        { token: "string", foreground: "98c379" },
        { token: "number", foreground: "d19a66" },
        { token: "function", foreground: "61afef" },
        { token: "variable", foreground: "e06c75" },
        { token: "type", foreground: "e5c07b" },
        { token: "operator", foreground: "c678dd" },
      ],
      colors: {
        "editor.background": "#282c34",
        "editor.foreground": "#abb2bf",
        "editor.lineHighlightBackground": "#2c313c",
        "editor.selectionBackground": "#3e4451",
        "editorCursor.foreground": "#528bff",
        "editorLineNumber.foreground": "#495162",
        "editorLineNumber.activeForeground": "#737984",
        "editorGutter.background": "#282c34",
        "editor.selectionHighlightBackground": "#3e445150",
      },
    },
  },

  githubdark: {
    name: "GitHub Dark",
    description: "Professional and clean",
    colors: {
      primary: "#58a6ff",
      secondary: "#7ee787",
      background: "#0d1117",
      accent: "#f85149",
    },
    monacoTheme: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "8b949e", fontStyle: "italic" },
        { token: "keyword", foreground: "ff7b72", fontStyle: "bold" },
        { token: "string", foreground: "a5d6ff" },
        { token: "number", foreground: "79c0ff" },
        { token: "function", foreground: "d2a8ff" },
        { token: "variable", foreground: "ffa657" },
        { token: "type", foreground: "7ee787" },
        { token: "operator", foreground: "ff7b72" },
      ],
      colors: {
        "editor.background": "#0d1117",
        "editor.foreground": "#e6edf3",
        "editor.lineHighlightBackground": "#161b22",
        "editor.selectionBackground": "#264f78",
        "editorCursor.foreground": "#58a6ff",
        "editorLineNumber.foreground": "#6e7681",
        "editorLineNumber.activeForeground": "#f0f6fc",
        "editorGutter.background": "#0d1117",
        "editor.selectionHighlightBackground": "#264f7850",
      },
    },
  },
};

function ThemeSelector({ currentTheme, onThemeChange, isOpen, onClose }) {
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-12 right-0 border rounded-lg shadow-2xl z-50 min-w-72 overflow-hidden theme-selector-enter theme-transition"
      style={{
        backgroundColor: "var(--theme-background)",
        borderColor: "var(--border-medium)",
      }}
    >
      {/* Header del dropdown */}
      <div
        className="px-4 py-3 border-b theme-transition"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium flex items-center space-x-2 theme-transition">
            <i
              className="fas fa-palette"
              style={{ color: "var(--theme-secondary)" }}
            ></i>
            <span style={{ color: "var(--console-text)" }}>
              Seleccionar Tema
            </span>
          </h3>
          <button
            onClick={onClose}
            className="transition-colors theme-hover"
            style={{ color: "var(--console-text)" }}
          >
            <i className="fas fa-times text-xs"></i>
          </button>
        </div>
      </div>

      {/* Lista de temas */}
      <div className="py-2">
        {Object.entries(THEMES).map(([themeId, theme]) => (
          <button
            key={themeId}
            onClick={() => {
              onThemeChange(themeId, theme);
              onClose();
            }}
            className={`w-full px-4 py-3 text-left transition-all group theme-ripple ${
              currentTheme === themeId ? "theme-glow" : ""
            }`}
            style={{
              backgroundColor:
                currentTheme === themeId
                  ? "var(--border-medium)"
                  : "transparent",
            }}
            onMouseEnter={(e) => {
              if (currentTheme !== themeId) {
                e.currentTarget.style.backgroundColor = "var(--border-subtle)";
              }
            }}
            onMouseLeave={(e) => {
              if (currentTheme !== themeId) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            <div className="flex items-center space-x-3">
              {/* Preview de colores del tema */}
              <div className="flex space-x-1">
                <div
                  className="w-3 h-3 rounded-full border theme-transition theme-glow"
                  style={{
                    backgroundColor: theme.colors.primary,
                    borderColor: "var(--border-subtle)",
                  }}
                ></div>
                <div
                  className="w-3 h-3 rounded-full border theme-transition theme-glow"
                  style={{
                    backgroundColor: theme.colors.secondary,
                    borderColor: "var(--border-subtle)",
                  }}
                ></div>
                <div
                  className="w-3 h-3 rounded-full border theme-transition theme-glow"
                  style={{
                    backgroundColor: theme.colors.accent,
                    borderColor: "var(--border-subtle)",
                  }}
                ></div>
              </div>

              {/* Info del tema */}
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span
                    className="text-sm font-medium transition-colors theme-transition"
                    style={{ color: "var(--console-text)" }}
                  >
                    {theme.name}
                  </span>
                  {currentTheme === themeId && (
                    <i
                      className="fas fa-check text-xs synthwave-glow"
                      style={{ color: "var(--theme-secondary)" }}
                    ></i>
                  )}
                </div>
                <p
                  className="text-xs mt-0.5 theme-transition"
                  style={{ color: "var(--console-text)", opacity: 0.7 }}
                >
                  {theme.description}
                </p>
              </div>

              {/* Indicador hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <i
                  className="fas fa-chevron-right text-xs"
                  style={{ color: "var(--theme-primary)" }}
                ></i>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ThemeSelector;
export { THEMES };

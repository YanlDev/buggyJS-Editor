import { useState, useEffect, useCallback } from 'react';
import { THEMES } from '../components/ThemeSelector';

const THEME_STORAGE_KEY = 'buggyjs_selected_theme';
const DEFAULT_THEME = 'synthwave'; // 🎯 Synthwave como tema por defecto

export function useTheme() {
  // Estado del tema actual
  const [currentTheme, setCurrentTheme] = useState(() => {
    // Intentar cargar tema guardado del localStorage
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      return (savedTheme && THEMES[savedTheme]) ? savedTheme : DEFAULT_THEME;
    } catch (error) {
      console.warn('No se pudo cargar el tema guardado:', error);
      return DEFAULT_THEME;
    }
  });

  // Referencia al monaco editor para cambiar temas
  const [monacoInstance, setMonacoInstance] = useState(null);

  /**
   * Registra la instancia de Monaco Editor
   */
  const registerMonaco = useCallback((monaco) => {
    setMonacoInstance(monaco);
  }, []);

  /**
   * Aplica un tema tanto a Monaco como a la UI
   */
  const applyTheme = useCallback((themeId, themeData) => {
    if (!THEMES[themeId]) {
      console.warn(`Tema '${themeId}' no encontrado`);
      return;
    }

    const theme = themeData || THEMES[themeId];

    // 🎨 APLICAR TEMA A MONACO EDITOR
    if (monacoInstance) {
      try {
        // Definir el tema personalizado en Monaco
        monacoInstance.editor.defineTheme(themeId, theme.monacoTheme);

        // Aplicar el tema
        monacoInstance.editor.setTheme(themeId);
      } catch (error) {
        console.error('Error aplicando tema a Monaco:', error);
      }
    }

    // 🎨 APLICAR TEMA A LA UI (CSS Custom Properties)
    if (typeof document !== 'undefined') {
      const root = document.documentElement;

      // Actualizar variables CSS con los colores del tema
      root.style.setProperty('--theme-primary', theme.colors.primary);
      root.style.setProperty('--theme-secondary', theme.colors.secondary);
      root.style.setProperty('--theme-background', theme.colors.background);
      root.style.setProperty('--theme-accent', theme.colors.accent);

      // 🎯 COLORES ESPECÍFICOS PARA LA CONSOLA
      root.style.setProperty('--console-bg', theme.colors.background);
      root.style.setProperty('--console-text', '#ffffff');
      root.style.setProperty('--console-success', theme.colors.secondary);
      root.style.setProperty('--console-error', '#ef4444');
      root.style.setProperty('--console-warning', theme.colors.accent);
      root.style.setProperty('--console-info', theme.colors.primary);
      root.style.setProperty('--console-border', theme.colors.primary + '40');

      // 🎨 BORDES Y SEPARADORES MÁS SUTILES
      root.style.setProperty('--border-subtle', theme.colors.primary + '20'); // Muy sutil
      root.style.setProperty('--border-medium', theme.colors.primary + '40'); // Medio
      root.style.setProperty('--border-strong', theme.colors.primary + '60'); // Fuerte
    }

    // Actualizar estado
    setCurrentTheme(themeId);

    // 💾 GUARDAR PREFERENCIA EN LOCALSTORAGE
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
    } catch (error) {
      console.warn('No se pudo guardar la preferencia de tema:', error);
    }
  }, [monacoInstance]);

  /**
   * Cambia a un tema específico
   */
  const changeTheme = useCallback((themeId) => {
    if (THEMES[themeId]) {
      applyTheme(themeId, THEMES[themeId]);
    }
  }, [applyTheme]);

  /**
   * Obtiene la información del tema actual
   */
  const getCurrentThemeData = useCallback(() => {
    return THEMES[currentTheme];
  }, [currentTheme]);

  /**
   * Cicla entre los temas disponibles (útil para shortcuts)
   */
  const cycleTheme = useCallback(() => {
    const themeKeys = Object.keys(THEMES);
    const currentIndex = themeKeys.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themeKeys.length;
    const nextTheme = themeKeys[nextIndex];

    changeTheme(nextTheme);
  }, [currentTheme, changeTheme]);

  // 🚀 APLICAR TEMA INICIAL CUANDO MONACO ESTÉ DISPONIBLE
  useEffect(() => {
    if (monacoInstance && currentTheme) {
      applyTheme(currentTheme, THEMES[currentTheme]);
    }
  }, [monacoInstance, currentTheme, applyTheme]);

  // 🎨 APLICAR TEMA INICIAL A LA UI (antes de que Monaco esté listo)
  useEffect(() => {
    if (currentTheme && THEMES[currentTheme]) {
      const theme = THEMES[currentTheme];
      const root = document.documentElement;

      root.style.setProperty('--theme-primary', theme.colors.primary);
      root.style.setProperty('--theme-secondary', theme.colors.secondary);
      root.style.setProperty('--theme-background', theme.colors.background);
      root.style.setProperty('--theme-accent', theme.colors.accent);

      // 🎯 COLORES ESPECÍFICOS PARA LA CONSOLA
      root.style.setProperty('--console-bg', theme.colors.background);
      root.style.setProperty('--console-text', '#ffffff');
      root.style.setProperty('--console-success', theme.colors.secondary);
      root.style.setProperty('--console-error', '#ef4444');
      root.style.setProperty('--console-warning', theme.colors.accent);
      root.style.setProperty('--console-info', theme.colors.primary);
      root.style.setProperty('--console-border', theme.colors.primary + '40');
    }
  }, [currentTheme]);

  return {
    // Estado
    currentTheme,
    currentThemeData: getCurrentThemeData(),
    availableThemes: THEMES,

    // Acciones
    changeTheme,
    cycleTheme,
    registerMonaco,

    // Utilidades
    isThemeAvailable: (themeId) => Boolean(THEMES[themeId]),
    getThemeData: (themeId) => THEMES[themeId] || null,
  };
}
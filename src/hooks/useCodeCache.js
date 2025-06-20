import { useState, useRef } from 'react'

/**
 * Hook para manejar cache inteligente de ejecuciones de código
 * Evita ejecutar el mismo código repetidamente
 */
export function useCodeCache() {
  const [smartModeEnabled, setSmartModeEnabled] = useState(true)
  const cacheRef = useRef(new Map()) // Cache de código -> resultado
  const lastExecutionRef = useRef(null)

  /**
   * Normaliza el código removiendo espacios innecesarios y comentarios
   * @param {string} code - Código original
   * @returns {string} Código normalizado
   */
  const normalizeCode = (code) => {
    return code
      // Remover comentarios de línea
      .replace(/\/\/.*$/gm, '')
      // Remover comentarios de bloque
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remover espacios extra y saltos de línea
      .replace(/\s+/g, ' ')
      // Remover espacios al inicio y final
      .trim()
      // Remover punto y coma final opcional
      .replace(/;$/, '')
  }

  /**
   * Detecta si el código contiene elementos no-determinísticos
   * Estos códigos siempre se deben re-ejecutar
   * @param {string} code - Código a analizar
   * @returns {boolean} true si contiene elementos no-determinísticos
   */
  const hasNonDeterministicElements = (code) => {
    const nonDeterministicPatterns = [
      // Funciones de tiempo
      /Date\s*\(/i,                    // new Date(), Date()
      /Date\.now\(\)/i,                // Date.now()
      /performance\.now\(\)/i,         // performance.now()
      
      // Funciones aleatorias
      /Math\.random\(\)/i,             // Math.random()
      /crypto\.getRandomValues/i,      // crypto.getRandomValues()
      
      // APIs externas
      /fetch\s*\(/i,                   // fetch()
      /XMLHttpRequest/i,               // XMLHttpRequest
      /axios\./i,                      // axios.get(), etc.
      
      // Inputs de usuario
      /prompt\s*\(/i,                  // prompt()
      /confirm\s*\(/i,                 // confirm()
      /alert\s*\(/i,                   // alert() (puede tener side effects)
      
      // Storage APIs (pueden cambiar)
      /localStorage\./i,               // localStorage.getItem()
      /sessionStorage\./i,             // sessionStorage.getItem()
      
      // Timers
      /setTimeout/i,                   // setTimeout
      /setInterval/i,                  // setInterval
      
      // Console interactivo (podría cambiar estado)
      /console\.clear\(\)/i,           // console.clear()
    ]

    return nonDeterministicPatterns.some(pattern => pattern.test(code))
  }

  /**
   * Genera una clave única para el código
   * @param {string} normalizedCode - Código normalizado
   * @returns {string} Hash del código
   */
  const generateCodeKey = (normalizedCode) => {
    // Simple hash function para generar clave
    let hash = 0
    for (let i = 0; i < normalizedCode.length; i++) {
      const char = normalizedCode.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return `code_${Math.abs(hash)}`
  }

  /**
   * Verifica si el código ha cambiado sustancialmente
   * @param {string} code - Código actual
   * @returns {object} Información sobre el cambio
   */
  const analyzeCodeChange = (code) => {
    const normalizedCode = normalizeCode(code)
    const codeKey = generateCodeKey(normalizedCode)
    const now = Date.now()
    
    // Obtener información de la última ejecución
    const lastExecution = lastExecutionRef.current
    const cachedExecution = cacheRef.current.get(codeKey)
    
    const analysis = {
      normalizedCode,
      codeKey,
      timestamp: now,
      
      // Estados de cambio
      hasChanged: !lastExecution || lastExecution.codeKey !== codeKey,
      hasNonDeterministic: hasNonDeterministicElements(code),
      isCached: !!cachedExecution,
      
      // Información temporal
      timeSinceLastExecution: lastExecution ? now - lastExecution.timestamp : 0,
      timeSinceCachedExecution: cachedExecution ? now - cachedExecution.timestamp : 0,
      
      // Metadatos
      cacheSize: cacheRef.current.size,
      lastExecution,
      cachedExecution
    }
    
    return analysis
  }

  /**
   * Decide si se debe ejecutar el código
   * @param {string} code - Código a evaluar
   * @param {string} source - 'manual' o 'auto'
   * @returns {object} Decisión y razones
   */
  const shouldExecuteCode = (code, source = 'auto') => {
    // Si smart mode está desactivado, siempre ejecutar
    if (!smartModeEnabled) {
      return {
        shouldExecute: true,
        reason: 'Smart mode disabled',
        type: 'always'
      }
    }
    
    // Ejecuciones manuales siempre se ejecutan
    if (source === 'manual') {
      return {
        shouldExecute: true,
        reason: 'Manual execution (forced)',
        type: 'manual'
      }
    }
    
    const analysis = analyzeCodeChange(code)
    
    // Código con elementos no-determinísticos siempre se ejecuta
    if (analysis.hasNonDeterministic) {
      return {
        shouldExecute: true,
        reason: 'Code contains non-deterministic elements',
        type: 'non-deterministic',
        analysis
      }
    }
    
    // Si el código no ha cambiado
    if (!analysis.hasChanged) {
      // Si se ejecutó recientemente (menos de 5 segundos), no ejecutar
      if (analysis.timeSinceLastExecution < 5000) {
        return {
          shouldExecute: false,
          reason: 'Code unchanged, executed recently',
          type: 'cached-recent',
          analysis
        }
      }
      
      // Si hay resultado en cache y es reciente (menos de 30 segundos), no ejecutar
      if (analysis.isCached && analysis.timeSinceCachedExecution < 30000) {
        return {
          shouldExecute: false,
          reason: 'Code unchanged, using cached result',
          type: 'cached',
          analysis
        }
      }
    }
    
    // Por defecto, ejecutar (código cambió o cache expiró)
    return {
      shouldExecute: true,
      reason: analysis.hasChanged ? 'Code changed' : 'Cache expired',
      type: analysis.hasChanged ? 'changed' : 'expired',
      analysis
    }
  }

  /**
   * Registra una ejecución en el cache
   * @param {string} code - Código ejecutado
   * @param {Array} output - Resultado de la ejecución
   * @param {string} source - 'manual' o 'auto'
   */
  const recordExecution = (code, output, source = 'auto') => {
    const analysis = analyzeCodeChange(code)
    const now = Date.now()
    
    const executionRecord = {
      code,
      normalizedCode: analysis.normalizedCode,
      codeKey: analysis.codeKey,
      output: output ? [...output] : [], // Clonar array
      source,
      timestamp: now
    }
    
    // Actualizar última ejecución
    lastExecutionRef.current = executionRecord
    
    // Guardar en cache solo si es determinístico
    if (!analysis.hasNonDeterministic) {
      cacheRef.current.set(analysis.codeKey, executionRecord)
      
      // Limpiar cache viejo (mantener solo últimas 50 entradas)
      if (cacheRef.current.size > 50) {
        const entries = Array.from(cacheRef.current.entries())
        // Ordenar por timestamp y mantener solo las más recientes
        entries.sort((a, b) => b[1].timestamp - a[1].timestamp)
        cacheRef.current.clear()
        entries.slice(0, 50).forEach(([key, value]) => {
          cacheRef.current.set(key, value)
        })
      }
    }
    
    return executionRecord
  }

  /**
   * Obtiene estadísticas del cache
   */
  const getCacheStats = () => {
    const entries = Array.from(cacheRef.current.values())
    const now = Date.now()
    
    return {
      totalCached: cacheRef.current.size,
      recentExecutions: entries.filter(e => now - e.timestamp < 60000).length, // Últimos 60s
      smartModeEnabled,
      oldestCacheAge: entries.length > 0 ? 
        Math.max(...entries.map(e => now - e.timestamp)) : 0
    }
  }

  /**
   * Limpia el cache completamente
   */
  const clearCache = () => {
    cacheRef.current.clear()
    lastExecutionRef.current = null
  }

  /**
   * Toggle del smart mode
   */
  const toggleSmartMode = () => {
    setSmartModeEnabled(!smartModeEnabled)
  }

  return {
    // Funciones principales
    shouldExecuteCode,
    recordExecution,
    analyzeCodeChange,
    
    // Configuración
    smartModeEnabled,
    toggleSmartMode,
    
    // Utilidades
    getCacheStats,
    clearCache,
    
    // Para debugging
    normalizeCode,
    hasNonDeterministicElements
  }
}
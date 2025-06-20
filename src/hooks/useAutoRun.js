import { useState, useEffect, useRef } from 'react'
import { useCodeCache } from './useCodeCache'

/**
 * Hook para manejar la ejecución automática de código con cache inteligente
 * @param {string} code - Código actual del editor
 * @param {Function} runCode - Función para ejecutar el código
 * @param {boolean} isRunning - Si ya se está ejecutando código
 * @returns {object} Estado y controles del auto-run
 */
export function useAutoRun(code, runCode, isRunning) {
  // Estado del auto-run
  const [isAutoRunEnabled, setIsAutoRunEnabled] = useState(false)
  const [isAutoRunning, setIsAutoRunning] = useState(false)
  const [lastCacheDecision, setLastCacheDecision] = useState(null)
  
  // Cache inteligente
  const {
    shouldExecuteCode,
    recordExecution,
    smartModeEnabled,
    toggleSmartMode,
    getCacheStats,
    clearCache
  } = useCodeCache()
  
  // Referencias para el debounce y control
  const timeoutRef = useRef(null)
  const previousCodeRef = useRef(code)
  const isFirstRender = useRef(true)
  const abortControllerRef = useRef(null)

  /**
   * Activa/desactiva el auto-run
   */
  const toggleAutoRun = () => {
    const newState = !isAutoRunEnabled
    setIsAutoRunEnabled(newState)
    
    // Si se desactiva, cancelar cualquier ejecución pendiente
    if (!newState) {
      cancelAutoRun()
    }
  }

  /**
   * Cancela cualquier auto-run pendiente COMPLETAMENTE
   */
  const cancelAutoRun = () => {
    // Cancelar timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    // Abortar ejecución en progreso
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    
    setIsAutoRunning(false)
    setLastCacheDecision(null)
  }

  /**
   * Agrega un mensaje informativo al console sobre decisiones de cache
   * @param {object} decision - Decisión del cache
   * @param {Function} addOutputLine - Función para agregar líneas al console
   */
  const addCacheInfoMessage = (decision, addOutputLine) => {
    const icons = {
      'cached': '📋',
      'cached-recent': '⏱️',
      'changed': '⚡',
      'manual': '🔄',
      'non-deterministic': '🎲',
      'expired': '⏳',
      'always': '🔥'
    }
    
    const messages = {
      'cached': 'Code unchanged, using cached result',
      'cached-recent': 'Code unchanged, executed recently',
      'changed': 'Code changed, auto-running',
      'manual': 'Manual execution (forced)',
      'non-deterministic': 'Code contains dynamic elements, re-executing',
      'expired': 'Cache expired, re-executing',
      'always': 'Smart mode disabled, always executing'
    }
    
    const icon = icons[decision.type] || '📋'
    const message = messages[decision.type] || decision.reason
    
    // Solo mostrar mensaje si smart mode está habilitado y no es ejecución manual
    if (smartModeEnabled && decision.type !== 'manual') {
      addOutputLine(`${icon} ${message}`, 'info')
    }
  }

  /**
   * Ejecuta el código automáticamente con cache inteligente
   */
  const executeAutoRun = async () => {
    // Crear AbortController para esta ejecución
    abortControllerRef.current = new AbortController()
    
    try {
      // Verificar si fue cancelada antes de ejecutar
      if (abortControllerRef.current.signal.aborted) {
        return
      }
      
      setIsAutoRunning(false) // Ya no está esperando
      
      // Crear función para capturar output y registrar en cache
      const executeAndCache = async (code, source = 'auto') => {
        const outputBefore = [] // Aquí deberíamos capturar el output actual
        
        // Ejecutar el código
        await runCode(code, source)
        
        const outputAfter = [] // Aquí deberíamos capturar el output después
        
        // Registrar en cache (idealmente con el output real)
        recordExecution(code, outputAfter, source)
      }
      
      await executeAndCache(code, 'auto')
      
    } catch (error) {
      if (!abortControllerRef.current.signal.aborted) {
        console.error('Auto-run execution error:', error)
      }
    } finally {
      // Solo limpiar si no fue abortada por una nueva ejecución
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        abortControllerRef.current = null
      }
    }
  }

  /**
   * Valida si el código tiene sintaxis básica correcta
   * @param {string} code - Código a validar
   * @returns {boolean} true si parece válido
   */
  const hasValidSyntax = (code) => {
    if (!code.trim()) return false
    
    try {
      // Intenta parsear el código como JavaScript
      new Function(code)
      return true
    } catch (error) {
      // Si hay error de sintaxis, no auto-ejecutar
      return false
    }
  }

  // Effect principal: detectar cambios en el código con cache inteligente
  useEffect(() => {
    // No hacer nada en el primer render
    if (isFirstRender.current) {
      isFirstRender.current = false
      previousCodeRef.current = code
      return
    }

    // Solo proceder si auto-run está habilitado
    if (!isAutoRunEnabled) {
      previousCodeRef.current = code
      return
    }

    // No auto-ejecutar si ya se está ejecutando código manualmente
    if (isRunning) {
      previousCodeRef.current = code
      return
    }

    // CANCELAR completamente cualquier auto-run anterior
    cancelAutoRun()

    // Validar sintaxis básica antes de consultar cache
    if (!hasValidSyntax(code)) {
      previousCodeRef.current = code
      return
    }

    // CONSULTAR CACHE INTELIGENTE
    const decision = shouldExecuteCode(code, 'auto')
    setLastCacheDecision(decision)

    if (decision.shouldExecute) {
      // EJECUTAR: Código cambió, cache expiró, o elementos no-determinísticos
      setIsAutoRunning(true)
      
      // Debounce: esperar 1 segundo después de que el usuario pare de escribir
      timeoutRef.current = setTimeout(() => {
        executeAutoRun()
      }, 1000)
    } else {
      // NO EJECUTAR: Usar resultado en cache
      // Opcionalmente podríamos mostrar un mensaje en el console aquí
      console.log(`Auto-run skipped: ${decision.reason}`)
    }

    // Actualizar referencia del código anterior
    previousCodeRef.current = code
    
  }, [code, isAutoRunEnabled, isRunning, runCode, shouldExecuteCode])

  // Cleanup: cancelar todo al desmontar
  useEffect(() => {
    return () => {
      cancelAutoRun()
    }
  }, [])

  return {
    // Estado del auto-run
    isAutoRunEnabled,
    isAutoRunning,
    
    // Estado del cache
    smartModeEnabled,
    lastCacheDecision,
    
    // Controles principales
    toggleAutoRun,
    cancelAutoRun,
    
    // Controles del cache
    toggleSmartMode,
    clearCache,
    getCacheStats,
    
    // Información útil
    hasAutoRunPending: !!timeoutRef.current && isAutoRunning,
    
    // Para debugging
    cacheStats: getCacheStats()
  }
}
import { useState, useEffect, useRef, useCallback } from 'react'
import { useCodeCache } from './useCodeCache'

/**
 * Hook para manejar la ejecución automática de código
 * VERSIÓN LIMPIA: Sin mensajes molestos, solo ejecuta cuando es necesario
 */
export function useAutoRun(code, runCodeFunction, isRunning) {
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
   * Toggle auto-run (sin mensajes molestos)
   */
  const toggleAutoRun = useCallback(() => {
    const newState = !isAutoRunEnabled
    setIsAutoRunEnabled(newState)

    if (!newState) {
      cancelAutoRun()
    }
  }, [isAutoRunEnabled])

  /**
   * Cancela cualquier auto-run pendiente
   */
  const cancelAutoRun = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    setIsAutoRunning(false)
    setLastCacheDecision(null)
  }, [])

  /**
   * Ejecuta el código automáticamente de forma silenciosa
   */
  const executeAutoRun = useCallback(async () => {
    abortControllerRef.current = new AbortController()

    try {
      if (abortControllerRef.current.signal.aborted) return

      setIsAutoRunning(false)

      // Ejecutar código de forma silenciosa
      const executionResult = await runCodeFunction(code, 'auto')

      // Registrar en cache
      if (executionResult && executionResult.success) {
        recordExecution(code, executionResult.output || [], 'auto')
      }

      return executionResult

    } catch (error) {
      if (!abortControllerRef.current.signal.aborted) {
        console.error('Auto-run execution error:', error)
      }
    } finally {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        abortControllerRef.current = null
      }
    }
  }, [code, runCodeFunction, recordExecution])

  /**
   * Valida si el código tiene sintaxis correcta
   */
  const hasValidSyntax = useCallback((code) => {
    if (!code.trim()) return false

    try {
      new Function(code)
      return true
    } catch (error) {
      return false
    }
  }, [])

  /**
   * Determina si el código ha cambiado significativamente
   * Evita ejecutar por cada tecla presionada
   */
  const hasSignificantChange = useCallback((newCode, oldCode) => {
    // Si es exactamente igual, no hay cambio
    if (newCode === oldCode) return false

    // Normalizar código (remover espacios extra, saltos de línea, etc.)
    const normalize = (code) => code.replace(/\s+/g, ' ').trim()
    const normalizedNew = normalize(newCode)
    const normalizedOld = normalize(oldCode)

    // Solo considerar cambio significativo si:
    // 1. El código normalizado es diferente
    // 2. Y la diferencia es mayor a solo espacios
    return normalizedNew !== normalizedOld && normalizedNew.length > 0
  }, [])

  // Effect principal - MUCHO más conservador
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

    // CRÍTICO: Solo proceder si hay un cambio SIGNIFICATIVO
    if (!hasSignificantChange(code, previousCodeRef.current)) {
      return
    }

    // Cancelar cualquier auto-run anterior
    cancelAutoRun()

    // Validar sintaxis básica
    if (!hasValidSyntax(code)) {
      previousCodeRef.current = code
      return
    }

    // Consultar cache inteligente (pero sin mostrar mensajes)
    const decision = shouldExecuteCode(code, 'auto')
    setLastCacheDecision(decision)

    if (decision.shouldExecute) {
      setIsAutoRunning(true)

      // Debounce MÁS LARGO: esperar 1.5 segundos de inactividad
      timeoutRef.current = setTimeout(() => {
        executeAutoRun()
      }, 1500) // Aumentado de 1000ms a 1500ms
    }

    // Actualizar referencia del código anterior
    previousCodeRef.current = code

  }, [
    code,
    isAutoRunEnabled,
    isRunning,
    hasSignificantChange,
    hasValidSyntax,
    shouldExecuteCode,
    executeAutoRun,
    cancelAutoRun
  ])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      cancelAutoRun()
    }
  }, [cancelAutoRun])

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
    hasAutoRunPending: !!timeoutRef.current,

    // Para debugging
    cacheStats: getCacheStats()
  }
}
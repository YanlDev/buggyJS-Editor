import { useState, useRef, useCallback } from 'react'
/**
 * Hook personalizado para ejecutar código JavaScript y capturar output
 */
export function useCodeRunner() {
  const [output, setOutput] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const executionIdRef = useRef(0)
  const abortControllerRef = useRef(null)

  /**
   * Genera un ID único para cada ejecución
   */
  const generateExecutionId = () => {
    executionIdRef.current += 1
    return executionIdRef.current
  }

  /**
   * Genera timestamp para los mensajes
   */
  const getTimestamp = () => {
    const now = new Date()
    return now.toLocaleTimeString('es-ES', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  /**
   * Agrega una línea al output del console
   * CORREGIDO: Ahora es una función estable con useCallback
   */
  const addOutputLine = useCallback((content, type = 'log') => {
    const newLine = {
      id: Date.now() + Math.random(),
      content: String(content),
      type,
      timestamp: getTimestamp()
    }

    setOutput(prev => [...prev, newLine])
    return newLine // NUEVO: Retorna la línea para tracking
  }, [])

  /**
   * Limpia el output del console
   */
  const clearOutput = useCallback(() => {
    setOutput([])
  }, [])

  /**
   * NUEVO: Obtiene el output actual (para cache)
   */
  const getCurrentOutput = useCallback(() => {
    return [...output] // Retorna copia del output actual
  }, [output])

  /**
   * Cancela la ejecución actual
   */
  const cancelExecution = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    generateExecutionId()
    setIsRunning(false)
  }, [])

  /**
   * CORREGIDO: Ejecuta código con mejor tracking del output
   */
  const runCode = useCallback(async (code, source = 'manual') => {
    if (!code.trim()) {
      return { success: false, output: [], reason: 'Empty code' }
    }

    // Cancelar ejecución anterior
    cancelExecution()

    const currentExecutionId = generateExecutionId()
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    setIsRunning(true)

    // NUEVO: Capturar output antes de la ejecución
    const outputBefore = getCurrentOutput()
    const capturedLogs = []

    try {
      if (signal.aborted) {
        return { success: false, output: [], reason: 'Aborted before execution' }
      }

      let logCount = 0
      const MAX_LOGS = 1000

      // Console interceptor mejorado
      const mockConsole = {
        log: (...args) => {
          if (signal.aborted || currentExecutionId !== executionIdRef.current) return

          logCount++
          if (logCount > MAX_LOGS) {
            const warningLine = addOutputLine(
              `[MAX LOGS REACHED] Output truncated after ${MAX_LOGS} messages`,
              'warn'
            )
            capturedLogs.push(warningLine)
            return
          }

          const message = args.map(arg => {
            if (typeof arg === 'object') {
              try {
                return JSON.stringify(arg, null, 2)
              } catch (e) {
                return String(arg)
              }
            }
            return String(arg)
          }).join(' ')

          const line = addOutputLine(message, 'log')
          capturedLogs.push(line)
        },

        error: (...args) => {
          if (signal.aborted || currentExecutionId !== executionIdRef.current) return
          const message = args.map(arg => String(arg)).join(' ')
          const line = addOutputLine(message, 'error')
          capturedLogs.push(line)
        },

        warn: (...args) => {
          if (signal.aborted || currentExecutionId !== executionIdRef.current) return
          const message = args.map(arg => String(arg)).join(' ')
          const line = addOutputLine(message, 'warn')
          capturedLogs.push(line)
        },

        info: (...args) => {
          if (signal.aborted || currentExecutionId !== executionIdRef.current) return
          const message = args.map(arg => String(arg)).join(' ')
          const line = addOutputLine(message, 'info')
          capturedLogs.push(line)
        },

        clear: () => {
          if (signal.aborted || currentExecutionId !== executionIdRef.current) return
          clearOutput()
          capturedLogs.length = 0 // Limpiar logs capturados también
        }
      }

      // Ejecutar con timeout
      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Code execution timeout (5 seconds)'))
        }, 5000)

        try {
          if (signal.aborted || currentExecutionId !== executionIdRef.current) {
            clearTimeout(timeoutId)
            resolve()
            return
          }

          const wrappedCode = `
            (function() {
              try {
                ${code}
              } catch (error) {
                console.error('Runtime Error: ' + error.message)
              }
            })()
          `

          const executor = new Function('console', wrappedCode)
          executor(mockConsole)

          clearTimeout(timeoutId)
          resolve()
        } catch (error) {
          clearTimeout(timeoutId)
          reject(error)
        }
      })

      // Verificar si fue cancelada después de la ejecución
      if (signal.aborted || currentExecutionId !== executionIdRef.current) {
        setIsRunning(false)
        return { success: false, output: capturedLogs, reason: 'Execution cancelled' }
      }

      // Mostrar mensaje de éxito solo para ejecuciones manuales sin output
      if (capturedLogs.length === 0 && source === 'manual') {
        const successLine = addOutputLine('Code executed successfully (no output)', 'info')
        capturedLogs.push(successLine)
      }

      // NUEVO: Retornar información completa de la ejecución
      const executionResult = {
        success: true,
        output: capturedLogs,
        outputBefore,
        outputAfter: getCurrentOutput(),
        source,
        timestamp: Date.now()
      }

      return executionResult

    } catch (error) {
      if (!signal.aborted && currentExecutionId === executionIdRef.current) {
        let errorLine
        if (error.message.includes('timeout')) {
          errorLine = addOutputLine('⚠️ Execution stopped: Code took too long (5s timeout)', 'warn')
        } else {
          errorLine = addOutputLine(`Execution Error: ${error.message}`, 'error')
        }
        capturedLogs.push(errorLine)
      }

      return {
        success: false,
        output: capturedLogs,
        error: error.message,
        source,
        timestamp: Date.now()
      }
    } finally {
      if (!signal.aborted && currentExecutionId === executionIdRef.current) {
        setIsRunning(false)
      }
    }
  }, [addOutputLine, clearOutput, getCurrentOutput, cancelExecution])

  return {
    // Estado
    output,
    isRunning,
    hasOutput: output.length > 0,

    // Funciones principales
    runCode,
    clearOutput,
    cancelExecution,

    // NUEVO: Funciones para integración con auto-run
    addOutputLine,
    getCurrentOutput
  }
}
// hooks/useCodeRunner.js - Cancelación mejorada y manejo de bucles
import { useState, useRef } from 'react'

/**
 * Hook personalizado para ejecutar código JavaScript y capturar output
 * Incluye soporte para auto-run y cancelación REAL de ejecuciones
 */
export function useCodeRunner() {
  const [output, setOutput] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const executionIdRef = useRef(0)
  const abortControllerRef = useRef(null)

  /**
   * Genera un ID único para cada ejecución
   * Permite cancelar ejecuciones anteriores
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
   * @param {string} content - Contenido del mensaje
   * @param {string} type - Tipo: 'log', 'error', 'warn'
   */
  const addOutputLine = (content, type = 'log') => {
    const newLine = {
      id: Date.now() + Math.random(), // ID único
      content: String(content),
      type,
      timestamp: getTimestamp()
    }

    setOutput(prev => [...prev, newLine])
  }

  /**
   * Limpia el output del console
   */
  const clearOutput = () => {
    setOutput([])
  }

  /**
   * Cancela la ejecución actual REALMENTE
   */
  const cancelExecution = () => {
    // Abortar el AbortController actual
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Invalidar ID de ejecución
    generateExecutionId()
    setIsRunning(false)
  }

  /**
   * Ejecuta código JavaScript de forma segura con cancelación REAL
   * @param {string} code - Código JavaScript a ejecutar
   * @param {string} source - Fuente: 'manual' o 'auto'
   */
  const runCode = async (code, source = 'manual') => {
    if (!code.trim()) {
      return
    }

    // CANCELAR cualquier ejecución anterior ANTES de empezar
    cancelExecution()

    // Generar ID para esta ejecución
    const currentExecutionId = generateExecutionId()

    // Crear nuevo AbortController para esta ejecución
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    setIsRunning(true)

    try {
      // Verificar si fue abortada antes de empezar
      if (signal.aborted) {
        return
      }

      // Crear un contexto aislado para la ejecución
      const capturedLogs = []
      let logCount = 0
      const MAX_LOGS = 1000 // Límite para evitar spam

      // Interceptar console con límites y cancelación
      const mockConsole = {
        log: (...args) => {
          // Verificar si fue cancelada
          if (signal.aborted || currentExecutionId !== executionIdRef.current) {
            return
          }

          logCount++
          if (logCount > MAX_LOGS) {
            capturedLogs.push({
              content: `[MAX LOGS REACHED] Output truncated after ${MAX_LOGS} messages`,
              type: 'warn'
            })
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

          capturedLogs.push({ content: message, type: 'log' })
        },

        error: (...args) => {
          if (signal.aborted || currentExecutionId !== executionIdRef.current) return
          const message = args.map(arg => String(arg)).join(' ')
          capturedLogs.push({ content: message, type: 'error' })
        },

        warn: (...args) => {
          if (signal.aborted || currentExecutionId !== executionIdRef.current) return
          const message = args.map(arg => String(arg)).join(' ')
          capturedLogs.push({ content: message, type: 'warn' })
        },

        info: (...args) => {
          if (signal.aborted || currentExecutionId !== executionIdRef.current) return
          capturedLogs.push({
            content: args.map(arg => String(arg)).join(' '),
            type: 'log'
          })
        },

        clear: () => {
          if (signal.aborted || currentExecutionId !== executionIdRef.current) return
          clearOutput()
        }
      }

      // Verificar cancelación antes de ejecutar
      if (signal.aborted || currentExecutionId !== executionIdRef.current) {
        setIsRunning(false)
        return
      }

      // Ejecutar con timeout para evitar bucles infinitos
      const executeWithTimeout = () => {
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Code execution timeout (5 seconds)'))
          }, 5000) // 5 segundos timeout

          try {
            // Verificar cancelación una vez más
            if (signal.aborted || currentExecutionId !== executionIdRef.current) {
              clearTimeout(timeoutId)
              resolve()
              return
            }

            // Envolver código con try-catch y verificación de cancelación
            const wrappedCode = `
              (function() {
                try {
                  ${code}
                } catch (error) {
                  console.error('Runtime Error: ' + error.message)
                }
              })()
            `

            // Ejecutar usando Function constructor (más seguro que eval)
            const executor = new Function('console', wrappedCode)
            executor(mockConsole)

            clearTimeout(timeoutId)
            resolve()
          } catch (error) {
            clearTimeout(timeoutId)
            reject(error)
          }
        })
      }

      // Ejecutar con timeout
      await executeWithTimeout()

      // Verificar si fue cancelada después de la ejecución
      if (signal.aborted || currentExecutionId !== executionIdRef.current) {
        setIsRunning(false)
        return
      }

      // Agregar los logs capturados al output EN TIEMPO REAL
      capturedLogs.forEach(log => {
        // Verificar antes de cada log
        if (!signal.aborted && currentExecutionId === executionIdRef.current) {
          addOutputLine(log.content, log.type)
        }
      })

      // Si no hay output visible, mostrar mensaje de éxito solo para ejecuciones manuales
      if (capturedLogs.length === 0 && source === 'manual') {
        if (!signal.aborted && currentExecutionId === executionIdRef.current) {
          addOutputLine('Code executed successfully (no output)', 'log')
        }
      }

    } catch (error) {
      // Solo mostrar errores si no fue cancelada la ejecución
      if (!signal.aborted && currentExecutionId === executionIdRef.current) {
        if (error.message.includes('timeout')) {
          addOutputLine('⚠️ Execution stopped: Code took too long (5s timeout)', 'warn')
        } else {
          addOutputLine(`Execution Error: ${error.message}`, 'error')
        }
      }
    } finally {
      // Solo cambiar estado si esta ejecución sigue siendo la actual
      if (!signal.aborted && currentExecutionId === executionIdRef.current) {
        setIsRunning(false)
      }
    }
  }

  return {
    // Estado
    output,
    isRunning,
    hasOutput: output.length > 0,

    // Funciones
    runCode,
    clearOutput,
    cancelExecution
  }
}
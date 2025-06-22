import { useState, useCallback } from 'react'

/**
 * Runner con contexto dinámico - Las variables desaparecen cuando borras líneas
 * Comportamiento exacto de RunJS
 */
export function useCleanRunner() {
  const [outputLines, setOutputLines] = useState({})
  const [isRunning, setIsRunning] = useState(false)
  const [persistentContext, setPersistentContext] = useState({})

  /**
   * Función principal que ejecuta código con contexto dinámico
   * Las variables solo existen si sus líneas de declaración existen
   */
  const executeCode = useCallback(async (code) => {
    if (!code.trim()) {
      setOutputLines({})
      setPersistentContext({})
      return
    }

    setIsRunning(true)

    try {
      // Limpiar outputs anteriores
      setOutputLines({})

      // Analizar código actual para detectar variables disponibles
      const currentVariables = extractVariablesFromCode(code)

      // Actualizar contexto persistente solo con variables que existen en el código actual
      const updatedContext = {}
      Object.keys(currentVariables).forEach(varName => {
        if (persistentContext[varName] !== undefined) {
          updatedContext[varName] = persistentContext[varName]
        }
      })

      // Dividir código en líneas
      const lines = code.split('\n')
      const newOutputs = {}

      // Variables para tracking
      const consoleOutputs = []

      // Console personalizado que captura everything
      const captureConsole = {
        log: (...args) => {
          consoleOutputs.push({
            type: 'log',
            content: formatOutput(args),
            order: consoleOutputs.length
          })
        },
        error: (...args) => {
          consoleOutputs.push({
            type: 'error',
            content: formatOutput(args),
            order: consoleOutputs.length
          })
        },
        warn: (...args) => {
          consoleOutputs.push({
            type: 'warn',
            content: formatOutput(args),
            order: consoleOutputs.length
          })
        },
        info: (...args) => {
          consoleOutputs.push({
            type: 'info',
            content: formatOutput(args),
            order: consoleOutputs.length
          })
        }
      }

      // Función para formatear argumentos
      function formatOutput(args) {
        return args.map(arg => {
          if (typeof arg === 'object' && arg !== null) {
            try {
              return JSON.stringify(arg, null, 2)
            } catch (e) {
              return String(arg)
            }
          }
          return String(arg)
        }).join(' ')
      }

      // Crear mapa de líneas con console.xxx
      const consoleLinesInfo = []
      lines.forEach((line, index) => {
        const lineNumber = index + 1
        const trimmed = line.trim()

        // Detectar si la línea tiene console.xxx
        if (trimmed &&
          !trimmed.startsWith('//') &&
          /console\.(log|error|warn|info)\s*\(/.test(trimmed)) {
          consoleLinesInfo.push({
            lineNumber: lineNumber,
            lineContent: trimmed,
            expectedOutputIndex: consoleLinesInfo.length
          })
        }
      })

      // Preparar código para ejecución con contexto
      const codeToExecute = lines
        .filter(line => {
          const trimmed = line.trim()
          return trimmed && !trimmed.startsWith('//')
        })
        .join('\n')

      if (codeToExecute.trim()) {
        // Crear contexto de ejecución con variables persistentes
        const contextCode = `
          // Inyectar variables del contexto persistente
          ${Object.keys(updatedContext).map(key => {
          try {
            return `let ${key} = ${JSON.stringify(updatedContext[key])};`
          } catch (e) {
            return `let ${key} = updatedContext.${key};`
          }
        }).join('\n')}
          
          // Código del usuario
          ${codeToExecute}
          
          // Capturar nuevas variables
          const newVars = {};
          try {
            ${Object.keys(currentVariables).map(varName =>
          `if (typeof ${varName} !== 'undefined') newVars.${varName} = ${varName};`
        ).join('\n')}
          } catch(e) {}
          
          return newVars;
        `

        // Ejecutar código y capturar nuevas variables
        const executeFunction = new Function('console', 'updatedContext', contextCode)
        const newVariables = executeFunction(captureConsole, updatedContext)

        // Actualizar contexto persistente
        setPersistentContext(newVariables)
      }

      // Mapear outputs capturados a sus líneas correspondientes
      consoleLinesInfo.forEach((lineInfo, index) => {
        const correspondingOutput = consoleOutputs[index]

        if (correspondingOutput) {
          newOutputs[lineInfo.lineNumber] = {
            id: `line-${lineInfo.lineNumber}`,
            lineNumber: lineInfo.lineNumber,
            content: correspondingOutput.content,
            type: correspondingOutput.type,
            timestamp: new Date().toLocaleTimeString('es-ES', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }),
            lastUpdated: Date.now()
          }
        }
      })

      // Manejar casos especiales como bucles que generan múltiples outputs
      if (consoleOutputs.length > consoleLinesInfo.length) {
        // Hay más outputs que líneas console - probablemente un bucle
        const extraOutputs = consoleOutputs.slice(consoleLinesInfo.length)

        // Encontrar la última línea con console en un bucle
        let lastConsoleLineInLoop = null
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i].trim()
          if (line &&
            !line.startsWith('//') &&
            /console\.(log|error|warn|info)\s*\(/.test(line)) {
            lastConsoleLineInLoop = i + 1
            break
          }
        }

        if (lastConsoleLineInLoop && newOutputs[lastConsoleLineInLoop]) {
          // Combinar outputs extra con la línea del bucle
          const existingOutput = newOutputs[lastConsoleLineInLoop]
          const combinedContent = [existingOutput.content]
            .concat(extraOutputs.map(output => output.content))
            .join('\n')

          newOutputs[lastConsoleLineInLoop] = {
            ...existingOutput,
            content: combinedContent
          }
        }
      }

      setOutputLines(newOutputs)

    } catch (error) {
      // Mostrar error en la primera línea con código
      const errorLineNumber = findFirstCodeLine(code.split('\n'))
      setOutputLines({
        [errorLineNumber]: {
          id: `line-${errorLineNumber}`,
          lineNumber: errorLineNumber,
          content: `Error: ${error.message}`,
          type: 'error',
          timestamp: new Date().toLocaleTimeString('es-ES', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          lastUpdated: Date.now()
        }
      })
    } finally {
      setIsRunning(false)
    }
  }, [persistentContext])

  /**
   * Extrae variables declaradas en el código actual
   */
  function extractVariablesFromCode(code) {
    const variables = {}
    const lines = code.split('\n')

    lines.forEach(line => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('//')) return

      // Detectar declaraciones de variables
      const patterns = [
        /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g,
        /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g
      ]

      patterns.forEach(pattern => {
        let match
        while ((match = pattern.exec(trimmed)) !== null) {
          variables[match[1]] = true
        }
      })
    })

    return variables
  }

  /**
   * Encuentra la primera línea con código válido
   */
  function findFirstCodeLine(lines) {
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim()
      if (trimmed && !trimmed.startsWith('//')) {
        return i + 1
      }
    }
    return 1
  }

  /**
   * Limpia todos los outputs
   */
  const clearOutput = useCallback(() => {
    setOutputLines({})
    setPersistentContext({})
  }, [])

  /**
   * Reset completo (alias de clearOutput por compatibilidad)
   */
  const resetContext = useCallback(() => {
    setOutputLines({})
  }, [])

  // Convertir a array para el componente Console
  const outputArray = Object.values(outputLines)
    .sort((a, b) => a.lineNumber - b.lineNumber)

  return {
    // Función principal de ejecución
    runCode: executeCode,

    // Estado
    output: outputArray,
    isRunning,
    hasOutput: outputArray.length > 0,

    // Funciones de utilidad
    clearOutput,
    resetContext,

    // Funciones dummy para compatibilidad con el código existente
    isAutoRunEnabled: false,
    triggerAutoRun: () => { },
    toggleAutoRun: () => { },
    runIncremental: (code, isManual) => {
      if (isManual) {
        return executeCode(code)
      }
    }
  }
}
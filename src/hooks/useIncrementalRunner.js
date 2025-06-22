import { useState, useCallback, useRef } from 'react'

export function useCleanRunner() {
  const [outputLines, setOutputLines] = useState({})
  const [isRunning, setIsRunning] = useState(false)
  const timeoutRef = useRef(null) // Referencia para el timeout

  /**
   * Función principal que ejecuta código con contexto completo
   * Incluye fetch, Promise, setTimeout y todas las APIs del navegador
   */
  const executeCode = useCallback(async (code) => {
    if (!code.trim()) {
      setOutputLines({})
      return
    }

    setIsRunning(true)

    // 🛡️ TIMEOUT AUTOMÁTICO PARA PREVENIR BUCLES INFINITOS
    const EXECUTION_TIMEOUT = 5000; // 5 segundos
    let isTimedOut = false;

    timeoutRef.current = setTimeout(() => {
      isTimedOut = true;
      setOutputLines({
        1: {
          id: 'timeout-error',
          lineNumber: 1,
          content: '⏰ Ejecución cancelada automáticamente: Timeout de 5 segundos excedido (posible bucle infinito)',
          type: 'error',
          timestamp: new Date().toLocaleTimeString('es-ES', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          lastUpdated: Date.now()
        }
      });
      setIsRunning(false);
    }, EXECUTION_TIMEOUT);

    try {
      // Limpiar outputs anteriores
      setOutputLines({})

      const lines = code.split('\n')
      const newOutputs = {}
      const consoleOutputs = []

      // 🎯 CONSOLE PERSONALIZADO QUE CAPTURA TODO
      const captureConsole = {
        log: (...args) => {
          if (isTimedOut) return; // No procesar si ya expiró
          consoleOutputs.push({
            type: 'log',
            content: formatOutput(args),
            order: consoleOutputs.length
          })
        },
        error: (...args) => {
          if (isTimedOut) return;
          consoleOutputs.push({
            type: 'error',
            content: formatOutput(args),
            order: consoleOutputs.length
          })
        },
        warn: (...args) => {
          if (isTimedOut) return;
          consoleOutputs.push({
            type: 'warn',
            content: formatOutput(args),
            order: consoleOutputs.length
          })
        },
        info: (...args) => {
          if (isTimedOut) return;
          consoleOutputs.push({
            type: 'info',
            content: formatOutput(args),
            order: consoleOutputs.length
          })
        }
      }

      /**
       * Formatea argumentos de console para mostrarlos correctamente
       */
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

      // 🎯 MAPEAR LÍNEAS CON CONSOLE.XXX PARA MOSTRAR OUTPUTS
      const consoleLinesInfo = []
      lines.forEach((line, index) => {
        const lineNumber = index + 1
        const trimmed = line.trim()

        // Detectar líneas que tienen console.log, console.error, etc.
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

      // Preparar código para ejecución (sin comentarios y líneas vacías)
      const codeToExecute = lines
        .filter(line => {
          const trimmed = line.trim()
          return trimmed && !trimmed.startsWith('//')
        })
        .join('\n')

      // 🌐 EJECUTAR CÓDIGO CON CONTEXTO COMPLETO (FETCH, PROMISE, ETC.)
      if (codeToExecute.trim() && !isTimedOut) {
        try {
          // 🎯 CREAR FUNCIÓN CON ACCESO A TODAS LAS APIs DEL NAVEGADOR
          const executeFunction = new Function(
            'console',           // Console personalizado
            'fetch',             // API fetch del navegador
            'Promise',           // Promises para async/await
            'setTimeout',        // setTimeout para delays
            'setInterval',       // setInterval para timers
            'clearTimeout',      // clearTimeout para limpiar timers
            'clearInterval',     // clearInterval para limpiar intervals
            'JSON',              // JSON para parsing
            'Date',              // Date para timestamps
            'Math',              // Math para cálculos
            'Array',             // Array methods
            'Object',            // Object methods
            'String',            // String methods
            'Number',            // Number methods
            'Boolean',           // Boolean constructor
            'Error',             // Error constructor
            'RegExp',            // RegExp para expresiones regulares
            // 🔧 WRAPPER PARA CÓDIGO DEL USUARIO CON MANEJO DE ERRORES
            `
            (async () => {
              try {
                ${codeToExecute}
              } catch (error) {
                console.error('Error:', error.message);
                throw error;
              }
            })();
            `
          );

          
          await executeFunction(
            captureConsole,                      // Tu console personalizado
            window.fetch?.bind(window),          // fetch real del navegador
            window.Promise,                      // Promise real
            window.setTimeout.bind(window),      // setTimeout real
            window.setInterval.bind(window),     // setInterval real
            window.clearTimeout.bind(window),    // clearTimeout real
            window.clearInterval.bind(window),   // clearInterval real
            window.JSON,                         // JSON real
            window.Date,                         // Date real
            window.Math,                         // Math real
            window.Array,                        // Array real
            window.Object,                       // Object real
            window.String,                       // String real
            window.Number,                       // Number real
            window.Boolean,                      // Boolean real
            window.Error,                        // Error real
            window.RegExp                        // RegExp real
          );

        } catch (executionError) {

          console.error('Error en ejecución:', executionError);

          if (!isTimedOut) {
            const errorLineNumber = findFirstCodeLine(code.split('\n'));
            newOutputs[errorLineNumber] = {
              id: `error-${errorLineNumber}`,
              lineNumber: errorLineNumber,
              content: `Error: ${executionError.message}`,
              type: 'error',
              timestamp: new Date().toLocaleTimeString('es-ES', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              }),
              lastUpdated: Date.now()
            };
          }
        }
      }


      if (!isTimedOut) {

        clearTimeout(timeoutRef.current);

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


        if (consoleOutputs.length > consoleLinesInfo.length) {

          const extraOutputs = consoleOutputs.slice(consoleLinesInfo.length)

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
        setIsRunning(false)
      }

    } catch (error) {

      clearTimeout(timeoutRef.current);

      if (!isTimedOut) {
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
        setIsRunning(false)
      }
    }
  }, [])

  /**
   * Encuentra la primera línea con código válido (no comentario ni vacía)
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
   * Limpia todos los outputs y cancela timeout si existe
   */
  const clearOutput = useCallback(() => {
    setOutputLines({})
    // 🛡️ Limpiar timeout si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [])

  /**
   * Reset completo (alias de clearOutput por compatibilidad)
   */
  const resetContext = useCallback(() => {
    setOutputLines({})
    // 🛡️ Limpiar timeout si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [])


  const outputArray = Object.values(outputLines)
    .sort((a, b) => a.lineNumber - b.lineNumber)

  return {

    runCode: executeCode,


    output: outputArray,
    isRunning,
    hasOutput: outputArray.length > 0,


    clearOutput,
    resetContext,


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
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
    const EXECUTION_TIMEOUT = 15000; // 🔧 AUMENTADO A 15 segundos para APIs
    let isTimedOut = false;

    timeoutRef.current = setTimeout(() => {
      isTimedOut = true;
      setOutputLines({
        1: {
          id: 'timeout-error',
          lineNumber: 1,
          content: '⏰ Ejecución cancelada automáticamente: Timeout de 15 segundos excedido (posible bucle infinito)',
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
      const consoleOutputs = []

      // 🔄 FUNCIÓN PARA ACTUALIZAR OUTPUTS EN TIEMPO REAL
      function updateOutputsInRealTime() {
        const currentOutputs = {};

        consoleOutputs.forEach((output, index) => {
          currentOutputs[index + 1] = {
            id: `console-${index}`,
            lineNumber: index + 1,
            content: output.content,
            type: output.type,
            timestamp: output.timestamp,
            lastUpdated: Date.now()
          };
        });

        setOutputLines(currentOutputs);
      }

      // 🎯 CONSOLE PERSONALIZADO MEJORADO QUE CAPTURA TODO
      const captureConsole = {
        log: (...args) => {
          if (isTimedOut) return;

          const output = {
            type: 'log',
            content: formatOutput(args),
            order: consoleOutputs.length,
            timestamp: new Date().toLocaleTimeString('es-ES', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })
          };

          consoleOutputs.push(output);

          // 🔥 ACTUALIZAR UI INMEDIATAMENTE
          updateOutputsInRealTime();
        },

        error: (...args) => {
          if (isTimedOut) return;

          const output = {
            type: 'error',
            content: formatOutput(args),
            order: consoleOutputs.length,
            timestamp: new Date().toLocaleTimeString('es-ES', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })
          };

          consoleOutputs.push(output);
          updateOutputsInRealTime();
        },

        warn: (...args) => {
          if (isTimedOut) return;

          const output = {
            type: 'warn',
            content: formatOutput(args),
            order: consoleOutputs.length,
            timestamp: new Date().toLocaleTimeString('es-ES', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })
          };

          consoleOutputs.push(output);
          updateOutputsInRealTime();
        },

        info: (...args) => {
          if (isTimedOut) return;

          const output = {
            type: 'info',
            content: formatOutput(args),
            order: consoleOutputs.length,
            timestamp: new Date().toLocaleTimeString('es-ES', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })
          };

          consoleOutputs.push(output);
          updateOutputsInRealTime();
        }
      }

      /**
      * 🔧 NUEVA VERSIÓN: Captura objetos RAW sin stringify
      * Para que el console expandible pueda trabajar con objetos reales
      */
      function formatOutput(args) {
        // 🎯 Si solo hay un argumento y es un objeto/array, devolverlo raw
        if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
          return args[0]; // Objeto crudo para el console expandible
        }

        // 🎯 Si hay múltiples argumentos con texto + objeto
        if (args.length === 2 && typeof args[0] === 'string' && typeof args[1] === 'object' && args[1] !== null) {
          return `${args[0]} ${JSON.stringify(args[1], null, 2)}`;
        }

        // 🎯 Para otros casos, mantener comportamiento original
        return args.map((arg, index) => {
          if (typeof arg === 'string') {
            return arg;
          }

          if (typeof arg !== 'object' || arg === null) {
            return String(arg);
          }

          // Para objetos, usar representación compacta en múltiples argumentos
          if (Array.isArray(arg)) {
            return `Array(${arg.length}) [...]`;
          } else {
            const keys = Object.keys(arg);
            return `Object{${keys.length} props}`;
          }
        }).join(' ');
      }


      // Preparar código para ejecución (sin comentarios y líneas vacías)
      const codeToExecute = lines
        .filter(line => {
          const trimmed = line.trim()
          return trimmed && !trimmed.startsWith('//')
        })
        .join('\n')

      // 🌐 EJECUTAR CÓDIGO CON CONTEXTO COMPLETO (FETCH, PROMISE, ETC.)
      // 🔧 VERSIÓN MEJORADA PARA ASYNC/AWAIT
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
            // 🔧 WRAPPER MEJORADO PARA CÓDIGO DEL USUARIO CON MANEJO DE ASYNC
            `
            return (async () => {
              try {
                ${codeToExecute}
                
                // 🕐 ESPERAR UN POCO MÁS para operaciones async pendientes
                await new Promise(resolve => setTimeout(resolve, 100));
                
              } catch (error) {
                console.error('Error en ejecución:', error.message);
                throw error;
              }
            })();
            `
          );

          // 🚀 EJECUTAR Y ESPERAR A QUE TERMINE COMPLETAMENTE
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

          // 🕐 ESPERAR UN POCO MÁS para asegurar que todos los console.log se capturen
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (executionError) {
          console.error('Error en ejecución:', executionError);

          if (!isTimedOut) {
            consoleOutputs.push({
              type: 'error',
              content: `Error: ${executionError.message}`,
              order: consoleOutputs.length,
              timestamp: new Date().toLocaleTimeString('es-ES', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })
            });
            updateOutputsInRealTime();
          }
        }
      }

      if (!isTimedOut) {
        // Limpiar timeout
        clearTimeout(timeoutRef.current);
        setIsRunning(false);
      }

    } catch (error) {
      // Limpiar timeout
      clearTimeout(timeoutRef.current);

      if (!isTimedOut) {
        setOutputLines({
          1: {
            id: 'line-1',
            lineNumber: 1,
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
        });
        setIsRunning(false);
      }
    }
  }, [])

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

  // Convertir outputLines a array ordenado
  const outputArray = Object.values(outputLines)
    .sort((a, b) => a.lineNumber - b.lineNumber)

  return {
    // Función principal
    runCode: executeCode,

    // Estado de outputs
    output: outputArray,
    isRunning,
    hasOutput: outputArray.length > 0,

    // Funciones de control
    clearOutput,
    resetContext,

    // Compatibilidad con versión anterior
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
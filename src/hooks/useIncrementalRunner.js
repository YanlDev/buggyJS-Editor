import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Hook para ejecución INCREMENTAL con líneas persistentes como RunJS
 * - Cada statement tiene su propia línea fija en el output
 * - El output se actualiza en lugar de agregar nuevas líneas
 */
export function useIncrementalRunner() {
  const [outputLines, setOutputLines] = useState({}) // Objeto con líneas por statement
  const [isRunning, setIsRunning] = useState(false)
  const [isAutoRunEnabled, setIsAutoRunEnabled] = useState(false)

  // Estado persistente
  const globalScopeRef = useRef({})
  const previousCodeRef = useRef('')
  const statementLinesRef = useRef({}) // Mapea statement hash -> line number

  /**
   * Genera timestamp simple
   */
  function getTimestamp() {
    const now = new Date()
    return now.toLocaleTimeString('es-ES', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  /**
   * Actualiza el output de una línea específica
   */
  const updateOutputLine = useCallback((lineNumber, content, type = 'log') => {
    setOutputLines(prev => ({
      ...prev,
      [lineNumber]: {
        id: `line-${lineNumber}`,
        lineNumber,
        content: String(content),
        type,
        timestamp: getTimestamp(),
        lastUpdated: Date.now()
      }
    }))
  }, [])

  /**
   * Limpia una línea específica
   */
  const clearOutputLine = useCallback((lineNumber) => {
    setOutputLines(prev => {
      const newLines = { ...prev }
      delete newLines[lineNumber]
      return newLines
    })
  }, [])

  /**
   * Limpia todo el output
   */
  const clearOutput = useCallback(() => {
    setOutputLines({})
  }, [])

  /**
   * Resetea el contexto de ejecución
   */
  const resetContext = useCallback(() => {
    globalScopeRef.current = {}
    statementLinesRef.current = {}
    previousCodeRef.current = ''
    clearOutput()
  }, [clearOutput])

  /**
   * Divide el código en statements con información de línea
   */
  function parseStatements(code) {
    const lines = code.split('\n')
    const statements = []
    let currentStatement = ''
    let statementStartLine = 0
    let braceLevel = 0
    let parenLevel = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Iniciar nuevo statement si no hay uno activo
      if (!currentStatement && line && !line.startsWith('//')) {
        currentStatement = lines[i]
        statementStartLine = i + 1
      } else if (currentStatement) {
        currentStatement += '\n' + lines[i]
      }

      if (!line || line.startsWith('//')) continue

      // Contar llaves y paréntesis
      for (const char of line) {
        if (char === '{') braceLevel++
        if (char === '}') braceLevel--
        if (char === '(') parenLevel++
        if (char === ')') parenLevel--
      }

      // Determinar si el statement está completo
      const isComplete = (
        braceLevel === 0 &&
        parenLevel === 0 &&
        currentStatement.trim() &&
        (line.endsWith(';') ||
          line.endsWith('}') ||
          line.includes('console.') ||
          /^(let|const|var|function|class|if|for|while|return)\s/.test(line.trim()) ||
          !line.includes('(') && !line.includes('{')) // Expresiones simples
      )

      if (isComplete) {
        const trimmed = currentStatement.trim()
        if (trimmed) {
          statements.push({
            code: trimmed,
            lineNumber: statementStartLine,
            endLine: i + 1,
            hash: generateHash(trimmed)
          })
        }
        currentStatement = ''
        statementStartLine = 0
      }
    }

    return statements
  }

  /**
   * Genera hash simple para detectar cambios
   */
  function generateHash(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(36)
  }

  /**
   * Detecta statements nuevos o cambiados y limpia los eliminados
   */
  function getChangedStatements(currentStatements) {
    const previousStatements = parseStatements(previousCodeRef.current)
    const prevHashMap = new Map(previousStatements.map(s => [s.hash, s]))
    const currentHashMap = new Map(currentStatements.map(s => [s.hash, s]))

    // Limpiar líneas de statements que ya no existen
    const currentHashes = new Set(currentStatements.map(s => s.hash))
    Object.keys(statementLinesRef.current).forEach(hash => {
      if (!currentHashes.has(hash)) {
        const lineNumber = statementLinesRef.current[hash]
        clearOutputLine(lineNumber)
        delete statementLinesRef.current[hash]
      }
    })

    // Retornar statements nuevos o cambiados
    return currentStatements.filter(statement => {
      return !prevHashMap.has(statement.hash)
    })
  }

  /**
   * Ejecuta un statement y actualiza su línea correspondiente
   */
  async function executeStatement(statement) {
    // Asignar número de línea al statement si no tiene uno
    if (!statementLinesRef.current[statement.hash]) {
      statementLinesRef.current[statement.hash] = statement.lineNumber
    }

    const outputLineNumber = statementLinesRef.current[statement.hash]

    try {
      // No ejecutar si es solo una declaración de variable sin output
      const isDeclarationOnly = /^(let|const|var)\s+\w+\s*=/.test(statement.code.trim()) &&
        !statement.code.includes('console.')

      if (isDeclarationOnly) {
        // Solo ejecutar para capturar la variable, pero no mostrar output
        const contextCode = `
          ${Object.keys(globalScopeRef.current).map(key =>
          `var ${key} = globalScope.${key};`
        ).join('\n')}
          
          ${statement.code}
          
          const newVars = {};
          for (const key in this) {
            if (typeof this[key] !== 'function' && key !== 'globalScope' && key !== 'newVars') {
              newVars[key] = this[key];
            }
          }
          return newVars;
        `

        const executor = new Function('globalScope', contextCode)
        const newVars = executor(globalScopeRef.current)
        Object.assign(globalScopeRef.current, newVars)

        // Limpiar la línea ya que no hay output visible
        clearOutputLine(outputLineNumber)
        return { success: true }
      }

      // Ejecutar statement con output
      const contextCode = `
        ${Object.keys(globalScopeRef.current).map(key =>
        `var ${key} = globalScope.${key};`
      ).join('\n')}
        
        const output = [];
        const console = {
          log: (...args) => output.push({type: 'log', content: args.map(formatArg).join(' ')}),
          error: (...args) => output.push({type: 'error', content: args.map(formatArg).join(' ')}),
          warn: (...args) => output.push({type: 'warn', content: args.map(formatArg).join(' ')}),
          info: (...args) => output.push({type: 'info', content: args.map(formatArg).join(' ')})
        };
        
        function formatArg(arg) {
          if (typeof arg === 'object' && arg !== null) {
            try { return JSON.stringify(arg, null, 2); }
            catch(e) { return String(arg); }
          }
          return String(arg);
        }
        
        ${statement.code}
        
        const newVars = {};
        for (const key in this) {
          if (typeof this[key] !== 'function' && key !== 'console' && key !== 'output' && key !== 'globalScope' && key !== 'formatArg' && key !== 'newVars') {
            newVars[key] = this[key];
          }
        }
        
        return { output, newVars };
      `

      const executor = new Function('globalScope', contextCode)
      const result = executor(globalScopeRef.current)

      // Actualizar variables globales
      Object.assign(globalScopeRef.current, result.newVars)

      // Actualizar output en la línea correspondiente
      if (result.output && result.output.length > 0) {
        // Si hay múltiples outputs, mostrar solo el último
        const lastOutput = result.output[result.output.length - 1]
        updateOutputLine(outputLineNumber, lastOutput.content, lastOutput.type)
      } else {
        // Si no hay output, limpiar la línea
        clearOutputLine(outputLineNumber)
      }

      return { success: true }

    } catch (error) {
      // Mostrar error en la línea correspondiente
      updateOutputLine(outputLineNumber, `Error: ${error.message}`, 'error')
      return { success: false, error: error.message }
    }
  }

  /**
   * Ejecuta código incrementalmente
   */
  const runIncremental = useCallback(async (code, isManual = false) => {
    if (!code.trim()) {
      clearOutput()
      return
    }

    setIsRunning(true)

    try {
      const statements = parseStatements(code)

      if (isManual) {
        // Ejecución manual: ejecutar todo desde cero
        resetContext()
        for (const statement of statements) {
          await executeStatement(statement)
        }
      } else {
        // Auto-run incremental: solo statements nuevos/cambiados
        const changedStatements = getChangedStatements(statements)

        for (const statement of changedStatements) {
          await executeStatement(statement)
        }
      }

      previousCodeRef.current = code

    } catch (error) {
      console.error('Execution error:', error)
    } finally {
      setIsRunning(false)
    }
  }, [updateOutputLine, clearOutputLine, clearOutput, resetContext])

  /**
   * Auto-run con debounce mínimo
   */
  const timeoutRef = useRef(null)
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const triggerAutoRun = useCallback((code) => {
    if (!isAutoRunEnabled) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Micro-debounce de 150ms
    timeoutRef.current = setTimeout(() => {
      runIncremental(code, false)
    }, 150)
  }, [isAutoRunEnabled, runIncremental])

  /**
   * Toggle auto-run
   */
  const toggleAutoRun = useCallback(() => {
    setIsAutoRunEnabled(prev => !prev)
  }, [])

  // Convertir outputLines a array ordenado para el componente Console
  const outputArray = Object.values(outputLines).sort((a, b) => a.lineNumber - b.lineNumber)

  return {
    // Estado
    output: outputArray,
    isRunning,
    isAutoRunEnabled,
    hasOutput: outputArray.length > 0,

    // Funciones principales
    runIncremental,
    triggerAutoRun,
    clearOutput,
    resetContext,
    toggleAutoRun,

    // Info del contexto
    globalScope: globalScopeRef.current
  }
}
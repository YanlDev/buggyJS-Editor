export class CodeExecutor {
  constructor() {
    // Array para almacenar todos los outputs
    this.outputs = []
    
    // Referencias originales para restaurar después
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    }
  }

  /**
   * Ejecuta código JavaScript y captura el output
   * @param {string} code - Código JavaScript a ejecutar
   * @returns {Array} Array de objetos con tipo, contenido y timestamp
   */
  execute(code) {
    // Limpiar outputs anteriores
    this.outputs = []
    
    try {
      // Interceptar console methods
      this.interceptConsole()
      
      // Crear función que ejecute el código en un scope aislado
      const executeFunction = new Function(`
        "use strict";
        ${code}
      `)
      
      // Ejecutar el código
      const result = executeFunction()
      
      // Si hay un return explícito, mostrarlo
      if (result !== undefined) {
        this.addOutput('log', `← ${this.formatValue(result)}`)
      }
      
    } catch (error) {
      // Capturar errores de sintaxis o runtime
      this.addOutput('error', `Error: ${error.message}`)
    } finally {
      // Restaurar console original
      this.restoreConsole()
    }
    
    return this.outputs
  }

  /**
   * Intercepta los métodos de console para capturar outputs
   */
  interceptConsole() {
    // Capturar console.log
    console.log = (...args) => {
      const message = args.map(arg => this.formatValue(arg)).join(' ')
      this.addOutput('log', message)
    }
    
    // Capturar console.error
    console.error = (...args) => {
      const message = args.map(arg => this.formatValue(arg)).join(' ')
      this.addOutput('error', message)
    }
    
    // Capturar console.warn
    console.warn = (...args) => {
      const message = args.map(arg => this.formatValue(arg)).join(' ')
      this.addOutput('warn', message)
    }
    
    // Capturar console.info (tratarlo como log)
    console.info = (...args) => {
      const message = args.map(arg => this.formatValue(arg)).join(' ')
      this.addOutput('log', message)
    }
  }

  /**
   * Restaura los métodos originales de console
   */
  restoreConsole() {
    console.log = this.originalConsole.log
    console.error = this.originalConsole.error
    console.warn = this.originalConsole.warn
    console.info = this.originalConsole.info
  }

  /**
   * Formatea valores para mostrar en console
   * @param {any} value - Valor a formatear
   * @returns {string} Valor formateado como string
   */
  formatValue(value) {
    // Manejar diferentes tipos de datos
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (typeof value === 'string') return `"${value}"`
    if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`
    if (Array.isArray(value)) return `[${value.map(v => this.formatValue(v)).join(', ')}]`
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2)
      } catch {
        return '[Object]'
      }
    }
    
    return String(value)
  }

  /**
   * Agrega un output al array con timestamp
   * @param {string} type - Tipo: 'log', 'error', 'warn'
   * @param {string} content - Contenido del mensaje
   */
  addOutput(type, content) {
    // Crear timestamp en formato HH:MM:SS
    const now = new Date()
    const timestamp = now.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
    
    // Agregar al array de outputs
    this.outputs.push({
      type,
      content,
      timestamp,
      id: Date.now() + Math.random() // ID único para React keys
    })
  }

  /**
   * Limpia todos los outputs
   */
  clear() {
    this.outputs = []
  }
}

// Crear instancia singleton para usar en toda la app
export const codeExecutor = new CodeExecutor()
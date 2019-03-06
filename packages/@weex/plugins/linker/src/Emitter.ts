import utils from './utils'
import * as DEBUG from 'debug'
const debug = DEBUG('emitter')

export default class Emitter {
  private eventHandler: any = {}

  on(event: any, namespace: string, handler: any) {
    if (arguments.length === 2) {
      handler = namespace
      namespace = ''
    }
    if (!this.eventHandler[event]) {
      this.eventHandler[event] = {}
    }

    const target = utils.locateEventHanlderByNamespace(this.eventHandler[event], namespace)

    if (target.__handlers__) {
      target.__handlers__.push(handler)
    } else {
      target.__handlers__ = [handler]
    }
  }

  off(event: string, namespace: string) {
    if (this.eventHandler[event]) {
      if (!namespace) {
        this.eventHandler[event] = {}
      } else {
        utils.clearEventHandlerByNamespace(this.eventHandler[event], namespace)
      }
    }
  }

  emit(event: string | number, namespace: string, data: any) {
    if (arguments.length === 2) {
      data = namespace
      namespace = ''
    }
    if (this.eventHandler[event]) {
      const context = {
        namespace,
        event,
        path: namespace,
      }
      return this._emit(this.eventHandler[event], namespace, context, data)
    } else {
      return false
    }
  }

  private _emit(prevTarget: any, namespace: string, context: any, data: any) {
    context.path = namespace
    const target = utils.getEventHanlderByNamespace(prevTarget, namespace)
    if (target && target.__handlers__) {
      target.__handlers__.forEach(h => h.call(context, data))
    } else {
      if (namespace) {
        const ns = namespace.substr(0, namespace.lastIndexOf('.'))
        return this._emit(prevTarget, ns, context, data)
      } else {
        return false
      }
    }
  }

  broadcast(event: any, namespace: string, data: any) {
    debug(`broadcast ${event}, ${namespace}, ${data}`)
    if (arguments.length === 2) {
      data = namespace
      namespace = ''
    }
    if (this.eventHandler[event]) {
      const target = utils.getEventHanlderByNamespace(this.eventHandler[event], namespace)
      if (target) {
        const context = { event, namespace, path: namespace }
        this._broadcast(target, context, data)
        return true
      } else {
        return false
      }
    } else {
      return false
    }
  }

  private _broadcast(target: any, context: any, data: any) {
    target.__handlers__ && target.__handlers__.forEach(h => h.call(context, data))
    const keys = Object.keys(target).filter(k => k !== '__handlers__')
    keys.forEach(k => {
      const ctx = {
        event: context.event,
        namespace: context.namespace,
        path: context.namespace + '.' + k,
      }
      this._broadcast(target[k], ctx, data)
    })
  }
}

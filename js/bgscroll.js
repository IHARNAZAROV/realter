'use strict'

/**
 * BGScroll — плавная прокрутка background-position у элементов
 * Улучшения:
 * - requestAnimationFrame вместо setInterval
 * - без eval и глобального мусора
 * - start/stop/destroy
 * - авто-пауза если элемент не виден (IntersectionObserver)
 *
 * Использование:
 * BGScroll.init(".bg-moving", { scrollSpeed: 20, direction: "h", pauseWhenHidden: true });
 */

const BGScroll = (() => {
  const instances = new WeakMap()

  function normalizeDirection (dir) {
    if (dir === 'h' || dir === 'v' || dir === 'd') return dir
    return 'h'
  }

  function normalizeSpeed (ms) {
    const n = Number(ms)
    if (!Number.isFinite(n) || n <= 0) return 70
    return n
  }

  function normalizePauseWhenHidden (v) {
    return v !== false // по умолчанию true
  }

  function applyPosition (el, direction, current) {
    let axis = '0 0'

    if (direction === 'h') axis = `${current}px 0`
    if (direction === 'v') axis = `0 ${current}px`
    if (direction === 'd') axis = `${current}px ${current}px`

    el.style.backgroundPosition = axis
  }

  function getElements (target) {
    if (!target) return []

    if (typeof target === 'string') {
      return Array.from(document.querySelectorAll(target))
    }

    if (target instanceof Element) {
      return [target]
    }

    if (target instanceof NodeList || Array.isArray(target)) {
      return Array.from(target).filter(Boolean)
    }

    return []
  }

  function createInstance (el, options = {}) {
    const state = {
      el,
      direction: normalizeDirection(options.direction),
      scrollSpeed: normalizeSpeed(options.scrollSpeed),
      pauseWhenHidden: normalizePauseWhenHidden(options.pauseWhenHidden),

      current: 0,
      running: false,
      rafId: 0,
      lastStepTime: 0,

      observer: null,
      isVisible: true
    }

    function tick (time) {
      if (!state.running) return

      if (time - state.lastStepTime >= state.scrollSpeed) {
        state.current -= 1
        applyPosition(state.el, state.direction, state.current)
        state.lastStepTime = time
      }

      state.rafId = requestAnimationFrame(tick)
    }

    state.start = () => {
      if (state.running) return
      state.running = true
      state.lastStepTime = performance.now()
      state.rafId = requestAnimationFrame(tick)
    }

    state.stop = () => {
      state.running = false
      if (state.rafId) cancelAnimationFrame(state.rafId)
      state.rafId = 0
    }

    state.destroy = () => {
      state.stop()

      if (state.observer) {
        state.observer.disconnect()
        state.observer = null
      }

      instances.delete(state.el)
    }

    // Auto pause when hidden (IntersectionObserver)
    if (state.pauseWhenHidden && 'IntersectionObserver' in window) {
      state.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.target !== state.el) return

            const visible = entry.isIntersecting && entry.intersectionRatio > 0
            state.isVisible = visible

            if (visible) {
              state.start()
            } else {
              state.stop()
            }
          })
        },
        {
          root: null,
          threshold: 0.01
        }
      )

      state.observer.observe(state.el)
    }

    return state
  }

  return {
    init (target, options = {}) {
      const els = getElements(target)
      if (!els.length) return []

      const created = []

      els.forEach((el) => {
        // если уже есть инстанс — обновляем настройки
        if (instances.has(el)) {
          const inst = instances.get(el)

          inst.direction = normalizeDirection(options.direction || inst.direction)
          inst.scrollSpeed = normalizeSpeed(options.scrollSpeed || inst.scrollSpeed)
          inst.pauseWhenHidden = normalizePauseWhenHidden(
            options.pauseWhenHidden !== undefined ? options.pauseWhenHidden : inst.pauseWhenHidden
          )

          // если наблюдателя нет, но нужен — создадим заново через destroy/init
          // чтобы не усложнять логику, проще пересоздать
          inst.destroy()
          const newInst = createInstance(el, options)
          instances.set(el, newInst)

          // если pauseWhenHidden выключен — стартуем сразу
          if (!newInst.pauseWhenHidden) newInst.start()

          created.push(newInst)
          return
        }

        const inst = createInstance(el, options)
        instances.set(el, inst)

        // если pauseWhenHidden выключен — стартуем сразу
        if (!inst.pauseWhenHidden) inst.start()

        created.push(inst)
      })

      return created
    },

    start (target) {
      getElements(target).forEach((el) => {
        const inst = instances.get(el)
        if (inst) inst.start()
      })
    },

    stop (target) {
      getElements(target).forEach((el) => {
        const inst = instances.get(el)
        if (inst) inst.stop()
      })
    },

    destroy (target) {
      getElements(target).forEach((el) => {
        const inst = instances.get(el)
        if (inst) inst.destroy()
      })
    }
  }
})()

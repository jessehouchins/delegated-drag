(function($){

  // SETUP ----------------------------------------

  var uidcount = 1
  var doc = $(document)
  var defaults = {
    scope: '_',
    tolerance: 5,
    overClass: 'dragDrop-over'
  }


  // GLOBAL EVENT MODULE -------------------------------

  function createDragDrop(e) {
    var base = $(e.currentTarget)
    base.data('dragDrop', new DragDrop(e, base.data('dragDrop-opts')))
  }


  // `$.fn.dragDrop` -- Initializes one-time event bindings on the document.

  $.fn.dragDrop = function(opts) {
    if (!opts || !opts.sortable && !opts.draggable && !opts.droppable) return

    var base = this
    var selectors = []
    var handle = opts.handle ? ' ' + opts.handle : ''

    if (opts.sortable) selectors.push(opts.sortable + handle)
    if (opts.draggable) selectors.push(opts.draggable + handle)

    base
      .data('dragDrop-opts', DragDrop.prototype.defaults({base: base, selector: selectors.join(', ')}, opts, defaults))
      .on('mousedown.dragDrop', createDragDrop)
  }

  $.fn.dragDrop.module = DragDrop


  // MODULE CONSTRUCTOR --------------------------------

  function DragDrop(e, opts) {
    this.opts = opts || {}
    this.el = $(e.target).closest(opts.selector)
    this.startX = e.pageX
    this.startY = e.pageY
    this.offsetX = e.offsetX
    this.offsetY = e.offsetY
    this.uid = this.newUid()

    // start watch event
    doc.on('mousemove.' + this.uid, this.defer('watch'))

    // stop events if drag never starts
    doc.on('mouseup.' + this.uid, function(){ doc.off('.' + this.uid) })
  }

  DragDrop.prototype = {

  // EVENT METHODS ---------------------------------------

    // Watches to see it the mouse is outside the tolerance area
    watch: function(e) {
      if (Math.abs(this.startX - e.pageX) > this.opts.tolerance || Math.abs(this.startY - e.pageY) > this.opts.tolerance) {
        // stop watch event
        doc.off('.' + this.uid)
        // start drag events
        this.doAction('drag:start', e)
      }
    },
    
    // `start` -- Enable move events and generates drag placeholder (if necessary).

    start: function(e) {
      // start move events
      this.started = true
      doc.on('mousemove.' + this.uid, this.defer('doAction', 'drag:move'))
      doc.on('mouseup.' + this.uid, this.defer('doAction', 'drag:end'))

      // do initial move
      this.move(e)
    },

    // `move` -- Checks to see it the mouse is over a droppable.

    move: function(e) {
      this.updateDroppable(e)
      this.updateDraggable(e)
    },

    // `end` -- Cleans up move events and runs drop callbacks if necessary.

    end: function(e) {
      doc.off('.' + this.uid) // clean up move events
      this.releaseDraggableEl()
      if (this.droppableEl) this.doAction('drag:drop', e)
    },

    drop: function() {
      $(this.droppableEl).removeClass(this.opts.overClass)
    },


  // FINDER METHODS ---------------------------------------

    // `draggableEl` -- Returns a reference to the draggable element or placeholder.

    draggableEl: function(e) {
      if (this._draggableEl) return this._draggableEl

      var opts = this.opts

      // either move the original element
      if (!opts.placeholder) {
        var el = this.el
        if (el.is(opts.handle)) {
          if (opts.draggable) el = el.closest(opts.draggable)
          if (opts.sortable) el = el.closest(opts.sortable)
        }
        var raw = el.get()[0]

        el.data('oldStyle', {
          top: raw.style.top,
          left: raw.style.left,
          zIndex: raw.style.zIndex
        })

        raw.style.zIndex = 9999

        return this._draggableEl = el
      }

      // or use a drag placeholder
      return this._draggableEl = $(this.result(opts, 'placeholder')).appendTo('body')
    },

    droppableEls: function() {
      if (!this._droppableEls) this._droppableEls = $(this.opts.droppable)
      return this._droppableEls
    },

    sortableEls: function() {
      if (!this.droppableEl) return $()
      if (!this._sortableEls) {
        this._sortableEls = $(this.droppableEl).find(this.opts.sortable)
      }
      return this._sortableEls
    },


  // HELPER METHODS ------------------------------

    // `updateDraggable` -- Updates the position and dom parent of the draggable element/placeholder.

    updateDraggable: function(e) {
      // check for sortables
      var nextSortable
      var sortableEl
      var sortableEls = this.sortableEls().get().slice(0)
      var draggableEl = this.draggableEl(e)

      // findt the draggable sort position
      while (!nextSortable && sortableEls.length) {
        sortableEl = sortableEls.shift()
        if (this.relativePosition(sortableEl, e).above) nextSortable = sortableEl
      }

      // move the draggable if necessary
      if (nextSortable) $(nextSortable).before(draggableEl)
      else if (sortableEl) $(sortableEl).after(draggableEl)
      else if (this.droppableEl) $(this.droppableEl).append(draggableEl)

      // update the draggable position
      draggableEl.offset({
        top: e.pageY - (this.opts.offsetY || this.offsetY),
        left: e.pageX - (this.opts.offsetX || this.offsetX)
      })
    },

    // `updateDroppable` -- Updates droppable class on psuedo mouseover/mouseout events.

    updateDroppable: function(e) {
      var wasOver = this.droppableEl
      var isOver
      var droppableEls = this.droppableEls().get().slice(0)

      while (!isOver && droppableEls.length) {
        var droppableEl = droppableEls.shift()
        if (this.relativePosition(droppableEl, e).over) isOver = droppableEl
      }

      this.droppableEl = isOver

      if (wasOver !== isOver) {
        delete this._sortableEls
        if (wasOver) $(wasOver).removeClass(this.opts.overClass)
        if (isOver) $(isOver).addClass(this.opts.overClass)
      }
    },

    releaseDraggableEl: function() {
      var el = this.draggableEl()

      if (this.opts.placeholder) return el.remove()

      var raw = el.get()[0]
      var oldStyle = el.data('oldStyle')
      raw.style.top = oldStyle.top
      raw.style.left = oldStyle.left
      raw.style.zIndex = oldStyle.zIndex
    },

    // `trigger` -- fires DOM events on the document (override if you want).

    trigger: function(type, clonedEvent) {
      doc.trigger(type, clonedEvent, this)
    },

    // `relativePosition` - Checks where the mouse is relative to the given element.

    relativePosition: function(el, e) {
      el = $(el)
      var offset = el.offset()
      var width = el.outerWidth()
      var height = el.outerHeight()

      return {
        over: e.pageX >= offset.left && e.pageX <= offset.left + width && e.pageY >= offset.top && e.pageY <= offset.top + height,
        above: e.pageY < offset.top + height/2
      }
    },

    // `doAction` - Fires methods/callbacks and scoped events for each action.

    doAction: function(type, e) {
      opts = this.opts
      var method = type.split(':')[1]
      if (opts.scope !== defaults.scope) type += ':' + opts.scope
      if (this[method]) this[method](e)
      var clonedEvent = new $.Event(type, this.pick(e, 'pageX', 'pageY', 'target', 'currentTarget', 'originalEvent'))
      this.trigger(type, clonedEvent)
    },


    // `defer` -- Creates a runnable callback for the given method name.

    defer: function(method) {
      var toArray = this.toArray
      var args = toArray(arguments, 1)
      var scope = this
      return function() {
        scope[method].apply(scope, args.concat(toArray(arguments)))
      }
    },

    // `toArray` -- converts arguments to a real array

    toArray: function(args, start, end) {
      return Array.prototype.slice.call(args, start, end)
    },

    // `result` -- return the result of a method or property.

    result: function(obj, prop) {
      if (!obj) return
      if (typeof obj[prop] === 'function') return obj[prop]()
      return obj[prop]
    },

    // `pick` -- retunrs a copy of an object with the specified properties only.

    pick: function() {
      var args = this.toArray(arguments)
      var obj = args.shift()
      var result = {}
      for (var i in obj) { result[i] = obj[i] }
      return result
    },

    // `defaults` -- meges two or more objects, only overriding properties that are not defined.

    defaults: function() {
      var objects = this.toArray(arguments)
      var result = objects.shift() || {}
      while (objects.length) {
        var object = objects.shift()
        for (var key in object) {
          if (object[key] && result[key] === undefined) {
            result[key] = object[key]
          }
        }
      }
      return result
    },

    // `uid` -- generates a unique id for each instance

    newUid: function() {
      return 'DragDrop' + uidcount++
    }

  }

})($)








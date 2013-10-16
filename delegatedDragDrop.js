(function($, _){

  // SETUP ----------------------------------------

  // `defaults` -- Combined with options on instance initialization.

  var defaults = {
    scope:      '_',
    tolerance:  5
  }

  // `$.fn.dragDrop` -- Initializes one-time event bindings on selected base element.

  $.fn.dragDrop = function(opts) {
    if (!opts || !opts.sortable && !opts.draggable && !opts.droppable) return

    opts = _.defaults({base: this}, opts, defaults)

    var selectors = []
    var handle = opts.handle ? ' ' + opts.handle : ''

    if (opts.sortable) selectors.push(opts.sortable + handle)
    if (opts.draggable) selectors.push(opts.draggable + handle)

    $(document).on('mousedown.DragDrop', selectors.join(', '), function(e) { new DragDrop(e, opts) })
  }


  // MODULE -------------------------------------------

  function DragDrop(e, opts) {
    this.opts = opts
    this.el = e.currentTarget
    this.startX = e.pageX
    this.startY = e.pageY
    this.offsetX = e.offsetX
    this.offsetY = e.offsetY

    var uid = this.uid = newUid()
    var doc = this.doc = $(document)

    // start watch event
    doc.on('mousemove.' + uid, _.bind(this.watch, this))

    // stop events if drag never starts
    doc.on('mouseup.' + this.uid, function(){ doc.off('.' + uid) })
  }

  DragDrop.prototype = {

    // Watches to see it the mouse is outside the tolerance area
    watch: function(e) {
      if (Math.abs(this.startX - e.pageX) > this.opts.tolerance || Math.abs(this.startY - e.pageY) > this.opts.tolerance) {
        // stop watch event
        this.doc.off('.' + this.uid)
        // start drag events
        doAction.call(this, 'drag:start', e)
      }
    },
    
    // `start` -- Enable move events and generates drag placeholder (if necessary).

    start: function(e) {
      // start move events
      this.started = true
      this.doc.on('mousemove.' + this.uid, _.bind(doAction, this, 'drag:move'))
      this.doc.on('mouseup.' + this.uid, _.bind(doAction, this, 'drag:end'))

      // do initial move
      this.move(e)
    },

    // `move` -- Checks to see it the mouse is over a droppable.

    move: function(e) {
      this.position(e)
      this.updateDroppable(e)
    },

    // `over` -- Handles sort display if sortable is active.
    
    over: function(e) {

    },

    // `out` -- Handles sort display if sortable is active. 

    out: function(e) {

    },

    // `end` -- Cleans up move events and runs drop callbacks if necessary.

    end: function(e) {
      // clean up move events
      this.doc.off('.' + this.uid)
      this.releaseDraggableEl()
      //
      doAction.call(this, 'drag:drop', e)
    },

    // `position` -- Updates the position of the draggable element/placeholder.

    position: function(e) {
      this.draggableEl(e).offset({
        top: e.pageY - (this.opts.offsetY || this.offsetY),
        left: e.pageX - (this.opts.offsetX || this.offsetX)
      })
    },

    // `draggableEl` -- Returns a reference to the draggable element or placeholder.

    draggableEl: function(e) {
      if (!this._draggableEl) this.findDraggableEl()
      return this._draggableEl
    },

    findDraggableEl: function() {
      var opts = this.opts
      if (opts.placeholder) {
        this._draggableEl = $(_.result(opts, 'placeholder')).append('body')
      }
      else {
        var el = $(this.el)
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

        this._draggableEl = el
      }
    },

    releaseDraggableEl: function() {
      var el = this.draggableEl()
      if (this.opts.placeholder) {
        el.remove()
      }
      else {
        var raw = el.get()[0]
        var oldStyle = el.data('oldStyle')
        raw.style.top = oldStyle.top
        raw.style.left = oldStyle.left
        raw.style.zIndex = oldStyle.zIndex
      }
    },

    updateDroppable: function(e) {
      var wasOver = this.droppable
      var isOver
      var droppables = this.droppableEls().get().slice(0)

      while (!isOver && droppables.length) {
        var droppable = droppables.shift()
        if (checkOver(droppable, e)) isOver = droppable
      }

      this.droppable = isOver

      if (wasOver !== isOver) {
        if (wasOver) wasOver.style.borderStyle = 'solid'
        if (isOver) isOver.style.borderStyle = 'dashed'
      }
    },

    droppableEls: function() {
      if (!this._droppableEls) this._droppableEls = $(this.opts.droppable)
      return this._droppableEls
    },

    // `trigger` -- fires DOM events on the document (override if you want).

    trigger: function(type, clonedEvent) {
      this.doc.trigger(type, clonedEvent, this)
    }

  }

  // HELPERS --------------------------------------

  // `checkOver` - Checks if the mouse is over the given element

  function checkOver(el, e) {
    el = $(el)
    var offset = el.offset()
    offset.right = offset.left + el.outerWidth()
    offset.bottom = offset.top + el.outerHeight()
    return e.pageX >= offset.left && e.pageX <= offset.right && e.pageY >= offset.top && e.pageY <= offset.bottom
  }

  // `doAction` - Fires methods/callbacks and scoped events for each action.

  function doAction(type, e) {
    opts = this.opts
    var method = type.split(':')[1]
    if (opts.scope) type += ':' + opts.scope
    if (this[method]) this[method](e)
    var clonedEvent = new $.Event(type, _.pick(e, 'pageX', 'pageY', 'target', 'currentTarget', 'originalEvent'))
    this.trigger(type, clonedEvent)
  }

  // `uid` -- generates a unique id for each instance

  var uidcount = 1
  function newUid() {
    return 'DragDrop' + uidcount++
  }

})($, _)








(function($, _){

  // SETUP ----------------------------------------

  // `defaults` -- Combined with options on instance initialization.

  var defaults = {
    scope: '_',
    tolerance: 5,
    overClass: 'ddd-over'
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
      this.updateDroppable(e)
      this.updateDraggable(e)
    },

    // `end` -- Cleans up move events and runs drop callbacks if necessary.

    end: function(e) {
      this.doc.off('.' + this.uid) // clean up move events
      this.releaseDraggableEl()
      if (this.droppableEl) doAction.call(this, 'drag:drop', e)
    },

    drop: function() {
      $(this.droppableEl).removeClass(this.opts.overClass)
    },

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
        if (relativePosition(sortableEl, e).above) nextSortable = sortableEl
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
        if (relativePosition(droppableEl, e).over) isOver = droppableEl
      }

      this.droppableEl = isOver

      if (wasOver !== isOver) {
        delete this._sortableEls
        if (wasOver) $(wasOver).removeClass(this.opts.overClass)
        if (isOver) $(isOver).addClass(this.opts.overClass)
      }
    },

    // `draggableEl` -- Returns a reference to the draggable element or placeholder.

    draggableEl: function(e) {
      if (this._draggableEl) return this._draggableEl

      var opts = this.opts

      // either move the original element
      if (!opts.placeholder) {
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

        return this._draggableEl = el
      }

      // or use a drag placeholder
      return this._draggableEl = $(_.result(opts, 'placeholder')).append('body')
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

    droppableEls: function() {
      if (!this._droppableEls) this._droppableEls = $(this.opts.droppable)
      return this._droppableEls
    },

    sortableEls: function() {
      if (!this.droppableEl) return $()
      if (!this._sortableEls) {
        this._sortableEls = $(this.droppableEl).find(this.opts.sortable)
        console.log("sortable", this._sortableEls.text())
      }
      return this._sortableEls
    },

    // `trigger` -- fires DOM events on the document (override if you want).

    trigger: function(type, clonedEvent) {
      this.doc.trigger(type, clonedEvent, this)
    }

  }

  // HELPERS --------------------------------------

  // `checkOver` - Checks if the mouse is over the given element

  function relativePosition(el, e) {
    el = $(el)
    var offset = el.offset()
    var width = el.outerWidth()
    var height = el.outerHeight()

    return {
      over: e.pageX >= offset.left && e.pageX <= offset.left + width && e.pageY >= offset.top && e.pageY <= offset.top + height,
      above: e.pageY < offset.top + height/2
    }
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








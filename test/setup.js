(function(root){

  var con = $.fn.dragDrop.module
  var proto = con.prototype

  root.DragDrop = {
    proto: proto,
    mockInstance: function(e, opts) {
      var mock = {}

      // generate spy methods
      for (var i in proto) {
        if (typeof proto[i] === 'function') {
          mock[i] = sinon.spy()
        }
      }

      // call constructor with mock scope
      con.call(mock, e || {}, opts)
      return mock
    }
  }

})(this)
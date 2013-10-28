
module('Initialization')

  test("jQuery module exists", 1, function() {
    ok(typeof $.fn.dragDrop === 'function')
  })

module('Setup')

  test("$.fn.dragDrop exists", 1, function() {
    ok(typeof $.fn.dragDrop === 'function')
  })

  test("Constructor", 1, function() {
    ok(true)
  })

  test("binds to default scope", 1, function() {
    ok(true)
  })
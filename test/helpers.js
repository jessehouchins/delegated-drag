var instance

module('Helpers')

  test("#doAction", 2, function() {
    instance = DragDrop.mockInstance()
    console.log('instance', instance.trigger.calledOnce)
    DragDrop.proto.doAction.call(instance, 'drag:start')
    ok(instance.start.calledOnce, "Runs named method")
    ok(instance.trigger.calledWith('drag:start'), "Triggers scoped event")
  })

  test("#defer", 1, function() {
    ok(true, "Test3 Passed")
  })

  test("#relativePosition", 1, function() {
    ok(true)
  })
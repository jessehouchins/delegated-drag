delegated-drag
==============

# Notice:
This is NOT under active development. The many of the features below are not be implemented yet.

# Intro

I've found that most drag, drop and sort libraries initilize on specific DOM elements. This makes it difficult to add/remove elements from the interaction chain without reinitializing the plugins events. DelegatedDrag is designed to initialize once and handle events for any elements that fall within the config parameters, regardless of when they get added to the DOM.

# Setup

```javascript
delegated({
  draggable:    '#foo .draggable',
  sortable:     '#foo .sortable',
  droppable:    '#foo .droppable',
  handle:       '.dragHandle',
  payload:      fn,
  scope:        'foo',
  base:         '.container',
  placeholder:  null,
  tolerance:    5
})
```

# Config Options

- __draggable__   - a selector to match elements that can be draged.
- __sortable__    - a selector to match elements that can be sorted.
- __droppable__   - a selector to match elements that can accept draggable and sortable elements.
- __handle__      - the element (within the draggable/sortable) that must be clicked to start dragging.
- __payload__     - a function to generate the payload data (sent with drag events).
- __scope__       - a key to goup draggable, sortable and droppable elements (defaults to `_`).
- __base__        - a selector to limit event scope (defaults to body).
- __tolerance__   - the number of pixels the mouse must move in order to start a drag event (defaults to 5)

# SwipePane

  Swipe component with touch support, for image or any other content. Based on code from [component/swipe](https://github.com/component/swipe). Try it out the [demo](http://github.com/urban/swipe-pane/) in your browser or on your device.

## Installation

    $ component install urban/swipe-pane

## Events

- `start` (x, y): when a swipe begins
- `swipe` (x, y): when a swipe is happening
- `swipe` (x, y): when a swipe ends

## API

### SwipePane(el)

  Create a swipable object for `el`. This should be a container element with 
  overflow that wraps another element. View ./example.html for a working example.

### .duration(ms)

  Set the transition end duration, defaults to 300ms.


// This code initializes the freestar object and creates several objects within it.
var freestar = freestar || {};

// freestar.queue: Holds code that the Freestar engine will execute
freestar.queue = freestar.queue || [];

// freestar.config: Stores all configuration options
freestar.config = freestar.config || {};

// freestar.config.enabled_slots: Stores each ad placement
freestar.config.enabled_slots = [];

// freestar.initCallback: Calls newAdSlots and fetches ads from enabled_slots
freestar.initCallback = function () {
  (freestar.config.enabled_slots.length === 0)
    ? freestar.initCallbackCalled = false
    : freestar.newAdSlots(freestar.config.enabled_slots)
}

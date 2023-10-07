# GridLayout VUE Events

## container-resized

## drag-start
Fired when a GridItems is being dragged.

## drag-end
Fired when a GridItem is finished dragging (GridItem is dropped into the GridLayout)

## item-move

## item-moved

## item-resize

## item-resized


## layout-before-mount
Layout beforeMount event

Emitted on the component beforeMount lifecycle hook

```typescript
layoutBeforeMountEvent: function(newLayout: Layout): void {
  console.log("beforeMount layout: ", newLayout);
}
```

## layout-created
Layout created event

Emitted on the component created lifecycle hook

```typescript
layoutCreatedEvent: function(newLayout: Layout): void {
  console.log("Created layout: ", newLayout);
}
```

## layout-mounted
Layout mounted event

Emitted on the component mounted lifecycle hook

```typescript
layoutMountedEvent: function(newLayout: Layout): void {
  console.log("Mounted layout: ", newLayout);
}
```


## layout-ready
Layout ready event

Emitted when all the operations on the mount hook finish

```typescript
layoutReadyEvent: function(newLayout: Layout): void {
  console.log("Ready layout: ", newLayout);
}
```


## recalculate-styles 
Emitted into the event bus, maybe get this and others into separate enum.


## layout-update
Emitted every time the GridLayout is being updated.
This will fire everytime the GridLayout is updated, the GridItems are dropped or resized in the GridLayout. 

```typescript
layoutUpdatedEvent: function(newLayout: Layout): void {
  console.log("Updated layout: ", newLayout);
}
```

## layout-updated
Emitted when a GridItem is dropped or finished resizing and the GridLayout is updated.

# GridItem VUE  Events

See https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/src/core/griditem/enums/EGridItemEvents.ts for a list of defined emit events.
And See https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/src/components/Grid/GridItem.vue#L108-L117 for updated event definitions

## container-resized
Container Resized event

Every time the grid item/layout container changes size (browser window or other)

```typescript
containerResizedEvent: function(i, newH, newW, newHPx, newWPx): void {
    console.log("CONTAINER RESIZED i=" + i + ", H=" + newH + ", W=" + newW + ", H(px)=" + newHPx + ", W(px)=" + newWPx);
}
``` 


## drag

Every time an item is being dragged

```typescript
dragEvent: function(i, h, w, height, width): void {
    console.log("DRAG i=" + i + ", h=" + h + ", w=" + w + ", height=" + height + ", width=" + width);
}
```

## dragged

Every time an item is finished being dragged

```typescript
dragEvent: function(i, h, w, height, width): void {
    console.log("DRAGGED i=" + i + ", h=" + h + ", w=" + w + ", height=" + height + ", width=" + width);
}
```

## item-move
Move event

Every time an item is being moved and changes position

```typescript
moveEvent: function(i, newX, newY): void {
    console.log("MOVE i=" + i + ", X=" + newX + ", Y=" + newY);
}
```

## item-moved
Moved event

Every time an item is finished being moved and changes position

```typescript
movedEvent: function(i, newX, newY): void {
    console.log("MOVED i=" + i + ", X=" + newX + ", Y=" + newY);
}
```


## remove-grid-item
Emitted when the user clicks the close button in a `GridItem`.

```typescript
const closeClicked = (id: number): void => {
  emit(`remove-grid-item`, id);
};
```


## resize
Resize event

Every time an item is being resized and changes size

```typescript
resizeEvent: function(i, newH, newW, newHPx, newWPx): void {
    console.log("RESIZE i=" + i + ", H=" + newH + ", W=" + newW + ", H(px)=" + newHPx + ", W(px)=" + newWPx);
}
``` 


## resized

Every time an item is finished being resized and changes size

```typescript
resizeEvent: function(i, newH, newW, newHPx, newWPx): void {
    console.log("RESIZED i=" + i + ", H=" + newH + ", W=" + newW + ", H(px)=" + newHPx + ", W(px)=" + newWPx);
}
``` 


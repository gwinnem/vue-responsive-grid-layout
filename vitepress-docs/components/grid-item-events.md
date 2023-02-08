# GridItem Events

## container-resized
Container Resized event

Every time the grid item/layout container changes size (browser window or other)

```typescript
containerResizedEvent: function(i, newH, newW, newHPx, newWPx): void {
    console.log("CONTAINER RESIZED i=" + i + ", H=" + newH + ", W=" + newW + ", H(px)=" + newHPx + ", W(px)=" + newWPx);
}
``` 


## drag-event

## move
Move event

Every time an item is being moved and changes position

```typescript
moveEvent: function(i, newX, newY): void {
    console.log("MOVE i=" + i + ", X=" + newX + ", Y=" + newY);
}
```

## moved
Moved event

Every time an item is finished being moved and changes position

```typescript
movedEvent: function(i, newX, newY): void {
    console.log("MOVED i=" + i + ", X=" + newX + ", Y=" + newY);
}
```


## remove-grid-item
Fired when a GridItem's close button is clicked.


## resize
Resize event

Every time an item is being resized and changes size

```typescript
resizeEvent: function(i, newH, newW, newHPx, newWPx): void {
    console.log("RESIZE i=" + i + ", H=" + newH + ", W=" + newW + ", H(px)=" + newHPx + ", W(px)=" + newWPx);
}
``` 


## remove-grid-item
Emitted when the user clicks the close button in a `GridItem`.

```typescript
const closeClicked = (id: number): void => {
  emit(`remove-grid-item`, id);
};
```


## resized

## resize-event(??)

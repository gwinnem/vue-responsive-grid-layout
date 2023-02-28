# GridItem styles

```scss
@import '../../styles/variables';

$grid-item-border-radius: 10px;

.vue-close-button {
  height: 24px;
  position: absolute;
  right: 3px;
  top: 3px;
  width: 24px;
  z-index: 20;
}

.vue-close-button:hover {
  cursor: pointer;
  filter: brightness(0) invert(1);
  opacity: .8;
}

.vue-grid-item {
  background-color: $grid-item-bg-color;
  box-sizing: border-box;
  color: $grid-item-text-color;
  cursor: default !important;
  font-size: $grid-item-font-size;
  touch-action: none;
  transition: all 200ms ease;
  transition-property: left, top, right;

&.vue-static {
   background-color: $grid-item-static-bg-color;
 }

&.no-touch {
   touch-action: none;
 }

&.vue-use-radius {
   border-radius: $grid-item-border-radius;
 }

&.css-transforms {
   left: 0;
   right: auto;
   transition-property: transform;
 }

&.resizing {
   opacity: .6;
   z-index: 3;
 }

&.vue-draggable {
   cursor: grab !important;
 }

&.vue-draggable-dragging {
   cursor: grabbing !important;
   transition: none;
   z-index: 3;
 }

&.vue-grid-placeholder {
   background: $grid-item-placeholder-bg-color;
   opacity: $grid-item-placeholder-opacity;
   transition-duration: 100ms;
   user-select: none;
   z-index: 2;
 }

& > .vue-resizable-handle {
    background-image: url('../../assets/resize.svg');
    background-origin: content-box;
    background-position: bottom right;
    background-repeat: no-repeat;
    bottom: 1px;
    box-sizing: border-box;
    cursor: se-resize;
    height: 20px;
    padding: 0 3px 3px 0;
    position: absolute;
    right: 1px;
    width: 20px;
    z-index: 20;
  }

&.disable-user-select {
   user-select: none;
 }
}
```

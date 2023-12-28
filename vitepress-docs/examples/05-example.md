# Drag allow/ignore elements
Ignore drag on certain elements and allow on others.

Click and drag the black dot on the corner of each GridItem to be able to drag it.
<br/>

The GridItem has the following properties set in order to get this functionality.
```html
drag-allow-from=".vue-draggable-handle"
drag-ignore-from=".no-drag"
```

Style for the black circle drag handler and overriding the cursor property, so the grab and grabbing cursor is not shown.
```scss
.vue-draggable-handle {
  position: absolute;
  width: 20px;
  height: 20px;
  top: -5px;
  left: 5px;
  background-origin: content-box;
  background-color: black;
  box-sizing: border-box;
  border-radius: 10px;
  cursor: grab;
}

.vue-grid-item {
  &.vue-draggable {
    cursor: default !important;
  }

  &.vue-draggable-dragging {
    cursor: grabbing !important;
  }
}
```

<CustomComponent/>

<script setup>
import CustomComponent from './components/05-example.vue';
</script>

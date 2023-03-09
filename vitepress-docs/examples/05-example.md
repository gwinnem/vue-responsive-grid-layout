# Drag allow/ignore elements
Ignore drag on certain elements and allow on others.

Click and drag the black dot on the corner of each GridItem to be able to drag it.
<br/>

The GridItem has the following properties set in order to get this functionality.
```html
drag-allow-from=".vue-draggable-handle"
drag-ignore-from=".no-drag"
```


<CustomComponent/>

<script setup>
import CustomComponent from './components/05-example.vue';
</script>

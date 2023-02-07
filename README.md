# vue-responsive-grid-layout
VUE 3 responsive grid layout. More to come.
<br/>
This work is based on amd inspired by the original work with: [Vue Grid Layout](https://jbaysolutions.github.io/vue-grid-layout/guide/).
[FREE ICONS](https://icones.js.org/)
#### Original Features:
* Draggable widgets
* Resizable widgets
* Static widgets
* Bounds checking for dragging and resizing
* Widgets may be added or removed without rebuilding grid
* Layout can be serialized and restored
* Automatic RTL support
* Responsive
* GridItem automatically resizes when content change(Useful when displaying charts).

#### New Features:
* GridLayout now has slot for GridItem.
* Prop for displaying grid lines in GridLayout.
* Prop for setting edit mode in GridLayout. Shortcuts the isDraggable and isResizable props.
* Prop for adding border radius in GridLayout. Adds a 8px radius to each GridItem.
* Prop in GridLayout for shifting GridItems horizontally when dragging instead of vertical.
* Separated out style variables, so it is easier to restyle the component.
* Added tab navigation support.
* Close button in GridItem for removing the GridItem from the GridLayout.
* Added more events to GridLayout and GridItem.

#### Major refactorings
* Converted code base to typescript.
* Enforced proper coding style and type safety for typescript.
* Using proper linting rules for vue, typescript and styles.
* Component using script setup style syntax.
* Props and emits are typesafe.

## Donate
<a href="https://paypal.me/gwinnem/">
    <img src="./docs/paypal-images/blue.svg" height="40" alt="paypal">
</a>

If you enjoyed this project — or just feeling generous, consider buying me a beer. Cheers! :beers:


## Setting up vue-responsive-grid-layout in your project
[Howto](./docs/setup.md)

<br/>

#### Auditing the package
```
 npm audit --registry=https://registry.npmjs.org/
```

<br/>

### Testing the npm package before publishing
[Howto](./docs/testing-package.md)


### Publishing the library
[Howto](./docs/build.md)


### References
* [Vue Grid Layout](https://jbaysolutions.github.io/vue-grid-layout/guide/)
* [Mini.css used in the sandbox](https://minicss.us/docs.htm#)

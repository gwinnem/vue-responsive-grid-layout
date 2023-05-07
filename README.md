<p align="center">
  <img src="https://raw.githubusercontent.com/gwinnem/vue-responsive-grid-layout/main/docs/Data%20Grid.svg" height="200" alt="logo">
</p>

<h1 align="center">vue-ts-responsive-grid-layout</h1>

<h2 align="center">
<a href="https://vue-ts-responsive-grid-layout.winnem.tech" target="_blank">Documentation Website</a>
</h2>

## What is vue-ts-responsive-grid-layout
VUE 3 responsive grid layout is based on the original work by [JBaysolution's vue-grid-layout](https://github.com/jbaysolutions/vue-grid-layout).

<br/>

This new and refactored component has more features, typesafe Emits, Props and a strict linting rule setup.


<br/>

# Changelog

## v: 1.2.1 (2023-05-07)
* --Fixed Issue-- [Issue 7](https://github.com/gwinnem/vue-responsive-grid-layout/issues/7), thanks t0 [UTing1119](https://github.com/UTing1119)
* --Fixed Issue-- [Issue 6](https://github.com/gwinnem/vue-responsive-grid-layout/issues/6), thanks t0 [UTing1119](https://github.com/UTing1119)

<br/>

### New Features:
* Prop in GridLayout for distributing GridItem's equally.
* GridLayout now has slot for GridItem.
* Prop for displaying grid lines in GridLayout.
* Prop for setting edit mode in GridLayout. Shortcuts the isDraggable and isResizable props.
* Prop for adding border radius in GridLayout. Adds a 8px radius to each GridItem.
* Prop in GridLayout for shifting GridItems horizontally when dragging instead of vertical.
* Separated out style variables, so it is easier to restyle the component.
* Added tab navigation support.
* Close button in GridItem for removing the GridItem from the GridLayout.
* Added more events to GridLayout and GridItem.


### Original Features:
* Draggable widgets
* Resizable widgets
* Static widgets
* Bounds checking for dragging and resizing
* Widgets may be added or removed without rebuilding grid
* Layout can be serialized and restored
* Automatic RTL support
* Responsive using predefined layout's for different breakpoints.
* GridItem automatically resizes when content change(Useful when displaying charts).


### Major refactorings
* Converted code base to typescript.
* Enforced proper coding style and type safety for typescript.
* Using proper linting rules for vue, typescript and styles.
* Component using script setup style syntax.
* Props and emits are typesafe.

## Donate
<a href="https://paypal.me/gwinnem/">
    <img src="https://raw.githubusercontent.com/gwinnem/vue-responsive-grid-layout/dev/docs/paypal-images/blue.svg" height="40" alt="paypal">
</a>

If you enjoyed this project — or just feeling generous, consider buying me a beer. Cheers! :beers:


## Setting up vue-ts-responsive-grid-layout in your project
[Howto](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/docs/setup.md)

<br/>

#### Auditing the package
```
 npm audit --registry=https://registry.npmjs.org/
```

<br/>


### References
* [Vue Grid Layout](https://jbaysolutions.github.io/vue-grid-layout/guide/)
* [Mini.css used in the sandbox](https://minicss.us/docs.htm#)

<div style="text-align: center">

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat)](https://github.com/prettier/prettier)
[![npm bundle size](https://img.shields.io/bundlephobia/min/vue-ts-responsive-grid-layout)](https://bundlephobia.com/result?p=vue-ts-responsive-grid-layout)
[![npm](https://img.shields.io/npm/v/vue-ts-responsive-grid-layout)](https://www.npmjs.com/package/vue-ts-responsive-grid-layout)
[![NPM](https://img.shields.io/npm/l/vue-ts-responsive-grid-layout)](https://github.com/gwinnem/vue-ts-responsive-grid-layout/blob/master/LICENSE)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

</div>

<p align="center">
  <img src="https://raw.githubusercontent.com/gwinnem/vue-responsive-grid-layout/main/docs/Data%20Grid.svg" height="200" alt="logo">
</p>

<h1 align="center">vue-ts-responsive-grid-layout</h1>

<h2 align="center">
  <a href="https://vue-ts-responsive-grid-layout.winnem.tech" target="_blank">Documentation Website</a>
</h2>

## What is vue-ts-responsive-grid-layout

VUE 3 responsive grid layout is based on the original work by [JBaysolution's vue-grid-layout](https://github.com/jbaysolutions/vue-grid-layout).

This new and refactored component has more features, typesafe Emits, Props and a strict linting rule setup.

A proper App developed for testing purposes.

Documentation website contains 13 examples. Will be updated when new features are added to the component.

<br/>

## Donate

If you enjoyed this project — or just feeling generous, consider buying me a 🍺. Cheers!

<br/>

<a href="https://paypal.me/gwinnem/">
    <img src="https://raw.githubusercontent.com/gwinnem/vue-responsive-grid-layout/dev/docs/paypal-images/blue.svg" height="40" alt="paypal">
</a>

<br/>

### Features:

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
* Support for resize Bottom, Bottom Right and Right in GridIem.
* Draggable widgets
* Resizable widgets
* Static widgets
* Bounds checking for dragging and resizing
* Widgets may be added or removed without rebuilding grid
* Layout can be serialized and restored
* Automatic RTL support
* Responsive using predefined layout's for different breakpoints.
* GridItem automatically resizes when content change(Useful when displaying charts).

### Testing:

* __Unit tests__ [Using Vitest](https://vitest.dev/)
* __Unit test console__ [Using Vitest UI](https://vitest.dev/guide/ui.html#vitest-ui)
* __e2e tests__ [Using nightwatchjs](https://nightwatchjs.org/)

## Changelog

### v: 1.2.5 (2023-12-14)
* __Fixed Issue__ [editMode not working as expected](https://github.com/gwinnem/vue-responsive-grid-layout/issues/33)
* __Documentation__ Updated config so when refreshing a page it loads the correct page and not the 404 page.
* __Demo App__ Added inputs for Margins.
* __Refactor__ Updated style for gridlines in GridLayout.vue.
* __Config__ Added style linting to project.
* __Config__ Updated scripts section in package.json.
* __Demo App__ Fixed index value when dropping a new GridItem onto the layout. This only works when index is a numeric value.
* __Demo App__ Added checks so number input can not have less than 1.
* __Tests__ Added more unit tests and refactored code so it is easier to test.
 


### v: 1.2.4 (2023-10-23)

* __Fixed Issue__ [Layout update event is raised before update is finished](https://github.com/gwinnem/vue-responsive-grid-layout/issues/19). Tnxs to [SamGeems](https://github.com/SamGeens)
* __Fixed issue__ [Close button css is different from the example](https://github.com/gwinnem/vue-responsive-grid-layout/issues/20). Tnxs to [SamGeems](https://github.com/SamGeens)
* __Feature__ Added event __drag-end__ to GridLayout.
* __Feature__ Added event __drag-move__ to GridLayout.
* __Feature__ Added event __drag-start__ to GridLayout.
* __Codebase__ Renamed EGridLayoutEvent value UPDATE_LAYOUT to LAYOUT_UPDATE.
* __Codebase__ Removed file EDragEvents and updated GridLayout. Values are implemented in EGridLayoutEvent.
* __Codebase__ Added documentation to file DOM.ts
* __Codebase__ Added new enum for drag events and refactored GridLayout to use new enum.
* __Refactor__ Removed obsolete enum EMovingDirections.
* __Demo App__ Added button for clearing the event log.
* __Demo App__ Added Dropdown for filtering on events.

### v: 1.2.2 (2023-09-19)

* __Fixed Issue__ [Drag and Drop from outside is not working when distributeEvenly prop is set](https://github.com/gwinnem/vue-responsive-grid-layout/issues/5)
* __Partial Fix__ [Resizemove edges case handling is incomplete](https://github.com/gwinnem/vue-responsive-grid-layout/issues/13)
  * __Right, Right Bottom and Bottom__ resize fixed.
  * __Left, Top Left, Top and Top Right__ resize not fixed.
* __Codebase__ Adding description to functions.
* __Codebase__ Added contributors to package.json.
* __Codebase__ Added badges to README file.
* __Codebase__ Fixed outdated dependencies.

Thanks to [UTing1119](https://github.com/UTing1119) for his contribution to this release.

### v: 1.2.1 (2023-05-07)

* --Fixed Issue-- [Issue 7](https://github.com/gwinnem/vue-responsive-grid-layout/issues/7), thanks to [UTing1119](https://github.com/UTing1119)
* --Fixed Issue-- [Issue 6](https://github.com/gwinnem/vue-responsive-grid-layout/issues/6), thanks to [UTing1119](https://github.com/UTing1119)

## Setting up vue-ts-responsive-grid-layout in your project

[Howto](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/docs/setup.md)

<br/>

#### Auditing the package

```
 npm audit --registry=https://registry.npmjs.org/
```

<br/>

### References

* [Mini.css used in the sandbox](https://minicss.us/docs.htm#)
* [Vue-Multiselect used in the sandbox](https://vue-multiselect.js.org/#sub-getting-started)
* [Vitest](https://vitest.dev/)
* [Vitest UI](https://vitest.dev/guide/ui.html#vitest-ui)
* [nightwatchjs](https://nightwatchjs.org/)

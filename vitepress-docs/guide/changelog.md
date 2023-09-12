---
aside: false
page: true
title: Changelog
---

# Changelog

## v: 1.2.2 (2023.09.xx)
* __Fixed Issue__ [Drag and Drop from outside is not working when distributeEvenly prop is set](https://github.com/gwinnem/vue-responsive-grid-layout/issues/5). Tnxs to [UTing1119](https://github.com/UTing1119)
* __Partial Fix__ [Resizemove edges case handling is incomplete](https://github.com/gwinnem/vue-responsive-grid-layout/issues/13)
  * __Right, Right Bottom and Bottom__ resize fixed.
  * __Left, Top Left, Top and Top Right__ resize not fixed.
* __Codebase__ Adding description to functions.
* __Codebase__ Added contributors to package.json.
* __Codebase__ Added badges to README file.
* __Codebase__ Fixed outdated dependencies.

## v: 1.2.1 (2023.04.20)
* __Updated Issue__ [responsive grid item will not be distributed equally.](https://github.com/gwinnem/vue-responsive-grid-layout/issues/2)
* __Codebase__ Documenting function's.
* __Doc__ Added example ***Distribute Evenly.***


## v: 1.2.0 (2023-04-09)
* __Fixed Issue__ [responsive grid item will not be distributed equally.](https://github.com/gwinnem/vue-responsive-grid-layout/issues/2)
* __Components__ Added support for prop ***distributeEvenly*** in **GridLayout**.
* __Codebase__ Moved ***correctBounds*** from utils to responsiveUtils.
* __Demo App__ Removed unused properties.
* __Demo App__ Updated layout.
* __Demo App__ Added new prop: ***distributeEvenly***.
* __Doc__ Added changelog to navbar.
* __Tests__ Moved test folder to project root.


## v: 1.1.1 (2023-03-16)
* __Doc__ Added example ***Add Drag and Drop from outside the grid.***
* __Doc__ Added example ***Show Gridlines.***
* __Doc__ Added example ***Responsive.***
* __Codebase__ Fixed resize icon placement when layout is mirrored.
* __Codebase__ Fixed close button placement when layout is mirrored.
* __Feature__ ShowGridLines moved to GridLayout. ***Experimental***


## v: 1.0.5b (2023-03-12)
* __Doc__ Added example ***Prevent Collision.***
* __Doc__ Added example ***Add and Remove items.***
* __Doc__ Added example ***Show Close Button.***
* __Doc__ Added example ***Add default border-radius.***
* __Doc__ Added example ***Drag allow/ignore elements.***
* __Doc__ Added example ***Horizontal shift GridItem's.***
* __Doc__ Added example ***Mirrored / Right to Left layout.***
* __CodeBase__ Refactored all functions to use arrow syntax.
* __Codebase__ Refactored away get and setDocumentDir in DOM.ts.


## v: 1.0.4b (2023-03-06)
* __Codebase:__ Added new enum values for drag and dragged to EGridItemEvent.
* __Codebase__ Changed Type: TLayoutItem to Interface: ILayoutItem.
* __Codebase__ Refactored close button and resize icon to pure css.
* __Doc__ Added example: ***Basic Drag & Resize.***
* __Doc__ Added example: ***Bounded drag to container.***
* __Doc__ Added example: ***Drag, Drop and resize events.***

## v: 1.0.3b (2023-02-27)

* __Codebase:__ Complete refactoring of old codebase.
* __Codebase:__ Strongly typed typescript code.
* __Components:__ Updated to VUE 3.
* __Components:__ using vue setup syntax.
* __Feature:__ Horizontal shift.
* __Feature:__ Border radius for GridItem component.
* __Feature:__ Edit mode for GridItems.
* __Feature:__ Close button in GridItem's.
* __Doc:__ Added ***Vitepress*** for documentation.
* __Test:__ Unit test's for Validators.
* __Sandbox__ Added new Test application.

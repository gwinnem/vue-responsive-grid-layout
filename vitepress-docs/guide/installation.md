---
page: true
title: Installation
---

# Installation

## NPM
```
	npm install vue-ts-responsive-grid-layout --save
```

## Yarn
```
    yarn add vue-ts-responsive-grid-layout
```

## Import the package

```typescript
    import VueResponsiveGridLayout from 'vue-ts-responsive-grid-layout';
```

Add to other Vue components using Options api.

```typescript
    export default {
        components: {
            GridLayout: VueResponsiveGridLayout.GridLayout,
            GridItem: VueResponsiveGridLayout.GridItem
        },
    // ... data, methods, mounted (), etc.
    }
```

Add to other Vue components using Composition api.

```html
<script setup>
  import { GridItem, GridLayout } from 'vue-ts-responsive-grid-layout';
</script>
```

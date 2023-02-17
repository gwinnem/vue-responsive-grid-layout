# Installation

## NPM
```
	npm install vue-fluid-grid-layout --save
```

## Yarn
```
    yarn add vue-fluid-grid-layout
```

## Import the library

```typescript
    import VueFluidGridLayout from 'vue-fluid-grid-layout';
```

Add to other Vue components

 ```typescript
    export default {
        components: {
            GridLayout: VueResponsiveGridLayout.GridLayout,
            GridItem: VueResponsiveGridLayout.GridItem
        },
    // ... data, methods, mounted (), etc.
    }
    
```    

## Browser

Include the browser-ready bundle (download from [releases](https://github.com/gwinnem/vue-fluid-grid-layout/releases)) in your page. The components will be automatically available.

```html
    <script src="vue-responsive-grid-layout.umd.min.js"></script>
```

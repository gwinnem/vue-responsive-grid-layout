# How to test the npm package before publishing it:

Before you publish the package it is a good idea to test it.
To do this you can use npm pack to create .tgz file. 
This file can be imported in another project to test the package.
You can use the package by copying the .tgz file to the other project,
and running the following commands:

```
npm pack
```

<br/>

```
npm install vue-ts-responsive-grid-layout.tgz
```

Where <span style="color: green">vue-ts-responsive-grid-layout</span> is the name of your package.

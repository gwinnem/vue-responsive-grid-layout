# Creating a build to prepare the npm release
Execute <span style="color: green">npm run build</span> to generate a production build inside dist/.

The <span style="color: green">dist/</span> folder is structured like this:

* <span style="color: green">dist/vite-vue-package-skeleton.{es|umd}.js</span>: the actual JavaScript file that will be used in a parent project when importing the components.
* <span style="color: green">dist/style.css</span>: scoped styling of the components.
* <span style="color: green">dist/types/{index|Input.vue}.d.ts</span>: those files are generated with <span style="color: green">npm run build:types</span> and are used to provide TypeScript types for the components (typed props, slots, imports, etc). Those files are very important for TypeScript projects, without them you <span style="font-weight: 800">won't get any types</span>.

```
// From package.json
{
  "main": "dist/vue-responsive-grid-layout.umd.js",
  "module": "dist/vue-responsive-grid-layout.es.js",
  "types": "dist/types/index.d.ts",
  "files": [
    "dist/*",
    "src/**/*.vue"
  ]
}
```

* <span style="color: green">files</span>: an array of files to include in the npm release.
* <span style="color: green">main</span>: UMD file entry point.
* <span style="color: green">module</span>: ECMAScript module file entry point.
* <span style="color: green">types</span>: the types property to point to your bundled declaration file.


## Publishing the library
In order to publish the package, you need to follow these steps
#### Bumping the package version
```
npm version patch -m "message"
```
#### Logging in to npm
```
 npm login
```
#### Publishing the package to npm
```
 npm publish
```

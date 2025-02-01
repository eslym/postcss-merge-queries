# postcss-merge-queries

A PostCSS plugin to merge media queries and optionally sort them.
Nested media queries are supported, including those in `@layer` rules.

## Installation

```sh
npm install @eslym/postcss-merge-queries
```

## Usage

Add `@eslym/postcss-merge-queries` to your PostCSS configuration.

### Without sorting

```js
// postcss.config.js
module.exports = {
  plugins: [
    require('@eslym/postcss-merge-queries')(),
  ],
};
```

### With sorting

```js
const merge = require("@eslym/postcss-merge-queries");
// postcss.config.js
module.exports = {
  plugins: [
    merge({
      // Sort queries by the witdh and height features
      sortQuery: merge.simpleCompare,
    }),
  ],
};

## Example

Input CSS:

```css
/* Before */
@media (min-width: 768px) {
  .foo { color: red; }
}
@media (min-width: 768px) {
  .bar { color: blue; }
}
```

Output CSS:

```css
/* After */
@media (min-width: 768px) {
  .foo { color: red; }
  .bar { color: blue; }
}
```

## API

### `mergeQueries(options)`

#### options

Type: `object` (optional)

Options to customize the behavior of the plugin.

```typescript
// dist/index.d.ts
interface Options {
  // ...existing code...
}

declare function mergeQueries(options?: Options): any;

export = mergeQueries;
```

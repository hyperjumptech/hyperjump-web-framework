# eslint-plugin-react-strict-structure

A custom ESLint plugin to enforce strict React performance patterns. Specifically, it prevents the definition of inline functions that return JSX inside components.

## Why use this?

Defining a function that returns JSX _inside_ another component (often called a "render helper") is a React anti-pattern.

```javascript
// ❌ BAD
function Parent() {
  // This function is re-created on every render
  const RenderItem = () => <div>Item</div>;

  // React treats <RenderItem /> as a BRAND NEW component type every time.
  // Result: It unmounts the old one, mounts the new one.
  // Side effects: Loss of state, loss of focus, high memory churn.
  return <RenderItem />;
}
```

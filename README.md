---
id: babel-plugin-literal-shadow
title: @radist2s/literal-shadow
sidebar_label: literal-shadow
---

## Example

##### Source code
```jsx harmony
import {css} from 'reshadow' // any package is configurable
import literalShadow from '@radist2s/babel-plugin-literal-shadow'

const Button = () => <Button />
const style = css`
    ${literalShadow(Button)} {
        color: red;
    }
`
```
###### Transformed code
```jsx harmony
import {css} from 'reshadow'

const Button = () => <Button />
const style = css`
    Button {
        color: red;
    }
`
```

## Motivation
Compile-time styles processing libraries such as [`reshadow`](https://github.com/lttb/reshadow) provides ability to create CSS out of [Tagged Template Literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals). Using simple line markup without reference to the element name, you can miss some style. In addition, the use of strings makes it more difficult to refactoring.    

The `literal-shadow` plugin is a dirty hack that allows you to proxy a variable name inside Tagged Template Literals during code compilation and disappear completely.

In order not to abuse this feature, the plugin strictly limits the application area of this feature. The plugin will substitute variable names instead of calling its functions only inside Tagged Template Literals and nowhere else.
## Installation

```sh
npm install --save-dev @radist2s/babel-plugin-literal-shadow
```

## Usage

### With a configuration file (Recommended)

```json
{
  "plugins": [
    ["@radist2s/babel-plugin-literal-shadow/babel", {"taggedTemplateModules": ["reshadow"], "source":  "@radist2s/babel-plugin-literal-shadow"}],
    ["reshadow/babel"]
  ]
}
```
Short notation is not allowed:~~@radist2s/literal-shadow/balbel~~

#### Options
 
| option                  | default value                           | description       |
| ----------------------- | ----------------------------------------| ------------------|
| `taggedTemplateModules` | `["reshadow"]`                          | Styling library, whose tags are going to be transformed. |
| `source`                | `@radist2s/babel-plugin-literal-shadow` | default imported function of module from option will be used as instead of plugin builtin function to proxy variable name. |

#### Examples

Using of custom styled component library and custom proxy function module.
####### Babel configuration
```json
{"plugins": [
  ["@radist2s/babel-plugin-literal-shadow/babel", {"taggedTemplateModules": "my-styled-lib", "source":  "my-component-name-proxy"}]    
]}
```

####### Component implementation
```jsx harmony
import myStyled, {css as myPlainCss, otherTag as css} from 'my-styled-lib' // only default import and {css} is supported as tags identifiers
import comProxy from 'my-component-name-proxy'

const Button = () => <Button />

// Correct. 'myPlainCss' is possible identifier as it is originally 'css' identifier
const style1 = myPlainCss`
    ${comProxy(Button)} {
        color: red;
    }
`
// Correct. 'myStyled' imported as default and also possible identifier

const style2 = myStyled`
    ${comProxy`${Button}`} { // also possible to use function as Tag inside preparing template
        color: green;
    }
    // This could be used for semantic purposes instead of function call implementation
`

// Wrong! At this case 'comProxy' will not proxy variable name. identifier 'css' is an import of 'otherTag' and plugin is not support this.
const style3 = css`
    ${comProxy(Button)} {
        color: blue;
    }
`
```

### Via CLI

```sh
babel --plugins @radist2s/babel-plugin-literal-shadow/babel script.js
```

### Via Node API

```javascript
require("@babel/core").transform("code", {
  plugins: ["@radist2s/babel-plugin-literal-shadow/babel", {"taggedTemplateModules": ["styled-components"]}]
});
```
## References

* [`reshadow`](https://github.com/lttb/reshadow) Match styles on the elements, components, and props. That's all you need. Compile-time styles processing and efficient runtime.

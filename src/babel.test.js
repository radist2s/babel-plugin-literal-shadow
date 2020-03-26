const {stripIndent} = require('common-tags');
const {transformAsync} = require('@babel/core');

const getPlugin = (options) => [
    require.resolve('./babel'),
    options
];

const defaultOptions = {
    root: __dirname,
    filename: __filename,
    babelrc: false,
    configFile: false,
    presets: [
        ['@babel/preset-react', {throwIfNamespace: false, useBuiltIns: true}],
    ],
    plugins: [getPlugin()],
};

const transformCode = (code, options = defaultOptions) =>
    transformAsync(stripIndent(code), options);

const transform = (code) => transformCode(code);

transform.with = (params) => (code) => transformCode(code, params);

describe('babel', () => {
    it('should be compatible with `reshadow` plugin', async () => {
        const pluginOptions = {"taggedTemplateModules": "reshadow", "source":  "shadow"}

        const plugins = [getPlugin(pluginOptions), 'module:@reshadow/babel']

        const {code} = await transform.with({...defaultOptions, plugins})`
        import myReshadowStyled, {css} from 'reshadow'
        import shadow from 'shadow'

        const Button = 'button'

        const buttonStyles = css\`\${shadow(Button)} {font: arial}\`

        const StyledButton = () => myReshadowStyled(buttonStyles)\`
            \${shadow(Button)} {
                color: purple;
            }
        \`(<Button />)
      `;

        expect(code).toMatchSnapshot();
    });

    it('should use options', async () => {
        const pluginOptions = {"taggedTemplateModules": "my-styled-lib", "source":  "my-component-name-proxy"}

        const {code} = await transform.with({...defaultOptions, plugins: [getPlugin(pluginOptions)]})`
        import myStyled from 'my-styled-lib'
        import comProxy from 'my-component-name-proxy'

        const Button = () => <Button />

        const style1 = myStyled\`
            \${comProxy(Button)} {
                color: red;
            }
        \`

        const style2 = myStyled\`
            \${comProxy\`\${Button}\`} { // also possible to use function as Tag inside preparing template
                color: red;
            }
            // This could be used for semantic purposes instead of function call implementation
        \`
      `;

        expect(code).toMatchSnapshot();
    });

    it('should transform the code with string literal identifier', async () => {
      const {code} = await transform`
      import styled, {css} from 'reshadow';
      import shadowName from '@radist2s/babel-plugin-literal-shadow';

      const Foobar = 'div';
      const Bar = 'span';

      const Btn = ({color}) => styled\`
        \${shadowName\`\${Foobar}\`} { background: blue; }

        \${shadowName(Bar)} + \${shadowName(Bar)}[disabled] { fill: red; }

        Foobar { color: \${color}; }
      \`(<Foobar />);

      export default Btn;
      `;

        expect(code).toMatchSnapshot();
    });

    it('should transform the code with Function/Class identifier', async () => {
      const {code} = await transform`
      import styled, {css} from 'reshadow';
      import cn from '@radist2s/babel-plugin-literal-shadow';

      const Comp = () => <div>Component</div>

      const Btn = ({color}) => styled\`
        \${cn\`\${Comp}\`} { background: blue; }

        \${cn(Comp)} { fill: red; }

        Comp { color: \${color}; }
      \`(<Foobar />);

      export default Btn;
      `;

        expect(code).toMatchSnapshot();
    });

    it('should transform the code in CSS', async () => {
        const {code} = await transform`
            import {css as cssTemplate} from 'reshadow';
            import shadowName from '@radist2s/babel-plugin-literal-shadow';

            const Foo = 'div'

            const styles = cssTemplate\`
            \${shadowName\`\${Foo}\`} { background: blue; }

            \${shadowName(Foo)} { fill: red; }
            \`

            export default styles;
        `;
        expect(code).toMatchSnapshot();
    });

    it('should transform the code from start and at the end', async () => {
        const {code} = await transform`
            import {css as cssTemplate} from 'reshadow';
            import shadowName from '@radist2s/babel-plugin-literal-shadow';

            const Foo = 'div'

            const styles1 = cssTemplate\`\${shadowName\`\${Foo}\`} { background: blue; }\`
            const styles2 = cssTemplate\`\${shadowName\`\${Foo}\`} { background: blue; }
            \`
            const styles3 = cssTemplate\`
            \${shadowName\`\${Foo}\`} { background: blue; }\`

            export default {styles1, styles2, styles3};
        `;
        expect(code).toMatchSnapshot();
    });
});

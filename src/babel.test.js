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
    it('should transform the code with string literal identifier', async () => {
        const {code} = await transform`
      import styled, {css} from 'reshadow';
      import shadowName from '@radist2s/literal-shadow';

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
      import shadowName from '@radist2s/literal-shadow';

      const Comp = () => <div>Component</div>

      const Btn = ({color}) => styled\`
        \${shadowName\`\${Comp}\`} { background: blue; }

        \${shadowName(Comp)} { fill: red; }

        Comp { color: \${color}; }
      \`(<Foobar />);

      export default Btn;
      `;

        expect(code).toMatchSnapshot();
    });

    it('should transform the code in CSS', async () => {
        const {code} = await transform`
            import {css as cssTemplate} from 'reshadow';
            import shadowName from '@radist2s/literal-shadow';

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
            import shadowName from '@radist2s/literal-shadow';

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

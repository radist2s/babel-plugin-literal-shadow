const t = require('@babel/types');

const defaultOptions = {
    taggedTemplateModules: ['reshadow'],
    source: require('../package.json').name,
};

const babelPluginName = (() => {
    const [vendorNamespace, pluginName] = defaultOptions.source.split('/');

    return pluginName || vendorNamespace;
})();

function findExpressionQuasisPosition(
    callExpr,
    templateElements,
    elementBefore = false,
) {
    const elementIndex = templateElements.findIndex((element) => {
        return element.start > callExpr.end;
    });

    if (elementIndex < 0) {
        return;
    }

    return elementBefore
        ? templateElements[elementIndex - 1]
        : templateElements[elementIndex];
}

function putElementData(element, {start, end, value: {raw, cooked}}) {
    element.value.raw = raw;
    element.value.cooked = cooked;
    element.start = start;
    element.end = end;
}

/**
 * @param {Node} expr
 * @param {string} identifierName
 * @return {Node|null}
 */
function getTemplateExpressionSelectorHelperArgument(expr, identifierName) {
    let identifier = null;

    if (t.isExpression(expr.callee, {name: identifierName})) {
        if (expr.arguments && expr.arguments.length) {
            identifier = expr.arguments[0];
        }
    } else if (
        t.isTaggedTemplateExpression(expr) &&
        t.isIdentifier(expr.tag, {name: identifierName})
    ) {
        const {quasi} = expr;

        if (
            t.isTemplateLiteral(quasi) &&
            quasi.expressions &&
            quasi.expressions.length
        ) {
            identifier = quasi.expressions[0];
        }
    }

    if (t.isIdentifier(identifier)) {
        return identifier;
    }
}

function templateLiteralVisitor(path) {
    if (!path.node.expressions || !path.node.expressions.length) {
        return;
    }

    path.node.expressions = path.node.expressions.filter(function (expr) {
        const {identifierNames = []} = path.state;

        let identifier = null;

        for (const idName of identifierNames) {
            identifier = getTemplateExpressionSelectorHelperArgument(
                expr,
                idName,
            );

            if (identifier) {
                break;
            }
        }

        if (!t.isIdentifier(identifier)) {
            return true;
        }

        const afterElement = findExpressionQuasisPosition(
            expr,
            path.node.quasis,
        );

        if (!afterElement) {
            return true;
        }

        const beforeElement = findExpressionQuasisPosition(
            expr,
            path.node.quasis,
            true,
        );

        const selector = identifier.name;

        // Actually, before element will always exists, even with {start: 1, end: 1}, means, with zero length
        if (!beforeElement) {
            return true;
        }

        putElementData(beforeElement, {
            start: beforeElement.start,
            end: afterElement.end,
            value: {
                raw: `${beforeElement.value.raw}${selector}${afterElement.value.raw}`,
                cooked: `${beforeElement.value.cooked}${selector}${afterElement.value.cooked}`,
            },
        });

        path.node.quasis.splice(path.node.quasis.indexOf(afterElement), 1);

        return false;
    });
}

/**
 * @param {NodePath} path
 * @param {string[]|string} whiteListSources
 * @return {[]}
 */
function getImportIdentifierNamesForPackage(path, whiteListSources = []) {
    whiteListSources =
        typeof whiteListSources === 'string'
            ? [whiteListSources]
            : whiteListSources;

    const names = [];

    const {
        node,
        node: {source},
    } = path;

    for (const spec of node.specifiers) {
        if (whiteListSources.indexOf(source.value) === -1) {
            continue;
        }

        if (t.isImportDefaultSpecifier(spec)) {
            names.push(spec.local.name);
        } else {
            if (spec.imported.name === 'css') {
                // 'reshadow' css TemplateTag
                names.push(spec.local.name);
            }
        }
    }

    return names;
}

/**
 * @param path
 * @param {string[]} wrapperTagImports
 * @param {string[]} packageImports
 */
function taggedTemplateExpressionVisitor(
    path,
    wrapperTagImports = [],
    packageImports = [],
) {
    let taggedName = '';

    if (path.isTaggedTemplateExpression()) {
        const {
            node: {tag},
        } = path;
        if (tag.arguments && tag.arguments.length && tag.callee) {
            taggedName = tag.callee.name;
        } else {
            taggedName = tag.name;
        }
    } else if (path.isCallExpression()) {
        taggedName = path.node.callee.tag.name;
    }

    if (!taggedName || !wrapperTagImports.some((name) => name === taggedName)) {
        return;
    }

    path.traverse(
        {TemplateLiteral: templateLiteralVisitor},
        {
            taggedName,
            identifierNames: packageImports,
        },
    );
}

function callExpressionVisitor(path) {}

export default function ({types: t}, pluginOptions = {}) {
    const options = Object.assign({}, defaultOptions, pluginOptions);

    let packageImports = [];
    let wrapperTaggedTemplateImports = [];
    const visited = new WeakSet();

    const isStyledExpression = (node) => {
        if (t.isCallExpression(node))
            return (
                wrapperTaggedTemplateImports.indexOf(node.callee.name) !== -1
            );

        return false;
    };

    return {
        name: babelPluginName,

        visitor: {
            CallExpression(path) {
                const {node, node: {callee}} = path;

                if (visited.has(node)) {
                    return;
                }

                visited.add(node);

                if (isStyledExpression(callee) || isStyledExpression(node) || t.isTaggedTemplateExpression(callee)) {
                    path.traverse({
                        TaggedTemplateExpression: (templatePath) =>
                            taggedTemplateExpressionVisitor(
                                templatePath,
                                wrapperTaggedTemplateImports,
                                packageImports,
                            ),
                    });

                    return;
                }
            },

            TaggedTemplateExpression(path) {
                taggedTemplateExpressionVisitor(
                    path,
                    wrapperTaggedTemplateImports,
                    packageImports,
                );
            },

            ImportDeclaration(path) {
                const {taggedTemplateModules, source: packageName} = options;

                const wrapperTaggedTemplateNames = getImportIdentifierNamesForPackage(
                    path,
                    taggedTemplateModules,
                );

                if (wrapperTaggedTemplateNames.length) {
                    wrapperTaggedTemplateImports = [
                        ...wrapperTaggedTemplateImports,
                        ...wrapperTaggedTemplateNames,
                    ];

                    return;
                }

                const pathPackageImportedNames = getImportIdentifierNamesForPackage(
                    path,
                    packageName,
                );

                if (pathPackageImportedNames.length) {
                    packageImports = [
                        ...packageImports,
                        ...pathPackageImportedNames,
                    ];

                    path.remove(); // remove package imports, just cast a shadow and disappear...
                }
            },
        },
    };
}

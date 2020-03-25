/**
 * @param {(string|ComponentType)[]} strings
 * @param args
 * @return {string}
 */
export default function literalShadow(strings, ...args) {
    return args[0].displayName || args[0].name || args[0] // nothing will
}

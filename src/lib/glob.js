/**
 * Convert a glob to a regex, the directory separator
 * @param string
 * @returns {*}
 */
const directorySeparator = string => string.replace(/\//g, '\\/')
/**
 * Convert a glob to a regex, the dot construct
 * @param string
 * @returns {*}
 */
const dot = string => string.replace(/\./g, '\\.')
/**
 * Convert a glob to a regex, the ** or splat splat
 * @param string
 * @returns {*}
 */
const splatSplat = string => string.replace(/\*{2}/g, ".*")
/**
 * Convert a glob to a regex, the ?
 * @param string
 * @returns {*}
 */
const question = string => string.replace(/\?/g, ".{1}")
/**
 * Convert a glob to a regex, the * or splat
 * @param string
 * @returns {*}
 */
const splat = string => string.replace(/(?<!\*)\*(?!\*)/g, "[^\\/]*")
/**
 * Convert a glob to a regex, group construct
 * @param string
 * @returns {*}
 */
const extensionGroup = string => string.replace(/\{(.*)\}/g, '($1)');
/**
 * Convert a glob to a regex, the inverse group construct
 * @param string
 * @returns {*}
 */
const negativeUnixLike = string => string.replace(/\[!(.*)\]/g, '[^($1)]');

/**
 * Converts a glob to a regex
 * @param glob {string} - The glob to convert
 * @returns {string}
 */
module.exports.globToRegex = (glob) => { //, options) => {
    // const absolute = options && options.absolute ? '^' : '';
    return `^${[extensionGroup, dot, directorySeparator, splat, splatSplat, question, negativeUnixLike]
            .reduce((acc, cur) => {
                return cur(acc)
            }, glob)}$`
}

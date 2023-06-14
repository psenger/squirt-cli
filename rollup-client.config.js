const commonjs = require('@rollup/plugin-commonjs');
const resolve = require('@rollup/plugin-node-resolve').default;
const json = require('@rollup/plugin-json');
const terser = require('@rollup/plugin-terser');
const banner = '#!/usr/bin/env node\n'

const shouldCompress = process.env.COMPRESS === 'true';

module.exports = {
    input: 'src/client.js', // Replace 'src/main.js' with the path to your entry file
    external: /node_modules/,
    output: {
        banner,
        file: `dist/squirt-client${shouldCompress ? '-compressed' : ''}.js`, // Replace 'dist/bundle.js' with the desired output file path
        format: 'cjs' // Replace 'cjs' with the desired output format (e.g., 'umd', 'esm')
    },
    treeshake: true,
    plugins: [
        resolve(),
        commonjs(),
        json(),
        shouldCompress && terser()
    ]
};

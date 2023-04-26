import del from 'rollup-plugin-delete';
import copy from 'rollup-plugin-copy';
import terser from '@rollup/plugin-terser';
import gitInfo from './rollup-plugin-git-info/index.js';

export default {
    input: '../src/index.js',
    output: {
        file: '../dist/index.js',
        format: 'es',
    },
    plugins: [
        gitInfo(),
        del({ targets: '../dist/*', force: true }),
        terser({
            mangle: {
                properties: true,
            },
        }),
        copy({
            targets: [
                {
                    src: [
                        '../src/index.html',
                        '../src/index.css',
                        '../src/favicon.png'
                    ],
                    dest: '../dist/',
                },
            ],
        }),
    ],
}

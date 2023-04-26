import util from 'node:util';
import { exec } from 'node:child_process';
import { createFilter } from '@rollup/pluginutils';

const getGitCommitHash = async function() {
    const { stdout } = await util.promisify(exec)('git rev-parse HEAD');

    try {
        return stdout.trim();
    } catch (err) {
        return `failed to determine git commit hash: ${err.message ?? err}`;
    };
}

const re = new RegExp('(^|\\s+)(const\\s+COMMITHASH\\s*=\\s*\')(\\?)(\'\\s*;)');

export default function(options) {
    const filter = createFilter(options?.include, options?.exclude);
    const gitCommitHashPromise = getGitCommitHash();

    return {
        name: 'gitInfo',

        transform: async function(code, id) {
            if (filter(id) === false) {
                return;
            }

            const gitCommitHash = await gitCommitHashPromise;

            const newCode = code.replace(re, (_match, g1, g2, _g3, g4) => {
                return `${g1}${g2}${gitCommitHash}${g4}`;
            });

            return {
                code: newCode,
                map: null,
            };
        },
    };
}

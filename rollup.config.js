import alias from '@rollup/plugin-alias';
import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import postcss from 'rollup-plugin-postcss';
import { terser } from 'rollup-plugin-terser';

import fs from 'fs-extra';
import path from 'path';

import pkg from './package.json';

let entries = [];

let core = {};

const NPM_LINK = process.env.NPM_LINK === 'true';

// alias entries
const ALIAS_ICON_COMPONENT_ENTRIES = [
    { find: '../../iconbase/IconBase', replacement: '@orcado/yoyui/iconbase' },
    { find: '../icons/angledoubledown', replacement: '@orcado/yoyui/icons/angledoubledown' },
    { find: '../icons/angledoubleleft', replacement: '@orcado/yoyui/icons/angledoubleleft' },
    { find: '../icons/angledoubleright', replacement: '@orcado/yoyui/icons/angledoubleright' },
    { find: '../icons/angledoubleup', replacement: '@orcado/yoyui/icons/angledoubleup' },
    { find: '../icons/angledown', replacement: '@orcado/yoyui/icons/angledown' },
    { find: '../icons/angleleft', replacement: '@orcado/yoyui/icons/angleleft' },
    { find: '../icons/angleright', replacement: '@orcado/yoyui/icons/angleright' },
    { find: '../icons/angleup', replacement: '@orcado/yoyui/icons/angleup' },
    { find: '../icons/arrowdown', replacement: '@orcado/yoyui/icons/arrowdown' },
    { find: '../icons/arrowup', replacement: '@orcado/yoyui/icons/arrowup' },
    { find: '../icons/ban', replacement: '@orcado/yoyui/icons/ban' },
    { find: '../icons/bars', replacement: '@orcado/yoyui/icons/bars' },
    { find: '../icons/calendar', replacement: '@orcado/yoyui/icons/calendar' },
    { find: '../icons/check', replacement: '@orcado/yoyui/icons/check' },
    { find: '../icons/chevrondown', replacement: '@orcado/yoyui/icons/chevrondown' },
    { find: '../icons/chevronleft', replacement: '@orcado/yoyui/icons/chevronleft' },
    { find: '../icons/chevronright', replacement: '@orcado/yoyui/icons/chevronright' },
    { find: '../icons/chevronup', replacement: '@orcado/yoyui/icons/chevronup' },
    { find: '../icons/exclamationtriangle', replacement: '@orcado/yoyui/icons/exclamationtriangle' },
    { find: '../icons/eye', replacement: '@orcado/yoyui/icons/eye' },
    { find: '../icons/eyeslash', replacement: '@orcado/yoyui/icons/eyeslash' },
    { find: '../icons/filter', replacement: '@orcado/yoyui/icons/filter' },
    { find: '../icons/filterslash', replacement: '@orcado/yoyui/icons/filterslash' },
    { find: '../icons/infocircle', replacement: '@orcado/yoyui/icons/infocircle' },
    { find: '../icons/minus', replacement: '@orcado/yoyui/icons/minus' },
    { find: '../icons/pencil', replacement: '@orcado/yoyui/icons/pencil' },
    { find: '../icons/plus', replacement: '@orcado/yoyui/icons/plus' },
    { find: '../icons/refresh', replacement: '@orcado/yoyui/icons/refresh' },
    { find: '../icons/search', replacement: '@orcado/yoyui/icons/search' },
    { find: '../icons/searchminus', replacement: '@orcado/yoyui/icons/searchminus' },
    { find: '../icons/searchplus', replacement: '@orcado/yoyui/icons/searchplus' },
    { find: '../icons/sortalt', replacement: '@orcado/yoyui/icons/sortalt' },
    { find: '../icons/sortamountdown', replacement: '@orcado/yoyui/icons/sortamountdown' },
    { find: '../icons/sortamountupalt', replacement: '@orcado/yoyui/icons/sortamountupalt' },
    { find: '../icons/spinner', replacement: '@orcado/yoyui/icons/spinner' },
    { find: '../icons/star', replacement: '@orcado/yoyui/icons/star' },
    { find: '../icons/starfill', replacement: '@orcado/yoyui/icons/starfill' },
    { find: '../icons/thlarge', replacement: '@orcado/yoyui/icons/thlarge' },
    { find: '../icons/times', replacement: '@orcado/yoyui/icons/times' },
    { find: '../icons/timescircle', replacement: '@orcado/yoyui/icons/timescircle' },
    { find: '../icons/trash', replacement: '@orcado/yoyui/icons/trash' },
    { find: '../icons/undo', replacement: '@orcado/yoyui/icons/undo' },
    { find: '../icons/upload', replacement: '@orcado/yoyui/icons/upload' },
    { find: '../icons/windowmaximize', replacement: '@orcado/yoyui/icons/windowmaximize' },
    { find: '../icons/windowminimize', replacement: '@orcado/yoyui/icons/windowminimize' }
];

const CORE_PASSTHROUGH_DEPENDENCIES = [
    { find: '../passthrough', replacement: '@orcado/yoyui/passthrough' },
    { find: '../passthrough/tailwind', replacement: '@orcado/yoyui/passthrough/tailwind' }
];

const ALIAS_COMPONENT_ENTRIES = [
    { find: '../utils/Utils', replacement: '@orcado/yoyui/utils' },
    { find: '../api/Api', replacement: '@orcado/yoyui/api' },
    { find: '../componentbase/ComponentBase', replacement: '@orcado/yoyui/componentbase' },
    { find: '../hooks/Hooks', replacement: '@orcado/yoyui/hooks' },
    { find: '../ripple/Ripple', replacement: '@orcado/yoyui/ripple' },
    { find: '../csstransition/CSSTransition', replacement: '@orcado/yoyui/csstransition' },
    { find: '../portal/Portal', replacement: '@orcado/yoyui/portal' },
    { find: '../keyfilter/KeyFilter', replacement: '@orcado/yoyui/keyfilter' },
    ...ALIAS_ICON_COMPONENT_ENTRIES,
    { find: '../tooltip/Tooltip', replacement: '@orcado/yoyui/tooltip' },
    { find: '../virtualscroller/VirtualScroller', replacement: '@orcado/yoyui/virtualscroller' },
    { find: '../terminalservice/TerminalService', replacement: '@orcado/yoyui/terminalservice' },
    { find: '../overlayservice/OverlayService', replacement: '@orcado/yoyui/overlayservice' },
    { find: '../checkox/Checkbox', replacement: '@orcado/yoyui/checkbox' },
    { find: '../button/Button', replacement: '@orcado/yoyui/button' },
    { find: '../inputtext/InputText', replacement: '@orcado/yoyui/inputtext' },
    { find: '../inputnumber/InputNumber', replacement: '@orcado/yoyui/inputnumber' },
    { find: '../messages/Messages', replacement: '@orcado/yoyui/messages' },
    { find: '../progressbar/ProgressBar', replacement: '@orcado/yoyui/progressbar' },
    { find: '../dropdown/Dropdown', replacement: '@orcado/yoyui/dropdown' },
    { find: '../dialog/Dialog', replacement: '@orcado/yoyui/dialog' },
    { find: '../paginator/Paginator', replacement: '@orcado/yoyui/paginator' },
    { find: '../tree/Tree', replacement: '@orcado/yoyui/tree' },
    ...CORE_PASSTHROUGH_DEPENDENCIES
];

// dependencies
const GLOBAL_DEPENDENCIES = {
    react: 'React',
    'react-dom': 'ReactDOM',
    'react-transition-group': 'ReactTransitionGroup'
};

const GLOBAL_COMPONENT_DEPENDENCIES = {
    ...GLOBAL_DEPENDENCIES,
    ...(NPM_LINK ? [] : ALIAS_COMPONENT_ENTRIES.reduce((acc, cur) => ({ ...acc, [cur.replacement]: cur.replacement.replaceAll('@', '').replaceAll('/', '.') }), {}))
};

// externals
const EXTERNAL = ['react', 'react-dom', 'react-transition-group', '@babel/runtime', '@fullcalendar/core', 'chart.js/auto', 'quill'];

const EXTERNAL_COMPONENT = [...EXTERNAL, ...(NPM_LINK ? [] : ALIAS_COMPONENT_ENTRIES.map((entries) => entries.replacement))];

// plugins
const BABEL_PLUGIN_OPTIONS = {
    exclude: 'node_modules/**',
    presets: ['@babel/preset-env', '@babel/preset-react'],
    plugins: ['@babel/plugin-transform-runtime', '@babel/plugin-proposal-class-properties'],
    skipPreflightCheck: true,
    babelHelpers: 'runtime',
    babelrc: false
};

const ALIAS_PLUGIN_OPTIONS_FOR_COMPONENT = {
    entries: ALIAS_COMPONENT_ENTRIES
};

const REPLACE_PLUGIN_OPTIONS = {
    'process.env.NODE_ENV': JSON.stringify('production'),
    preventAssignment: true
};

const RESOLVE_PLUGIN_OPTIONS = {
    extensions: ['.js']
};

const COMMONJS_PLUGIN_OPTIONS = {
    exclude: process.env.INPUT_DIR + '**',
    sourceMap: false
};

const POSTCSS_PLUGIN_OPTIONS = {
    sourceMap: false
};

const TERSER_PLUGIN_OPTIONS = {
    compress: {
        keep_infinity: true,
        pure_getters: true,
        reduce_funcs: false
    }
};

const PLUGINS = [replace(REPLACE_PLUGIN_OPTIONS), resolve(RESOLVE_PLUGIN_OPTIONS), commonjs(COMMONJS_PLUGIN_OPTIONS), babel(BABEL_PLUGIN_OPTIONS), postcss(POSTCSS_PLUGIN_OPTIONS)];

const PLUGINS_COMPONENT = NPM_LINK ? PLUGINS : [alias(ALIAS_PLUGIN_OPTIONS_FOR_COMPONENT), ...PLUGINS];

function sanitizeNameForIIFE(name) {
    return name.replace('@', '').replaceAll('/', '.');
}

function addEntry(name, input, output, isComponent = true) {
    const exports = name === '@orcado/yoyui.api' || name === '@orcado/yoyui' ? 'named' : 'auto';
    const useCorePlugin = !NPM_LINK && ALIAS_COMPONENT_ENTRIES.some((entry) => entry.replacement === name.replaceAll('.', '/'));
    const plugins = isComponent ? PLUGINS_COMPONENT : PLUGINS;
    const external = isComponent ? EXTERNAL_COMPONENT : EXTERNAL;
    const inlineDynamicImports = true;

    const onwarn = (warning) => {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
            return;
        }
    };

    const getEntry = (isMinify) => {
        return {
            onwarn,
            input,
            plugins: [...plugins, isMinify && terser(TERSER_PLUGIN_OPTIONS), useCorePlugin && corePlugin()],
            external,
            inlineDynamicImports
        };
    };

    const get_CJS_ESM = (isMinify) => {
        return {
            ...getEntry(isMinify),
            output: [
                ...(NPM_LINK
                    ? []
                    : [
                          {
                              format: 'cjs',
                              file: `${output}.cjs${isMinify ? '.min' : ''}.js`,
                              exports,
                              banner: "'use client';" // This line is required for SSR.
                          }
                      ]),
                {
                    format: 'esm',
                    file: `${output}.esm${isMinify ? '.min' : ''}.js`,
                    exports,
                    banner: "'use client';" // This line is required for SSR.
                }
            ]
        };
    };

    const get_IIFE = (isMinify) => {
        return {
            ...getEntry(isMinify),
            output: [
                {
                    format: 'iife',
                    name: sanitizeNameForIIFE(name),
                    file: `${output}${isMinify ? '.min' : ''}.js`,
                    globals: isComponent ? GLOBAL_COMPONENT_DEPENDENCIES : GLOBAL_DEPENDENCIES,
                    exports
                }
            ]
        };
    };

    entries.push(get_CJS_ESM());

    if (!NPM_LINK) {
        entries.push(get_IIFE());

        // Minify
        entries.push(get_CJS_ESM(true));
        entries.push(get_IIFE(true));
    }
}

function corePlugin() {
    return {
        name: 'corePlugin',
        generateBundle(outputOptions, bundle) {
            const { name, format } = outputOptions;

            if (format === 'iife') {
                Object.keys(bundle).forEach((id) => {
                    const chunk = bundle[id];
                    const sanitizedName = name.replace('@', '').replaceAll('/', '.');
                    const folderName = sanitizedName.replace('orcado.yoyui.', '').replaceAll('.', '/');
                    const filePath = `./dist/core/core${id.indexOf('.min.js') > 0 ? '.min.js' : '.js'}`;

                    core[filePath] ? (core[filePath][folderName] = chunk.code) : (core[filePath] = { [`${folderName}`]: chunk.code });
                });
            }
        }
    };
}

function addCore() {
    const lastEntry = entries[entries.length - 1];

    lastEntry.plugins = [
        ...lastEntry.plugins,
        {
            name: 'coreMergePlugin',
            generateBundle() {
                Object.entries(core).forEach(([filePath, value]) => {
                    const code = ALIAS_COMPONENT_ENTRIES.reduce((val, entry) => {
                        const name = entry.replacement.replace('@orcado/yoyui/', '');

                        val += value[name] + '\n';

                        return val;
                    }, '');

                    fs.outputFile(path.resolve(__dirname, filePath), code, {}, function (err) {
                        if (err) {
                            // eslint-disable-next-line no-console
                            return console.error(err);
                        }
                    });
                });
            }
        }
    ];
}

function addComponent() {
    fs.readdirSync(path.resolve(__dirname, process.env.INPUT_DIR), { withFileTypes: true })
        .filter((dir) => dir.isDirectory())
        .forEach(({ name: folderName }) => {
            fs.readdirSync(path.resolve(__dirname, process.env.INPUT_DIR + folderName)).forEach((file) => {
                const name = file.split(/(.js)$/)[0].toLowerCase();

                if (name === folderName) {
                    const input = process.env.INPUT_DIR + folderName + '/' + file;
                    const output = process.env.OUTPUT_DIR + folderName + '/' + name;

                    addEntry('@orcado/yoyui.' + folderName, input, output, true);
                }
            });
        });
}

function addIcon() {
    const iconDir = path.resolve(__dirname, process.env.INPUT_DIR + 'icons');

    fs.readdirSync(path.resolve(__dirname, iconDir), { withFileTypes: true })
        .filter((dir) => dir.isDirectory())
        .forEach(({ name: folderName }) => {
            fs.readdirSync(path.resolve(__dirname, iconDir + '/' + folderName)).forEach((file) => {
                if (/\.js$/.test(file)) {
                    const name = file.split(/(.js)$/)[0].toLowerCase();
                    const input = process.env.INPUT_DIR + 'icons/' + folderName + '/' + file;
                    const output = process.env.OUTPUT_DIR + 'icons/' + folderName + '/' + name;

                    addEntry('@orcado/yoyui.icons.' + folderName, input, output, true);
                }
            });
        });
}

function addPassThrough() {
    const inputDir = process.env.INPUT_DIR + 'passthrough';
    const outputDir = process.env.OUTPUT_DIR + 'passthrough';

    addEntry('passthrough', `${inputDir}/index.js`, `${outputDir}/index`, false);
    addEntry('passthrough.tailwind', `${inputDir}/tailwind/index.js`, `${outputDir}/tailwind/index`, false);
}

function addPrimeReact() {
    const input = process.env.INPUT_DIR + 'primereact.all.js';
    const output = process.env.OUTPUT_DIR + 'primereact.all';

    addEntry('@orcado/yoyui', input, output, false);
}

function addPackageJson() {
    const outputDir = path.resolve(__dirname, process.env.OUTPUT_DIR);
    const packageJson = `{
    "name": "${pkg.name}",
    "version": "${pkg.version}",
    "private": false,
    "author": "${pkg.author || 'Orcado'}",
    "description": "${pkg.description || ''}",
    "homepage": "${pkg.homepage || ''}",
    "repository": ${JSON.stringify(pkg.repository || {})},
    "license": "${pkg.license || 'MIT'}",
    "bugs": ${JSON.stringify(pkg.bugs || {})},
    "keywords": ${JSON.stringify(pkg.keywords || [])},
    "unpkg": "primereact.all.min.js",
    "jsdelivr": "primereact.all.min.js",
    "main": "primereact.all.min.js",
    "module": "primereact.all.esm.min.js",
    "web-types": "web-types.json",
    "peerDependencies": {
        "@types/react": "^17.0.0 || ^18.0.0 || ^19.0.0",
        "react": "^17.0.0 || ^18.0.0 || ^19.0.0",
        "react-dom": "^17.0.0 || ^18.0.0 || ^19.0.0"
    },
    "peerDependenciesMeta": {
        "@types/react": {
            "optional": true
        }
    },
    "dependencies": {
        "@types/react-transition-group": "^4.4.1",
        "react-transition-group": "^4.4.1"
    },
    "sideEffects": [
        "**/*.css"
    ],
    "engines": {
        "node": ">=14.0.0"
    }
}`;

    !fs.existsSync(outputDir) && fs.mkdirSync(outputDir);
    fs.writeFileSync(path.resolve(outputDir, 'package.json'), packageJson);
}

addIcon();
addComponent();
addPrimeReact();
addPassThrough();
addCore();
addPackageJson();

export default entries;

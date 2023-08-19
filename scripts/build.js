const process = require('node:process')
const { join, resolve } = require('node:path')
const { sh } = require('./utils/sh')

function build({ platform = 'node', outfile = 'out/extension.js' }) {
  return require('esbuild').build({
    alias: {
      '~/': `${resolve(__dirname, 'src')}/`,
    },
    entryPoints: [
      './src/extension.ts',
    ],
    outfile,
    bundle: true,
    metafile: process.argv.includes('--metafile'),
    external: [
      'vscode',
      'typescript', // vue-component-meta
    ],
    format: 'cjs',
    platform,
    define: { 'process.env.NODE_ENV': '"production"' },
    minify: process.argv.includes('--minify'),
  // watch: process.argv.includes('--watch'),
  })
}

sh(`cp "${join(__filename, '../../node_modules/vscode-oniguruma/release/onig.wasm')}" "${join(__filename, '../../out/oniguruma.wasm')}" `)
build({
  platform: 'node',
  outfile: 'out/extension.js',
})
build({
  platform: 'browser',
  outfile: 'out/web-extension.js',
})

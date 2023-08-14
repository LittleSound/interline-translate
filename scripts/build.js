const process = require('node:process')
const { join } = require('node:path')
const { sh } = require('./utils/sh')

async function build({ platform = 'node', outfile = 'out/extension.js' }) {
  await sh(`cp "${join(__filename, '../node_modules/vscode-oniguruma/release/onig.wasm')}" "${join(__filename, '../out/oniguruma.wasm')}" `)

  return require('esbuild').build({
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

await build({
  platform: 'node',
  outfile: 'out/extension.js',
})
await build({
  platform: 'browser',
  outfile: 'out/web-extension.js',
})

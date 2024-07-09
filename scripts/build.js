const process = require('node:process')
const { resolve } = require('node:path')
const fs = require('node:fs/promises')

function build({ platform = 'node', outfile = 'out/extension.js' }) {
  return require('esbuild').build({
    alias: {
      '~/*': `${resolve(__dirname, 'src')}/`,
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

async function main() {
  await fs.mkdir('out', { recursive: true })
  await Promise.all([
    fs.cp(
      resolve(__filename, '../../node_modules/vscode-oniguruma/release/onig.wasm'),
      resolve(__filename, '../../out/onig.wasm'),
    ),
    build({
      platform: 'node',
      outfile: 'out/extension.js',
    }),
    build({
      platform: 'browser',
      outfile: 'out/web-extension.js',
    }),
  ])
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

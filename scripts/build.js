const process = require('node:process')

function build({ platform = 'node', outfile = 'out/extension.js' }) {
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

build({
  platform: 'node',
  outfile: 'out/extension.js',
})
build({
  platform: 'browser',
  outfile: 'out/web-extension.js',
})

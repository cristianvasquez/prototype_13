const { resolve } = require('path')
const { PassThrough } = require('stream')
const rdf = require('rdf-ext')

async function ingestDataset (context) {
  const {
    createMarkdownPipeline,
  } = await import('dottriples') // It seems eleventy does not support ESM support yet :(

  // Build pipelines
  const outputStream = new PassThrough({
    objectMode: true, write (object, encoding, callback) {
      this.push(object)
      callback()
    },
  })
  const inputStream = createMarkdownPipeline(context, outputStream)
  for (const file of context.index.files.filter(x => x.endsWith('.md'))) {
    inputStream.write(file)
  }
  inputStream.end()
  const result = rdf.dataset()
  return await result.import(outputStream)
}

async function getTriples (inputDirectory) {
  console.log('Processing ', inputDirectory)

  const {
    createContext, ns,
  } = await import('dottriples') // It seems eleventy does not support ESM support yet :(

  const vault = ns.ex
  const customMappers = {
    'is a': ns.rdf.type, 'are': ns.rdf.type, 'foaf:knows': ns.foaf.knows,
  }
  const context = await createContext({
    basePath: resolve(inputDirectory),
    baseNamespace: vault,
    mappers: customMappers,
  })

  const dataset = await ingestDataset(context)
  return {
    dataset, context,
  }
}

class Ingest {
  async getData (inputDirectory) {
    if (!this.data) {
      this.data = await getTriples(inputDirectory)
    }
    return this.data
  }
}

module.exports = {
  Ingest,
}

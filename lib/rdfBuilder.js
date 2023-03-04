const { resolve } = require('path')
const {readFile} = require('fs/promises')

async function getTriples (dir) {

  console.log('Processing ', dir)

  // It seems eleventy does not support ESM support yet :(

  const {
    createTriplifier
  } = await import('vault-triplifier')

  const rdfExt  = await import('rdf-ext')
  const rdf = rdfExt.default

  const ns = {
    rdf: rdf.namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#'),
    schema: rdf.namespace('http://schema.org/'),
    xsd: rdf.namespace('http://www.w3.org/2001/XMLSchema#'),
    rdfs: rdf.namespace('http://www.w3.org/2000/01/rdf-schema#'),
    ex: rdf.namespace('http://example.org/'),
    dot: rdf.namespace('http://pkm-united.org/'),
  }

  const triplifier = await createTriplifier(dir)


  const triplifyOptions = {
    baseNamespace: ns.ex,
    addLabels: true,
    includeWikipaths: false,
    splitOnHeader: false,
    namespaces: ns,
    customMappings:{
      'lives in': ns.schema.address,
      'are': ns.rdf.type,
    }
  }

  const dataset = rdf.dataset()

  for (const file of triplifier.getFiles()) {
    const text = await readFile(resolve(dir, file), 'utf8')
    const pointer = triplifier.toRDF(text, { path: file }, triplifyOptions)
    console.log('file:', file, pointer.dataset.size, 'quads')
    for (const quad of pointer.dataset){
      dataset.add(quad)
    }
  }

  return {
    triplifier, triplifyOptions, dataset, ns
  }
}

class Ingest {
  async getData ({ inputDir }) {
    if (!this.data) {
      this.data = await getTriples(inputDir)
    }
    return this.data
  }
}

module.exports = {
  Ingest,
}

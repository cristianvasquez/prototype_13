const attrs = require('markdown-it-attrs')
const footnote = require('markdown-it-footnote')
const Plugin = require('markdown-it-regexp')
const markdownIt = require('markdown-it')
const { Ingest } = require('./rdfBuilder.js')

function addRDFSupport (eleventyConfig) {

  const ingest = new Ingest()
  let data = null

  eleventyConfig.on('eleventy.before', async ({ inputDir }) => {
    console.log('eleventy.before')
    ingest.data = undefined
    data = (await ingest.getData({ inputDir: 'src' }))
  })

  eleventyConfig.addGlobalData('rdfData', async () => {
    return await ingest.getData({ inputDir: 'src' })
  })

  /**
   * A map of markdown_path was populated, that will be used to lookup for paths
   */
  function getPathByName (noteName) {
    const { triplifier } = data
    const { path } = triplifier.termMapper.getPathByName(noteName) ?? {path:''}
    return path.endsWith('.md') ? '/'+path.replace(/\.md$/, '') : path;
  }

  // Goes from [[Alice]] to <a href='/somewhere/Alice'>
  const wikilinks = Plugin(// Detects Wikilinks like [[Hello]]
    /^\s?\[\[([^\[\]\|\n\r]+)(\|[^\[\]\|\n\r]+)?\s?\]\]/,
    function (match, utils) {
      const parts = match[0].slice(2, -2).split('|')
      parts[0] = parts[0].replace(/.(md|markdown)\s?$/i, '')
      const text = (parts[1] || parts[0]).trim()
      const url = getPathByName(parts[0])
      return `<a class="internal" href="${url}">${text}</a>`
    })

  // Goes from [[file.pdf]] to <object data="/somewhere/file.pdf" type="application/pdf"/>
  const wikilinksResources = Plugin(// Detects misc resources like a pdf or an image
    /^\s?!\[\[([^\[\]\n\r]+)\]\]/, function (match, utils) {
      let parts = match[1].split('|')

      let url = getPathByName(parts[0])

      if (parts[0].toLowerCase().endsWith('.pdf')) {
        // Handle PDF
        return `<object data="${url}" type="application/pdf" style="min-height:100vh;width:100%"></object>`
      } else {
        // Handle images
        url = `/${url}`
        let clazz = ''
        if (parts[1]) {
          clazz = 'class="' + parts[1] + '"'
        }
        let size = ''
        if (parts[2]) {
          size = 'width="' + parts[2] + '"'
        }
        return `<img ${clazz} ${size} src='${url}'  alt='${url}'/>`
      }
    })

  const markdownItOptions = {
    html: true, linkify: true,
  }

  eleventyConfig.addFilter('shrink', function (term) {

    if (term.constructor.name !== 'NamedNode') {
      return term.value
    }
    const candidates = Array.from(Object.entries(data.ns)).
      filter(([_, value]) => {
        return term.value.startsWith(value().value)
      })
    if (candidates.length) {
      candidates.sort(([, iri1], [, iri2]) => iri2.length - iri1.length)
      const found = candidates[0]
      const label = term.value.replace(new RegExp(`^${found[1]().value}`),
        `${found[0]}:`)
      return `<a href="#">${label}</a>`
    }
    return `<a href="#">${term.value}</a>`
  })

  const md = markdownIt(markdownItOptions).
    use(footnote).
    use(attrs).
    use(wikilinksResources).
    use(wikilinks)

  eleventyConfig.setLibrary('md', md)

}

module.exports = {
  addRDFSupport,
}

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
    data = await ingest.getData(inputDir)
  })

  eleventyConfig.addGlobalData('dataset', async () => {
    const result = await ingest.getData('src')
    return result.dataset
  })

  eleventyConfig.addGlobalData('uriResolver', async () => {
    const result = await ingest.getData('src')
    return result.context.uriResolver
  })

  /**
   * A map of markdown_path was populated, that will be used to lookup for paths
   */
  function getPathByName (noteName) {
    let result = ''

    const namesPaths = data.context.index.namesPaths
    const markdown_paths = namesPaths.get(noteName)
    if (markdown_paths !== undefined && markdown_paths.size === 1) {
      // one and only one markdown found
      result = `${markdown_paths.values().next().value.trim()}`
      result = result.startsWith('.') ? result.slice(1) : result
      result = result.endsWith('.md') ? result.slice(0, -3) : result
    } else {
      console.error('found', markdown_paths, `for ${noteName}`)
      console.log('Disambiguation not implemented in this demo')
    }
    return result
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

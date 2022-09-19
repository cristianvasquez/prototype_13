const { titleCase } = require("title-case")
const clownface = require('clownface')

module.exports = {
  eleventyComputed: {
    title: (data) => titleCase(data.title || data.page.fileSlug),

    quadsIn: async (data) => {
      const dataset = data.dataset
      const term = data.uriResolver.getUriFromName(
        data.page.fileSlug)
      return term?dataset.match(null,null,term):undefined
    },
    quadsOut: async (data) => {
      const dataset = data.dataset
      const term = data.uriResolver.getUriFromName(
        data.page.fileSlug)
      return term?dataset.match(term,null,null):undefined
    },
  }
}

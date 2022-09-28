const { titleCase } = require("title-case")

module.exports = {
  eleventyComputed: {
    title: (data) => titleCase(data.title || data.page.fileSlug),
    quadsIn: (data) => {
      const { dataset, context } = data.rdfData
      const term = context.uriResolver.getUriFromName(data.page.fileSlug)
      if (!term) {
        return []
      }
      return [...dataset].filter(quad => quad.object.equals(term))
    },
    quadsOut: (data) => {
      const { dataset, context } = data.rdfData
      const term = context.uriResolver.getUriFromName(data.page.fileSlug)
      if (!term) {
        return []
      }
      return [...dataset].filter(quad => quad.subject.equals(term))
    },
  }
}

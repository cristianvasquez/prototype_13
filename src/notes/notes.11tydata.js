const { titleCase } = require("title-case")

module.exports = {
  eleventyComputed: {
    title: (data) => titleCase(data.title || data.page.fileSlug),
    quadsIn: (data) => {
      const { triplifier, dataset, context, triplifyOptions} = data.rdfData

      const { path } = triplifier.termMapper.getPathByName(data.page.fileSlug) ?? {path:''}
      const term = triplifier.termMapper.pathToUri(path, triplifyOptions)

      if (!term) {
        return []
      }

      return [...dataset].filter(quad => quad.object.equals(term))
    },
    quadsOut: (data) => {
      const { triplifier, dataset, context, triplifyOptions} = data.rdfData
      const { path } = triplifier.termMapper.getPathByName(data.page.fileSlug) ?? {path:''}
      const term = triplifier.termMapper.pathToUri(path, triplifyOptions)
      if (!term) {
        return []
      }
      return [...dataset].filter(quad => quad.subject.equals(term))
    },
  }
}

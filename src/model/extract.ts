import { split as varnameSplit } from 'varname'
import { config, isPhraseExcluded } from '~/config'

export function *extractPhrases(text: string) {
  // Here we create a regex inside the closure to avoid `lastIndex` pollution across iterations
  const regex = /[\w|-]{2,}/g
  let match: RegExpExecArray | null
  regex.lastIndex = 0

  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(text))) {
    let phrase = match[0]
    if (!phrase)
      continue

    if (isPhraseExcluded(phrase))
      continue

    const translatedPhrase = config.customTranslations[phrase.toLowerCase()]
    if (translatedPhrase) {
      yield {
        translated: true,
        phrase: translatedPhrase,
        match,
        regex,
      }
      continue
    }

    // Split variable name into parts
    let nameParts = varnameSplit(phrase)
    // If all parts are excluded, skip this key
    if (nameParts.length > 1 && nameParts.every(part => isPhraseExcluded(part)))
      continue

    const translated = nameParts.every(part => config.customTranslations[part.toLowerCase()] !== undefined)
    nameParts = nameParts.map(part => config.customTranslations[part.toLowerCase()] || part)

    // Join the parts back as a sentence
    // TODO distinguish whether the language uses spaces to separate words.
    phrase = nameParts.join(translated ? '' : ' ')

    yield {
      translated,
      phrase,
      match,
      regex,
    }
  }
}

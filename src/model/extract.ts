import { split as varnameSplit } from 'varname'
import { isPhraseExcluded } from '~/config'

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

    // Split variable name into parts
    const nameParts = varnameSplit(phrase)
    // If all parts are excluded, skip this key
    if (nameParts.every(part => isPhraseExcluded(part)))
      continue
    // Join the parts back as a sentence
    phrase = nameParts.join(' ')

    yield {
      phrase,
      match,
      regex,
    }
  }
}

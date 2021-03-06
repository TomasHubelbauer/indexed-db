export default function extractTags(/** @type {string} */ title, /** @type {string[]} */ tags = []) {
  title = title.trim();
  const regex = /(^| )((?<tag>[-+][\w(\p{Emoji}\p{Emoji_Component}?)-]+)( |$))+$/u;
  const match = regex.exec(title);
  if (match) {
    const modifiers = title.slice(match.index).trim().split(/ /g);
    title = title.slice(0, -match[0].length).trim();
    for (const modifier of modifiers) {
      const tag = modifier.slice('±'.length);
      switch (modifier[0]) {
        case '+': {
          if (!tags.includes(tag)) {
            tags.push(tag);
          }

          break;
        }
        case '-': {
          tags = tags.filter(t => t !== tag);
          break;
        }
        default: {
          throw new Error('Tag modifier must start with + or -.');
        }
      }
    }

    tags.sort();
  }

  return { title, tags };
}

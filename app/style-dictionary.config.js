import StyleDictionary from 'style-dictionary';
import { usesReferences, getReferences } from 'style-dictionary/utils';

// Tailwind v4 reads theme tokens from an `@theme { ... }` block instead of a JS
// config file. This format wraps the filtered token set in that block so the
// generated file can be @import-ed straight into index.css.
StyleDictionary.registerFormat({
  name: 'css/theme',
  format: ({ dictionary }) => {
    const lines = dictionary.allTokens.map((token) => {
      let value = token.$value;
      if (usesReferences(token.original.$value)) {
        const [ref] = getReferences(token.original.$value, dictionary.tokens, { usesDtcg: true });
        if (ref) value = `var(--${ref.path.join('-')})`;
      }
      return `  --${token.path.join('-')}: ${value};`;
    });
    return [
      '/**',
      ' * Do not edit directly, this file was auto-generated.',
      ' * Tailwind v4 theme tokens — imported by index.css.',
      ' */',
      '',
      '@theme {',
      ...lines,
      '}',
      '',
    ].join('\n');
  },
});

const isThemeable = (token) => ['color', 'spacing', 'radius'].includes(token.path[0]);

export default {
  source: ['tokens/tokens.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'src/styles/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: {
            outputReferences: true,
          },
        },
      ],
    },
    tailwind: {
      transformGroup: 'css',
      buildPath: 'src/styles/',
      files: [
        {
          destination: 'theme.css',
          format: 'css/theme',
          filter: isThemeable,
          options: {
            outputReferences: true,
          },
        },
      ],
    },
  },
};

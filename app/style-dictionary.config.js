import StyleDictionary from 'style-dictionary';
import { usesReferences, getReferences } from 'style-dictionary/utils';

// Structural mode/tier segments that shouldn't appear in the CSS variable name
// for the "live" Tailwind theme — dark-mode values are intentionally excluded
// from this output (captured in tokens.json under color.dark.*, not yet wired
// into a runtime dark-mode override).
const STRUCTURAL_SEGMENTS = new Set(['primitive', 'light']);
const cleanPath = (path) => path.filter((p) => !STRUCTURAL_SEGMENTS.has(p));

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
        if (ref) value = `var(--${cleanPath(ref.path).join('-')})`;
      }
      return `  --${cleanPath(token.path).join('-')}: ${value};`;
    });
    return [
      '/**',
      ' * Do not edit directly, this file was auto-generated.',
      ' * Tailwind v4 theme tokens — imported by index.css.',
      ' * Light-mode values only; dark-mode values live in tokens.json',
      ' * (color.dark.*) but are not wired into a runtime override yet.',
      ' */',
      '',
      '@theme {',
      ...lines,
      '}',
      '',
    ].join('\n');
  },
});

const isThemeable = (token) => {
  const [category, sub] = token.path;
  if (category === 'color') return sub === 'primitive' || sub === 'light' || sub === 'brand';
  return category === 'spacing' || category === 'radius';
};

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

import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: ['dist', '*.md', '*.yml'],
  stylistic: {
    indent: 2,
    quotes: 'single',
    semi: false,
  },
})

module.exports = {
  presets: [
    ['@vue/app', {
      modules: false,
      useBuiltIns: 'usage'
    }]
  ],
  plugins: [
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator'
  ]
}

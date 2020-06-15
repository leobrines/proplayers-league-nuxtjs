export default {
  mode: 'spa',
  /*
   ** Headers of the page
   */
  head: {
    title: process.env.npm_package_name || '',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: process.env.npm_package_description || ''
      }
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
  },
  /*
   ** Customize the progress-bar color
   */
  loading: { color: '#fff' },
  /*
   ** Global CSS
   */
  css: [],
  /*
   ** Plugins to load before mounting the App
   */
  plugins: [],
  /*
   ** Nuxt.js dev-modules
   */
  buildModules: [
    // Doc: https://github.com/nuxt-community/eslint-module
    '@nuxtjs/eslint-module'
  ],
  /*
   ** Nuxt.js modules
   */
  modules: [
    // Doc: https://buefy.github.io/#/documentation
    'nuxt-buefy',
    // Doc: https://github.com/nuxt-community/dotenv-module
    '@nuxtjs/dotenv',
    [
      '@nuxtjs/firebase',
      {
        config: {
          apiKey: process.env.REACT_APP_FIREBASE_APIKEY,
          authDomain: process.env.REACT_APP_FIREBASE_AUTHDOMAIN,
          databaseURL: process.env.REACT_APP_FIREBASE_DATABASEURL,
          projectId: process.env.REACT_APP_FIREBASE_PROJECTID,
          storageBucket: process.env.REACT_APP_FIREBASE_STORAGEBUCKET,
          messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGESENDERID,
          appId: process.env.REACT_APP_FIREBASE_APPID
        },
        onFirebaseHosting: true,
        services: {
          storage: true
        }
      }
    ]
  ],
  /*
   ** Build configuration
   */
  build: {
    /*
     ** You can extend webpack config here
     */
    extend(config, ctx) {}
  }
}

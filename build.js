{
  appDir: "./remora/",
  baseUrl: "./",
  paths: {
    "underscore": "empty:",
    "remora": "./"
  },
  dir: "./build/",
  optimize: "none",
  inlineText: true,

  modules: [
    {
      name: "remora/remora",
      exclude: ["remora/evaler"],
    },
  ],
}

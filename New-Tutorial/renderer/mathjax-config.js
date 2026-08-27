window.MathJax = {
  loader: {
    load: ["ui/safe"],
  },
  tex: {
    inlineMath: [["\\(", "\\)"]],
    displayMath: [["\\[", "\\]"], ["$$", "$$"]],
    processEscapes: true,
    processEnvironments: false,
    processRefs: false,
  },
  options: {
    enableMenu: false,
    skipHtmlTags: ["script", "noscript", "style", "textarea", "pre", "code"],
    safeOptions: {
      allow: {
        URLs: "safe",
        classes: "safe",
        cssIDs: "safe",
        styles: "safe",
      },
      safeProtocols: {
        http: true,
        https: true,
        mailto: true,
        file: false,
        javascript: false,
        data: false,
      },
    },
  },
  svg: {
    fontCache: "global",
  },
};

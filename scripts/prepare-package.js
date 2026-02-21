const fs = require("fs");
const path = require("path");

const packageJson = require("../package.json");

const libPackageJson = {
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
  main: "./index.js",
  types: "./index.d.ts",
  exports: {
    ".": {
      types: "./index.d.ts",
      require: "./index.js",
      default: "./index.js",
    },
  },
  keywords: packageJson.keywords,
  author: packageJson.author,
  license: packageJson.license,
  repository: packageJson.repository,
  bugs: packageJson.bugs,
  homepage: packageJson.homepage,
  publishConfig: packageJson.publishConfig,
  engines: packageJson.engines,
  peerDependencies: { ...packageJson.peerDependencies },
  scripts: {},
  dependencies: {},
  devDependencies: {},
};

const libDir = path.join(__dirname, "..", "lib");
fs.writeFileSync(
  path.join(libDir, "package.json"),
  JSON.stringify(libPackageJson, null, 2)
);
fs.copyFileSync(
  path.join(__dirname, "..", "README.md"),
  path.join(libDir, "README.md")
);
fs.copyFileSync(
  path.join(__dirname, "..", "LICENSE"),
  path.join(libDir, "LICENSE")
);

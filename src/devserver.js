const { createServer } = require("http");
const path = require("path"),
  fs = require("fs");
const { URL } = require("url");

// Ideally need an alternative to this at some point in the future.
const ModuleServer = require("moduleserve/moduleserver");
const { handleCollabRequest } = require("./collab/server/server");
// An old depreciated static file server middleware. Needs to be scrapped.
const ecstatic = require("ecstatic");
const { buildFile } = require("./build/buildfile");
// Marjin's ES6 -> CommonJS converter, imports into requires.
const tariff = require("tariff");

let port = 8008;
const root = path.resolve(__dirname, "../public/");

// So I think the joke here is when you call usage 0 for help it does literally nothing.
function usage(status) {
  console.log("Usage: demoserver [--port PORT] [--help]");
  process.exit(status);
}

for (let i = 2; i < process.argv.length; i++) {
  let arg = process.argv[i];
  if (arg == "--port") port = +process.argv[++i];
  else if (arg == "--help") usage(0);
  else usage(1);
}

let moduleServer = new ModuleServer({
  root,
  // If the module path doesn't end in json, run it through tariff,
  // which is marjin's ES6 converter to CommonJS modules
  transform(path, content) {
    return /\.json$/.test(path) ? content : tariff(content);
  },
});
// estatic is unmaintained and depreciated, need different middleware.
let fileServer = ecstatic({
  root: root,
});

function transformPage(req, resp) {
  let path = new URL(req.url, "http:/localhost/").pathname;
  // The final chunk of a path ./directory"/THISSELECTED"
  let dir = /\/([^\.\/]+)?$/.exec(path);
  if (dir) path = (dir[1] ? path : path.slice(0, -1)) + "/index.html";

  if (!/\.html$/.test(path)) return false;

  let file = __dirname + "/../pages" + path,
    mdFile = file.replace(/\.html$/, ".md");
  if (!fs.existsSync(file) && fs.existsSync(mdFile)) file = mdFile;
  let text = buildFile(file).replace(
    /<script src="[^"]*prosemirror\.js"><\/script>\s+<script src="([^"]*\.js)"><\/script>/,
    function (_, script) {
      let base = path.replace(/\/[^\/]+$|^\//g, ""),
        full = /^\//.test(script) ? script : base + "/" + script;
      let name = /\/([^\/]*?)\/example\.js/.exec(full);
      let up = base ? base.replace(/[^\/]+/g, "..") + "/" : "";
      return `<script src="/moduleserve/load.js" data-module="./${up}../example/${name[1]}/index.js" data-require></script>`;
    }
  );
  resp.writeHead(200, {
    "Content-Type": "text/html",
  });
  resp.end(text);
  return true;
}

function maybeCollab(req, resp) {
  let url = req.url,
    backend = url.replace(/\/collab-backend\b/, "");
  if (backend != url) {
    req.url = backend;
    if (handleCollabRequest(req, resp)) return true;
    req.url = url;
  }
  return false;
}

// Chaining the different calls with ORs is interesting.
createServer((req, resp) => {
  maybeCollab(req, resp) ||
    moduleServer.handleRequest(req, resp) ||
    transformPage(req, resp) ||
    fileServer(req, resp);
}).listen(port);

console.log("Demo server listening on port " + port);

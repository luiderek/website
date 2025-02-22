const { parse } = require("url");

// A URL router for the server.
class Router {
  constructor() {
    this.routes = [];
  }

  add(method, url, handler) {
    this.routes.push({
      method,
      url,
      handler,
    });
  }

  // : (union<string, RegExp, Array>, string) → union<Array, null>
  // Check whether a route pattern matches a given URL path.
  match(pattern, path) {
    if (typeof pattern == "string") {
      if (pattern == path) return [];
    } else if (pattern instanceof RegExp) {
      let match = pattern.exec(path);
      return match && match.slice(1);
    } else {
      let parts = path.slice(1).split("/");
      if (parts.length && !parts[parts.length - 1]) parts.pop();
      if (parts.length != pattern.length) return null;
      let result = [];
      for (let i = 0; i < parts.length; i++) {
        let pat = pattern[i];
        if (pat) {
          if (pat != parts[i]) return null;
        } else {
          result.push(parts[i]);
        }
      }
      return result;
    }
  }

  // Resolve a request, letting the matching route write a response.
  resolve(request, response) {
    let parsed = parse(request.url, true);
    let path = parsed.pathname;
    request.query = parsed.query;

    return this.routes.some((route) => {
      let match = route.method == request.method && this.match(route.url, path);
      if (!match) return false;

      let urlParts = match.map(decodeURIComponent);
      route.handler(request, response, ...urlParts);
      return true;
    });
  }
}
exports.Router = Router;

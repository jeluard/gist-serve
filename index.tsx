type Gist = {
  id: string;
  url: string;
  files: Record<string, GistFile>;
}

type GistFile = {
  filename: string;
  type: string;
  language: string;
  raw_url: string;
  size: number;
}

async function listGists(username: string): Promise<Array<Gist>> {
  const url = `https://api.github.com/users/${username}/gists`;
  const response = await fetch(url);
  return await response.json();
}

function error(message: string, status: number = 400): Response {
  const response = new Response(message, {status});
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  return response;
}

function contentTypeFor(filename: string): string {
  if (filename.endsWith('js')) {
    return 'application/javascript';
  }
  return 'text/plain';
}

const server = Bun.serve({
  port: 3000,
  async fetch(request) {
    const [username, gisthash, filename, ...fragments] = new URL(request.url).pathname.split('/').filter(Boolean);
    if (!username) {
      return error('Missing username');
    }
    if (!gisthash) {
      return error('Missing gisthash');
    }
    if (fragments.length > 0) {
      return error(`Too many arguments: ${fragments}`);
    }
    const gists = await listGists(username);
    if (gists.length === 0) {
      return error(`No public gists for ${username}`);
    }
    const gist = gists.find(({id}) => id === gisthash);
    if (!gist) {
      return error(`No gist with id ${gisthash}`);
    }
    const files = Object.values(gist.files);
    const file = filename ? files.find(file => file.filename === filename) : files[0];
    if (!file) {
      return error(filename ? `No file named ${filename}` : `No files`);
    }
    const fileUrl = file['raw_url'];
    const resp = await fetch(fileUrl);
    const res = new Response(await resp.text(), {headers: {
      "content-type": contentTypeFor(file.filename),
    }});
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    return res;
  },
});

console.log(`Listening on localhost:${server.port}`);

export {};
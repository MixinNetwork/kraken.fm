const fs = require('node:fs');
const fsp = require('node:fs/promises');
const https = require('node:https');
const os = require('node:os');
const path = require('node:path');

const rootDir = __dirname;
const certDir = path.join(rootDir, '.devcert');
const keyPath = path.join(certDir, 'localhost-key.pem');
const certPath = path.join(certDir, 'localhost-cert.pem');
const port = Number(process.env.HTTPS_PORT || 8443);
const host = process.env.HTTPS_HOST || '0.0.0.0';

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

function getContentType(filePath) {
  return mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function getRequestPath(urlPathname) {
  const decodedPath = decodeURIComponent(urlPathname.split('?')[0]);
  const normalizedPath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, '');
  const relativePath = normalizedPath === path.sep ? 'index.html' : normalizedPath.replace(/^[/\\]+/, '');
  return path.join(rootDir, relativePath || 'index.html');
}

async function resolveFilePath(urlPathname) {
  const requestedPath = getRequestPath(urlPathname);
  let stat;
  try {
    stat = await fsp.stat(requestedPath);
  } catch (error) {
    return null;
  }
  if (stat.isDirectory()) {
    const indexPath = path.join(requestedPath, 'index.html');
    try {
      await fsp.access(indexPath, fs.constants.R_OK);
      return indexPath;
    } catch (error) {
      return null;
    }
  }
  return requestedPath;
}

function getNetworkUrls(serverPort) {
  const urls = [`https://localhost:${serverPort}`];
  const interfaces = os.networkInterfaces();
  Object.values(interfaces).forEach((items) => {
    (items || []).forEach((item) => {
      if (!item || item.internal) {
        return;
      }
      if (item.family === 'IPv4') {
        urls.push(`https://${item.address}:${serverPort}`);
      }
    });
  });
  return Array.from(new Set(urls));
}

async function createServer() {
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.error('Missing development certificate.');
    console.error('Run `npm run cert:https` first.');
    process.exit(1);
  }

  const options = {
    key: await fsp.readFile(keyPath),
    cert: await fsp.readFile(certPath)
  };

  const server = https.createServer(options, async (req, res) => {
    try {
      const filePath = await resolveFilePath(req.url || '/');
      if (!filePath) {
        res.writeHead(404, {
          'Cache-Control': 'no-store',
          'Content-Type': 'text/plain; charset=utf-8'
        });
        res.end('Not Found');
        return;
      }

      const body = await fsp.readFile(filePath);
      res.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Type': getContentType(filePath)
      });
      res.end(body);
    } catch (error) {
      console.error('Request failed', error);
      res.writeHead(500, {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain; charset=utf-8'
      });
      res.end('Internal Server Error');
    }
  });

  server.on('error', (error) => {
    console.error('Failed to start HTTPS dev server.');
    console.error(error);
    process.exit(1);
  });

  server.listen(port, host, () => {
    const address = server.address();
    const serverPort = typeof address === 'object' && address ? address.port : port;
    console.log('Kraken HTTPS dev server is running.');
    console.log('Certificate:', certPath);
    getNetworkUrls(serverPort).forEach((url) => console.log(url));
  });
}

createServer().catch((error) => {
  console.error(error);
  process.exit(1);
});

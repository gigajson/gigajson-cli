# gigajson

Open a local JSON file in [GigaJSON](https://gigajson.com/) from your terminal.

```sh
npx gigajson orders.json
```

GigaJSON is a JSON viewer and editor that runs in the browser. It shows a file as a tree, a table or a graph, runs JSONPath, JMESPath and jq queries, and compares files. It handles files up to 1 GB. This command hands it a file from your computer, so you don't have to find the file again in a browser dialog.

## Usage

```sh
npx gigajson <file>              # open a file
<command> | npx gigajson         # open what another command prints
```

Examples:

```sh
npx gigajson data/export.json
npx gigajson logs.ndjson
curl -s https://api.github.com/repos/nodejs/node | npx gigajson
kubectl get pods -o json | npx gigajson
```

To install it once instead of using `npx` each time:

```sh
npm install -g gigajson
gigajson orders.json
```

### Options

| Option | What it does |
|---|---|
| `--no-open` | Print the link instead of opening a browser |
| `-v`, `--version` | Print the version |
| `-h`, `--help` | Print the usage |

## How it works

1. The command starts a small web server on `127.0.0.1`, on a free port, and serves only your file. The file's address has a random 32-character path, so no other page can guess it.
2. It opens `https://gigajson.com/app/?open=<that address>` in your default browser.
3. The app downloads the file from your computer and opens it. The app accepts only `127.0.0.1` and `[::1]` addresses in `?open=`, so a link can't make it fetch a file from anywhere else.
4. The command stops a minute after the file has been sent, or after 5 minutes if nothing asked for it. Press Ctrl+C to stop it sooner.

The file goes from your disk to your browser and is never uploaded. GigaJSON keeps it in your browser's storage, like a file you open on the site.

The server answers only the GigaJSON origin (CORS) and refuses every other path with a 404. It reads the file from disk for each request, so its memory stays around 100 MB whatever the file's size. Input from stdin is held in memory until the browser has fetched it.

## The local network prompt in Chrome

The first time, Chrome may ask whether gigajson.com may access devices on your local network. Allow it: the device is this command, on your own computer. Chrome remembers the answer. If you block it, the file can't reach the app. You can change the setting from the icon at the left of the address bar.

## Formats and limits

- JSON and JSON Lines: up to 1 GB. The app's default limit is 512 MB; raise it in Preferences → Largest document.
- CSV, YAML and XML: CSV and YAML up to 128 MB, XML up to 1 GB.
- The format is detected from the content, not the file name.
- Measured in Chrome on a desktop (Linux, headless): a 100 MB file opens in about 2 seconds, 500 MB in about 12 seconds, 1 GB in about 34 seconds.

Tested in Chrome. Other browsers may refuse to let a secure page read from `http://127.0.0.1`. If yours does, open the file from the site with Open a file.

## Requirements

Node.js 18 or later. No dependencies.

## Development

```sh
npm test                                    # starts the command, checks what it serves
GIGAJSON_APP=http://localhost:5173/app/ node bin/gigajson.mjs file.json   # use another copy of the app
```

## License

MIT

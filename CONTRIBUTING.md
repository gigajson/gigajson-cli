# Contributing

Thanks for helping. A few things to know first.

## Before you start

- For a bug, open an issue with the command you ran, your OS, Node version and browser, and what happened.
- For a new feature or a bigger change, open an issue first so we can agree on it before you write code.
- Small fixes (typos, clearer messages) can go straight to a pull request.

## Making a change

1. Fork the repo and create a branch from `main`.
2. Keep it to plain Node.js with no dependencies. The command has to start fast with `npx`.
3. Run `npm test` and make sure it prints `ok`. Add a check to `test.mjs` for what you changed.
4. Open a pull request that says what changed and why.

`main` is protected: nobody pushes to it directly. Every pull request is reviewed and merged by the maintainer.

## Releases

The maintainer bumps `version` in `package.json` in a pull request, then publishes a GitHub release tagged `v<version>`. The release runs `.github/workflows/publish.yml`, which tests the package and stages it on npm with provenance. The version goes live once the maintainer approves it on npmjs.com with 2FA. Nobody publishes from their own computer.

## Security

The command serves a file from your computer, so changes to what it serves, to whom (CORS) or for how long get a close review. Please report security problems privately, as described in [SECURITY.md](SECURITY.md), not in a public issue.

## License

By contributing, you agree that your contribution is licensed under the MIT License.

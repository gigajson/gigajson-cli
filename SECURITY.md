# Security

## Reporting a problem

Please don't open a public issue for a security problem. Report it privately: on this repository's **Security** tab, click **Report a vulnerability**. You'll get an answer within a week.

## What the command does

`gigajson` serves one file on `127.0.0.1` under a random 32-character path. It answers CORS requests only from https://gigajson.com, refuses every other path, and stops a minute after the file is sent (or after 5 minutes if nothing asks for it). The GigaJSON app only fetches `?open=` addresses on `127.0.0.1` or `[::1]`.

Problems worth reporting include: another site or local user reading the file, the server serving anything other than the one file, or the app fetching a non-local address through `?open=`.

## Supported versions

Only the latest version on npm gets fixes.

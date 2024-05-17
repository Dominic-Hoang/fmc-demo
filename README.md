## Installation

To run this app, you only need `docker` and `docker compose`.

## Running the app

Before running the app, ensure to update the environment variables in the `.env` file. You can copy the `.env.sample` file and make the following changes:


- `GOOGLE_OAUTH2_CLIENT_ID`: Replace with the client ID registered on the Google API console.
- `GOOGLE_OAUTH2_CLIENT_SECRET`: Replace with the client secret associated with the client ID.
- `GOOGLE_OAUTH2_REDIRECT_URL`: Replace with the registered redirect URL of the app.
- `JWT_SECRET`: Replace with a random confidential string, with a minimum length of 20 characters, used for signing access tokens and for internal verification of JWTs.
- `SMTP_HOST`: The hostname or IP address of the SMTP server used for sending emails.
- `SMTP_PORT`: The port number on which the SMTP server is listening. Typically, this is port 587 for TLS, port 465 for SSL.
- `SMTP_USER`: The username required to authenticate with the SMTP server.
- `SMTP_PASSWORD`: The password required to authenticate with the SMTP server.

Then run:

```bash
# development
$ docker compose watch
```

This app utilizes Docker Compose's watch feature, leveraging Docker bind mount for file system synchronization. This enables seamless development, with automatic server restarts upon file changes. Docker Compose handles all necessary components for local development setup.


## Test

```bash
docker compose exec api npm run test:e2e
```

## Stay in touch

- Author - Dominic Hoang (hoang.minhhiep@outlook.com)

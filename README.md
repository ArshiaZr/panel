## Setup

The Express application requires a `.env` file and a public/private keypair.  In the root of the project, create a `.env` file and put the following into it:

```
NODE_ENV=development
DB_STRING=<your db string>
DB_STRING_PROD=<your db string>
```
Next, you will need to generate a public/private keypair.  The `.gitignore` automatically ignores the private key.

```
node generateKeypair.js
```

Note that to run the script, you will need a NodeJS version greater than v10.x.

## Quickstart

To start the app, you will need to run an Express server.
```
# Start the Express server (http://localhost:3000)
node app.js
```

## Docker

To start the app with docker, you just need to run:
```
docker compose up
```
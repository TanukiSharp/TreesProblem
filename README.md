# Overview

This is a logical problem we ask in interviews.

## Build

```sh
cd web/tooling
nvm use
npm install
npm run build
```

## Publish

```psh
cd web/tooling
Compress-Archive -Path ../dist/* -DestinationPath dist.zip -Force
az webapp deploy --resource-group trees-problem_group --name trees-problem --type zip --src-path ./dist.zip
# Optionally.
rm ./dist.zip
```

For some reason, when zipping with `zip` command on Ubuntu in WSL2, it produces an empty/invalid ZIP file.<br/>
`7zip` was too complicated to get something simple done.<br/>
Fuck them both.

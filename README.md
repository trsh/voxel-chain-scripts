1) Clone repo
2) `npm i`
3) `npm run server`
4) Open http://localhost:3000/?userId=1&worldId=1
5) Open another terminal
4) `npm run build:watch`
5) Edit `src/main.ts`
6) See changes on http://localhost:3000/?userId=1&worldId=1 in few secs

What is happening:

1) User edits typescript source
2) It is compiled to js and ziped
3) Sent to server
4) Server unzips and puts in file tree structure
5) Server notifies it's client to refresh with this new javascript
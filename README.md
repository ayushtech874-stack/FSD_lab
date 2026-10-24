# FSD_lab
Curriculum related discussions

## Run the persistent React counter

The React page and its Node.js backend are both in the `reactjs` folder. The
backend stores the shared counter in `reactjs/counter.json` so it keeps its
value after a page reload.

1. In a terminal, run `cd reactjs && node server.js` (or run `node reactjs/server.js` from the project root).
2. Open [http://localhost:3000](http://localhost:3000).

The backend uses only Node.js built-in modules; no package installation is
needed. Use the **Reset** button to set the saved counter back to zero.

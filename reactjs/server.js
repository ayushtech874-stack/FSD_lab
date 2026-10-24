const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const port = Number(process.env.PORT) || 3000;
const counterFile = path.join(__dirname, "counter.json");
const pageFile = path.join(__dirname, "exercise3.html");

if (!fs.existsSync(counterFile)) {
    fs.writeFileSync(counterFile, JSON.stringify({ value: 0 }, null, 2));
}

function readCounter() {
    const saved = JSON.parse(fs.readFileSync(counterFile, "utf8"));

    if (!Number.isSafeInteger(saved.value)) {
        throw new Error("The saved counter value is invalid.");
    }

    return saved.value;
}

function saveCounter(value) {
    const temporaryFile = `${counterFile}.tmp`;
    fs.writeFileSync(temporaryFile, JSON.stringify({ value }, null, 2));
    fs.renameSync(temporaryFile, counterFile);
}

function sendJson(response, statusCode, body) {
    response.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
    });
    response.end(JSON.stringify(body));
}

async function readJson(request) {
    const chunks = [];
    let size = 0;

    for await (const chunk of request) {
        size += chunk.length;

        if (size > 1024) {
            const error = new Error("Request body is too large.");
            error.statusCode = 413;
            throw error;
        }

        chunks.push(chunk);
    }

    try {
        return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
        const error = new Error("Request body must be valid JSON.");
        error.statusCode = 400;
        throw error;
    }
}

const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

    try {
        if (url.pathname === "/api/counter" && request.method === "GET") {
            sendJson(response, 200, { counter: readCounter() });
            return;
        }

        if (url.pathname === "/api/counter" && request.method === "POST") {
            const body = await readJson(request);

            if (body === null || typeof body !== "object" || Array.isArray(body)) {
                sendJson(response, 400, { error: "Request body must be a JSON object." });
                return;
            }

            const { action } = body;

            if (!["increment", "decrement", "reset"].includes(action)) {
                sendJson(response, 400, { error: "Action must be increment, decrement, or reset." });
                return;
            }

            const currentValue = readCounter();
            const nextValue = action === "increment"
                ? currentValue + 1
                : action === "decrement"
                    ? currentValue - 1
                    : 0;

            if (!Number.isSafeInteger(nextValue)) {
                sendJson(response, 409, { error: "Counter reached its supported limit." });
                return;
            }

            saveCounter(nextValue);
            sendJson(response, 200, { counter: nextValue });
            return;
        }

        if (request.method === "GET" && ["/", "/exercise3.html"].includes(url.pathname)) {
            response.writeHead(200, {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "no-store",
            });
            fs.createReadStream(pageFile).pipe(response);
            return;
        }

        sendJson(response, 404, { error: "Not found." });
    } catch (error) {
        if (response.headersSent) {
            response.destroy(error);
            return;
        }

        if (error.statusCode) {
            sendJson(response, error.statusCode, { error: error.message });
            return;
        }

        console.error("Request failed:", error);
        sendJson(response, 500, { error: "The server could not process the request." });
    }
});

server.listen(port, () => {
    console.log(`Counter app is running at http://localhost:${port}`);
});

import { Agent, request } from "https";

/** Responses larger than this are refused, so a misbehaving server cannot fill the memory. */
const DEFAULT_MAX_BYTES = 25 * 1024 * 1024;

interface HttpsOptions {
	body?: object;
	endpoint?: string;
	headers?: Record<string, string>;
	maxBytes?: number;
	method?: "GET" | "POST";
	responseType?: "json" | "stream" | "text";
	statusCode?: number;
	timeout?: number;
}

/** A failed request. JSON-serialises to `{ error, status }`, as it did when it was a plain object. */
function failure(error: string, status: number | undefined): Error & { error: string; status: number | undefined } {
	return Object.assign(new Error(error), { error, status });
}

const agent = new Agent({ keepAlive: true });

/**
 * Send HTTPS Request.
 * @async
 * @param {string} url
 * @param {HttpsOptions} options
 * @param {Object} [options.body]
 * @param {string} [options.endpoint]
 * @param {Record<string, string>} [options.headers]
 * @param {number} [options.maxBytes=26214400] - Largest response accepted, in bytes (25 MiB by default)
 * @param {("GET"|"POST")} [options.method="GET"]
 * @param {("json"|"stream"|"text")} [options.responseType="json"] - Expected response type.
 * @param {number} [options.statusCode] - Expected status code.
 * @param {number} [options.timeout] - Request Timeout in Milliseconds
 * @returns {Promise<Object|Buffer|string>} - Returns the response from the request.
 * @throws {Error} - If the request fails: it carries `error` (the reason) and `status` (the HTTP status, when there is one).
 */
export async function https(url: string, options: HttpsOptions = {}): Promise<object | Buffer | string> {
	const {
		body,
		endpoint,
		headers = { "Content-Type": "application/json" },
		maxBytes = DEFAULT_MAX_BYTES,
		method = "GET",
		responseType = "json",
		statusCode: expectedStatus,
		timeout = 5000,
	} = options;

	const { hostname, pathname, search, port } = new URL(url);

	// Hoisted so the timeout promise can call req.destroy().
	// The Promise executor below runs synchronously, so req is assigned before the race begins.
	let req!: ReturnType<typeof request>;

	const requestPromise = new Promise<object | Buffer | string>((resolve, reject) => {
		req = request({
			agent,
			headers,
			hostname,
			method,
			path: endpoint ?? (pathname + search),
			port: port ? parseInt(port, 10) : 443,
		}, (response) => {
			const chunks: Buffer[] = [];
			let received = 0;
			response.on("error", reject);
			response.on("data", (chunk: Buffer) => {
				received += chunk.length;
				if (received > maxBytes) {
					chunks.length = 0;
					req.destroy();
					return reject(failure("Response Too Large", response.statusCode));
				}
				chunks.push(chunk);
			});
			response.on("end", () => {
				if (expectedStatus !== undefined && response.statusCode !== expectedStatus)
					return reject(failure("Unexpected Status Code", response.statusCode));

				try {
					const data = Buffer.concat(chunks);
					chunks.length = 0;
					switch (responseType) {
						case "json":
							resolve(JSON.parse(data.toString()));
							break;
						case "stream":
							resolve(data);
							break;
						default:
							resolve(data.toString());
					}
				} catch (e) {
					reject(e instanceof Error ? e : new Error(String(e)));
				}
			});
		}).on("error", reject);

		if (body) req.write(JSON.stringify(body));
		req.end();
	});

	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeoutPromise = new Promise<never>((_, reject) => {
		timer = setTimeout(() => {
			req.destroy();
			reject(failure("Request Timed Out", 408));
		}, timeout);
	});

	return Promise.race([requestPromise, timeoutPromise])
		.finally(() => clearTimeout(timer));
}
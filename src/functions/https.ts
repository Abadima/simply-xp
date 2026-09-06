import { Agent, request } from "https";

interface HttpsOptions {
	body?: object;
	endpoint?: string;
	headers?: Record<string, string>;
	method?: "GET" | "POST";
	responseType?: "json" | "stream" | "text";
	statusCode?: number;
	timeout?: number;
}

// Shared keep-alive agent — reused across all requests for connection pooling
const agent = new Agent({ keepAlive: true });

/**
 * Send HTTPS Request.
 * @async
 * @param {string} url
 * @param {HttpsOptions} options
 * @param {Object} [options.body]
 * @param {string} [options.endpoint]
 * @param {Record<string, string>} [options.headers]
 * @param {("GET"|"POST")} [options.method="GET"]
 * @param {("json"|"stream"|"text")} [options.responseType="json"] - Expected response type.
 * @param {number} [options.statusCode] - Expected status code.
 * @param {number} [options.timeout] - Request Timeout in Milliseconds
 * @returns {Promise<Object|Buffer|string>} - Returns the response from the request.
 * @throws {PromiseRejectedResult} - If the request fails.
 */
export async function https(url: string, options: HttpsOptions = {}): Promise<object | Buffer | string> {
	const {
		body,
		endpoint,
		headers = { "Content-Type": "application/json" },
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
			response.on("error", reject);
			response.on("data", (chunk: Buffer) => chunks.push(chunk));
			response.on("end", () => {
				if (expectedStatus !== undefined && response.statusCode !== expectedStatus)
					return reject({ error: "Unexpected Status Code", status: response.statusCode });

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
					reject(e);
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
			reject({ error: "Request Timed Out", status: 408 });
		}, timeout);
	});

	return Promise.race([requestPromise, timeoutPromise])
		.finally(() => clearTimeout(timer));
}
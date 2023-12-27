import { Agent, request } from "https";
import { URL } from "url";

interface HttpsOptions {
	body?: object;
	endpoint?: string;
	headers?: Record<string, string>;
	method?: "GET" | "POST";
	responseType?: "json" | "stream" | "text";
	statusCode?: number;
	timeout?: number;
}

/**
 * Send HTTPS Request.
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
export function https(url: string, options: HttpsOptions = {}): Promise<object | Buffer | string> {
	return new Promise((resolve, reject) => {
		const req = request({
			agent: new Agent({ keepAlive: true }),
			headers: options?.headers || { "Content-Type": "application/json" },
			hostname: new URL(url).hostname,
			method: options?.method || "GET",
			path: options?.endpoint || new URL(url).pathname,
		}, (response) => {
			const data: Buffer[] = [];
			response.on("error", reject);
			response.on("data", (chunk) => data.push(Buffer.from(chunk)));
			response.on("end", () => {
				if (options?.statusCode && response.statusCode !== options?.statusCode)
					reject({
						error: "Unexpected Status Code",
						status: response.statusCode
					});

				try {
					switch (options?.responseType || "json") {
					case "json":
						resolve(JSON.parse(Buffer.concat(data).toString()));
						break;
					case "stream":
						resolve(Buffer.concat(data));
						break;
					default:
						resolve(Buffer.concat(data).toString());
					}
				} catch (e) {
					reject(e);
				}
			});
		}).on("error", reject);

		req.setTimeout(options?.timeout || 5000, () => {
			req.destroy();
			reject({ error: "Request Timed Out", status: 408 });
		});
		if (options?.body) req.write(JSON.stringify(options.body));
		req.end();
	});
}
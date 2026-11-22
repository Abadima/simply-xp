import type { Canvas, Image } from "@napi-rs/canvas";

type CanvasModule = typeof import("@napi-rs/canvas");

/** Remote images that take longer than this are given up on, so a stalled host cannot hang a card forever. */
const IMAGE_TIMEOUT_MS = 10_000;

let loaded: CanvasModule | undefined;

/**
 * Loads `@napi-rs/canvas` on first use. Its native binding costs about 60 ms and 55 MB to load,
 * and only the cards, charts and fonts need it, so `require("simply-xp")` stays cheap without it.
 */
export async function loadCanvas(): Promise<CanvasModule> {
	loaded ??= await import("@napi-rs/canvas");
	return loaded;
}

/** Clears the canvas font and glyph caches, when there is anything loaded to clear. */
export function clearCanvasCache(): void {
	loaded?.clearAllCache();
}

/**
 * Encodes `canvas` as WebP on a worker thread, so the event loop keeps running, then frees its pixels.
 * Left alone, 300 renders hold about 700 MB until the garbage collector gets to them; freed, about 10 MB.
 */
export async function encodeWebp(canvas: Canvas): Promise<Buffer> {
	try {
		return await canvas.encode("webp");
	} finally {
		canvas.width = 0;
		canvas.height = 0;
	}
}

/** Loads an image from a path, URL or buffer, giving up on a remote one after {@link IMAGE_TIMEOUT_MS}. */
export async function loadImage(source: string | URL | Buffer): Promise<Image> {
	const canvas = await loadCanvas();
	const controller = typeof AbortController === "function" ? new AbortController() : undefined;
	let timer: ReturnType<typeof setTimeout> | undefined;

	const loading = canvas.loadImage(source, controller && { requestOptions: { signal: controller.signal } });
	// If the timeout wins, this promise still rejects later (the request is aborted); nobody should see that.
	loading.catch(() => undefined);

	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(() => {
			controller?.abort();
			reject(new Error(`Image did not load within ${IMAGE_TIMEOUT_MS} ms`));
		}, IMAGE_TIMEOUT_MS);
	});

	try {
		return await Promise.race([loading, timeout]);
	} finally {
		clearTimeout(timer);
	}
}

require("dotenv").config();

const pug = require("pug");
const fs = require("fs");
const crypto = require("crypto");

const IMGIX_DEFAULTS = Object.freeze({
	auto: "compress,format",
	fit: "crop",
	crop: "focalpoint,entropy",
	q: 50,
});

fs.writeFileSync("dist/index.html", pug.renderFile("src/index.pug", {
	IMGIX_DEFAULTS,
	imgixSrc,
	imgixSrcset,
	signImgix,
	nominalDimensions,
	widthsFull: [320, 360, 420, 576, 640, 788, 801, 1024, 1280, 1680, 1920, 2560],
	gaId: "G-609BP44WCQ",
}), "utf-8");

/**
 * Get a URL to an imgix image
 */
function imgixSrc(src, width, options) {
	const url = new URL(`https://votemarkwiens.imgix.net/liberal/${src}`);
	for (const [key, value] of Object.entries({
		...IMGIX_DEFAULTS,
		...options,
		w: width,
	})) {
		url.searchParams.set(key, value);
	}
	return signImgix(url.toString());
}

/**
 * Get a set of imgix image URLs
 */
function imgixSrcset(src, widths, options) {
	return widths.map((width) => `${imgixSrc(src, width, options)} ${width}w`).join(", ");
}

/**
 * Get nominal dimensions of an imgix image
 *
 * Its source crop is taken into account if specified via the `rect` option.
 */
function nominalDimensions(dimensions, widths, options) {
	const aspect = getImgixAspect(dimensions, options);
	const width = widths[widths.length - 1];
	const height = Math.round(width / aspect);
	return { width, height };
}

/**
 * Get the aspect ratio of an imgix image
 *
 * Its source crop is taken into account if specified via the `rect` option.
 */
function getImgixAspect(dimensions, options) {
	if ("rect" in options) {
		const [_x, _y, width, height] = options.rect.split(",");
		return parseInt(width) / parseInt(height);
	}
	return dimensions[0] / dimensions[1];
}

/**
 * Sign an Imgix URL
 */
function signImgix(url) {
	const token = process.env.IMGIX_TOKEN;
	if (token == null || token === "") throw new Error("IMGIX_TOKEN must be set");
	const urlObj = new URL(url);
	const signature = crypto.createHash("md5")
		.update(token)
		.update(urlObj.pathname)
		.update(urlObj.search)
		.digest("hex");
	urlObj.searchParams.set("s", signature);
	return urlObj.toString();
}

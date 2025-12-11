const BASE64_KEY_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const ASCII_TO_64 = new Array(128).fill(0);

for (let index = 0; index < BASE64_KEY_CHARS.length; index += 1) {
    ASCII_TO_64[BASE64_KEY_CHARS.charCodeAt(index)] = index;
}

const UUID_DASH_REGEX = /-/g;
const UUID_REGEX = /^[0-9a-fA-F-]{36}$/;
const NORMALIZED_UUID_REGEX = /^[0-9a-fA-F]{32}$/;
const COMPRESSED_UUID_REGEX = /^[0-9a-zA-Z+/]{22,23}$/;

const compressHex = (hex, prefixLength = hex.length % 3) => {
    const prefix = hex.slice(0, prefixLength);
    const compressed = [];

    for (let index = prefixLength; index < hex.length; index += 3) {
        const first = parseInt(hex[index], 16);
        const second = parseInt(hex[index + 1], 16);
        const third = parseInt(hex[index + 2], 16);

        compressed.push(BASE64_KEY_CHARS[(first << 2) | (second >> 2)]);
        compressed.push(BASE64_KEY_CHARS[((second & 0b11) << 4) | third]);
    }

    return `${prefix}${compressed.join("")}`;
};

const decompressBase64Segment = (value) => {
    const hexParts = [];

    for (let index = 0; index < value.length; index += 2) {
        const high = ASCII_TO_64[value.charCodeAt(index)];
        const low = ASCII_TO_64[value.charCodeAt(index + 1)];

        hexParts.push((high >> 2).toString(16));
        hexParts.push((((high & 0b11) << 2) | (low >> 4)).toString(16));
        hexParts.push((low & 0b1111).toString(16));
    }

    return hexParts.join("");
};

const compressUuid = (uuid, useShortPrefix) => {
    let normalizedUuid = uuid;

    if (UUID_REGEX.test(normalizedUuid)) {
        normalizedUuid = normalizedUuid.replace(UUID_DASH_REGEX, "");
    } else if (!NORMALIZED_UUID_REGEX.test(normalizedUuid)) {
        return uuid;
    }

    return compressHex(normalizedUuid, useShortPrefix === true ? 2 : 5);
};

const decompressUuid = (value) => {
    if (value.length <= 20) {
        return value;
    }

    if (value.length === 23) {
        const hexPart = decompressBase64Segment(value.slice(5));
        value = `${value.slice(0, 5)}${hexPart}`;
    } else if (value.length === 22) {
        const hexPart = decompressBase64Segment(value.slice(2));
        value = `${value.slice(0, 2)}${hexPart}`;
    }

    return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
};

const isUuid = (value) => typeof value === "string" && (COMPRESSED_UUID_REGEX.test(value) || NORMALIZED_UUID_REGEX.test(value) || UUID_REGEX.test(value));

const UuidUtils = {
    compressUuid,
    compressHex,
    decompressUuid,
    isUuid,
};

module.exports = UuidUtils;

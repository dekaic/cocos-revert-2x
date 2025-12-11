var extnames = [".png", ".jpg", ".jpeg", ".bmp", ".webp", ".pvr", ".pkm", ".astc"];
let SUPPORT_TEXTURE_FORMATS = [".astc", ".pkm", ".pvr", ".webp", ".jpg", ".jpeg", ".bmp", ".png"],
    CUSTOM_PIXEL_FORMAT = 1024,
    RGB_A_PVRTC_2BPPV1 = CUSTOM_PIXEL_FORMAT++,
    RGB_A_PVRTC_4BPPV1 = CUSTOM_PIXEL_FORMAT++,
    RGBA_ETC1 = CUSTOM_PIXEL_FORMAT++,
    RGB_ETC2 = 28,
    RGBA_ETC2 = 29,
    RGB_ETC1 = 4,
    RGBA8888 = 16,
    CHAR_CODE_0 = 48,
    CHAR_CODE_1 = 49;
var PARSER_TOOLS = {};
function _parseExt(t, a) {
    let _ = t.split("_"),
        p = "",
        n = "",
        l = 999,
        E = a,
        s = SUPPORT_TEXTURE_FORMATS;
    for (let r = 0; r < _.length; r++) {
        let t = _[r].split("@"),
            e = t[0];
        e = extnames[e.charCodeAt(0) - CHAR_CODE_0] || e;
        var R = s.indexOf(e);
        -1 !== R && R < l ? ((t = t[1] ? parseInt(t[1]) : a), (l = R), (n = e), (E = t)) : (p = p || e);
    }
    return { bestExt: n, bestFormat: E, defaultExt: p };
}
(PARSER_TOOLS.parser_Texture2D = function (t) {
    if (!t || 0 == t.length) return [];
    var e,
        r = [];
    for (e of t.split("|")) {
        var a = e.split(","),
            _ = a[0],
            p = {};
        if (_ && !(p = _parseExt(_, RGBA8888)).bestExt && !p.defaultExt)
            throw new Error("Can't find a texture format supported by the current platform! Please add a fallback format in the editor.");
        8 === a.length &&
            ((p._minFilter = parseInt(a[1])),
            (p._magFilter = parseInt(a[2])),
            (p._wrapS = parseInt(a[3])),
            (p._wrapT = parseInt(a[4])),
            (p._premultiplyAlpha = a[5].charCodeAt(0) === CHAR_CODE_1),
            (p._genMipmaps = a[6].charCodeAt(0) === CHAR_CODE_1),
            (p._packable = a[7].charCodeAt(0) === CHAR_CODE_1)),
            r.push(p);
    }
    return r;
}),
    (PARSER_TOOLS._Texture2D_deserialize = function (t) {
        var e = (t = t.split(","))[0],
            r = {};
        if (e)
            if ((r = _parseExt(e, RGBA8888)).bestExt) (r._native = r.bestExt), (r._name = r.bestExt);
            else {
                if (!r.defaultExt)
                    throw new Error("Can't find a texture format supported by the current platform! Please add a fallback format in the editor.");
                (r._native = r.defaultExt), (r._name = r.defaultExt);
            }
        return (
            8 === t.length &&
                ((r._minFilter = parseInt(t[1])),
                (r._magFilter = parseInt(t[2])),
                (r._wrapS = parseInt(t[3])),
                (r._wrapT = parseInt(t[4])),
                (r._premultiplyAlpha = t[5].charCodeAt(0) === CHAR_CODE_1),
                (r._genMipmaps = t[6].charCodeAt(0) === CHAR_CODE_1),
                (r._packable = t[7].charCodeAt(0) === CHAR_CODE_1)),
            r
        );
    }),
    (module.exports = PARSER_TOOLS);

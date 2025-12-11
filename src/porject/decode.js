var BASE64_KEYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    BASE64_VALUES = new Array(123);
for (let e = 0; e < 123; ++e) BASE64_VALUES[e] = 64;
for (let e = 0; e < 64; ++e) BASE64_VALUES[BASE64_KEYS.charCodeAt(e)] = e;
var Base64Values = BASE64_VALUES,
    HexChars = "0123456789abcdef".split("");
module.exports = function (a) {
    var e = ["", "", "", ""],
        t = e.concat(e, "-", e, "-", e, "-", e, "-", e, e, e),
        s = t
            .map(function (e, r) {
                return "-" === e ? NaN : r;
            })
            .filter(isFinite);
    if ("string" == typeof a) {
        if (22 !== a.length) return a;
        (t[0] = a[0]), (t[1] = a[1]);
        for (let e = 2, r = 2; e < 22; e += 2) {
            var A = Base64Values[a.charCodeAt(e)],
                n = Base64Values[a.charCodeAt(e + 1)];
            (t[s[r++]] = HexChars[A >> 2]), (t[s[r++]] = HexChars[((3 & A) << 2) | (n >> 4)]), (t[s[r++]] = HexChars[15 & n]);
        }
        return t.join("");
    }
};

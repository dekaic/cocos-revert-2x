// let WebSocket = require("ws"),
//     fs = require("fs"),
//     dir = require("./dir"),
//     path =
//         ("undefined" != typeof global && "undefined" == typeof window ? (global.window = {}) : "undefined" == typeof window && (window = {}),
//         (window.Login = require("../protos/Login/Login_pb")),
//         (window.Revert = require("../protos/Revert/Revert_pb")),
//         require("path"));
// autoplay &&
//     (console.log("自动模式 3秒后自动生成项目"),
//     setTimeout(() => {
//         try {
//             var e = (0, require("child_process").spawn)("cmd.exe", ["/c", path.resolve(__dirname, "生成工程3.bat")], { encoding: "utf-8" });
//             e.stdout.on("data", (e) => {
//                 console.log("stdout: " + e), e.includes("All tasks completed") && (console.log("程序即将退出"), process.exit(0));
//             }),
//                 e.stderr.on("data", (e) => {
//                     console.error("stderr: " + e);
//                 }),
//                 e.on("close", (e) => {
//                     console.log("子进程退出，退出码: " + e), console.log("程序即将退出"), process.exit(e);
//                 });
//         } catch (e) {
//             console.error("执行批处理文件时出错:", e);
//         }
//     }, 3e3));

import "./globals/setup-globals";
import revert from "./core/revert";

function main() {
    console.log("Cocos Revert 2.x Toolkit");
    revert.start(() => {});
}

main();

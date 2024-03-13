const path = require("path");
const binaryInstallDir = path.join(__dirname, '..', '..', ".crates");

module.exports = {
    idlGenerator: "anchor",
    programName: "dummy_swap",
    programId: "FFCs7PxV93BsPUNQhspKkggWArSxo2Hhas4PU4xhBmh6",
    idlDir: path.join(__dirname, "idl"),
    sdkDir: path.join(__dirname, "src"),
    binaryInstallDir,
    programDir: path.join(__dirname, '..', '..', "programs", "dummy-swap"),
    anchorRemainingAccounts: true,
};

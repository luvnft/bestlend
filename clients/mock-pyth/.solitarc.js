const path = require("path");
const binaryInstallDir = path.join(__dirname, '..', '..', ".crates");

module.exports = {
    idlGenerator: "anchor",
    programName: "mock_pyth",
    programId: "6Lh68KvhjwFGUENYh97S5BdLubB91bEcgKc2BuU2M13q",
    idlDir: path.join(__dirname, "idl"),
    sdkDir: path.join(__dirname, "src"),
    binaryInstallDir,
    programDir: path.join(__dirname, '..', '..', "programs", "mock-pyth"),
    anchorRemainingAccounts: true,
};

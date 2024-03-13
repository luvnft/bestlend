const path = require("path");
const binaryInstallDir = path.join(__dirname, '..', '..', ".crates");

module.exports = {
    idlGenerator: "anchor",
    programName: "bestlend",
    programId: "hackF7pNZ7dGZCGXaiPNnzxkSoyrBkyEyDTpywK9KJs",
    idlDir: path.join(__dirname, "idl"),
    sdkDir: path.join(__dirname, "src"),
    binaryInstallDir,
    programDir: path.join(__dirname, '..', '..', "programs", "bestlend"),
    anchorRemainingAccounts: true,
};

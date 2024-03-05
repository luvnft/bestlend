const path = require("path");
const binaryInstallDir = path.join(__dirname, '..', '..', ".crates");

module.exports = {
    idlGenerator: "anchor",
    programName: "kamino_lending",
    programId: "HUHJsverovPJN3sVtv8J8D48fKzeajRtz3Ga4Zmh4RLA",
    idlDir: path.join(__dirname, "idl"),
    sdkDir: path.join(__dirname, "src"),
    binaryInstallDir,
    programDir: path.join(__dirname, '..', '..', "programs", "klend"),
    anchorRemainingAccounts: true,
};

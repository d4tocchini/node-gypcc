#!/usr/bin/env node
require("../index.js");
process.exit(gypcc.main(process.argv.length - 1, process.argv.slice(1)));

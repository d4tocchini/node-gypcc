require("../index.js");
const assert = require('assert');

main();

function main()
{
    console.log("node-gypcc/test ...")
    test_hello_cc();
    console.log("✅");
}

// https://github.com/nodejs/node/blob/master/test/addons/hello-world/binding.gyp
function test_hello_cc()
{
    // compile
    const tgt = new gypcc.Target();
    tgt.add_argv_string(`hello.cc --silent --debug -o ./build/hello.node`)
    assert.ok(tgt.exec_sync() == 0);
    // test
    const binding = require(`./build/hello.node`);
    assert.strictEqual(binding.hello(), 'world');
}


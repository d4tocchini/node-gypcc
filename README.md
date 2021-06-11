# node-gypcc

`node-gyp` wrapper for compiling native node addons without the binding.gyp build conventions - compat with make, cmake, ninja, etc.  Use it like gcc, emcc, clang, `CC=node-gypcc`.  Arguments & environment variables are carefully marshalled to heal gyp pain with electron, xcode_settings and rigid filesystem constraints.

```sh

node-gypcc hello.c -o hello.node
node -e "require(hello.node).hello()"

```

More coming soon...
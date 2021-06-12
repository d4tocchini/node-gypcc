# node-gypcc

`node-gyp` wrapper for compiling native node addons without the binding.gyp build conventions - compat with make, cmake, ninja, etc.  Use it like gcc, emcc, clang, `CC=node-gypcc`.  Arguments & environment variables are carefully marshalled to heal gyp pain with electron, xcode_settings and rigid filesystem constraints.

## usage

basics:

```sh
# install
npm install -g node-gypcc

# build no binding.gyp
node-gypcc hello.c -o hello.node

# require no build/[Debug|Release}/...
node -e "require(hello.node).hello()"
```

more realistic build script:

```sh
# node-gyp specific cli args
CC="node-gypcc --silly --debug"

# fixes gyp inconsistencies in npm env vars
# see: https://github.com/nodejs/node-gyp/issues/2250
export npm_config_runtime="electron"
export npm_config_target="13.1.2"
export npm_config_dist_url="https://electronjs.org/headers"

# for the shell fluent >> gyp conditionals & variables
export MAKE="gmake"
CFLAGS="-I${PREFIX}/include -I${PWD}"
CFLAGS+=" -fPIC -O3 -std=c2x -pthread -Wno-incompatible-pointer-types"
CFLAGS+=" -Wno-int-conversion -Wno-error=deprecated-declarations"
if [ "$(uname)" == "Darwin" ]; then
    # marshalls magically reserved words of gyp xcode_settings
    # see: https://github.com/nickdesaulniers/node-nanomsg/pull/144
    CFLAGS+=" -mmacosx-version-min=10.12"
fi
LDFLAGS="-L${PREFIX}/lib -ltcc -lpthread"

# env or args
CFLAGS=$CFLAGS $CC $LDFLAGS ./binding.c -o ./build/binding.node
```

reminder software degrades faster than hardware improves:

```
CC=node-gypcc make binding.node
```

More coming soon...
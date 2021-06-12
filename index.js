global.gypcc = { // NOTABUG: old school anti-soydev export
    main,
    Target,
    argv_from_string,
};
const T = Target.prototype;
T.exec_sync = exec_sync;
T.add_env = add_env;
T.add_argv_string = add_argv_string;
T.add_argv = add_argv;
T.get_exec_args = get_exec_args;
T.get_binding = get_binding;
T._debug = _debug;
T._silent = _silent;
T._verbose = _verbose;
T._silly = _silly;
T._static = _static;
T._shared = _shared;
T._source = _source;
T._o = _o;
T._I = _I;
T._D = _D;
T._cflag = _cflag;
T._ldflag = _ldflag;
T._l = _l;
T._L = _L;
T._f = _f;
T._F = _F;

const fs = require('fs');
const p = require('path');
const chproc = require("child_process");
const log = console.log;
const CWD = process.cwd();
const ENV = process.env;

function main(argc, argv)
{
    let r = 0;
    if (argc == 1)
        return help();
    argv.shift();
    const cmd = argv[0];
    switch (cmd) {
        case "version": case "--version": case "-v":
            return version();
        case "help": case "--help": case "-h":
            return help();
    }
    const tgt = new Target();
    tgt.add_env(ENV);
    tgt.add_argv(argv);
    r = tgt.exec_sync();
    return r;

    // TODO: ...
    function version()
    {
        log("node-gypcc@");
        return 0;
    }
    function help(argv)
    {
        log("node-gypcc@");
        return 0;
    }
}

function Target()
{
    this.verbose = ""; // silent verbose silly
    this.debug = 0;
    this.out = "";
    this.target_name = "";
    this.type = "exectuable"; // shared_library static_library
    this.sources = [];
    this.defines = [];
    this.include_dirs = [];
    this.libraries = [];
    this.cflags = [];
    this.ldflags = [];
    this.HOME = "";
    this.PATH = ENV.PATH;
    // PYTHON: "/usr/local/bin/python3.9",
    // NODE_GYP_FORCE_PYTHON: "/usr/local/bin/python3.9",
    this.MAKE = "";
    // TODO: this.msvs_guid = ""
    this.MACOSX_DEPLOYMENT_TARGET = "";
    // npm
    this.npm_config_runtime = "";
    this.npm_config_target = "";
    this.npm_config_arch = "";
    this.npm_config_target_arch = "";
    this.npm_config_build_from_source = "";
    this.npm_config_dist_url = ""; // NOTE: https://github.com/nodejs/node-gyp/issues/2250
}

function exec_sync()
{
    const binding = this.get_binding();
    const exec_args = this.get_exec_args()
    const binding_path = P`./binding.gyp`;
    // console.dir(binding)
    mkjson(binding_path, {targets: [ binding ]});
    let code = 0;
    try {
        chproc.execFileSync.apply(null, exec_args);
    } catch(e) {
        code = 1;
        log("gypcc: ERROR: exec_sync");
        console.error(e);
    }
    fs.rmSync(binding_path,{force:true});
    if (code == 0)
        fs.renameSync(
            `./build/${this.debug?"Debug":"Release"}/${this.target_name}.node`,
            this.out
        );
    return code;
}

function add_env(obj)
{
    const tgt = this;
    const {CFLAGS, LDFLAGS} = obj;
    tgt.add_argv_string(CFLAGS);
    tgt.add_argv_string(LDFLAGS);
    if (_use("npm_config_runtime") === "electron") {
        tgt.npm_config_dist_url = tgt.npm_config_dist_url || "https://electronjs.org/headers";
        tgt.npm_config_build_from_source = tgt.npm_config_build_from_source || "true";
        tgt.HOME = tgt.HOME || "~/.electron-gyp";
    }
    _use("npm_config_target");
    _use("npm_config_arch");
    _use("npm_config_target_arch");
    _use("npm_config_build_from_source");
    _use("npm_config_dist_url"); // NOTE: https://github.com/nodejs/node-gyp/issues/2250
    _use("MAKE");
    _use("HOME");
    _use("PATH");
    _use("MACOSX_DEPLOYMENT_TARGET");
    function _use(key) {
        if (obj[key])
            return tgt[key] = obj[key];
        return '';
    }
}

function add_argv_string(string)
{
    if (string)
        this.add_argv(argv_from_string(string));
}

function add_argv(argv)
{
    // https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html#Overall-Options
    // TODO: ? -pthread, -x, -e entry --entry=entry, -c (compile w/o link)
    // TODO: 'cflags!': ['-stdlib=libc++'],
    // TODO: ? -Wl, link_settings https://github.com/nodejs/node-gyp/issues/682
    const tgt = this;
    const argc = argv.length;
    let argi = 0;
    function next() {return argv[argi++];}
    while (argi < argc) {
        let arg = next();
        switch (arg) {
            case "-o"        : tgt._o(next());   continue;
            case "-framework": tgt._f(next());   continue;
            case "-static"   : tgt._static();    continue;
            case "-shared"   : tgt._shared();    continue;
            case "--debug"   : tgt._debug();     continue;
            case "--silent"  : tgt._silent();    continue;
            case "--verbose" : tgt._verbose();   continue;
            case "--silly"   : tgt._silly();     continue;
        }
        let short = arg.match(/^-([a-zA-Z])(.*)/);
        if (short) {
            let [,ch,val] = short;
            switch (ch) {
                case "I": tgt._I(val);  continue;
                case "L": tgt._L(val);  continue;
                case "l": tgt._l(val);  continue;
                case "D": tgt._D(val);  continue;
                case "F": tgt._F(val);  continue;
            }
            tgt._cflag(arg);    continue;
        }
        let long = arg.match(/^--([a-zA-Z][a-zA-Z0-9]*)(=?)(.*)/);
        if (long) {
            let [,key,,val] = long;
            switch (key) {
                case "make"             : tgt.MAKE = val;                         continue;
                case "runtime"          : tgt.npm_config_runtime = val;           continue;
                case "target"           : tgt.npm_config_target = val;            continue;
                case "arch"             : tgt.npm_config_arch = val;              continue;
                case "target-arch"      : tgt.npm_config_target_arch = val;       continue;
                case "build-from-source": tgt.npm_config_build_from_source = val; continue;
                case "dist-url"         : tgt.npm_config_dist_url = val;          continue;
            }
            tgt._cflag(arg);    continue;
        }
        tgt._source(arg);
    }
}

function get_binding()
{
    const {target_name, sources, libraries, include_dirs, cflags, MACOSX_DEPLOYMENT_TARGET} = this;
    const xcode_settings = {
        OTHER_CFLAGS: cflags, // NOTE: https://github.com/nickdesaulniers/node-nanomsg/pull/144
    };
    if (MACOSX_DEPLOYMENT_TARGET)
        xcode_settings.MACOSX_DEPLOYMENT_TARGET = MACOSX_DEPLOYMENT_TARGET;
    const binding = {
        target_name,
        sources,
        libraries,
        include_dirs,
        cflags,
        xcode_settings,
    };
    return binding;
}

function get_exec_args()
{
    const file = p.resolve(__dirname,'node_modules','.bin','node-gyp');
    const args = [file, "rebuild"];
    const env = {};
    const {
        debug, verbose,
        PATH, HOME, MAKE,
        npm_config_runtime, npm_config_target, npm_config_arch,
        npm_config_target_arch, npm_config_build_from_source,
        npm_config_dist_url,
    } = this;
    if (PATH)    env.PATH = P`${PATH}`;
    if (HOME)    env.HOME = P`${HOME}`;
    if (MAKE)    args.push(`--make=${ENV.MAKE}`);
    if (debug)   args.push(`--debug`);
    if (verbose) args.push(`--${verbose}`);
    if (npm_config_runtime) args.push(`--runtime=${
            env.npm_config_runtime = npm_config_runtime
        }`);
    if (npm_config_target) args.push(`--target=${
            env.npm_config_runtime = npm_config_target
        }`);
    if (npm_config_arch) args.push(`--arch=${
            env.npm_config_arch = npm_config_arch
        }`);
    if (npm_config_target_arch) args.push(`--target-arch=${
            env.npm_config_target_arch = npm_config_target_arch
        }`);
    if (npm_config_dist_url) args.push(`--dist-url=${npm_config_dist_url}`);
        // NOTE: https://github.com/nodejs/node-gyp/issues/2250
    if (npm_config_build_from_source)
        env.npm_config_build_from_source = npm_config_build_from_source;
    // TODO: cmd += ` --directory=`+P`${CWD}`
    return [process.execPath, args, {
        // cwd:
        env,
    }];
}

function _debug()     { this.debug = 1; }
function _silent()    { this.verbose = "silent"; }
function _verbose()   { this.verbose = "verbose"; }
function _silly()     { this.verbose = "silly"; }
function _static()    { this.type = "static_library"; }
function _shared()    { this.type = "shared_library"; }
function _source(src) { this.sources.push(P`${src}`); }
function _I(dir)      { this.include_dirs.push(P`${dir}`); }
function _D(def)      { this.defines.push(def); }
function _cflag(f)    { this.cflags.push(f); }
function _ldflag(f)   { this.ldflags.push(f); }
function _l(lib)      { this.libraries.push('-l'+lib); }
function _L(dir)      { this.libraries.push('-L'+P`${dir}`); }
function _f(lib)      { this.libraries.push(`-framework ${lib}`); }
function _F(dir)      { this.libraries.push(`-F${P`${dir}`}`); }
function _o(file)
{
    if (!file.endsWith(".node"))
        file += ".node";
    this.out = P`${file}`;
    this.target_name = p.basename(file).replace(/\..*$/,"");
}


// utils ----------------------------------------------------------------------

const RX_ARGV = /([^\s'"]([^\s'"]*(['"])([^\3]*?)\3)+[^\s'"]*)|[^\s'"]+|(['"])([^\5]*?)\5/gi; // https://github.com/mccormicka/string-argv/blob/master/index.ts

function argv_from_string(str)
{
    const argv = [];
    // TODO: dehack escaped whitespace fix...
    const string = str.replace(/\\ /g,"~@@~");
    function push(a) {
        if (typeof a !== "string")
            return 0;
        if (!a)
            return -1;
        return argv.push(_arg(a));
    }
    if (string.length !== str.length)
        function _arg(a) {return a.replace(/~@@~/g,"\\ ");}
    else
        function _arg(a) {return a;}
    let match;
    while (true) {
        match = RX_ARGV.exec(string); // Each call returns next match
        if (match === null) break;
        if (push(match[1])) continue; // Index 1 is captured group if it exists
        if (push(match[6])) continue;
        if (push(match[0])) continue; // Index 0 is matched text if no captured group exists
    };
    return argv;
}

function P(strings, ...keys)
{
    let i = 0;
    let r = strings[i++];
    for (const k of keys)
        r += `${k}${strings[i++]}`;
    return _path_fix(r);
}

const _path_fix = (p.sep === '/') ? function (path) {return path;} : function (path)
{
    path = path.replace(/^~\//g, ENV.HOME || ENV.USERPROFILE ); // TODO: verify
    path = path.replace(/\//g, p.sep);
}

function mkdirp(path)
{
    return fs.mkdirSync(P`${path}`, {recursive:true});
}

function mkfile(path, content) // => num of bytes written
{
    return fs.writeFileSync(P`${path}`, content);
}

function mkjson(path, content)
{
    return mkfile(path, JSON.stringify(content))
}
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '../..');

function createContext(overrides = {}) {
    return vm.createContext({
        console,
        Math,
        Set,
        ...overrides
    });
}

function loadScripts(context, scriptPaths) {
    for (const scriptPath of scriptPaths) {
        const absolutePath = path.join(projectRoot, scriptPath);
        const source = fs.readFileSync(absolutePath, 'utf8');
        vm.runInContext(source, context, { filename: scriptPath });
    }
    return context;
}

function evaluate(context, expression) {
    return vm.runInContext(expression, context);
}

module.exports = { createContext, evaluate, loadScripts, projectRoot };

const fs = require('node:fs');
const { createContext, loadScripts, evaluate, projectRoot } = require('./load-scripts');

class Emitter {
    constructor() { this.listeners = new Map(); }
    on(event, callback, context) {
        const entries = this.listeners.get(event) || [];
        entries.push({ callback, context });
        this.listeners.set(event, entries);
        return this;
    }
    once(event, callback, context) {
        const wrapped = (...args) => { this.off(event, wrapped); callback.apply(context, args); };
        return this.on(event, wrapped);
    }
    off(event, callback, context) {
        if (!callback) this.listeners.delete(event);
        else this.listeners.set(event, (this.listeners.get(event) || []).filter(entry =>
            entry.callback !== callback || (context !== undefined && entry.context !== context)));
        return this;
    }
    emit(event, ...args) {
        for (const { callback, context } of [...(this.listeners.get(event) || [])]) callback.apply(context, args);
    }
    listenerCount(event) { return (this.listeners.get(event) || []).length; }
}

function loadGame(overrides = {}) {
    const context = createContext({
        console: { log() {}, warn() {}, error: console.error },
        Phaser: { Scene: class {}, GameObjects: { Container: class {} }, Math: { Clamp: (n, a, b) => Math.min(b, Math.max(a, n)) } },
        setTimeout, clearTimeout, ...overrides
    });
    const html = fs.readFileSync(`${projectRoot}/normal.html`, 'utf8');
    loadScripts(context, [...html.matchAll(/<script src="(src\/[^"]+)"/g)].map(match => match[1]));
    return { context, get: name => evaluate(context, name) };
}

function config(overrides = {}) {
    return { rows: 9, cols: 9, mines: 10, enemies: 2, treasures: 3, stairs: 1,
        wallClusters: 3, totalWalls: 10, treasurePoints: 100, cellSize: 40, ...overrides };
}

function installBoard(game, session, board) {
    session.boardData = board;
    session.boardModel = new (game.get('BoardModel'))(board);
    session.isFirstClick = false;
}

module.exports = { loadGame, config, installBoard, Emitter };

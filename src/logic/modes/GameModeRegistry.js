const GameModeId = Object.freeze({
    CLASSIC: 'CLASSIC',
    RPG_SIMPLE: 'RPG_SIMPLE',
    RPG_LAYERED: 'RPG_LAYERED',
    EXPERIMENTAL: 'EXPERIMENTAL'
});

class ClassicRuleSet {
    shouldCheckClassicWin() {
        return true;
    }

    evaluateStairs() {
        return { canAdvance: false, reason: 'STAIRS_DISABLED' };
    }
}

class RpgSimpleRuleSet {
    shouldCheckClassicWin() {
        return false;
    }

    evaluateStairs(session) {
        if (!session.hasKey) return { canAdvance: false, reason: 'KEY_REQUIRED' };
        if (session.enemiesDefeated < session.totalEnemies) {
            return { canAdvance: false, reason: 'ENEMIES_REMAIN' };
        }
        return { canAdvance: true, reason: null };
    }
}

/** Resolves legacy mode names to explicit model/generator/rule-set definitions. */
class GameModeRegistry {
    static resolve(mode) {
        const normalizedMode = this.normalize(mode);
        const definitions = {
            [GameModeId.CLASSIC]: {
                id: GameModeId.CLASSIC,
                boardModel: BoardModel,
                boardGenerator: BoardGenerator,
                ruleSet: new ClassicRuleSet()
            },
            [GameModeId.RPG_SIMPLE]: {
                id: GameModeId.RPG_SIMPLE,
                boardModel: BoardModel,
                boardGenerator: BoardGenerator,
                ruleSet: new RpgSimpleRuleSet()
            }
        };
        const definition = definitions[normalizedMode];
        if (!definition) {
            throw new RangeError(`Game mode ${normalizedMode} is not implemented`);
        }
        return Object.freeze(definition);
    }

    static normalize(mode) {
        if (mode === 'STANDARD' || mode === GameModeId.CLASSIC || mode == null) {
            return GameModeId.CLASSIC;
        }
        if (mode === 'RPG' || mode === GameModeId.RPG_SIMPLE) {
            return GameModeId.RPG_SIMPLE;
        }
        if (Object.values(GameModeId).includes(mode)) return mode;
        throw new RangeError(`Unknown game mode: ${mode}`);
    }
}

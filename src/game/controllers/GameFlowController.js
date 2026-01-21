class GameFlowController {
    constructor(scene, eventBus, session) {
        this.scene = scene;
        this.eventBus = eventBus;
        this.session = session;
    }

    // Logic from handleCellClick/RightClick results
    processResult(result) {
        if (result.events && result.events.length > 0) {
            if (result.events.includes('GAME_OVER')) {
                this.gameOver(false);
            }
            if (result.events.includes('NEXT_LEVEL')) {
                this.goToNextLevel();
            }
        }

        if (result.scoreEvents) {
            for (const evt of result.scoreEvents) {
                if (evt.type === 'TREASURE') {
                    this.eventBus.emitShowMessage({
                        text: `お宝を見つけました！ +${this.session.config.treasurePoints}点`,
                        color: '#ffd700',
                        duration: 2000
                    });
                    if (this.scene.sound.get('treasure')) {
                        this.scene.sound.play('treasure');
                    }
                }
            }
        }

        // Win check
        const winState = this.session.getWinState();
        if (winState.isWin && !this.session.isGameOver) {
            // isGameOver check is important to not trigger twice if session not updated?
            // Actually getWinState just checks flags/mines. Session doesn't set isGameOver on win automatically?
            // GameSession implementation: start, open, checkWinCondition...
            // Usually we check win after every move.
            this.gameOver(true);
        } else if (this.session.isGameOver && this.session.win) {
            this.gameOver(true);
        }
    }

    gameOver(isWin) {
        if (isWin) {
            this.eventBus.emitShowMessage({
                text: `勝利！おめでとうございます！`,
                color: '#00aa00'
            });
        } else {
            // Reveal mines is handled by Scene/BoardManager usually?
            // Scene calls boardManager.revealAllMines();
            // We should signal this.

            this.eventBus.emitShowMessage({
                text: 'ゲームオーバー！',
                color: '#ff0000'
            });
            if (this.scene.sound.get('explosion')) {
                this.scene.sound.play('explosion');
            }
        }
        // Return status to Scene to handle visual actions (Reveal mines)
        return { isWin, isGameOver: true };
    }

    goToNextLevel() {
        this.eventBus.emitShowMessage({
            text: '階段を見つけました！次のレベルへ…',
            color: '#9370db',
            duration: 1500
        });

        this.scene.game.gameData.level++;

        this.scene.time.delayedCall(1500, () => {
            this.scene.scene.restart();
        });
    }
}

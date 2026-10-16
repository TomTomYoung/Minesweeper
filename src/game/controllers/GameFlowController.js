class GameFlowController {
    constructor(scene, eventBus, session) {
        this.scene = scene;
        this.eventBus = eventBus;
        this.session = session;
        this.transitionTimer = null;
        this.hasShownGameOver = false;
    }

    processResult(result) {
        const events = result.events || [];
        if (events.includes('GENERATION_FAILED')) {
            this.eventBus.emitShowMessage({
                text: '盤面を生成できません。再度クリックするか、設定を変更してください。',
                color: '#cc0000'
            });
            return;
        }
        if (events.includes('GAME_OVER')) return this.gameOver(false);
        if (events.includes('NEXT_LEVEL')) this.goToNextLevel();

        const messages = [];
        for (const event of result.scoreEvents || []) {
            if (event.type === 'TREASURE_GOLD') {
                messages.push(`お宝を獲得！ +${this.session.config.treasurePoints}点`);
            }
        }
        if (events.includes('ITEM_KEY')) messages.push('この階の鍵を獲得しました');
        if (events.includes('ITEM_SWORD')) messages.push('剣を獲得！ +50点');
        const defeated = events.filter(event => event === 'ENEMY_DEFEATED').length;
        if (defeated) messages.push(`敵を${defeated}体撃破！ +${defeated * 50}点`);
        if (result.progression && !result.progression.canAdvance) {
            messages.push(result.progression.reason === 'KEY_REQUIRED'
                ? '階段には、この階の鍵が必要です'
                : `残り${this.session.totalEnemies - this.session.enemiesDefeated}体の敵を倒してください`);
        }
        if (messages.length) {
            this.eventBus.emitShowMessage({ text: messages.join(' / '), color: '#765500', duration: 2500 });
        }
        if (this.session.getWinState().isWin) return this.gameOver(true);
    }

    gameOver(isWin) {
        if (this.hasShownGameOver) return { isWin, isGameOver: true };
        this.hasShownGameOver = true;
        this.destroy();
        this.eventBus.emitShowMessage({
            text: isWin ? '勝利！おめでとうございます！' : 'ゲームオーバー！',
            color: isWin ? '#00aa00' : '#ff0000'
        });
        return { isWin, isGameOver: true };
    }

    goToNextLevel() {
        if (this.transitionTimer || !this.session.isTransitioning) return;
        this.eventBus.emitShowMessage({
            text: '階段を見つけました！次の階へ…', color: '#9370db', duration: 1500
        });
        this.transitionTimer = this.scene.time.delayedCall(1500, () => {
            this.transitionTimer = null;
            if (!this.session.advanceLevel()) return;
            this.scene.updateUI();
            this.scene.scene.restart();
        });
    }

    destroy() {
        if (this.transitionTimer) this.transitionTimer.remove();
        this.transitionTimer = null;
    }
}

export default {
    data: {
        pointsLabels: ["0", "15", "30", "40", "Ad"],
        scoreA: 0, scoreB: 0, pointsA: "0", pointsB: "0",
        gamesA: 0, gamesB: 0, setsA: 0, setsB: 0,
        lastState: null
    },

    onInit() { this.updateUI(); },

    saveState() {
        this.lastState = {
            sA: this.scoreA, sB: this.scoreB,
            gA: this.gamesA, gB: this.gamesB,
            stA: this.setsA, stB: this.setsB
        };
    },

    undoPoint() {
        if (this.lastState !== null) {
            this.scoreA = this.lastState.sA; this.scoreB = this.lastState.sB;
            this.gamesA = this.lastState.gA; this.gamesB = this.lastState.gB;
            this.setsA = this.lastState.stA; this.setsB = this.lastState.stB;
            this.lastState = null;
            this.updateUI();
        }
    },

    addPointA() { this.saveState(); this.logic("A"); },
    addPointB() { this.saveState(); this.logic("B"); },

    logic(winner) {
        if (winner === "A") {
            if (this.scoreA < 3) this.scoreA++;
            else if (this.scoreA === 3 && this.scoreB < 3) { this.winGame("A"); return; }
            else if (this.scoreA === 3 && this.scoreB === 3) this.scoreA = 4;
            else if (this.scoreA === 3 && this.scoreB === 4) this.scoreB = 3;
            else if (this.scoreA === 4) { this.winGame("A"); return; }
        } else {
            if (this.scoreB < 3) this.scoreB++;
            else if (this.scoreB === 3 && this.scoreA < 3) { this.winGame("B"); return; }
            else if (this.scoreB === 3 && this.scoreA === 3) this.scoreB = 4;
            else if (this.scoreB === 3 && this.scoreA === 4) this.scoreA = 3;
            else if (this.scoreB === 4) { this.winGame("B"); return; }
        }
        this.updateUI();
    },

    winGame(team) {
        this.scoreA = 0; this.scoreB = 0;
        if (team === "A") this.gamesA++; else this.gamesB++;
        if ((this.gamesA >= 6 && this.gamesA - this.gamesB >= 2) || this.gamesA === 7) {
            this.setsA++; this.gamesA = 0; this.gamesB = 0;
        } else if ((this.gamesB >= 6 && this.gamesB - this.gamesA >= 2) || this.gamesB === 7) {
            this.setsB++; this.gamesA = 0; this.gamesB = 0;
        }
        this.updateUI();
    },

    updateUI() {
        this.pointsA = this.pointsLabels[this.scoreA];
        this.pointsB = this.pointsLabels[this.scoreB];
    },

    resetMatch() {
        this.scoreA = 0; this.scoreB = 0; this.gamesA = 0; this.gamesB = 0;
        this.setsA = 0; this.setsB = 0; this.lastState = null;
        this.updateUI();
    }
}
export default {
    data: {
        pointsLabels: ["0", "15", "30", "40", "Ad"],
        scoreA: 0, scoreB: 0,
        pointsA: "0", pointsB: "0",
        gamesA: 0, gamesB: 0,
        setsA: 0, setsB: 0,
        isTieBreak: false, // Nova variable per controlar el mode
        lastState: null
    },

    onInit() { this.updateUI(); },

    saveState() {
        this.lastState = JSON.parse(JSON.stringify({
            sA: this.scoreA, sB: this.scoreB,
            gA: this.gamesA, gB: this.gamesB,
            stA: this.setsA, stB: this.setsB,
            tb: this.isTieBreak
        }));
    },

    undoPoint() {
        if (this.lastState) {
            this.scoreA = this.lastState.sA; this.scoreB = this.lastState.sB;
            this.gamesA = this.lastState.gA; this.gamesB = this.lastState.gB;
            this.setsA = this.lastState.stA; this.setsB = this.lastState.stB;
            this.isTieBreak = this.lastState.tb;
            this.lastState = null;
            this.updateUI();
        }
    },

    addPointA() { this.saveState(); this.logic("A"); },
    addPointB() { this.saveState(); this.logic("B"); },

    logic(winner) {
        if (this.isTieBreak) {
            this.logicTieBreak(winner);
        } else {
            this.logicNormal(winner);
        }
        this.updateUI();
    },

    logicNormal(winner) {
        if (winner === "A") {
            if (this.scoreA < 3) this.scoreA++;
            else if (this.scoreA === 3 && this.scoreB < 3) this.winGame("A");
            else if (this.scoreA === 3 && this.scoreB === 3) this.scoreA = 4; // Ad
            else if (this.scoreA === 3 && this.scoreB === 4) this.scoreB = 3; // Deuce
            else if (this.scoreA === 4) this.winGame("A");
        } else {
            if (this.scoreB < 3) this.scoreB++;
            else if (this.scoreB === 3 && this.scoreA < 3) this.winGame("B");
            else if (this.scoreB === 3 && this.scoreA === 3) this.scoreB = 4; // Ad
            else if (this.scoreB === 3 && this.scoreA === 4) this.scoreA = 3; // Deuce
            else if (this.scoreB === 4) this.winGame("B");
        }
    },

    logicTieBreak(winner) {
        if (winner === "A") this.scoreA++; else this.scoreB++;

        // Guanya el tie-break qui arriba a 7 amb diferència de 2
        if (this.scoreA >= 7 && (this.scoreA - this.scoreB) >= 2) {
            this.winSet("A");
        } else if (this.scoreB >= 7 && (this.scoreB - this.scoreA) >= 2) {
            this.winSet("B");
        }
    },

    winGame(team) {
        this.scoreA = 0; this.scoreB = 0;
        if (team === "A") this.gamesA++; else this.gamesB++;

        // Comprovar si anem a Tie-Break
        if (this.gamesA === 6 && this.gamesB === 6) {
            this.isTieBreak = true;
        }
        // Guanyar set normal
        else if ((this.gamesA >= 6 && this.gamesA - this.gamesB >= 2) || this.gamesA === 7) {
            this.winSet("A");
        } else if ((this.gamesB >= 6 && this.gamesB - this.gamesA >= 2) || this.gamesB === 7) {
            this.winSet("B");
        }
    },

    winSet(team) {
        if (team === "A") this.setsA++; else this.setsB++;
        this.gamesA = 0; this.gamesB = 0;
        this.scoreA = 0; this.scoreB = 0;
        this.isTieBreak = false;
    },

    updateUI() {
        if (this.isTieBreak) {
            this.pointsA = this.scoreA.toString();
            this.pointsB = this.scoreB.toString();
        } else {
            this.pointsA = this.pointsLabels[this.scoreA];
            this.pointsB = this.pointsLabels[this.scoreB];
        }
    },

    resetMatch() {
        this.scoreA = 0; this.scoreB = 0;
        this.gamesA = 0; this.gamesB = 0;
        this.setsA = 0; this.setsB = 0;
        this.isTieBreak = false;
        this.lastState = null;
        this.updateUI();
    }
}
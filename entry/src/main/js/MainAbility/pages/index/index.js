export default {
    data: {
        pointsLabels: ["0", "15", "30", "40", "Ad"],
        scoreA: 0, scoreB: 0,
        pointsA: "0", pointsB: "0",
        gamesA: 0, gamesB: 0,
        setsA: 0, setsB: 0,
        isTieBreak: false,
        goldenPoint: false,
        maxSets: 3,
        isMatchOver: false,
        winner: "",
        h1: "", h2: "", h3: "", h4: "", h5: "",
        historyCount: 0,
        state1: null, state2: null, state3: null, state4: null, state5: null
    },

    onInit() {
        this.updateUI();
    },

    // Aquesta funció "tanca" la pantalla de final de partit
    closeWinPage() {
        this.isMatchOver = false;
    },

    toggleMaxSets() {
        if (this.historyCount === 0 && this.scoreA === 0 && this.scoreB === 0) {
            this.maxSets = (this.maxSets === 3) ? 5 : 3;
        }
    },

    saveState() {
        if (this.isMatchOver) return;
        this.state5 = this.state4;
        this.state4 = this.state3;
        this.state3 = this.state2;
        this.state2 = this.state1;
        this.state1 = {
            sA: this.scoreA, sB: this.scoreB, gA: this.gamesA, gB: this.gamesB,
            stA: this.setsA, stB: this.setsB, tb: this.isTieBreak,
            h1: this.h1, h2: this.h2, h3: this.h3, h4: this.h4, h5: this.h5,
            hc: this.historyCount, over: this.isMatchOver, win: this.winner
        };
    },

    undoPoint() {
        if (!this.state1) return;
        var s = this.state1;
        this.scoreA = s.sA; this.scoreB = s.sB;
        this.gamesA = s.gA; this.gamesB = s.gB;
        this.setsA = s.stA; this.setsB = s.stB;
        this.isTieBreak = s.tb;
        this.h1 = s.h1; this.h2 = s.h2; this.h3 = s.h3; this.h4 = s.h4; this.h5 = s.h5;
        this.historyCount = s.hc;
        this.isMatchOver = s.over;
        this.winner = s.win;
        this.state1 = this.state2; this.state2 = this.state3;
        this.state3 = this.state4; this.state4 = this.state5;
        this.state5 = null;
        this.updateUI();
    },

    addPointA() {
        if (this.isMatchOver) return;
        this.saveState();
        if (this.isTieBreak) {
            this.scoreA++;
            if (this.scoreA >= 7 && (this.scoreA - this.scoreB) >= 2) { this.winSet("A"); }
        } else {
            if (this.scoreA < 3) { this.scoreA++; }
            else if (this.scoreA === 3 && this.scoreB < 3) { this.winGame("A"); }
            else if (this.scoreA === 3 && this.scoreB === 3) {
                if (this.goldenPoint) { this.winGame("A"); } else { this.scoreA = 4; }
            } else if (this.scoreA === 3 && this.scoreB === 4) { this.scoreB = 3; }
            else if (this.scoreA === 4) { this.winGame("A"); }
        }
        this.updateUI();
    },

    addPointB() {
        if (this.isMatchOver) return;
        this.saveState();
        if (this.isTieBreak) {
            this.scoreB++;
            if (this.scoreB >= 7 && (this.scoreB - this.scoreA) >= 2) { this.winSet("B"); }
        } else {
            if (this.scoreB < 3) { this.scoreB++; }
            else if (this.scoreB === 3 && this.scoreA < 3) { this.winGame("B"); }
            else if (this.scoreB === 3 && this.scoreA === 3) {
                if (this.goldenPoint) { this.winGame("B"); } else { this.scoreB = 4; }
            } else if (this.scoreB === 3 && this.scoreA === 4) { this.scoreA = 3; }
            else if (this.scoreB === 4) { this.winGame("B"); }
        }
        this.updateUI();
    },

    winGame(team) {
        this.scoreA = 0; this.scoreB = 0;
        if (team === "A") { this.gamesA++; } else { this.gamesB++; }
        if (this.gamesA === 6 && this.gamesB === 6) {
            this.isTieBreak = true;
        } else if ((this.gamesA >= 6 && (this.gamesA - this.gamesB) >= 2) || this.gamesA === 7) {
            this.winSet("A");
        } else if ((this.gamesB >= 6 && (this.gamesB - this.gamesA) >= 2) || this.gamesB === 7) {
            this.winSet("B");
        }
    },

    winSet(team) {
        var res = "SET " + (this.setsA + this.setsB + 1) + "  [ " + this.gamesA + " · " + this.gamesB + " ]";
        if (this.historyCount === 0) { this.h1 = res; }
        else if (this.historyCount === 1) { this.h2 = res; }
        else if (this.historyCount === 2) { this.h3 = res; }
        else if (this.historyCount === 3) { this.h4 = res; }
        else if (this.historyCount === 4) { this.h5 = res; }
        this.historyCount++;

        if (team === "A") { this.setsA++; } else { this.setsB++; }

        var setsNeeded = (this.maxSets === 3) ? 2 : 3;
        if (this.setsA === setsNeeded || this.setsB === setsNeeded) {
            this.isMatchOver = true;
            // No fem el reset automàtic per permetre veure el marcador final
        } else {
            this.gamesA = 0; this.gamesB = 0;
            this.scoreA = 0; this.scoreB = 0;
            this.isTieBreak = false;
        }
    },

    updateUI() {
        if (this.isTieBreak) {
            this.pointsA = this.scoreA + "";
            this.pointsB = this.scoreB + "";
        } else {
            this.pointsA = this.pointsLabels[this.scoreA];
            this.pointsB = this.pointsLabels[this.scoreB];
        }
    },

    toggleGoldenPoint() {
        this.goldenPoint = !this.goldenPoint;
    },

    resetMatch() {
        this.scoreA = 0; this.scoreB = 0;
        this.gamesA = 0; this.gamesB = 0;
        this.setsA = 0; this.setsB = 0;
        this.isTieBreak = false;
        this.isMatchOver = false;
        this.winner = "";
        this.h1 = ""; this.h2 = ""; this.h3 = ""; this.h4 = ""; this.h5 = "";
        this.historyCount = 0;
        this.state1 = null; this.state2 = null; this.state3 = null;
        this.state4 = null; this.state5 = null;
        this.updateUI();
    }
}
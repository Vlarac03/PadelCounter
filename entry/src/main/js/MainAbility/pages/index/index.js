import storage from '@system.storage';

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
        state1: null, state2: null, state3: null,
        setJustWon: false,
        showWinPage: true
    },

    onInit() {
        this.updateUI();
        this.loadRaw();
    },

    onShow() {
        this.loadRaw();
    },

    saveRaw() {
        const nums = JSON.stringify({
            a: this.scoreA, b: this.scoreB,
            c: this.gamesA, d: this.gamesB,
            e: this.setsA,  f: this.setsB,
            g: this.isTieBreak ? 1 : 0,
            m: this.historyCount,
            n: this.isMatchOver ? 1 : 0,
            o: this.winner,
            p: this.maxSets,
            q: this.goldenPoint ? 1 : 0
        });

        const hist = JSON.stringify({
            h: this.h1, i: this.h2, j: this.h3,
            k: this.h4, l: this.h5
        });

        // Guardem en seqüència: primer nums, quan acaba guardem hist
        storage.clear({
            complete: () => {
                storage.set({
                    key: 'mn',
                    value: nums,
                    success: () => {
                        storage.set({
                            key: 'mh',
                            value: hist,
                            success: function() {},
                            fail: function() {}
                        });
                    },
                    fail: function() {}
                });
            }
        });
    },

    loadRaw() {
        storage.get({
            key: 'mn',
            success: (data) => {
                if (data && data !== 'null' && data !== '') {
                    try {
                        const s = JSON.parse(data);
                        this.scoreA = s.a || 0; this.scoreB = s.b || 0;
                        this.gamesA = s.c || 0; this.gamesB = s.d || 0;
                        this.setsA  = s.e || 0; this.setsB  = s.f || 0;
                        this.isTieBreak  = s.g === 1;
                        this.historyCount = s.m || 0;
                        this.isMatchOver  = s.n === 1;
                        this.winner   = s.o || "";
                        this.maxSets  = s.p || 3;
                        this.goldenPoint = s.q === 1;
                    } catch(e) {}
                }
                // Carreguem historial en seqüència
                storage.get({
                    key: 'mh',
                    success: (data2) => {
                        if (data2 && data2 !== 'null' && data2 !== '') {
                            try {
                                const s2 = JSON.parse(data2);
                                this.h1 = s2.h || ""; this.h2 = s2.i || "";
                                this.h3 = s2.j || ""; this.h4 = s2.k || "";
                                this.h5 = s2.l || "";
                            } catch(e) {}
                        }
                        this.updateUI();
                    },
                    fail: () => { this.updateUI(); }
                });
            },
            fail: () => { this.updateUI(); }
        });
    },

    addPointA() {
        if (this.isMatchOver) return;
        this.saveState();
        this.setJustWon = false;
        if (this.isTieBreak) {
            this.scoreA++;
            if (this.scoreA >= 7 && (this.scoreA - this.scoreB) >= 2) this.winSet("A");
        } else {
            if (this.scoreA < 3) this.scoreA++;
            else if (this.scoreA === 3 && this.scoreB < 3) this.winGame("A");
            else if (this.scoreA === 3 && this.scoreB === 3) {
                if (this.goldenPoint) this.winGame("A"); else this.scoreA = 4;
            } else if (this.scoreA === 3 && this.scoreB === 4) this.scoreB = 3;
            else if (this.scoreA === 4) this.winGame("A");
        }
        if (!this.setJustWon) { this.updateUI(); this.saveRaw(); }
    },

    addPointB() {
        if (this.isMatchOver) return;
        this.saveState();
        this.setJustWon = false;
        if (this.isTieBreak) {
            this.scoreB++;
            if (this.scoreB >= 7 && (this.scoreB - this.scoreA) >= 2) this.winSet("B");
        } else {
            if (this.scoreB < 3) this.scoreB++;
            else if (this.scoreB === 3 && this.scoreA < 3) this.winGame("B");
            else if (this.scoreB === 3 && this.scoreA === 3) {
                if (this.goldenPoint) this.winGame("B"); else this.scoreB = 4;
            } else if (this.scoreB === 3 && this.scoreA === 4) this.scoreA = 3;
            else if (this.scoreB === 4) this.winGame("B");
        }
        if (!this.setJustWon) { this.updateUI(); this.saveRaw(); }
    },

    winGame(team) {
        this.scoreA = 0; this.scoreB = 0;
        if (team === "A") this.gamesA++; else this.gamesB++;
        if (this.gamesA === 6 && this.gamesB === 6) {
            this.isTieBreak = true;
        } else if ((this.gamesA >= 6 && (this.gamesA - this.gamesB) >= 2) || this.gamesA === 7) {
            this.winSet("A");
        } else if ((this.gamesB >= 6 && (this.gamesB - this.gamesA) >= 2) || this.gamesB === 7) {
            this.winSet("B");
        }
    },

    winSet(team) {
        let res;
        if (this.isTieBreak) {
            res = "S" + (this.setsA + this.setsB + 1) + ": [" + this.gamesA + "-" + this.gamesB + " (" + this.scoreA + "-" + this.scoreB + ")]";
        } else {
            res = "S" + (this.setsA + this.setsB + 1) + ": [" + this.gamesA + "-" + this.gamesB + "]";
        }

        if (this.historyCount === 0) this.h1 = res;
        else if (this.historyCount === 1) this.h2 = res;
        else if (this.historyCount === 2) this.h3 = res;
        else if (this.historyCount === 3) this.h4 = res;
        else if (this.historyCount === 4) this.h5 = res;
        this.historyCount++;

        if (team === "A") this.setsA++; else this.setsB++;

        let setsNeeded = (this.maxSets === 3) ? 2 : 3;
        if (this.setsA === setsNeeded || this.setsB === setsNeeded) {
            this.isMatchOver = true;
            this.showWinPage = true;
            this.winner = team;
        } else {
            this.gamesA = 0; this.gamesB = 0;
            this.scoreA = 0; this.scoreB = 0;
            this.isTieBreak = false;
        }
        this.setJustWon = true;
        this.updateUI();
        this.saveRaw();
    },

    updateUI() {
        if (this.isTieBreak) {
            this.pointsA = this.scoreA.toString();
            this.pointsB = this.scoreB.toString();
        } else {
            this.pointsA = this.pointsLabels[this.scoreA] || "0";
            this.pointsB = this.pointsLabels[this.scoreB] || "0";
        }
    },

    closeWinPage() {
        this.showWinPage = false;
    },

    undoPoint() {
        if (!this.state1) return;
        const s = JSON.parse(this.state1);
        this.scoreA = s.sA; this.scoreB = s.sB;
        this.gamesA = s.gA; this.gamesB = s.gB;
        this.setsA = s.stA; this.setsB = s.stB;
        this.isTieBreak = s.tb;
        this.h1 = s.h1; this.h2 = s.h2; this.h3 = s.h3;
        this.historyCount = s.hc;
        this.isMatchOver = s.over;
        this.winner = s.win;
        if (!this.isMatchOver) this.showWinPage = true;
        this.state1 = this.state2; this.state2 = this.state3; this.state3 = null;
        this.updateUI();
        this.saveRaw();
    },

    saveState() {
        const current = {
            sA: this.scoreA, sB: this.scoreB, gA: this.gamesA, gB: this.gamesB,
            stA: this.setsA, stB: this.setsB, tb: this.isTieBreak,
            h1: this.h1, h2: this.h2, h3: this.h3, hc: this.historyCount,
            over: this.isMatchOver, win: this.winner
        };
        this.state3 = this.state2;
        this.state2 = this.state1;
        this.state1 = JSON.stringify(current);
    },

    resetMatch() {
        this.scoreA = 0; this.scoreB = 0;
        this.gamesA = 0; this.gamesB = 0;
        this.setsA = 0; this.setsB = 0;
        this.isTieBreak = false; this.isMatchOver = false;
        this.showWinPage = true;
        this.winner = "";
        this.h1 = ""; this.h2 = ""; this.h3 = "";
        this.h4 = ""; this.h5 = "";
        this.historyCount = 0;
        this.state1 = null; this.state2 = null; this.state3 = null;
        this.setJustWon = false;
        this.updateUI();
        this.saveRaw();
    },

    toggleMaxSets() {
        if (this.historyCount === 0 && this.scoreA === 0 && this.scoreB === 0) {
            this.maxSets = (this.maxSets === 3) ? 5 : 3;
            this.saveRaw();
        }
    },

    toggleGoldenPoint() {
        this.goldenPoint = !this.goldenPoint;
        this.saveRaw();
    }
}
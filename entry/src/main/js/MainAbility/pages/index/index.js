import storage from '@system.storage';
import brightness from '@system.brightness';
import vibrator from '@system.vibrator';

// Lite wearable storage: values max ~128 bytes, so everything is saved as short comma-joined strings.
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
        hist: [],            // finished sets: "6-4" or "7-6(7-5)"
        h1: "", h2: "", h3: "", h4: "", h5: "",
        undo: [],            // last 3 states, newest first
        vibrate: true,
        serve: "",           // serving team "A"/"B", "" = off
        t0: 0, t1: 0,        // match start / end (unix seconds)
        duration: "-",
        showWinPage: true,
        srvA: false, srvB: false,
        confirmReset: false,
        subText: "",
        pointAlert: "",      // "SET POINT" / "MATCH POINT" banner
        dimmed: false, origBright: 0, dimTimer: null, wakeCount: 0
    },

    onInit() {
        brightness.setKeepScreenOn({ keepScreenOn: true, success: function() {}, fail: function() {} });
        this.updateUI();
        this.loadRaw();
        this.wake();
    },

    onShow() {
        this.updateUI();
        this.wake();
    },

    onHide() {
        this.restoreBrightness();
    },

    onDestroy() {
        this.restoreBrightness();
    },

    // Dim the screen after 90 s without touches to save battery; any touch brings it back.
    wake() {
        this.wakeCount++;
        if (this.dimTimer) clearTimeout(this.dimTimer);
        if (this.dimmed) this.restoreBrightness();
        this.dimTimer = setTimeout(() => { this.dim(); }, 90000);
    },

    dim() {
        const n = this.wakeCount;
        brightness.getValue({
            success: (d) => {
                if (n !== this.wakeCount || this.dimmed) return;   // touched meanwhile
                this.origBright = d.value;
                this.dimmed = true;
                brightness.setValue({ value: Math.max(15, Math.round(d.value * 0.3)), success: function() {}, fail: function() {} });
            },
            fail: function() {}
        });
    },

    restoreBrightness() {
        if (this.dimTimer) { clearTimeout(this.dimTimer); this.dimTimer = null; }
        if (!this.dimmed) return;
        this.dimmed = false;
        brightness.setValue({ value: this.origBright, success: function() {}, fail: function() {} });
    },

    buzz(mode) {
        if (!this.vibrate) return;
        try { vibrator.vibrate({ mode: mode, success: function() {}, fail: function() {} }); } catch (e) {}
    },

    saveRaw() {
        const set = (key, value) => storage.set({ key: key, value: value, success: function() {}, fail: function() {} });
        set('mn', [this.scoreA, this.scoreB, this.gamesA, this.gamesB, this.setsA, this.setsB,
            this.isTieBreak ? 1 : 0, this.isMatchOver ? 1 : 0, this.winner, this.maxSets,
            this.goldenPoint ? 1 : 0, this.t0, this.t1, this.serve, this.vibrate ? 1 : 0].join(','));
        set('mh', this.hist.join(';'));
        set('mu', this.undo.join(';'));
    },

    loadRaw() {
        const get = (key, cb) => storage.get({
            key: key,
            success: (d) => { cb(d && d !== 'null' ? String(d) : ""); },
            fail: () => { cb(""); }
        });
        get('mn', (mn) => {
            const s = mn.split(',');
            if (s.length === 15) {   // ignores the old JSON format from v1.3
                this.scoreA = +s[0]; this.scoreB = +s[1];
                this.gamesA = +s[2]; this.gamesB = +s[3];
                this.setsA = +s[4]; this.setsB = +s[5];
                this.isTieBreak = s[6] === '1';
                this.isMatchOver = s[7] === '1';
                this.winner = s[8];
                this.maxSets = +s[9] || 3;
                this.goldenPoint = s[10] === '1';
                this.t0 = +s[11]; this.t1 = +s[12]; this.serve = s[13]; this.vibrate = s[14] !== '0';
            }
            get('mh', (mh) => {
                this.hist = (mn.charAt(0) !== '{' && mh && mh.charAt(0) !== '{') ? mh.split(';') : [];
                get('mu', (mu) => {
                    this.undo = mu ? mu.split(';') : [];
                    this.updateUI();
                });
            });
        });
    },

    addPointA() { this.addPoint('A'); },
    addPointB() { this.addPoint('B'); },

    addPoint(w) {
        this.wake();
        if (this.isMatchOver) return;
        this.saveState();
        if (!this.t0) this.t0 = Math.floor(Date.now() / 1000);
        const l = (w === 'A') ? 'B' : 'A';
        const s = this['score' + w], o = this['score' + l];
        if (this.isTieBreak) {
            this['score' + w] = s + 1;
            if (s + 1 >= 7 && (s + 1 - o) >= 2) this.winSet(w);
        } else if (s < 3) {
            this['score' + w] = s + 1;
        } else if (o < 3 || this.goldenPoint || s === 4) {
            this.winGame(w);
        } else if (o === 4) {
            this['score' + l] = 3;
        } else {
            this['score' + w] = 4;
        }
        this.updateUI();
        this.saveRaw();
    },

    winGame(w) {
        this.scoreA = 0; this.scoreB = 0;
        if (w === 'A') this.gamesA++; else this.gamesB++;
        this.buzz('short');
        this.flipServe();
        if (this.gamesA === 6 && this.gamesB === 6) {
            this.isTieBreak = true;
        } else if (this.gamesA >= 6 && (this.gamesA - this.gamesB) >= 2 || this.gamesA === 7) {
            this.winSet("A");
        } else if (this.gamesB >= 6 && (this.gamesB - this.gamesA) >= 2 || this.gamesB === 7) {
            this.winSet("B");
        }
    },

    winSet(w) {
        this.hist.push(this.gamesA + "-" + this.gamesB + (this.isTieBreak ? "(" + this.scoreA + "-" + this.scoreB + ")" : ""));
        if (w === 'A') this.setsA++; else this.setsB++;
        const needed = Math.ceil(this.maxSets / 2);
        if (this.setsA === needed || this.setsB === needed) {
            this.isMatchOver = true;
            this.showWinPage = true;
            this.winner = w;
            this.t1 = Math.floor(Date.now() / 1000);
            this.buzz('long');
        } else {
            this.gamesA = 0; this.gamesB = 0;
            this.scoreA = 0; this.scoreB = 0;
            this.isTieBreak = false;
            this.buzz('long');
        }
    },

    flipServe() {
        if (this.serve) this.serve = (this.serve === 'A') ? 'B' : 'A';
    },

    // Team serving now; in a tie-break the server changes after the 1st point and then every 2 points.
    server() {
        if (!this.serve) return "";
        if (!this.isTieBreak) return this.serve;
        const sw = Math.floor((this.scoreA + this.scoreB + 1) / 2) % 2;
        return sw ? (this.serve === 'A' ? 'B' : 'A') : this.serve;
    },

    toggleServe() {
        if (this.hist.length === 0 && this.scoreA + this.scoreB + this.gamesA + this.gamesB === 0) {
            this.serve = (this.serve === "") ? 'A' : (this.serve === 'A' ? 'B' : "");
            this.updateUI(); this.saveRaw();
        }
    },

    // Does the next point by team w win the current game (or the tie-break)?
    canWin(w) {
        const l = (w === 'A') ? 'B' : 'A', s = this['score' + w], o = this['score' + l];
        if (this.isTieBreak) return s + 1 >= 7 && (s + 1 - o) >= 2;
        return s === 4 || (s === 3 && (o < 3 || this.goldenPoint));
    },

    // 0 = nothing, 1 = set point, 2 = match point for team w
    pointLevel(w) {
        if (this.isMatchOver || !this.canWin(w)) return 0;
        const l = (w === 'A') ? 'B' : 'A', g = this['games' + w] + 1, og = this['games' + l];
        if (!(this.isTieBreak || (g >= 6 && (g - og) >= 2) || g === 7)) return 0;
        return (this['sets' + w] + 1 === Math.ceil(this.maxSets / 2)) ? 2 : 1;
    },

    updateUI() {
        const pa = this.pointLevel('A'), pb = this.pointLevel('B'), lv = Math.max(pa, pb);
        this.pointAlert = lv ? (lv === 2 ? 'MATCH POINT' : 'SET POINT') + ((pa === lv) !== (pb === lv) ? (pa === lv ? ' · ME' : ' · OPP') : '') : '';
        // Exactly one of subText / pointAlert is non-empty (a text with `if` toggled at runtime did not render on the watch).
        this.subText = lv ? "" : "SETS " + this.setsA + "-" + this.setsB + (this.isTieBreak ? " · TB" : "");
        const sv = this.server();
        this.srvA = sv === 'A'; this.srvB = sv === 'B';
        const tb = this.isTieBreak;
        this.pointsA = tb ? String(this.scoreA) : (this.pointsLabels[this.scoreA] || "0");
        this.pointsB = tb ? String(this.scoreB) : (this.pointsLabels[this.scoreB] || "0");
        const h = this.hist;
        this.h1 = h[0] ? "S1  " + h[0] : ""; this.h2 = h[1] ? "S2  " + h[1] : "";
        this.h3 = h[2] ? "S3  " + h[2] : ""; this.h4 = h[3] ? "S4  " + h[3] : "";
        this.h5 = h[4] ? "S5  " + h[4] : "";
        if (this.t0) {
            const m = Math.floor(((this.t1 || Math.floor(Date.now() / 1000)) - this.t0) / 60);
            this.duration = Math.floor(m / 60) + "h " + (m % 60) + "m";
        } else {
            this.duration = "-";
        }
    },

    closeWinPage() {
        this.showWinPage = false;
    },

    saveState() {
        const cur = [this.scoreA, this.scoreB, this.gamesA, this.gamesB, this.setsA, this.setsB,
            this.isTieBreak ? 1 : 0, this.isMatchOver ? 1 : 0, this.hist.length, this.serve === 'A' ? 1 : (this.serve === 'B' ? 2 : 0)].join(',');
        this.undo = [cur].concat(this.undo).slice(0, 3);
    },

    undoPoint() {
        this.wake();
        if (this.undo.length === 0) return;
        const s = this.undo[0].split(',').map(Number);
        this.undo = this.undo.slice(1);
        this.scoreA = s[0]; this.scoreB = s[1];
        this.gamesA = s[2]; this.gamesB = s[3];
        this.setsA = s[4]; this.setsB = s[5];
        this.isTieBreak = s[6] === 1;
        this.isMatchOver = s[7] === 1;
        this.hist = this.hist.slice(0, s[8]);
        this.serve = ['', 'A', 'B'][s[9]] || '';
        if (!this.isMatchOver) { this.winner = ""; this.t1 = 0; this.showWinPage = true; }
        if (this.hist.length === 0 && this.scoreA === 0 && this.scoreB === 0 && this.gamesA === 0 && this.gamesB === 0) this.t0 = 0;
        this.updateUI();
        this.saveRaw();
    },

    // First tap arms the button, second tap within 3 s resets (avoids wiping a match by accident).
    resetMatch() {
        this.wake();
        if (!this.confirmReset && !this.isMatchOver) {
            this.confirmReset = true;
            setTimeout(() => { this.confirmReset = false; }, 3000);
            return;
        }
        this.confirmReset = false;
        this.scoreA = 0; this.scoreB = 0;
        this.gamesA = 0; this.gamesB = 0;
        this.setsA = 0; this.setsB = 0;
        this.isTieBreak = false; this.isMatchOver = false;
        this.showWinPage = true;
        this.winner = "";
        this.hist = []; this.undo = [];
        this.t0 = 0; this.t1 = 0;
        this.updateUI();
        this.saveRaw();
    },

    toggleMaxSets() {
        if (this.hist.length === 0 && this.scoreA === 0 && this.scoreB === 0 && this.gamesA === 0 && this.gamesB === 0) {
            this.maxSets = (this.maxSets === 3) ? 5 : (this.maxSets === 5 ? 1 : 3);
            this.saveRaw();
        }
    },

    toggleVibrate() {
        this.vibrate = !this.vibrate;
        this.buzz('short');
        this.saveRaw();
    },

    toggleGoldenPoint() {
        this.goldenPoint = !this.goldenPoint;
        this.saveRaw();
    }
}

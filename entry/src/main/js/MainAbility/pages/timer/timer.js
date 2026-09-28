import Vibrator from '@system.vibrator';

var tick = null;

export default {
    data: {
        total: 60,
        timeText: '01:00',
        remaining: 60,
        percent: 0,
        running: false,
        vib30Done: false
    },

    onDestroy() {
        this.pause();
    },

    updateDisplay() {
        var minutes = Math.floor(this.remaining / 60);
        var seconds = this.remaining % 60;
        var mm = minutes < 10 ? '0' + minutes : String(minutes);
        var ss = seconds < 10 ? '0' + seconds : String(seconds);

        this.timeText = mm + ':' + ss;
        this.percent = Math.floor(((this.total - this.remaining) / this.total) * 100);
    },

    start() {
        if (this.running || this.remaining === 0) {
            return;
        }

        this.running = true;

        var self = this;
        tick = setInterval(function () {
            self.remaining -= 1;
            self.updateDisplay();

            if (!self.vib30Done && self.remaining === 30) {
                try {
                    Vibrator.vibrate({ mode: 'short' });
                    self.vib30Done = true;
                } catch (e) {
                }
            }

            if (self.remaining === 0) {
                self.pause();
                try {
                    Vibrator.vibrate({ mode: 'long' });
                } catch (e) {
                }
            }
        }, 1000);
    },

    pause() {
        if (tick !== null) {
            clearInterval(tick);
            tick = null;
        }
        this.running = false;
    },

    reset() {
        this.pause();
        this.remaining = this.total;
        this.updateDisplay();
        this.vib30Done = false;
    }
};

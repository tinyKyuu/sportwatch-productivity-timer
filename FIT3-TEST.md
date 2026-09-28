# Watch Fit 3 first-install test

This branch is a **smoke test**, not the planned multi-timer redesign. It starts
at `01:00`, waits for **Start**, supports **Pause** and **Reset**, vibrates at
`00:30`, and vibrates again at `00:00`. The countdown logic can be checked
without Huawei tools using `node --test tests/timer.test.mjs`.

Target watch: Huawei Watch Fit 3, observed firmware `5.0.0.29 (C00M06)`.
The project now declares `compatibleSdkVersion: 5.0.0(12)` instead of the
upstream `5.1.0(18)`. This is a first compatibility hypothesis, **not** a
confirmed mapping between the watch firmware number and SDK API level.

## Build and simulator

1. Open this directory as a project in DevEco Studio **5.1.1 for Mac ARM64**.
2. Install the HarmonyOS SDK version requested by the project, then try a
   **debug build without signing**. Do not publish the app.
3. If DevEco offers a Lite Wearable simulator, run the app there and check
   Start, Pause, Reset, and completion. Simulator vibration may not represent
   the physical watch.

The original project had a `signingConfig: "default"` reference but no
corresponding signing configuration. It has been removed so unsigned simulator
builds do not depend on private signing material. For the real watch, a
Huawei debug certificate and provision profile for
`de.tinykyuu.fit3.timer` may still be required. Keep keystores and profiles
out of Git.

## Prepare the Gadgetbridge file

A Lite Wearable HAP is a ZIP container containing a Huawei app `.bin` payload.
Gadgetbridge's Huawei app installer parses the **`.bin` payload**, not the HAP
container. After building a signed Lite Wearable HAP, check it with:

```sh
node scripts/check-gadgetbridge-package.mjs /path/to/entry-default-signed.hap
unzip -Z1 /path/to/entry-default-signed.hap
unzip -p /path/to/entry-default-signed.hap entry-default-signed.bin > /path/to/timer-test.bin
```

Use the actual `.bin` entry name shown by `unzip -Z1` if it differs. The check
script confirms that the binary has the header and `config.json` structure
Gadgetbridge expects; it **cannot** prove that the watch will accept the
signature or that this firmware allows sideloading.

Copy `timer-test.bin` to the Android phone, connect the watch in Gadgetbridge,
then open its **File Installer** and choose the `.bin`. If Gadgetbridge rejects
the file or the watch rejects the transfer, stop and record the exact message.
Do not update the watch firmware or reset its pairing for this test.

If the installed app opens, test on the watch in this order:

1. It displays `01:00` without starting itself.
2. Start decreases the display once per second; tapping Start again does not
   speed it up.
3. Pause holds the time, Start resumes, and Reset returns to `01:00`.
4. It vibrates once at `00:30`, once at `00:00`, and stays stopped at `00:00`.
5. Repeat with the display off to see whether the watch suspends the timer.

The final check is important: passing the JavaScript unit tests or simulator
does not establish that a Lite Wearable timer continues while the watch sleeps.

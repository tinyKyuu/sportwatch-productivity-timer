# Watch Fit 3 first-install test

This branch is a **smoke test**, not the planned multi-timer redesign. It starts
at `01:00`, waits for **Start**, supports **Pause** and **Reset**, vibrates at
`00:30`, and vibrates again at `00:00`. The countdown logic can be checked
without Huawei tools using `node --test tests/timer.test.mjs`.

Target watch: Huawei Watch Fit 3, observed firmware `5.0.0.29 (C00M06)`.
This branch uses the older Gradle-based HarmonyOS **API 6** Lite Wearable
project format. A first-hand report for the same watch firmware says this
format installed where a newer DevEco build did not. That is useful evidence,
**not** confirmation that this timer package will install through Gadgetbridge.

## Build and simulator

1. Use Huawei's official **DevEco Studio 3.1.1 Release, Mac (ARM)** archive
   (`devecostudio-mac-arm-3.1.0.501.zip`). Open this directory as a Gradle
   project. Do not use the separate `fit3-smoke-test` Hvigor branch in 3.1.
2. Install HarmonyOS **2.2.0 (API 6)** for Lite Wearable. On the test Mac,
   DevEco's SDK Manager could not reach its catalog, so the official Huawei
   Mac API 6 JS, Java, and toolchains archives were unpacked into the
   Git-ignored `.local-sdk/hmscore/2.2.0/` directory. The archived JS loader
   also needed its lockfile-pinned npm dependencies. Its obsolete Huawei-only
   `deccjsunit` test package was excluded locally; other Huawei-internal
   registry URLs were replaced with public npm URLs while retaining their
   integrity hashes. These changes are to the ignored SDK copy, not app code.
3. Use Node **16** for this older Gradle project (the test Mac used the
   verified official Node 16.19.1 archive). Set `NODE_HOME`, `JAVA_HOME`,
   `GRADLE_USER_HOME`, and `NODE_PATH` as needed, then run
   `./gradlew assembleDebug --offline --no-daemon`. `NODE_PATH` pointed to
   `js/build-tools/ace-loader/node_modules/webpack-cli/node_modules` because
   Huawei's loader imports its nested `yargs` dependency directly.
4. The first successful debug build is **unsigned**. It produces
   `entry/build/outputs/bin/debug/entry-debug-unsigned.bin` and
   `entry/build/outputs/hap/debug/entry-bin-debug-lite-unsigned.hap`. Do not
   publish the app.
5. If DevEco offers a Lite Wearable simulator, run the app there and check
   Start, Pause, Reset, and completion. Simulator vibration may not represent
   the physical watch.

The older Gradle project deliberately has no signing material. For the real
watch, a Huawei debug certificate and provision profile for
`de.tinykyuu.fit3.timer` and this watch's UDID may be required. This is a
development-signing step, not AppGallery publication. Keep keystores and
profiles out of Git.

## Prepare the Gadgetbridge file

A Lite Wearable HAP is a ZIP container containing a Huawei app `.bin` payload.
Gadgetbridge's Huawei app installer parses the **`.bin` payload**, not the HAP
container. The debug build already exposes the `.bin` directly. Check it with:

```sh
node scripts/check-gadgetbridge-package.mjs entry/build/outputs/bin/debug/entry-debug-unsigned.bin
```

The check script confirms that the binary has the header and `config.json`
structure Gadgetbridge expects; it **cannot** prove that the watch will accept
an unsigned build or that this firmware allows sideloading.

Copy `entry-debug-unsigned.bin` to the Android phone, connect the watch in
Gadgetbridge, then open its **File Installer** and choose the `.bin`. If
Gadgetbridge rejects the file or the watch rejects the transfer, stop and
record the exact message. A refusal may mean a signed build and a provision
profile are needed; do not try to bypass watch signature checks.
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

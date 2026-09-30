/**
 * Host half of `dsh-plugin-wechat-bubble`.
 *
 * This is a PURE CLIENT-SIDE UI plugin: it performs no host-side work. The
 * host half exists only so the package can be mounted as a loader entry (it is
 * declared as a `dsh.bundle` in package.json). Being a loaded cordis entry is
 * what lets the `dsh-client-modules` registry discover the `dsh.client`
 * declaration and ship the browser half (`client.js`) into the Web UI.
 *
 * All visible behaviour lives in the client half, which injects a plugin-owned
 * `<style>` tag. Unloading this plugin removes that tag, restoring the
 * system-default bubble.
 *
 * @param ctx - Host cordis context (intentionally unused).
 */
export default {
  name: 'dsh-plugin-wechat-bubble',
  apply() {
    // No host-side logic. The client half owns the entire feature.
  },
};

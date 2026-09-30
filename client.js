// Client half of `dsh-plugin-wechat-bubble` (adapted for DSH 0.1.x web).
//
// This bundle runs in the browser. It injects a single plugin-owned <style>
// tag (via ctx.effect, so it is removed on unload / HMR) that restyles ONLY
// the user-side message bubble to the WeChat look. Nothing else in the
// conversation - AI replies, system messages, code blocks, tool cards,
// avatars, the timestamp/actions row - is touched.
//
// The host half (index.js) is a no-op; all work happens here.
window.__ModuleLoader__.load({
	id: "dsh-plugin-wechat-bubble",
	factory: (require) => {
		var PLUGIN_ID = "dsh-plugin-wechat-bubble";

		/* ============================================================
		 * WeChat-style user message bubble
		 *
		 * Selector (current DSH 0.1.x build):
		 *
		 * `body .Sixlwa_userRow .Sixlwa_bubble` - the CSS-module classes
		 * emitted by @deepseek-ai/dsh-client-ui-chat (MessageItem.module.css)
		 * for the USER bubble: the user row (`.userRow`) right-aligns and its
		 * direct bubble div carries `.bubble`. Scope under the user row so AI
		 * replies / other surfaces that reuse the module can never be hit.
		 * The `Sixlwa` prefix is a per-build CSS-module hash, stable for a
		 * given DSH build; if a future release re-hashes the module, re-derive
		 * it (see README "Keeping the selector current"). Specificity `body
		 * .Sixlwa_userRow .Sixlwa_bubble` (0,2,1) outranks the framework's own
		 * `.Sixlwa_bubble` (0,1,0), so the override wins regardless of <style>
		 * tag order.
		 *
		 * Legacy easyrewrite target (kept for compatibility): when the
		 * dsh-easyrewrite plugin (user-message edit/recall) replaces the
		 * official bubble renderer, its bubble is a classless div whose
		 * background is an INLINE style (`background:
		 * var(--dsw-alias-interactive-bg-hover, ...)`). Inline styles beat
		 * every stylesheet rule, so that target needs `!important`. While a
		 * message is being edited the row switches to
		 * data-dsh-easyrewrite="user-editing", which this selector
		 * deliberately does not match.
		 *
		 * Overridden: `background`, `border-radius`, `padding`, and (Part 3)
		 * `font-size` / `line-height` / `letter-spacing` (+2px / +2px / +10%
		 * of font size) with a slightly airier padding; plus (Part 2) a
		 * `position: relative` context and a ::before tail arrow. Text color,
		 * avatar and image layout are left exactly as the host renders them.
		 * ============================================================ */
		/* Hash-prefix-independent selectors.
		 * The CSS-module hash prefix (Sixlwa_ in 0.1.2, cJsG2q_ in 0.2.0, ...) is
		 * re-derived on every DSH build, so a hardcoded prefix breaks on upgrade.
		 * Matching the stable class-name suffix via [class*='_userRow'] /
		 * [class*='_bubble'] works across builds. Scope under the user row so AI
		 * replies / other surfaces that reuse the module can never be hit. */
		var USER_ROW = "body [class*='_userRow']";
		var BUBBLE = "[class*='_bubble']";
		var EASYREWRITE = "div[data-dsh-easyrewrite='user'] > div[title]";
		/* dsh-msg-edit (bubble edit/recall plugin) replaces the official user-bubble
		 * renderer too: a row div carrying data-dsh-msg-edit="user" whose direct
		 * child bubble div is classless with an INLINE background style. Like
		 * easyrewrite, it needs !important to beat the inline style. */
		var MSG_EDIT = "div[data-dsh-msg-edit='user'] > div[title]";
		/* Second user-bubble variant: classless content div inside a right-aligned
		 * flex column, scoped under the flow-item wrapper. This is the DOM DSH uses
		 * for plain-text user messages (no _bubble class). The [style*="flex-end"]
		 * parent + [style*="max-width"] child combo is specific enough to avoid
		 * hitting AI bubbles (which are left-aligned) or other surfaces. */
		var FLOW_BUBBLE = "[class*='flowItem'] div[style*='flex-end'] > div[style*='max-width']";

		var css = [
			/* ---- Light mode: WeChat classic green ---- */
			USER_ROW + " " + BUBBLE + ", " + FLOW_BUBBLE + ", " + MSG_EDIT + " {",
			"  background: #95ec69 !important;   /* WeChat sent-bubble green */",
			"  border-radius: 6px !important;    /* WeChat's subtle corner rounding */",
			"  padding: 12px 16px !important;    /* Part 3: airier (was 10px 12px) */",
			"  font-size: 18px !important;       /* Part 3: 16px + 2 */",
			"  line-height: 26px !important;     /* Part 3: 24px + 2 */",
			"  letter-spacing: 0.1em !important; /* Part 3: +10% of font size */",
			"}",
			/* dsh-easyrewrite user bubble (inline style -> !important) */
			EASYREWRITE + " {",
			"  background: #95ec69 !important;",
			"  border-radius: 6px !important;",
			"  padding: 12px 16px !important;     /* Part 3: airier */",
			"  font-size: 16px !important;        /* Part 3: 14px + 2 */",
			"  line-height: 24px !important;      /* Part 3: 22px + 2 */",
			"  letter-spacing: 0.1em !important;  /* Part 3: +10% of font size */",
			"}",
			/* dsh-msg-edit user bubble (inline style -> !important) */
			MSG_EDIT + " {",
			"  background: #95ec69 !important;",
			"  border-radius: 6px !important;",
			"  padding: 12px 16px !important;     /* Part 3: airier */",
			"  font-size: 16px !important;        /* Part 3: 14px + 2 */",
			"  line-height: 24px !important;      /* Part 3: 22px + 2 */",
			"  letter-spacing: 0.1em !important;  /* Part 3: +10% of font size */",
			"}",
			/* ---- Dark mode: brightness-adapted green ----
			 * The framework's label color is near-white in dark mode, so the
			 * green is darkened to keep the (unchanged) text readable. Only
			 * the background is retuned; shape and padding stay identical. */
			"body[data-ds-dark-theme] [class*='_userRow'] " + BUBBLE + ", body[data-ds-dark-theme] " + FLOW_BUBBLE + ", body[data-ds-dark-theme] " + MSG_EDIT + " {",
			"  background: #4a7c34 !important;   /* darkened WeChat green for dark surfaces */",
			"}",
			"body[data-ds-dark-theme] " + EASYREWRITE + " {",
			"  background: #4a7c34 !important;",
			"}",
			/* ---- Part 2: WeChat tail arrow ----
			 * Small right-pointing triangle on the bubble's right edge, near
			 * the top - the classic WeChat sent-bubble tail. A ::before
			 * pseudo-element (border trick): pseudo-elements are not affected
			 * by the inline styles easyrewrite puts on the bubble, so no
			 * !important is needed here. The bubble only becomes the
			 * positioning context (position: relative - no inline conflict).
			 * The 7px overhang lands inside the chat scroll container's
			 * horizontal padding, so nothing clips it. */
			USER_ROW + " " + BUBBLE + ",",
			EASYREWRITE + ",",
			MSG_EDIT + " {",
			"  position: relative;",
			"}",
			USER_ROW + " " + BUBBLE + "::before,",
			EASYREWRITE + "::before,",
			MSG_EDIT + "::before {",
			"  content: \"\";",
			"  position: absolute;",
			"  top: 12px;",
			"  right: -7px;",
			"  width: 0;",
			"  height: 0;",
			"  border-top: 5px solid transparent;",
			"  border-bottom: 5px solid transparent;",
			"  border-left: 7px solid #95ec69;",
			"}",
			"body[data-ds-dark-theme] [class*='_userRow'] " + BUBBLE + "::before,",
			"body[data-ds-dark-theme] " + EASYREWRITE + "::before,",
			"body[data-ds-dark-theme] " + MSG_EDIT + "::before {",
			"  border-left-color: #4a7c34;",
			"}"
		].join("\n");

		function installStyles(ctx) {
			if (typeof document === "undefined") return;
			ctx.effect(
				function () {
					var tag = document.createElement("style");
					tag.dataset.plugin = PLUGIN_ID;
					tag.dataset.pluginCss = PLUGIN_ID + "/wechat-bubble.css";
					tag.textContent = css;
					document.head.appendChild(tag);
					return function () {
						tag.remove();
					};
				},
				"wechat-bubble: stylesheet"
			);
		}

		/* ---- Inline-style enforcement (root fix for the "flashes then gone" bug) ----
		 * The <style> tag above is repeatedly removed by DSH's HMR / theme system,
		 * which is exactly why the bubble flashes green once and then reverts to the
		 * default black. A MutationObserver that re-applies the WeChat look as INLINE
		 * styles on each bubble element is immune to that: inline styles outrank every
		 * stylesheet rule and survive the <style> tag's removal. This observer is a
		 * plugin-owned effect, so it stops cleanly on unload / HMR. */
		var LIGHT = { background: "#95ec69", borderRadius: "6px", padding: "12px 16px" };
		var DARK = { background: "#4a7c34" };

		function isUserBubble(el) {
			if (!el || el.nodeType !== 1) return false;
			var cls = el.getAttribute("class") || "";
			if (/_bubble\b/.test(cls)) return true;
			/* Second variant: classless content div inside right-aligned flex column */
			var st = el.getAttribute("style") || "";
			if (st.indexOf("max-width") !== -1 &&
				el.parentElement &&
				(el.parentElement.getAttribute("style") || "").indexOf("flex-end") !== -1) return true;
			/* Third variant: dsh-msg-edit user bubble — classless div with a title,
			 * direct child of the data-dsh-msg-edit="user" row. */
			if (el.hasAttribute("title") &&
				el.parentElement &&
				el.parentElement.getAttribute("data-dsh-msg-edit") === "user") return true;
			return false;
		}

		function paint(el) {
			if (!isUserBubble(el)) return;
			var dark = document.body && document.body.matches ? document.body.matches("[data-ds-dark-theme]") : false;
			el.style.setProperty("background", dark ? DARK.background : LIGHT.background, "important");
			el.style.setProperty("border-radius", LIGHT.borderRadius, "important");
			el.style.setProperty("padding", LIGHT.padding, "important");
		}

		function installObserver(ctx) {
			if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;
			ctx.effect(
				function () {
					var paintAll = function () {
						/* Variant 1: _bubble class nodes */
						var nodes = document.querySelectorAll("[class*='_bubble']");
						for (var i = 0; i < nodes.length; i++) paint(nodes[i]);
						/* Variant 2: classless content divs in right-aligned flex columns */
						var flows = document.querySelectorAll("[class*='flowItem'] div[style*='flex-end'] > div[style*='max-width']");
						for (var j = 0; j < flows.length; j++) paint(flows[j]);
						/* Variant 3: dsh-msg-edit user bubbles */
						var edits = document.querySelectorAll("div[data-dsh-msg-edit='user'] > div[title]");
						for (var k = 0; k < edits.length; k++) paint(edits[k]);
					};

					/* Strategy: continuously repaint ALL user bubbles every 150ms.
					 * This is the simplest bulletproof approach — no matter what
					 * React does (replace nodes, strip styles, re-render), we
					 * recover within one tick. Bubbles are few, cost is negligible. */
					var timer = null;
					(function poll() {
						paintAll();
						timer = setTimeout(poll, 150);
					})();

					return function () {
						if (timer) clearTimeout(timer);
					};
				},
				"wechat-bubble: inline enforcement"
			);
		}

		function apply(ctx) {
			installStyles(ctx);
			installObserver(ctx);
		}

		return { name: PLUGIN_ID, inject: [], apply: apply };
	}
});

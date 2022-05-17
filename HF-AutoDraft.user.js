// ==UserScript==
// @name         HF-AutoDraft
// @namespace    https://hackforums.net/
// @version      1.0
// @description  HF automatic draft utility
// @author       xHeaven#2143
// @match        *://hackforums.net/showthread.php*
// @match        *://hackforums.net/newreply.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        none
// ==/UserScript==

(function () {
	'use strict';

	const qs = (selector, parent = document) => {
		return parent.querySelector(selector);
	}

	const isMoreThanOneDay = (date1, date2) => {
		const diff = Math.abs(date2.getTime() - date1.getTime());
		const diffDays = Math.ceil(diff / (1000 * 3600 * 24));
		return diffDays > 1;
	}

	const debounce = (func, timeout = 300) => {
		let timer;
		return (...args) => {
			clearTimeout(timer);
			timer = setTimeout(() => {
				func.apply(this, args);
			}, timeout);
		}
	}

	let messageBox, tid, replyButton;
	const pathName = window.location.pathname;
	const urlParams = new URLSearchParams(window.location.search);

	const init = () => {
		if (!urlParams.has('tid')) {
			return false;
		}

		tid = urlParams.get('tid');

		if (pathName === "/showthread.php") {
			messageBox = qs("textarea[name='message'][id='message']");
			replyButton = qs("#quick_reply_submit");
		}

		if (pathName === "/newreply.php") {
			messageBox = qs("textarea:not(#message)");
			replyButton = qs("input[type='submit'][name='submit'][value='Post Reply']");
		}

		return !(!messageBox || !tid || !replyButton);
	}

	const restore = () => {
		const draftRaw = localStorage.getItem(`hackforums-auto-draft-${tid}`);
		const draft = JSON.parse(draftRaw);

		if (!draft) {
			return;
		}

		if (!draft.date || !draft.message || draft.message === "") {
			return;
		}

		const draftDate = new Date(draft.date);

		if (isNaN(draftDate.getTime())) {
			return;
		}

		if (isMoreThanOneDay(new Date(), draftDate)) {
			console.log(`Draft is more than one day old, not restoring. Removing it from cache... - ${tid}`);
			localStorage.removeItem(`hackforums-auto-draft-${tid}`);
			console.log(`Removed! - ${tid}`);
		} else {
			messageBox.value = draft.message;
			console.log(`Draft restored! - ${tid}`);
		}
	}

	const listen = () => {
		messageBox.addEventListener('keyup', debounce(() => {
			const draftObj = {
				message: messageBox.value, date: new Date()
			}

			const draft = JSON.stringify(draftObj);

			localStorage.setItem(`hackforums-auto-draft-${tid}`, draft);

			console.log(`Draft saved! - ${tid}`);
		}));

		replyButton.addEventListener('click', () => {
			localStorage.removeItem(`hackforums-auto-draft-${tid}`);
			console.log(`Draft removed because you've replied! - ${tid}`);
		});
	}

	if (!init()) {
		console.log(`HF Auto-Draft init failed. - ${tid}`);
		return;
	}

	restore();

	listen();
})();

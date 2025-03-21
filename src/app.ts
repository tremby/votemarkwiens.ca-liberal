function selectOrFail<T extends HTMLElement = HTMLElement>(
	selector: string,
	elementType: { new (): T } = HTMLElement as { new (): T }
): T {
	const el = document.querySelector(selector);
	if (el == null) throw new Error(`No element matching selector ${selector} found`);
	if (el instanceof elementType) return el;
	throw new Error(`Element ${el} matching selector ${selector} is not the expected type`);
}

function toggleNav(force: boolean | undefined = undefined) {
	const nav = selectOrFail("#main-nav");
	const isOpen = nav.classList.toggle("is-open", force);
	nav.inert = !isOpen;
	const button = selectOrFail("#nav-toggle", HTMLButtonElement);
	button.ariaExpanded = isOpen ? "true" : "false";
}

function handleNavClick(event: MouseEvent) {
	const clickedEl = event.target;
	if (clickedEl == null) return;
	if (!(clickedEl instanceof HTMLElement)) return;
	if (clickedEl.closest("a") == null) return;
	toggleNav(false);
}

function handleRootKeydown(event: KeyboardEvent) {
	if (event.defaultPrevented) return;
	if (event.key !== "Escape") return;
	if (!selectOrFail("#main-nav").classList.contains("is-open")) return;
	event.preventDefault();
	event.stopPropagation();
	toggleNav(false);
}

function initScrollSpy() {
	let lockTimer: ReturnType<typeof setTimeout> | null = null;
	let dirty = false;

	const scrollRoot = document.scrollingElement;
	if (scrollRoot == null) return;

	const lis = new Map<string, HTMLLIElement>(
		[...document.querySelectorAll<HTMLAnchorElement>("#desktop-nav li a[href^='#']")]
			.map((a) => {
				const id = new URL(a.href).hash.substring(1);
				const li = a.closest("li")!;
				return [id, li]
			})
	);

	const docStyle = getComputedStyle(scrollRoot);

	function update() {
		dirty = false;
		const viewportHeight = document.documentElement.clientHeight;
		const padTop = parseInt(docStyle.scrollPaddingTop) || 0;
		const padBottom = parseInt(docStyle.scrollPaddingBottom) || 0;
		const mid = padTop + (viewportHeight - padTop - padBottom) / 2;
		let best: HTMLLIElement | null = null;
		for (const [id, li] of lis.entries()) {
			const element = document.getElementById(id);
			if (element == null) continue;
			const { top } = element.getBoundingClientRect();
			if (top > mid) break;
			best = li;
		}
		for (const li of lis.values()) li.classList.toggle("is-current", li === best);
	}

	function throttledUpdate() {
		dirty = true;
		if (lockTimer != null) return;
		update();
		lockTimer = setTimeout(() => {
			lockTimer = null;
			if (dirty) update();
		}, 100);
	}

	document.addEventListener("resize", throttledUpdate);
	document.addEventListener("scroll", throttledUpdate);
	update();
}

function init() {
	selectOrFail("#nav-toggle", HTMLButtonElement).addEventListener("click", () => toggleNav());
	selectOrFail("#main-nav").addEventListener("click", handleNavClick);
	selectOrFail("body").addEventListener("keydown", handleRootKeydown);
	initScrollSpy();
}

init();

import { getLaunch, searchLaunches } from './api.js';
import { el, empty } from './elements.js';

function idSet(event) {
	// const location = Location;
	const a = event.target.closest('li');
	const idOut = a.childNodes[0].childNodes[3].textContent;
	window.history.pushState({}, '', `/?id=${idOut}`)
	window.history.go()
}

/**
 * Býr til leitarform.
 * @param {(e: SubmitEvent) => void} searchHandler Fall sem keyrt er þegar leitað er.
 * @param {string | undefined} query Leitarstrengur.
 * @returns {HTMLElement} Leitarform.
 */
export function renderSearchForm(searchHandler, query = undefined) {
	const form = el(
		'form',
		{ class: 'nafn grid-container' },
		el('input', { value: query ?? '', name: 'query' }),
		el('button', { class: 'search-button' }, 'Leita')
	);

	form.addEventListener('submit', searchHandler);

	return form;
}

/**
 * Setur „loading state“ skilabað meðan gögn eru sótt.
 * @param {HTMLElement} parentElement Element sem á að birta skilbaoð í.
 * @param {Element | undefined} searchForm Leitarform sem á að gera óvirkt.
 */
function setLoading(parentElement, searchForm = undefined) {
	let loadingElement = parentElement.querySelector('.loading');
	parentElement.classList.add('loading')

	if (!loadingElement) {
		loadingElement = el('div', { class: 'loading' }, 'Sæki gögn...');
		parentElement.appendChild(loadingElement);
	}

	if (!searchForm) {
		return;
	}

	const button = searchForm.querySelector('button');

	if (button) {
		button.setAttribute('disabled', 'disabled');
	}
}

/**
 * Fjarlægir „loading state“.
 * @param {HTMLElement} parentElement Element sem inniheldur skilaboð.
 * @param {Element | undefined} searchForm Leitarform sem á að gera virkt.
 */
function setNotLoading(parentElement, searchForm = undefined) {
	const loadingElement = parentElement.querySelector('.loading');
	parentElement.classList.remove('loading');

	if (loadingElement) {
		loadingElement.remove();
	}

	if (!searchForm) {
		return;
	}

	const disabledButton = searchForm.querySelector('button[disabled]');

	if (disabledButton) {
		disabledButton.removeAttribute('disabled');
	}
}

/**
 * Birta niðurstöður úr leit.
 * @param {import('./api.types.js').Launch[] | null} results Niðurstöður úr leit
 * @param {string} query Leitarstrengur.
 */
function createSearchResults(results, query) {
	const list = el('ul', { class: 'results' });

	if (!results) {
		const noResultsElement = el('li', {}, `Villa við leit að ${query}`);
		list.appendChild(noResultsElement);
		return list;
	}

	if (results.length === 0) {
		const noResultsElement = el(
			'li',
			{},
			`Engar niðurstöður fyrir leit að ${query}`
		);
		list.appendChild(noResultsElement);
		return list;
	}

	for (const result of results) {
		const resultElement = el(
			'li',
			{ class: 'result' },
			el('button', { class: 'id-trigger' },
				el('span', { class: 'name' }, result.name), ': ',
				el('span', { class: 'name' }, result.status.name),
				el('span', { class: 'id' }, result.id)
			)
		);
		const idSubmit = resultElement.childNodes[0];
		idSubmit.addEventListener('click', idSet);
		list.appendChild(resultElement);
	}

	return list;
}

/**
 *
 * @param {HTMLElement} parentElement Element sem á að birta niðurstöður í.
 * @param {Element} searchForm Form sem á að gera óvirkt.
 * @param {string} query Leitarstrengur.
 */
export async function searchAndRender(parentElement, searchForm, query) {
	const mainElement = parentElement.querySelector('main');

	if (!mainElement) {
		console.warn('fann ekki <main> element');
		return;
	}

	// Fjarlægja fyrri niðurstöður
	const resultsElement = mainElement.querySelector('.results');
	if (resultsElement) {
		resultsElement.remove();
	}

	setLoading(mainElement, searchForm);
	const results = await searchLaunches(query);
	setNotLoading(mainElement, searchForm);

	const resultsEl = createSearchResults(results, query);

	mainElement.appendChild(resultsEl);
}

/**
 * Sýna forsíðu, hugsanlega með leitarniðurstöðum.
 * @param {HTMLElement} parentElement Element sem á að innihalda forsíðu.
 * @param {(e: SubmitEvent) => void} searchHandler Fall sem keyrt er þegar leitað er.
 * @param {string | undefined} query Leitarorð, ef eitthvað, til að sýna niðurstöður fyrir.
 */
export function renderFrontpage(
	parentElement,
	searchHandler,
	query = undefined
) {
	const heading = el(
		'h1',
		{ class: 'heading nafn', 'data-foo': 'bar' },
		'🚀 Geimskotaleitin'
	);
	const searchForm = renderSearchForm(searchHandler, query);

	const container = el('main', { class: 'grid-container' }, heading, searchForm);
	parentElement.appendChild(container);

	if (!query) {
		return;
	}

	searchAndRender(parentElement, searchForm, query);
}

function buildDetailList(mainElement, result) {
	/* TODO útfæra ef gögn */
	const nafnid = el('h2', { class: 'nafn' }, result?.name)
	const datalist = el('ol', { class: 'span12 grid-container' }, el(
		'li', { class: 'span12' },
		el('p', { class: 'span12' }, `Gluggi opnast: ${result.window_start}`),
		el('p', { class: 'span12' }, `Gluggi lokast: ${result.window_end}`),),
		el('li', { class: 'span12' }, el('h3', {}, `Staða: ${result.status.name}`), el('p', {}, result.status.description)),
		el('li', { class: 'span12' }, el('h3', {}, `Geimferð: ${result.mission.name}`), el('p', {}, result.mission.description)),
		el('li', { class: 'span12' }, el('figure', {}, el('img', { src: result.image }, ''))),


	)
	mainElement.appendChild(nafnid)
	mainElement.appendChild(datalist)
	return mainElement;
}

/**
 * Sýna geimskot.
 * @param {HTMLElement} parentElement Element sem á að innihalda geimskot.
 * @param {string} id Auðkenni geimskots.
 */
export async function renderDetails(parentElement, id) {
	empty(parentElement);
	const heading = el(
		'h1',
		{ class: 'heading nafn', 'data-foo': 'bar' }, '🚀 Geimskotaleitin')
		;
	const backElement = el(
		'div',
		{ class: 'back' },
		el('a', { href: '/', class: 'back' }, 'Til baka')
	);
	backElement.addEventListener('click', () => {
		window.history.back();
	});
	const container = el('main', { class: 'grid-container' }, heading);
	// empty(parentElement);
	parentElement.appendChild(container);
	const mainElement = parentElement.querySelector('main');
	if (!mainElement) {
		console.warn('fann ekki <main> element');
		return;
	}
	/* TODO setja loading state og sækja gögn */
	setLoading(mainElement)
	const result = await getLaunch(id);
	setNotLoading(mainElement)

	parentElement.querySelector('main')?.appendChild(backElement)
	// Tómt og villu state, við gerum ekki greinarmun á þessu tvennu, ef við
	// myndum vilja gera það þyrftum við að skilgreina stöðu fyrir niðurstöðu
	if (!result) {
		/* TODO útfæra villu og tómt state */
		const noResultsElement = el(
			'p',
			{},
			`Engar niðurstöður fyrir leit að ${id}`
		);
		parentElement.querySelector('main')?.appendChild(noResultsElement);
		return
	}
	buildDetailList(mainElement, result);
	mainElement.appendChild(backElement);
}
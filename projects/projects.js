import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

// Update title with project count
const projectsTitle = document.querySelector('.projects-title');
if (projectsTitle) {
    projectsTitle.textContent = `${projects.length} Projects`;
}

// Step 1.3: Arc generator
const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

// Step 1.5: Color scale keyed by year label for consistent colors across re-renders
const colors = d3.scaleOrdinal(d3.schemeTableau10);

// ─── State ──────────────────────────────────────────────────────────────────
// BUG FIX: both filters live here as plain variables — NOT inside closures.
// This is the core fix. The buggy version stored the year selection only inside
// the click handler's closure, so the search handler could never see it (and
// vice versa). By lifting both pieces of state here, every event handler reads
// the same source of truth before re-rendering.
let query = '';          // current search string (set by search bar)
let selectedYear = null; // currently selected pie year — null means "show all"

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Returns projects matching only the search query (used to feed the pie chart,
// so the pie always reflects "what years are in my search results").
function getSearchFilteredProjects() {
    if (!query) return projects;
    return projects.filter(project => {
        // Step 4.3: case-insensitive, search across all metadata fields
        const values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query.toLowerCase());
    });
}

// Returns projects matching BOTH the search query AND the selected year.
// This is what the project list shows. In the buggy version this function
// didn't exist — the search handler only applied query, and the click handler
// only applied year, so they always overwrote each other.
function getFullyFilteredProjects() {
    const searchFiltered = getSearchFilteredProjects();
    if (selectedYear === null) return searchFiltered;
    // Step 5.3: additionally filter by selected year
    return searchFiltered.filter(p => String(p.year) === selectedYear);
}

// ─── Pie chart renderer ───────────────────────────────────────────────────────

function renderPieChart(projectsGiven) {
    // Step 3.1: Roll up projects by year
    const rolledData = d3.rollups(
        projectsGiven,
        v => v.length,
        d => d.year
    );

    // Convert to { value, label } objects expected by sliceGenerator
    const data = rolledData.map(([year, count]) => ({
        value: count,
        label: String(year)
    }));

    // Step 1.4 / 1.5: Slice generator + arc paths
    const sliceGenerator = d3.pie().value(d => d.value);
    const arcData = sliceGenerator(data);
    const arcs = arcData.map(d => arcGenerator(d));

    // Clear old content before re-render (Step 4.4)
    const svg = d3.select('#projects-pie-plot');
    svg.selectAll('path').remove();
    const legend = d3.select('.legend');
    legend.selectAll('li').remove();

    // Step 1.4 / 5.2: Draw pie slices with click interaction
    arcs.forEach((arc, i) => {
        svg
            .append('path')
            .attr('d', arc)
            .attr('fill', colors(data[i].label))
            .attr('class', data[i].label === selectedYear ? 'selected' : '')
            .on('click', () => {
                // Step 5.2: toggle — click selected wedge to deselect.
                // BUG FIX: we only update selectedYear here, then call updateView().
                // The buggy version would call renderProjects(projectsGiven.filter(year))
                // directly, which ignored query entirely — year-only filter.
                selectedYear = selectedYear === data[i].label ? null : data[i].label;
                updateView();
            });
    });

    // Step 2.2: Draw legend entries with color swatch
    data.forEach((d, idx) => {
        legend
            .append('li')
            .attr('style', `--color: ${colors(d.label)}`)
            .attr('class', d.label === selectedYear ? 'selected' : '')
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
    });
}

// ─── Master update: derive both views from current state ───────────────────
// BUG FIX: this single function is called by BOTH event handlers. It always
// reads the latest query and selectedYear, so both filters are always applied.
// The buggy version had no equivalent — each handler re-rendered independently,
// so whichever ran last would silently drop the other handler's filter.
function updateView() {
    // Project list = search query AND selected year both applied
    renderProjects(getFullyFilteredProjects(), projectsContainer, 'h2');
    // Pie chart = search query only (so wedge sizes reflect search results,
    // not the further year-filtered subset — otherwise clicking a wedge would
    // collapse the pie to a single slice, which is useless)
    renderPieChart(getSearchFilteredProjects());
}

// ─── Step 4: Search ──────────────────────────────────────────────────────────

const searchInput = document.querySelector('.searchBar');
const resetButton = document.querySelector('.resetFilters');

searchInput.addEventListener('change', (event) => {
    query = event.target.value; // update state...
    updateView();               // ...then re-derive the whole view from state.
    // BUG FIX: the buggy version called renderProjects(filteredProjects) here
    // directly, which only applied the query and ignored selectedYear entirely.
});

// Show/hide the reset button whenever either filter is active
function syncResetButton() {
    resetButton.hidden = (query === '' && selectedYear === null);
}

// Clear both filters at once
resetButton.addEventListener('click', () => {
    query = '';
    selectedYear = null;
    searchInput.value = '';
    updateView();
});

// Wrap updateView to also sync the reset button after every render
const _updateView = updateView;
updateView = function () {
    _updateView();
    syncResetButton();
};

// ─── Initial render ──────────────────────────────────────────────────────────
updateView();

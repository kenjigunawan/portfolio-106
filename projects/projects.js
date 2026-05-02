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
// (Extra Credit: track both filters as independent state so they compose)
let query = '';         // current search string
let selectedYear = null; // currently selected pie year (null = none)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSearchFilteredProjects() {
    if (!query) return projects;
    return projects.filter(project => {
        // Step 4.3: case-insensitive, search across all metadata fields
        const values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query.toLowerCase());
    });
}

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
                // Step 5.2: toggle — click selected wedge to deselect
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
// Extra Credit fix: the pie always reflects the search filter; the project list
// reflects BOTH the search filter and the year selection. This means searching
// then clicking a wedge (or vice-versa) composes correctly in both directions.

function updateView() {
    renderProjects(getFullyFilteredProjects(), projectsContainer, 'h2');
    renderPieChart(getSearchFilteredProjects());
}

// ─── Step 4: Search ──────────────────────────────────────────────────────────

const searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('change', (event) => {
    query = event.target.value;
    updateView();
});

// ─── Initial render ──────────────────────────────────────────────────────────
updateView();

let datasets = [];

// Load datasets from db.dpo
async function loadDatasets() {
  const resp = await fetch('db/db.dpo');
  const db = await resp.json();
  // Map db.dpo lines to datasets array
  const sheet = db.sheets[0];
  datasets = sheet.lines.map(line => ({
    title: line.Name,
    description: line.Description,
    topic: '', // No topic in db.dpo, leave blank or map if available
    area: '',  // No area in db.dpo, leave blank or map if available
    resolution: `${line["Pixel resolution"]} ${line["Resolution unit"] || ''}`.trim(),
    yearStart: line["Year Start"],
    yearEnd: line["Year End"],
    link: line["link address"] || ''
  }));
  renderResults(datasets);
}

// Autodetect theme (light/dark), default to dark
(function() {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
})();

// Search logic
const form = document.getElementById('search-form');
const resultsSection = document.getElementById('results');

form.addEventListener('submit', function(e) {
  e.preventDefault();
  const query = document.getElementById('query').value.trim().toLowerCase();
  const topic = document.getElementById('topic').value;
  // Remove resolution and area, as db.dpo does not provide these fields directly
  // const resolution = document.getElementById('resolution').value;
  // const area = document.getElementById('area').value.trim().toLowerCase();

  // Filter datasets
  const filtered = datasets.filter(ds => {
    const matchesQuery = !query || ds.title.toLowerCase().includes(query) || ds.description.toLowerCase().includes(query);
    const matchesTopic = !topic || ds.topic === topic;
    // No filtering on resolution/area since not present
    return matchesQuery && matchesTopic;
  });

  renderResults(filtered);
});

function renderResults(results) {
  if (results.length === 0) {
    resultsSection.innerHTML = `<div style="opacity:0.7;">No datasets found.</div>`;
    return;
  }
  resultsSection.innerHTML = results.map(ds => {
    const metaParts = [];
    if (ds.resolution) metaParts.push(`Resolution: ${ds.resolution}`);
    if (ds.yearStart !== undefined && ds.yearEnd !== undefined)
      metaParts.push(`Years: ${ds.yearStart}–${ds.yearEnd}`);
    const meta = metaParts.join(' &nbsp;|&nbsp; ');
    const cardContent = `
      <div class="result-title">${ds.title}</div>
      <div class="result-meta">
        ${meta}
      </div>
      <hr>
      <div class="result-desc">${ds.description}</div>
    `;
    // If link exists, wrap card in <a>
    return ds.link
      ? `<a class = "result-card" href="${ds.link}" target="_blank" rel="noopener">${cardContent}</a>`
      : `<div class="result-card">${cardContent}</div>`;
  }).join('');
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Initial render: load datasets from db.dpo
document.addEventListener('DOMContentLoaded', loadDatasets);

// Responsive: Advanced search toggle (always hidden unless toggled, all screen sizes)
(function() {
  const searchBar = document.querySelector('.search-bar');
  const advToggle = document.querySelector('.search-advanced-toggle');
  const advSection = document.getElementById('search-advanced');

  function hideAdvanced() {
    searchBar.classList.remove('show-advanced');
    advSection.style.display = 'none';
    advToggle.setAttribute('aria-expanded', 'false');
  }
  function showAdvanced() {
    searchBar.classList.add('show-advanced');
    advSection.style.display = 'flex';
    advToggle.setAttribute('aria-expanded', 'true');
  }

  advToggle.addEventListener('click', function() {
    if (searchBar.classList.contains('show-advanced')) {
      hideAdvanced();
    } else {
      showAdvanced();
    }
  });

  // Always show toggle button, always hide advanced by default
  function setup() {
    advToggle.style.display = 'inline-block';
    hideAdvanced();
  }

  window.addEventListener('resize', setup);
  document.addEventListener('DOMContentLoaded', setup);
})();
console.log('IT\'S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Step 3: Automatic navigation menu
const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"
  : "/portfolio-106/";

const pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'resume/', title: 'Resume' },
  { url: 'https://github.com/kenjigunawan', title: 'GitHub' },
];

// Create and prepend navigation
let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;
  
  // Adjust relative URLs with BASE_PATH
  if (!url.startsWith('http')) {
    url = BASE_PATH + url;
  }
  
  // Create link element
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  
  // Highlight current page
  if (a.host === location.host && a.pathname === location.pathname) {
    a.classList.add('current');
  }
  
  // Open external links in new tab
  if (a.host !== location.host) {
    a.target = '_blank';
  }
  
  nav.append(a);
}

// Step 4: Dark mode switcher
function setColorScheme(colorScheme) {
  document.documentElement.style.setProperty('color-scheme', colorScheme);
  localStorage.colorScheme = colorScheme;
  let select = document.querySelector('select[name="color-scheme"]');
  if (select) {
    select.value = colorScheme;
  }
}

document.body.insertAdjacentHTML(
  'afterbegin',
  `<label class="color-scheme">Theme:
<select name="color-scheme">
  <option value="light dark">Automatic</option>
  <option value="light">Light</option>
  <option value="dark">Dark</option>
</select>
</label>`
);

let select = document.querySelector('select[name="color-scheme"]');

// Load saved preference or set to automatic
if ('colorScheme' in localStorage) {
  setColorScheme(localStorage.colorScheme);
} else {
  select.value = 'light dark';
}

// Listen for changes
select.addEventListener('input', function (event) {
  setColorScheme(event.target.value);
});

// Step 5: Better contact form (optional)
let form = document.querySelector('form');
form?.addEventListener('submit', function (event) {
  event.preventDefault();
  
  let data = new FormData(form);
  let url = form.action + '?';
  let params = [];
  
  for (let [name, value] of data) {
    params.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
  }
  
  url += params.join('&');
  location.href = url;
});

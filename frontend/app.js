// app.js — talks to the REST API with fetch() and keeps the table in sync

// Same origin when Express serves this page (local or deployed).
// If you open index.html straight from disk, fall back to the local API.
const API = (location.protocol === 'file:' ? 'http://localhost:3000' : '') + '/api/timetable';

const FIELDS = ['course_code', 'course_name', 'lecturer', 'day_of_week',
                'start_time', 'end_time', 'venue', 'weekly_goal'];

const form = document.getElementById('entry-form');
const rowsEl = document.getElementById('rows');
const statusEl = document.getElementById('status');
const idInput = document.getElementById('id');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const formTitle = document.getElementById('form-title');

function showStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.className = isError ? 'err' : 'ok';
}

// fetch wrapper: always parses JSON and throws a readable error on 4xx/5xx
async function request(url, options = {}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.errors ? data.errors.join(', ') : (data.error || `HTTP ${res.status}`);
    throw new Error(msg);
  }
  return data;
}

const hhmm = (t) => (t ? t.slice(0, 5) : ''); // "11:00:00" -> "11:00"

// Build a cell with textContent (not innerHTML) so user input can't inject HTML/JS
function cell(text) {
  const td = document.createElement('td');
  td.textContent = text ?? '';
  return td;
}

function render(records) {
  rowsEl.replaceChildren();
  document.getElementById('count').textContent = records.length;
  for (const r of records) {
    const tr = document.createElement('tr');
    tr.append(
      cell(r.id), cell(r.course_code), cell(r.course_name), cell(r.lecturer),
      cell(r.day_of_week), cell(`${hhmm(r.start_time)}–${hhmm(r.end_time)}`),
      cell(r.venue), cell(r.weekly_goal),
    );
    const btns = document.createElement('td');
    btns.className = 'btns';
    const edit = Object.assign(document.createElement('button'),
      { textContent: 'Edit', className: 'secondary small', onclick: () => startEdit(r.id) });
    const del = Object.assign(document.createElement('button'),
      { textContent: 'Delete', className: 'danger small', onclick: () => removeRecord(r.id, r.course_code) });
    btns.append(edit, del);
    tr.append(btns);
    rowsEl.append(tr);
  }
}

async function loadAll() {
  try {
    render(await request(API));
  } catch (err) {
    showStatus(`Could not load timetable: ${err.message}`, true);
  }
}

function readForm() {
  const data = {};
  for (const f of FIELDS) data[f] = document.getElementById(f).value.trim();
  return data;
}

function resetForm() {
  form.reset();
  idInput.value = '';
  submitBtn.textContent = 'Add';
  formTitle.textContent = 'Add a class';
  cancelBtn.hidden = true;
}

// Edit = GET one record, load it into the form, switch the button to "Save"
async function startEdit(id) {
  try {
    const r = await request(`${API}/${id}`);
    idInput.value = r.id;
    for (const f of FIELDS) {
      const v = r[f] ?? '';
      document.getElementById(f).value = f.endsWith('_time') ? hhmm(v) : v;
    }
    submitBtn.textContent = 'Save changes';
    formTitle.textContent = `Editing record #${r.id}`;
    cancelBtn.hidden = false;
    form.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    showStatus(err.message, true);
  }
}

async function removeRecord(id, code) {
  // A native confirm() is fine for a class project; real apps use a custom modal
  if (!confirm(`Delete ${code} (record #${id})?`)) return;
  try {
    await request(`${API}/${id}`, { method: 'DELETE' });
    showStatus(`Deleted record #${id}`);
    if (idInput.value === String(id)) resetForm();
    loadAll();
  } catch (err) {
    showStatus(err.message, true);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = idInput.value;
  try {
    if (id) {
      await request(`${API}/${id}`, { method: 'PUT', body: JSON.stringify(readForm()) });
      showStatus(`Updated record #${id}`);
    } else {
      const created = await request(API, { method: 'POST', body: JSON.stringify(readForm()) });
      showStatus(`Added record #${created.id}`);
    }
    resetForm();
    loadAll();
  } catch (err) {
    showStatus(err.message, true);
  }
});

cancelBtn.addEventListener('click', resetForm);

loadAll();

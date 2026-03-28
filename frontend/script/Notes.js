const API_BASE_URL = "http://127.0.0.1:4000"; 
axios.defaults.withCredentials = true;

let currentState = { view: 'importance', page: 1, tag: '', stars: 0 };
let isEditing = false; // Flag to check if we are updating

document.addEventListener('DOMContentLoaded', () => {
    loadView('importance'); 

    // Search Listener
    document.getElementById('tagSearchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentState.tag = e.target.value.trim();
            loadView(currentState.tag ? 'tag' : 'importance');
        }
    });

    // Form Listener (Handles BOTH Create and Update)
    document.getElementById('createForm').addEventListener('submit', handleFormSubmit);

    // Pagination Buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if(prevBtn) prevBtn.addEventListener('click', () => changePage(-1));
    if(nextBtn) nextBtn.addEventListener('click', () => changePage(1));
});

/* --- SIDEBAR TOGGLE (For Mobile) --- */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
    const closeIcon = document.getElementById('sidebarClose');
    if(closeIcon) closeIcon.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
}

/* --- FETCHING --- */
function loadView(viewType) {
    currentState.view = viewType;
    currentState.page = 1;
    updateUIHeader(viewType);
    fetchData();
}

function filterByStars(s) { 
    currentState.view = 'stars'; 
    currentState.stars = s; 
    updateUIHeader('stars'); 
    fetchData(); 
}

function changePage(d) { 
    currentState.page += d; 
    if (currentState.page < 1) currentState.page = 1; 
    fetchData(); 
}

async function fetchData() {
    toggleLoader(true);
    let url = '', params = {};

    switch (currentState.view) {
        case 'importance': 
            url = `${API_BASE_URL}/api/notes/problemByImportance`; 
            params = { page: currentState.page }; 
            break;
        case 'all': 
            url = `${API_BASE_URL}/api/notes/problem`; 
            params = { page: currentState.page }; 
            break;
        case 'tag': 
            url = `${API_BASE_URL}/api/notes/tag/${currentState.tag}`; 
            params = { page: currentState.page }; 
            break;
        case 'stars': 
            url = `${API_BASE_URL}/api/notes/stars/${currentState.stars}`; 
            params = { page: currentState.page }; 
            break;
    }

    try {
        const res = await axios.get(url, { params });
        if (res.data.success) {
            renderTable(res.data.data);
            const total = res.data.totalPages || 1; 
            updatePaginationControls(total); 
        }
    } catch (err) {
        console.error(err);
    } finally {
        toggleLoader(false);
    }
}

/* --- RENDER TABLE --- */
function renderTable(problems) {
    const tbody = document.getElementById('problemTableBody');
    tbody.innerHTML = '';
    if (!problems || problems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px;">No problems found</td></tr>';
        return;
    }

    problems.forEach(p => {
        const starsHtml = '<i class="fa-solid fa-star"></i>'.repeat(p.stars) + '<i class="fa-regular fa-star" style="opacity:0.3"></i>'.repeat(3 - p.stars);
        const tags = Array.isArray(p.tags) ? p.tags.map(t => `<span class="tag-badge">${t}</span>`).join('') : '';

        const row = `
            <tr onclick="fetchProblemDetails(${p.problemId})" style="cursor: pointer;">
                <td>#${p.problemId}</td>
                <td style="font-weight: 600;">${p.problemName}</td>
                <td>${tags}</td>
                <td><span class="text-gold">${starsHtml}</span></td>
                <td onclick="event.stopPropagation()"><a href="${p.problemLink}" target="_blank" class="link-icon"><i class="fa-solid fa-arrow-up-right-from-square"></i></a></td>
                <td onclick="event.stopPropagation()">
                    <button class="action-btn edit-btn" onclick="openEditModal(${p.problemId})"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="action-btn delete-btn" onclick="deleteProblem(${p.problemId})"><i class="fa-solid fa-trash-can"></i></button>
                </td>
            </tr>`;
        tbody.innerHTML += row;
    });
}

/* --- CREATE & UPDATE LOGIC --- */
function openCreateModal() {
    isEditing = false;
    document.getElementById('createForm').reset();
    document.getElementById('modalTitle').innerText = "Add New Problem";
    document.getElementById('modalSubmitBtn').innerText = "Save Problem";
    document.getElementById('createModal').style.display = 'flex';
}

async function openEditModal(id) {
    isEditing = true;
    try {
        const res = await axios.get(`${API_BASE_URL}/api/notes/problemById/${id}`);
        if(res.data.success) {
            const p = res.data.data;
            document.getElementById('editProblemId').value = p.problemId;
            document.getElementById('inpName').value = p.problemName;
            document.getElementById('inpLink').value = p.problemLink;
            document.getElementById('inpTags').value = p.tags.join(', ');
            document.getElementById('inpStars').value = p.stars;
            document.getElementById('inpDesc').value = p.problemDescription || '';
            document.getElementById('inpNotes').value = p.notes || '';
            document.getElementById('inpMistake').value = p.mistake || '';

            document.getElementById('modalTitle').innerText = "Edit Problem";
            document.getElementById('modalSubmitBtn').innerText = "Update Problem";
            document.getElementById('createModal').style.display = 'flex';
        }
    } catch(e) { alert("Error loading problem for edit"); }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const tagsArray = formData.get('tags').split(',').map(t => t.trim()).filter(t => t);

    const payload = {
        problemName: formData.get('problemName'),
        problemLink: formData.get('problemLink'),
        stars: parseInt(formData.get('stars')),
        tags: tagsArray,
        problemDescription: formData.get('problemDescription'),
        mistake: formData.get('mistake'),
        notes: formData.get('notes')
    };

    try {
        let response;
        if (isEditing) {
            const id = document.getElementById('editProblemId').value;
            response = await axios.put(`${API_BASE_URL}/api/notes/problem/${id}`, payload);
        } else {
            response = await axios.post(`${API_BASE_URL}/api/notes/new`, payload);
        }

        if (response.data.success) {
            closeModal('createModal');
            loadView(currentState.view);
            alert(isEditing ? 'Problem Updated!' : 'Problem Created!');
        }
    } catch (error) {
        alert(error.response?.data?.message || 'Operation failed');
    }
}

/* --- VIEW DETAILS (Full Screen) --- */
async function fetchProblemDetails(id) {
    try {
        const res = await axios.get(`${API_BASE_URL}/api/notes/problemById/${id}`);
        if (res.data.success) {
            const p = res.data.data;
            const content = document.getElementById('viewContent');
            
            const starsHtml = '<i class="fa-solid fa-star"></i>'.repeat(p.stars);
            const tagHtml = p.tags.map(t => `<span style="background:var(--accent-light); padding:5px 12px; border-radius:15px; font-size:14px; margin-right:5px; color:var(--accent);">#${t}</span>`).join('');

            content.innerHTML = `
                <div class="modal-header-fixed">
                    <div style="flex:1">
                        <h1 class="big-title">${p.problemName}</h1>
                        <div class="meta-info">
                            <span style="color:#fbbf24;">${starsHtml}</span>
                            <span>| ID: #${p.problemId}</span>
                        </div>
                        <div style="margin-top:10px;">${tagHtml}</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:15px;">
                        <div class="close-massive" onclick="closeModal('viewModal')">&times;</div>
                    </div>
                </div>

                <div class="modal-body">
                    <div class="action-bar-modal">
                        <a href="${p.problemLink}" target="_blank" class="solve-btn-massive" style="flex:2; text-align:center;">
                            Solve Problem <i class="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                        <button onclick="openEditModal(${p.problemId}); closeModal('viewModal')" class="solve-btn-massive icon-btn-modal" style="background:#334155;">
                            <i class="fa-solid fa-pen"></i> Edit
                        </button>
                        <button onclick="deleteProblem(${p.problemId})" class="solve-btn-massive icon-btn-modal" style="background:#ef4444;">
                            <i class="fa-solid fa-trash-can"></i> Delete
                        </button>
                    </div>

                    <div>
                        <div class="section-title">Description</div>
                        <div class="text-content">${p.problemDescription || 'No description.'}</div>
                    </div>

                    <div class="note-box-wide">
                        <div class="section-title" style="color:var(--accent);"><i class="fa-solid fa-lightbulb"></i> Notes</div>
                        <div class="text-content">${p.notes || 'No notes.'}</div>
                    </div>

                    ${p.mistake ? `
                    <div class="mistake-box-wide">
                        <div class="section-title" style="color:#f87171;"><i class="fa-solid fa-triangle-exclamation"></i> Mistakes</div>
                        <div class="text-content">${p.mistake}</div>
                    </div>` : ''}
                </div>
            `;
            document.getElementById('viewModal').style.display = 'flex';
        }
    } catch (error) { console.error(error); }
}

async function deleteProblem(id) {
    if(!confirm("Delete this problem?")) return;
    try {
        const res = await axios.delete(`${API_BASE_URL}/api/notes/problem/${id}`);
        if(res.data.success) {
            closeModal('viewModal'); 
            fetchData();
        }
    } catch (e) { alert('Error deleting'); }
}

/* --- UTILS --- */
function updateUIHeader(view) {
    const title = document.getElementById('page-title');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    if (view === 'importance') { 
        title.innerText = 'Top Priority'; 
        document.querySelector('.nav-btn:nth-child(1)').classList.add('active'); 
    }
    else if (view === 'all') { 
        title.innerText = 'All Problems'; 
        document.querySelector('.nav-btn:nth-child(2)').classList.add('active'); 
    }
    else if (view === 'tag') { 
        title.innerText = `Tag: "${currentState.tag}"`; 
    }
    else if (view === 'stars') { 
        if(currentState.stars === 0) {
            title.innerText = "Unrated Problems (0 Stars)";
        } else {
            title.innerText = `${currentState.stars} Star Problems`; 
        }
    }
}

function updatePaginationControls(totalPages) {
    const prev = document.getElementById('prevBtn');
    const next = document.getElementById('nextBtn');
    document.getElementById('pageIndicator').innerText = `Page ${currentState.page}`;
    prev.disabled = currentState.page === 1;
    next.disabled = currentState.page >= totalPages;
}

function toggleLoader(show) { 
    document.getElementById('loader')?.classList.toggle('hidden', !show); 
}

function closeModal(id) { 
    document.getElementById(id).style.display = 'none'; 
}

window.onclick = function(e) { 
    if (e.target.classList.contains('modal')) e.target.style.display = 'none'; 
}

async function logout() {
  try {
    await axios.post("/logout");
  } catch {}
  window.location.replace("login.html");
}

// Dark mode toggle (synced with portfolio)
    const toggleBtn = document.getElementById("theme-toggle");
    toggleBtn.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      const isDark = document.body.classList.contains("dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");
      toggleBtn.innerHTML = isDark ? '<i class="fa-regular fa-sun"></i> Light Mode' : '<i class="fa-solid fa-moon"></i> Dark Mode';
    });
    if (localStorage.getItem("theme") === "dark") {
      document.body.classList.add("dark");
      toggleBtn.innerHTML = '<i class="fa-regular fa-sun"></i> Light Mode';
    } else {
      toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i> Dark Mode';
    }

    // Keep the existing sidebar toggle function (already in scriptNote.js)
    function toggleSidebar() {
      const sidebar = document.getElementById("sidebar");
      sidebar.classList.toggle("active");
    }
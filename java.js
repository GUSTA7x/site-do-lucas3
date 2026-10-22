// ==========================================
// CONFIGURAÇÃO DO FIREBASE (COLE SEUS DADOS AQUI)
// ==========================================
const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    projectId: "SEU_PROJECT_ID",
    storageBucket: "SEU_PROJETO.appspot.com",
    messagingSenderId: "SEU_SENDER_ID",
    appId: "SEU_APP_ID"
  };
  
  // Inicializa o Firebase
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const db = firebase.firestore();
  
  // ==========================================
  // STATE GLOBAL DA APLICAÇÃO
  // ==========================================
  const state = {
    currentUser: null,
    activeCategory: 'all',
    itemToDelete: null,
    tasks: [],
    videos: [],
    tips: [],
    announcements: []
  };
  
  // INICIALIZAÇÃO
  document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    loadLocalStorageUser();
    listenToFirebaseData();
    checkAuth();
  });
  
  // GERENCIADOR DE PARTÍCULAS
  function initParticles() {
    const container = document.getElementById('math-particles');
    if (!container) return;
    const symbols = ['∑', '∫', 'π', '√', 'Δ', '∞', 'α', 'β', 'θ'];
    for (let i = 0; i < 25; i++) {
      const el = document.createElement('span');
      el.className = 'm-part';
      el.innerText = symbols[Math.floor(Math.random() * symbols.length)];
      el.style.left = `${Math.random() * 100}%`;
      el.style.animationDuration = `${12 + Math.random() * 20}s`;
      el.style.animationDelay = `${Math.random() * 5}s`;
      el.style.fontSize = `${1 + Math.random() * 1.5}rem`;
      container.appendChild(el);
    }
  }
  
  // SESSÃO DO USUÁRIO (Continua no localStorage pois é a identificação do aparelho)
  function loadLocalStorageUser() {
    const savedUser = localStorage.getItem('cm_user');
    if (savedUser) state.currentUser = JSON.parse(savedUser);
  }
  
  // ==========================================
  // SINCRONIZAÇÃO EM TEMPO REAL COM O FIREBASE
  // ==========================================
  function listenToFirebaseData() {
    db.collection('tasks').onSnapshot((snapshot) => {
      state.tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderAll();
    });
  
    db.collection('videos').onSnapshot((snapshot) => {
      state.videos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderAll();
    });
  
    db.collection('tips').onSnapshot((snapshot) => {
      state.tips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderAll();
    });
  
    db.collection('announcements').onSnapshot((snapshot) => {
      state.announcements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderAll();
    });
  }
  
  // ROTEAMENTO & AUTH
  function checkAuth() {
    const loginPage = document.getElementById('page-login');
    const appPage = document.getElementById('page-app');
  
    if (state.currentUser) {
      if (loginPage) loginPage.classList.remove('active');
      if (appPage) appPage.classList.add('active');
      updateUserInterface();
      renderAll();
    } else {
      if (loginPage) loginPage.classList.add('active');
      if (appPage) appPage.classList.remove('active');
    }
  }
  
  function selectRole(role) {
    if (role === 'student') {
      goToStep('step-class');
    } else {
      goToStep('step-teacher-auth');
    }
  }
  
  function goToStep(stepId) {
    document.querySelectorAll('.login-step').forEach(s => s.classList.remove('active'));
    const targetStep = document.getElementById(stepId);
    if (targetStep) targetStep.classList.add('active');
    hideLoginAlert();
  }
  
  function selectClass(className) {
    state.currentUser = { role: 'student', classGroup: className };
    localStorage.setItem('cm_user', JSON.stringify(state.currentUser));
    checkAuth();
    showToast(`Bem-vindo à turma do ${className}!`);
  }
  
  function handleTeacherLogin(e) {
    e.preventDefault();
    const idInput = document.getElementById('teacher-id');
    const passInput = document.getElementById('teacher-pass');
  
    const id = idInput ? idInput.value.trim() : '';
    const pass = passInput ? passInput.value : '';
  
    if (id === 'Lucas_adm' && pass === '12345678') {
      state.currentUser = { role: 'teacher', classGroup: null };
      localStorage.setItem('cm_user', JSON.stringify(state.currentUser));
      checkAuth();
      showToast('Acesso de Professor Autorizado!');
    } else {
      showLoginAlert('Credenciais inválidas. Tente novamente.');
    }
  }
  
  function logout() {
    state.currentUser = null;
    localStorage.removeItem('cm_user');
    checkAuth();
    goToStep('step-role');
  }
  
  function showLoginAlert(msg) {
    const alert = document.getElementById('login-alert');
    if (alert) {
      alert.innerText = msg;
      alert.style.display = 'block';
    }
  }
  
  function hideLoginAlert() {
    const alert = document.getElementById('login-alert');
    if (alert) alert.style.display = 'none';
  }
  
  // ATUALIZAÇÃO DE INTERFACE
  function updateUserInterface() {
    const chip = document.getElementById('user-status-chip');
    const title = document.getElementById('welcome-title');
    const fab = document.getElementById('fab-add');
    const btnAnnounce = document.getElementById('btn-add-announcement');
  
    if (!chip || !title) return;
  
    chip.className = 'status-chip ';
  
    if (state.currentUser.role === 'teacher') {
      chip.innerText = 'Professor';
      chip.classList.add('chip-teacher');
      title.innerText = 'Painel Docente';
      if (fab) fab.classList.add('show');
      if (btnAnnounce) btnAnnounce.style.display = 'block';
    } else {
      const cg = state.currentUser.classGroup;
      chip.innerText = cg;
      if (cg === '1° Ano') chip.classList.add('chip-s1');
      else if (cg === '2° Ano') chip.classList.add('chip-s2');
      else chip.classList.add('chip-s3');
  
      title.innerText = `Olá, Aluno (${cg})!`;
      if (fab) fab.classList.remove('show');
      if (btnAnnounce) btnAnnounce.style.display = 'none';
    }
  }
  
  function switchSection(secName) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.mnav-item').forEach(n => n.classList.remove('active'));
  
    const sec = document.getElementById(`sec-${secName}`);
    if (sec) sec.classList.add('active');
  
    const navIdx = ['dashboard', 'tasks', 'videos', 'tips', 'channel'].indexOf(secName);
    if (navIdx !== -1) {
      document.querySelectorAll('.nav-item')[navIdx]?.classList.add('active');
      document.querySelectorAll('.mnav-item')[navIdx]?.classList.add('active');
    }
  
    renderAll();
  }
  
  // RENDERIZADORES
  function renderAll() {
    renderMetrics();
    renderTasks();
    renderVideos();
    renderTips();
    renderAnnouncements();
  }
  
  function getFilteredTasks(sourceArray = state.tasks) {
    let list = sourceArray;
  
    if (state.currentUser && state.currentUser.role === 'student') {
      list = list.filter(t => t.targetClass === state.currentUser.classGroup || t.targetClass === 'Todas');
    }
  
    if (state.activeCategory !== 'all') {
      list = list.filter(t => t.frequency === state.activeCategory);
    }
  
    const query = document.getElementById('task-search')?.value.toLowerCase().trim();
    if (query) {
      list = list.filter(t => t.title.toLowerCase().includes(query) || t.desc.toLowerCase().includes(query));
    }
  
    return list;
  }
  
  function renderMetrics() {
    const userTasks = getFilteredTasks(state.tasks);
    const userKey = getUserKey();
  
    const filteredTasksForUser = userTasks.filter(t => {
      if (state.currentUser?.role === 'student') {
        return t.targetClass === state.currentUser.classGroup || t.targetClass === 'Todas';
      }
      return true;
    });
  
    const filteredTipsForUser = state.tips.filter(k => {
      if (state.currentUser?.role === 'student') {
        return k.targetClass === state.currentUser.classGroup || k.targetClass === 'Todas';
      }
      return true;
    });
  
    const pending = filteredTasksForUser.filter(t => !(t.completedBy || []).includes(userKey)).length;
    const completed = filteredTasksForUser.filter(t => (t.completedBy || []).includes(userKey)).length;
  
    const pendingEl = document.getElementById('count-pending');
    const completedEl = document.getElementById('count-completed');
    const tipsEl = document.getElementById('count-tips');
  
    if (pendingEl) pendingEl.innerText = pending;
    if (completedEl) completedEl.innerText = completed;
    if (tipsEl) tipsEl.innerText = filteredTipsForUser.length;
  }
  
  function getUserKey() {
    return state.currentUser ? (state.currentUser.classGroup || 'teacher') : 'guest';
  }
  
  function renderTasks() {
    const container = document.getElementById('tasks-container');
    const recentContainer = document.getElementById('recent-tasks-container');
    const list = getFilteredTasks(state.tasks);
  
    if (!container) return;
  
    const html = list.length === 0 
      ? '<p style="color:var(--text-muted); grid-column:1/-1; text-align:center; padding:2rem;">Nenhuma atividade encontrada.</p>'
      : list.map(t => createTaskCardHtml(t, 'task')).join('');
  
    container.innerHTML = html;
  
    if (recentContainer) {
      recentContainer.innerHTML = list.slice(0, 2).map(t => createTaskCardHtml(t, 'task')).join('');
    }
  }
  
  function renderVideos() {
    const container = document.getElementById('videos-container');
    const list = getFilteredTasks(state.videos);
  
    if (!container) return;
  
    container.innerHTML = list.length === 0 
      ? '<p style="color:var(--text-muted); grid-column:1/-1; text-align:center; padding:2rem;">Nenhum vídeo publicado.</p>'
      : list.map(v => createTaskCardHtml(v, 'video')).join('');
  }
  
  function getVideoMediaInfo(url) {
    if (!url) return { isVideo: false };
  
    const ytMatch = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    if (ytMatch && ytMatch[2].length === 11) {
      const ytId = ytMatch[2];
      return {
        isVideo: true,
        provider: 'youtube',
        thumbUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${ytId}?autoplay=1`
      };
    }
  
    if (url.startsWith('blob:') || /\.(mp4|webm|ogg|mov)$/i.test(url)) {
      return {
        isVideo: true,
        provider: 'direct',
        thumbUrl: url + '#t=0.1',
        embedUrl: url
      };
    }
  
    return { isVideo: false };
  }
  
  function createTaskCardHtml(item, itemType) {
    const isDone = (item.completedBy || []).includes(getUserKey());
    const isTeacher = state.currentUser?.role === 'teacher';
    const videoMedia = getVideoMediaInfo(item.link);
    const isVideo = item.mediaType === 'video' || videoMedia.isVideo;
  
    const playUrl = videoMedia.embedUrl || item.link;
  
    return `
      <div class="card-item">
        <div>
          <div class="card-tags">
            <span class="tag-badge bg-${(item.frequency || 'semanal').toLowerCase()}">${item.frequency || 'Vídeo'}</span>
            <span class="class-pill">📍 ${item.targetClass}</span>
            ${item.dueDate ? `
              <span class="due-badge ${isDone ? 'due-ok' : 'due-warn'}">
                ${isDone ? 'Concluída' : 'Entrega: ' + formatDate(item.dueDate)}
              </span>
            ` : ''}
          </div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.desc)}</p>
  
          ${item.link && (item.mediaType === 'image' || isImageUrl(item.link)) ? `
            <div class="card-preview-img" onclick="openLightbox('${item.link}', 'image')">
              <img src="${item.link}" alt="Anexo">
            </div>
          ` : ''}
  
          ${item.link && isVideo ? `
            <div class="card-preview-video" onclick="openLightbox('${playUrl}', 'video', '${videoMedia.provider || 'direct'}')">
              ${videoMedia.provider === 'youtube' ? `
                <img src="${videoMedia.thumbUrl}" alt="Miniatura do Vídeo" style="width:100%; height:100%; object-fit:cover;">
              ` : `
                <video src="${item.link}#t=0.1" preload="metadata" style="width:100%; height:100%; object-fit:cover; pointer-events:none;"></video>
              `}
              <span style="position:absolute; color:#fff; font-size:2rem; pointer-events:none; text-shadow:0 2px 10px rgba(0,0,0,0.8);">▶</span>
            </div>
          ` : ''}
  
          ${item.link && item.mediaType === 'link' && !isVideo ? `
            <a href="${item.link}" target="_blank" class="attachment-link">🔗 Acessar Link Externo</a>
          ` : ''}
        </div>
  
        <div class="card-actions">
          ${!isTeacher && itemType !== 'video' ? `
            <button class="action-btn" onclick="toggleTaskComplete('${item.id}')">
              ${isDone ? '↩️ Desfazer' : '✅ Marcar Concluída'}
            </button>
          ` : ''}
  
          ${isTeacher ? `
            <button class="action-btn" onclick="openEditModal('${item.id}', '${itemType}')">✏️ Editar</button>
            <button class="action-btn" onclick="promptDelete('${item.id}', '${itemType}')">🗑️ Excluir</button>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  function renderTips() {
    const container = document.getElementById('tips-container');
    if (!container) return;
  
    let list = state.tips;
    if (state.currentUser?.role === 'student') {
      list = list.filter(k => k.targetClass === state.currentUser.classGroup || k.targetClass === 'Todas');
    }
  
    const isTeacher = state.currentUser?.role === 'teacher';
  
    container.innerHTML = list.length === 0 
      ? '<p style="color:var(--text-muted); grid-column:1/-1; text-align:center; padding:2rem;">Nenhuma fórmula cadastrada.</p>'
      : list.map(k => `
        <div class="card-item">
          <div>
            <div class="card-tags">
              <span class="class-pill">📍 ${k.targetClass}</span>
            </div>
            <h3>${escapeHtml(k.title)}</h3>
            <p>${escapeHtml(k.desc)}</p>
            ${k.formula ? `<div class="formula-box">${escapeHtml(k.formula)}</div>` : ''}
            ${k.link && (k.mediaType === 'image' || isImageUrl(k.link)) ? `
              <div class="card-preview-img" style="margin-top:0.8rem;" onclick="openLightbox('${k.link}', 'image')">
                <img src="${k.link}" alt="Anexo">
              </div>
            ` : ''}
          </div>
          ${isTeacher ? `
            <div class="card-actions" style="margin-top:1rem;">
              <button class="action-btn" onclick="openEditModal('${k.id}', 'tip')">✏️ Editar</button>
              <button class="action-btn" onclick="promptDelete('${k.id}', 'tip')">🗑️ Excluir</button>
            </div>
          ` : ''}
        </div>
      `).join('');
  }
  
  function renderAnnouncements() {
    const container = document.getElementById('announcements-container');
    if (!container) return;
  
    let list = state.announcements;
    if (state.currentUser?.role === 'student') {
      list = list.filter(a => a.targetClass === state.currentUser.classGroup || a.targetClass === 'Todas');
    }
  
    const isTeacher = state.currentUser?.role === 'teacher';
  
    container.innerHTML = list.length === 0 
      ? '<p style="color:var(--text-muted); text-align:center; padding:2rem;">Nenhum recado até o momento.</p>'
      : list.map(a => {
          const userKey = getUserKey();
          const reactions = a.reactions || { '👍': [], '❤️': [], '👏': [], '🔥': [] };
          return `
            <div class="announcement-card">
              <div class="announcement-header">
                <div class="announcement-teacher-info">
                  <div class="announcement-avatar">π</div>
                  <div>
                    <strong>${escapeHtml(a.author)}</strong>
                    <div class="announcement-date">Para: ${a.targetClass} • ${a.date}</div>
                  </div>
                </div>
                ${isTeacher ? `<button class="action-btn" onclick="promptDelete('${a.id}', 'announcement')">🗑️ Excluir</button>` : ''}
              </div>
              <div class="announcement-content">${escapeHtml(a.content)}</div>
              <div class="reactions-wrapper">
                ${['👍', '❤️', '👏', '🔥'].map(emoji => {
                  const count = (reactions[emoji] || []).length;
                  const reacted = (reactions[emoji] || []).includes(userKey);
                  return `
                    <button class="reaction-btn ${reacted ? 'reacted' : ''}" onclick="toggleReaction('${a.id}', '${emoji}')">
                      <span>${emoji}</span> <span>${count}</span>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('');
  }
  
  function toggleReaction(announcementId, emoji) {
    const announcement = state.announcements.find(a => a.id === announcementId);
    if (!announcement) return;
  
    const userKey = getUserKey();
    let reactions = announcement.reactions || { '👍': [], '❤️': [], '👏': [], '🔥': [] };
    if (!reactions[emoji]) reactions[emoji] = [];
  
    const idx = reactions[emoji].indexOf(userKey);
    if (idx > -1) {
      reactions[emoji].splice(idx, 1);
    } else {
      reactions[emoji].push(userKey);
    }
  
    db.collection('announcements').doc(announcementId).update({ reactions });
  }
  
  function openLightbox(url, type, provider = 'direct') {
    const lightbox = document.getElementById('modal-lightbox');
    const content = document.getElementById('lightbox-content');
  
    if (!lightbox || !content) return;
  
    if (type === 'image') {
      content.innerHTML = `<img src="${url}" alt="Ampliada" style="max-width:90vw; max-height:80vh; border-radius:0.8rem;">`;
    } else if (type === 'video') {
      if (provider === 'youtube') {
        content.innerHTML = `
          <div style="position:relative; width:80vw; max-width:900px; aspect-ratio:16/9;">
            <iframe src="${url}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="width:100%; height:100%; border-radius:0.8rem;"></iframe>
          </div>
        `;
      } else {
        content.innerHTML = `
          <div style="max-width:90vw; max-height:80vh; display:flex; justify-content:center; align-items:center;">
            <video controls autoplay playsinline style="width:100%; max-height:80vh; border-radius:0.8rem; background:#000;">
              <source src="${url}">
              O teu navegador não suporta a reprodução deste vídeo.
            </video>
          </div>
        `;
      }
    }
  
    lightbox.classList.add('open');
  }
  
  function closeLightbox(e) {
    if (e.target.id === 'modal-lightbox' || e.target.classList.contains('lightbox-content')) {
      const lightbox = document.getElementById('modal-lightbox');
      const content = document.getElementById('lightbox-content');
      if (lightbox) lightbox.classList.remove('open');
      if (content) content.innerHTML = '';
    }
  }
  
  function toggleTaskComplete(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
  
    const key = getUserKey();
    let completedBy = task.completedBy || [];
    const idx = completedBy.indexOf(key);
  
    if (idx > -1) {
      completedBy.splice(idx, 1);
      showToast('Tarefa marcada como pendente.');
    } else {
      completedBy.push(key);
      showToast('Parabéns! Tarefa concluída.');
    }
  
    db.collection('tasks').doc(taskId).update({ completedBy });
  }
  
  function filterCategory(cat, btn) {
    state.activeCategory = cat;
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderTasks();
  }
  
  function openCreateModal() {
    const editId = document.getElementById('edit-item-id');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('create-form');
    const typeWrap = document.getElementById('field-type-wrap');
    const modal = document.getElementById('modal-create');
  
    if (editId) editId.value = '';
    if (title) title.innerText = 'Nova Atividade';
    if (form) form.reset();
    if (typeWrap) typeWrap.style.display = 'block';
  
    toggleModalFields();
    if (modal) modal.classList.add('open');
  }
  
  function openEditModal(id, itemType) {
    let item;
    if (itemType === 'task') item = state.tasks.find(t => t.id === id);
    else if (itemType === 'video') item = state.videos.find(v => v.id === id);
    else if (itemType === 'tip') item = state.tips.find(k => k.id === id);
  
    if (!item) return;
  
    const editId = document.getElementById('edit-item-id');
    const title = document.getElementById('modal-title');
    const createType = document.getElementById('create-type');
    const typeWrap = document.getElementById('field-type-wrap');
    const modal = document.getElementById('modal-create');
  
    if (editId) editId.value = id;
    if (title) title.innerText = 'Editar Item';
    if (createType) createType.value = itemType;
    if (typeWrap) typeWrap.style.display = 'none';
  
    const titleInput = document.getElementById('create-title');
    const classInput = document.getElementById('create-class');
    const descInput = document.getElementById('create-desc');
  
    if (titleInput) titleInput.value = item.title;
    if (classInput) classInput.value = item.targetClass;
    if (descInput) descInput.value = item.desc;
  
    if (itemType === 'task' || itemType === 'video') {
      const freqInput = document.getElementById('create-freq');
      const dateInput = document.getElementById('create-date');
      if (freqInput) freqInput.value = item.frequency || 'Semanal';
      if (dateInput) dateInput.value = item.dueDate || '';
    }
  
    if (itemType === 'tip') {
      const formulaInput = document.getElementById('create-formula');
      if (formulaInput) formulaInput.value = item.formula || '';
    }
  
    if (item.link) {
      const mediaRadios = document.querySelectorAll('input[name="mediaSource"]');
      if (mediaRadios[0]) mediaRadios[0].checked = true;
      toggleMediaSource();
      const linkInput = document.getElementById('create-link');
      if (linkInput) linkInput.value = item.link;
    }
  
    toggleModalFields();
    if (modal) modal.classList.add('open');
  }
  
  function openAnnouncementModal() {
    const modal = document.getElementById('modal-announcement');
    if (modal) modal.classList.add('open');
  }
  
  function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('open');
  }
  
  function toggleModalFields() {
    const typeInput = document.getElementById('create-type');
    const freqRow = document.getElementById('field-freq');
    const formulaRow = document.getElementById('field-formula');
  
    if (!typeInput) return;
    const type = typeInput.value;
  
    if (type === 'task' || type === 'video') {
      if (freqRow) freqRow.style.display = 'flex';
      if (formulaRow) formulaRow.style.display = 'none';
    } else {
      if (freqRow) freqRow.style.display = 'none';
      if (formulaRow) formulaRow.style.display = 'block';
    }
  }
  
  function toggleMediaSource() {
    const selectedRadio = document.querySelector('input[name="mediaSource"]:checked');
    if (!selectedRadio) return;
  
    const selected = selectedRadio.value;
    const wrapUrl = document.getElementById('wrap-media-url');
    const wrapFile = document.getElementById('wrap-media-file');
  
    if (wrapUrl) wrapUrl.style.display = selected === 'url' ? 'block' : 'none';
    if (wrapFile) wrapFile.style.display = selected === 'file' ? 'block' : 'none';
  }
  
  function handleCreateSubmit(e) {
    e.preventDefault();
    const editId = document.getElementById('edit-item-id')?.value;
    const type = document.getElementById('create-type')?.value;
    const title = document.getElementById('create-title')?.value.trim() || '';
    const targetClass = document.getElementById('create-class')?.value || '1° Ano';
    const desc = document.getElementById('create-desc')?.value.trim() || '';
    
    const selectedRadio = document.querySelector('input[name="mediaSource"]:checked');
    const mediaSource = selectedRadio ? selectedRadio.value : 'url';
    
    let link = '';
    let mediaType = 'none';
  
    if (mediaSource === 'url') {
      link = document.getElementById('create-link')?.value.trim() || '';
      if (isImageUrl(link)) mediaType = 'image';
      else if (isVideoUrl(link) || getVideoMediaInfo(link).isVideo) mediaType = 'video';
      else if (link) mediaType = 'link';
    } else {
      const fileInput = document.getElementById('create-file');
      if (fileInput && fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        link = URL.createObjectURL(file);
        
        if (file.type.startsWith('image/')) mediaType = 'image';
        else if (file.type.startsWith('video/')) mediaType = 'video';
      }
    }
  
    const collectionName = type === 'task' ? 'tasks' : (type === 'video' ? 'videos' : 'tips');
  
    const payload = {
      title,
      targetClass,
      desc,
      link,
      mediaType
    };
  
    if (type === 'task' || type === 'video') {
      payload.frequency = document.getElementById('create-freq')?.value || 'Semanal';
      payload.dueDate = document.getElementById('create-date')?.value || '';
      if (!editId) payload.completedBy = [];
    }
  
    if (type === 'tip') {
      payload.formula = document.getElementById('create-formula')?.value.trim() || '';
    }
  
    if (editId) {
      db.collection(collectionName).doc(editId).update(payload)
        .then(() => showToast('Registro atualizado na nuvem!'));
    } else {
      db.collection(collectionName).add(payload)
        .then(() => showToast('Novo registro adicionado na nuvem!'));
    }
  
    closeModal('modal-create');
    e.target.reset();
  }
  
  function handleAnnouncementSubmit(e) {
    e.preventDefault();
    const targetClass = document.getElementById('announcement-class')?.value || 'Todas';
    const content = document.getElementById('announcement-content')?.value.trim() || '';
  
    const now = new Date();
    const dateStr = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}`;
  
    db.collection('announcements').add({
      author: 'Prof. Lucas',
      date: dateStr,
      targetClass,
      content,
      reactions: { '👍': [], '❤️': [], '👏': [], '🔥': [] }
    }).then(() => {
      closeModal('modal-announcement');
      e.target.reset();
      showToast('Recado publicado na nuvem com sucesso!');
    });
  }
  
  function promptDelete(id, itemType) {
    state.itemToDelete = { id, itemType };
    const modal = document.getElementById('modal-delete');
    const btn = document.getElementById('confirm-delete-btn');
  
    if (modal) modal.classList.add('open');
    if (btn) {
      btn.onclick = () => {
        executeDelete();
        closeModal('modal-delete');
      };
    }
  }
  
  function executeDelete() {
    if (!state.itemToDelete) return;
    const { id, itemType } = state.itemToDelete;
  
    const collectionMap = {
      'task': 'tasks',
      'video': 'videos',
      'tip': 'tips',
      'announcement': 'announcements'
    };
  
    const collectionName = collectionMap[itemType];
    if (collectionName) {
      db.collection(collectionName).doc(id).delete()
        .then(() => {
          showToast('Item removido da nuvem com sucesso.');
          state.itemToDelete = null;
        });
    }
  }
  
  function togglePasswordMask(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (btn) btn.innerText = '🙈';
    } else {
      input.type = 'password';
      if (btn) btn.innerText = '👁️';
    }
  }
  
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
  }
  
  function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
  
  function formatDate(dateStr) {
    if (!dateStr) return 'S/D';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    return `${parts[2]}/${parts[1]}`;
  }
  
  function isImageUrl(url) {
    return /\.(jpeg|jpg|gif|png|webp)$/i.test(url) || url.includes('unsplash.com');
  }
  
  function isVideoUrl(url) {
    return /\.(mp4|webm|ogg)$/i.test(url) || getVideoMediaInfo(url).isVideo;
  }
  
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[m]);
  }
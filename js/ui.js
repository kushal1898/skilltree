// ═══ UI: Tooltip, Toast, Sidebar, Add Skill, Connect Mode ═══

let connectMode = false, connectSource = null, toastTimer;
const tooltip = $('tooltip');

// ── Tooltip ──
function showTooltip(e, node, st) {
    const skills = getAllSkills();
    tooltip.classList.remove('hidden');
    $('tooltip-title').textContent = `${node.icon} ${node.label}`;
    $('tooltip-status').textContent = BADGE[st];
    $('tooltip-xp').textContent = `+${node.xp} XP`;

    const instructions = { locked:'Locked → Master Prerequisites', available:'Click to initiate training!', progress:'Click to declare Mastery!', learned:'Click to undo mastery.' };
    $('tooltip-instruction').textContent = instructions[st];

    let reqEl = $('tooltip-req');
    if (!reqEl) { reqEl = Object.assign(document.createElement('p'), {id:'tooltip-req', className:'req-list'}); $('tooltip-xp').after(reqEl); }
    reqEl.textContent = st === 'locked' ? 'Missing: ' + node.prereqs.filter(p => state[p] !== 'learned').map(p => skills[p].label).join(', ') : '';

    setTooltipPos(e);
    window.addEventListener('mousemove', setTooltipPos);
}

function setTooltipPos(e) {
    let x = e.clientX + 15, y = e.clientY + 15;
    if (x + tooltip.offsetWidth > innerWidth) x = innerWidth - tooltip.offsetWidth - 10;
    if (y + tooltip.offsetHeight > innerHeight) y = innerHeight - tooltip.offsetHeight - 10;
    tooltip.style.left = x + 'px'; tooltip.style.top = y + 'px';
}

function hideTooltip() { tooltip.classList.add('hidden'); window.removeEventListener('mousemove', setTooltipPos); }

// ── Toast ──
function showToast(msg) {
    const el = $('toast');
    el.innerHTML = `<span>🎮</span> ${msg}`;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

// ── Click Handler ──
function handleClick(id) {
    if (connectMode) return handleConnect(id);
    const skills = getAllSkills(), cur = state[id], node = skills[id];

    if (cur === 'locked') { showToast('🔒 Missing: ' + node.prereqs.filter(p => state[p] !== 'learned').map(p => skills[p].label).join(', ')); return; }

    const transitions = { available:['progress','📖 Training: '], progress:['learned','✨ Mastered: '], learned:['progress','↩️ Reverted: '] };
    const [next, prefix] = transitions[cur];
    state[id] = next;
    if (next === 'learned') triggerParticleBurst(node);
    showToast(prefix + node.label + (next === 'learned' ? '!' : ''));
    if (cur !== 'available') reEvaluateLocks();
    saveState(); recalculateXP(); updateStats(); renderTree(); hideTooltip();
}

// ── Connect Mode ──
function handleConnect(id) {
    const skills = getAllSkills();
    if (!connectSource) { connectSource = id; showToast('🔗 Select target from ' + skills[id].label); renderTree(); return; }
    if (connectSource === id) { connectSource = null; showToast('Cancelled.'); renderTree(); return; }

    const target = skills[id];
    if (!target.prereqs.includes(connectSource)) {
        target.prereqs.push(connectSource);
        if (customSkills[id]) customSkills[id].prereqs = target.prereqs;
        showToast('🔗 ' + skills[connectSource].label + ' → ' + target.label);
    } else showToast('Already connected!');

    connectSource = null; reEvaluateLocks(); saveState(); renderTree();
}

// ── Add Skill ──
function addSkill() {
    const name = $('new-skill-name').value.trim(), cat = $('new-skill-category').value.trim() || 'Other';
    const icon = $('new-skill-icon').value.trim() || '📦', parentId = $('new-skill-parent').value;
    if (!name) { showToast('⚠️ Enter a skill name'); return; }

    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
    if (getAllSkills()[id]) { showToast('⚠️ Already exists!'); return; }

    const prereqs = parentId && getAllSkills()[parentId] ? [parentId] : [];
    const row = prereqs.length ? getAllSkills()[parentId].row + 1 : 0;
    customSkills[id] = { label:name, icon, row, prereqs, xp:80, category:cat };
    state[id] = prereqs.length ? 'locked' : 'available';

    saveState(); computeLayout(); reEvaluateLocks(); recalculateXP(); updateStats(); updateParentDropdown(); renderTree(); centerTree();
    showToast('✅ Added: ' + name);
    $('new-skill-name').value = ''; $('new-skill-category').value = ''; $('new-skill-icon').value = ''; $('new-skill-parent').value = '';
}

function updateParentDropdown() {
    const sel = $('new-skill-parent'), skills = getAllSkills();
    sel.innerHTML = '<option value="">No Parent (Root)</option>';
    const cats = {};
    for (const id in skills) { const c = skills[id].category || 'Other'; (cats[c] = cats[c] || []).push({id, label:skills[id].label}); }
    Object.keys(cats).sort().forEach(c => {
        const g = Object.assign(document.createElement('optgroup'), {label:c});
        cats[c].forEach(s => g.appendChild(Object.assign(document.createElement('option'), {value:s.id, textContent:s.label})));
        sel.appendChild(g);
    });
}

function resetAll() {
    if (!confirm('Eradicate all memory and start from level 1?')) return;
    localStorage.removeItem('rpg_skilltree_state'); 
    localStorage.removeItem('rpg_skilltree_custom');
    location.reload(); // Hard reload guarantees a clean slate
}

// ── Particles ──
function triggerParticleBurst(node) {
    const r = $('svg-tree').getBoundingClientRect();
    const sx = r.left + transform.x + node.x * transform.scale, sy = r.top + transform.y + node.y * transform.scale;
    for (let i = 0; i < 20; i++) {
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 80;
        p.setAttribute('r', 1 + Math.random() * 3); p.setAttribute('cx', sx); p.setAttribute('cy', sy);
        p.setAttribute('fill', '#d4a44a'); p.style.filter = 'drop-shadow(0 0 5px #d4a44a)';
        $('particles-overlay').appendChild(p);
        p.animate([
            { transform:'translate(0,0) scale(1)', opacity:1 },
            { transform:`translate(${Math.cos(a)*d}px,${Math.sin(a)*d}px) scale(0)`, opacity:0 }
        ], { duration:600+Math.random()*400, easing:'cubic-bezier(0.1,0.8,0.3,1)', fill:'forwards' }).onfinish = () => p.remove();
    }
}

// ═══════════════════════════════════════════
//  SKILLTREE — RPG Learning Tracker
//  Full Script with Sidebar, Add Skill, Connect Mode
// ═══════════════════════════════════════════

const SKILLS = {
    // Row 0 (Foundation)
    html:       { label: 'HTML',       icon: '🌐', row: 0, prereqs: [], xp: 50,  category: 'Web' },
    git:        { label: 'Git',        icon: '🌿', row: 0, prereqs: [], xp: 50,  category: 'Tools' },

    // Row 1
    css:        { label: 'CSS',        icon: '🎨', row: 1, prereqs: ['html'], xp: 50,  category: 'Web' },
    js:         { label: 'JavaScript', icon: '⚡', row: 1, prereqs: ['html'], xp: 100, category: 'Web' },
    github:     { label: 'GitHub',     icon: '🐙', row: 1, prereqs: ['git'],  xp: 60,  category: 'Tools' },

    // Row 2
    ts:         { label: 'TypeScript', icon: '💎', row: 2, prereqs: ['js'],   xp: 120, category: 'Web' },
    nodejs:     { label: 'Node.js',    icon: '🟩', row: 2, prereqs: ['js'],   xp: 140, category: 'Backend' },

    // Row 3
    react:      { label: 'React',      icon: '⚛️', row: 3, prereqs: ['ts'],   xp: 150, category: 'Frontend' },
    express:    { label: 'Express',    icon: '🚂', row: 3, prereqs: ['nodejs'], xp: 100, category: 'Backend' },
    mongo:      { label: 'MongoDB',    icon: '🍃', row: 3, prereqs: ['nodejs'], xp: 110, category: 'Database' },

    // Row 4
    nextjs:     { label: 'Next.js',    icon: '▲',  row: 4, prereqs: ['react'], xp: 160, category: 'Frontend' },
    graphql:    { label: 'GraphQL',    icon: '🕸️', row: 4, prereqs: ['express', 'react'], xp: 140, category: 'API' },
    docker:     { label: 'Docker',     icon: '🐳', row: 4, prereqs: ['nodejs'], xp: 150, category: 'DevOps' },
    aws:        { label: 'AWS Cloud',  icon: '☁️', row: 4, prereqs: ['docker'], xp: 200, category: 'Cloud' },
};

// Custom skills storage
let customSkills = {};

const TITLES = [
    { level: 1, title: 'NOVICE' },
    { level: 2, title: 'APPRENTICE' },
    { level: 3, title: 'ADEPT' },
    { level: 4, title: 'JOURNEYMAN' },
    { level: 5, title: 'EXPERT' },
    { level: 6, title: 'MASTER' },
    { level: 8, title: 'GRANDMASTER' },
    { level: 10, title: 'SORCERER' },
];

const BADGE = { locked: 'Locked', available: 'Available', progress: 'In Progress', learned: 'Mastered' };

let state = {};
let currentXP = 0;
let currentLevel = 1;

// Pan & Zoom
let transform = { x: 0, y: 0, scale: 1 };
let isDragging = false;
let startDragParams = { x: 0, y: 0, tx: 0, ty: 0 };

// Connect mode
let connectMode = false;
let connectSource = null;

const config = { nodeRadius: 32, spacingX: 160, spacingY: 160 };
const computedNodes = [];

// ─────────────────────────────────────
//  DOM REFS
// ─────────────────────────────────────
const svgContainer = document.getElementById('svg-tree');
const panZoomGroup = document.getElementById('svg-pan-zoom-group');
const edgesGroup = document.getElementById('edges-group');
const nodesGroup = document.getElementById('nodes-group');
const treeWrap = document.getElementById('tree-wrap');
const tooltip = document.getElementById('tooltip');
const particlesContainer = document.getElementById('particles-overlay');

// ─────────────────────────────────────
//  GET ALL SKILLS (built-in + custom)
// ─────────────────────────────────────
function getAllSkills() {
    return { ...SKILLS, ...customSkills };
}

// ─────────────────────────────────────
//  INIT AND STORAGE
// ─────────────────────────────────────
function loadState() {
    try {
        const saved = localStorage.getItem('rpg_skilltree_state');
        if (saved) state = JSON.parse(saved);
    } catch (e) {}

    try {
        const savedCustom = localStorage.getItem('rpg_skilltree_custom');
        if (savedCustom) customSkills = JSON.parse(savedCustom);
    } catch (e) {}

    const skills = getAllSkills();
    for (const id in skills) {
        if (!state[id]) state[id] = skills[id].prereqs.length === 0 ? 'available' : 'locked';
    }
}

function saveState() {
    localStorage.setItem('rpg_skilltree_state', JSON.stringify(state));
    localStorage.setItem('rpg_skilltree_custom', JSON.stringify(customSkills));
}

// ─────────────────────────────────────
//  LAYOUT ENGINE
// ─────────────────────────────────────
function computeLayout() {
    const skills = getAllSkills();
    const maxRow = Math.max(...Object.values(skills).map(s => s.row));
    const rows = [];
    for (let i = 0; i <= maxRow; i++) rows.push([]);

    for (const id in skills) {
        skills[id].id = id;
        rows[skills[id].row].push(skills[id]);
    }

    computedNodes.length = 0;
    rows.forEach((row, rowIdx) => {
        const rowWidth = (row.length - 1) * config.spacingX;
        const startX = -rowWidth / 2;

        row.forEach((node, idx) => {
            node.x = startX + (idx * config.spacingX);
            node.y = (rowIdx * config.spacingY) + 80;
            computedNodes.push(node);
        });
    });
}

// ─────────────────────────────────────
//  CLICK & AUTO-UNLOCK
// ─────────────────────────────────────
function handleClick(id) {
    if (connectMode) {
        handleConnectClick(id);
        return;
    }

    const skills = getAllSkills();
    const cur = state[id];
    const node = skills[id];

    if (cur === 'locked') {
        const missing = node.prereqs.filter(p => state[p] !== 'learned').map(p => skills[p].label).join(', ');
        showToast('🔒 Missing prerequisites: ' + missing);
        return;
    }

    if (cur === 'available') {
        state[id] = 'progress';
        showToast('📖 Training initiated: ' + node.label);
    } else if (cur === 'progress') {
        state[id] = 'learned';
        triggerParticleBurst(node);
        showToast('✨ Mastered: ' + node.label + '!');
        reEvaluateLocks();
    } else if (cur === 'learned') {
        state[id] = 'progress';
        showToast('↩️ Reverted: ' + node.label);
        reEvaluateLocks();
    }

    saveState();
    recalculateXP();
    updateStats();
    renderTree();
    hideTooltip();
}

function reEvaluateLocks() {
    const skills = getAllSkills();
    let changed = true;
    while (changed) {
        changed = false;
        for (const id in skills) {
            const allReqsMet = skills[id].prereqs.length === 0 || skills[id].prereqs.every(p => state[p] === 'learned');
            if (state[id] === 'locked' && allReqsMet) {
                state[id] = 'available';
                changed = true;
            } else if (state[id] === 'available' && !allReqsMet) {
                state[id] = 'locked';
                changed = true;
            }
        }
    }
}

// ─────────────────────────────────────
//  CONNECT MODE
// ─────────────────────────────────────
function handleConnectClick(id) {
    if (!connectSource) {
        connectSource = id;
        showToast('🔗 Select target skill to connect from ' + getAllSkills()[id].label);
        renderTree();
    } else {
        if (connectSource === id) {
            connectSource = null;
            showToast('Cancelled connection.');
            renderTree();
            return;
        }

        const skills = getAllSkills();
        const target = skills[id];

        // Add prerequisite
        if (!target.prereqs.includes(connectSource)) {
            target.prereqs.push(connectSource);

            // Save custom prereq links
            if (customSkills[id]) {
                customSkills[id].prereqs = target.prereqs;
            }

            showToast('🔗 Connected: ' + skills[connectSource].label + ' → ' + target.label);
        } else {
            showToast('Already connected!');
        }

        connectSource = null;
        reEvaluateLocks();
        saveState();
        renderTree();
    }
}

// ─────────────────────────────────────
//  XP / CHARACTER LEVELING
// ─────────────────────────────────────
function calculateTargetXP(level) { return level * 200; }

function recalculateXP() {
    const skills = getAllSkills();
    let oldLevel = currentLevel;

    currentXP = 0;
    for (const id in skills) if (state[id] === 'learned') currentXP += skills[id].xp;

    currentLevel = 1;
    let target = calculateTargetXP(currentLevel);

    let tempXp = currentXP;
    while (tempXp >= target) {
        tempXp -= target;
        currentLevel++;
        target = calculateTargetXP(currentLevel);
    }

    document.getElementById('current-xp').textContent = tempXp;
    document.getElementById('target-xp').textContent = target;
    document.getElementById('level-display').textContent = currentLevel;

    const percentage = Math.min(100, Math.max(0, (tempXp / target) * 100));
    document.getElementById('xp-bar').style.width = percentage + '%';

    const titleObj = TITLES.slice().reverse().find(t => currentLevel >= t.level);
    if (titleObj) document.getElementById('user-title').textContent = titleObj.title;

    if (currentLevel > oldLevel) {
        const badge = document.getElementById('level-badge');
        badge.style.animation = 'none';
        badge.offsetHeight;
        badge.style.animation = 'level-up-pulse 1s ease';
        setTimeout(() => showToast('🎉 LEVEL UP!'), 500);
    }
}

// ─────────────────────────────────────
//  SIDEBAR STATS
// ─────────────────────────────────────
function updateStats() {
    const skills = getAllSkills();
    let mastered = 0, progress = 0, locked = 0, total = 0;

    for (const id in skills) {
        total++;
        if (state[id] === 'learned') mastered++;
        else if (state[id] === 'progress') progress++;
        else if (state[id] === 'locked') locked++;
    }

    document.getElementById('stat-mastered').textContent = mastered;
    document.getElementById('stat-progress').textContent = progress;
    document.getElementById('stat-locked').textContent = locked;
    document.getElementById('stat-total').textContent = total;
}

// ─────────────────────────────────────
//  PARENT DROPDOWN
// ─────────────────────────────────────
function updateParentDropdown() {
    const select = document.getElementById('new-skill-parent');
    const skills = getAllSkills();
    select.innerHTML = '<option value="">No Parent (Root)</option>';

    // Group by category
    const categories = {};
    for (const id in skills) {
        const cat = skills[id].category || 'Other';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push({ id, label: skills[id].label });
    }

    for (const cat of Object.keys(categories).sort()) {
        const group = document.createElement('optgroup');
        group.label = cat;
        categories[cat].forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.label;
            group.appendChild(opt);
        });
        select.appendChild(group);
    }
}

// ─────────────────────────────────────
//  ADD SKILL
// ─────────────────────────────────────
function addSkill() {
    const nameInput = document.getElementById('new-skill-name');
    const catInput = document.getElementById('new-skill-category');
    const iconInput = document.getElementById('new-skill-icon');
    const parentSelect = document.getElementById('new-skill-parent');

    const name = nameInput.value.trim();
    const category = catInput.value.trim() || 'Other';
    const icon = iconInput.value.trim() || '📦';
    const parentId = parentSelect.value;

    if (!name) {
        showToast('⚠️ Please enter a skill name');
        return;
    }

    // Generate a unique ID
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
    const skills = getAllSkills();

    if (skills[id]) {
        showToast('⚠️ Skill already exists!');
        return;
    }

    // Determine row
    let row = 0;
    const prereqs = [];
    if (parentId && skills[parentId]) {
        row = skills[parentId].row + 1;
        prereqs.push(parentId);
    }

    customSkills[id] = {
        label: name,
        icon: icon,
        row: row,
        prereqs: prereqs,
        xp: 80,
        category: category,
    };

    state[id] = prereqs.length === 0 ? 'available' : 'locked';

    saveState();
    computeLayout();
    reEvaluateLocks();
    recalculateXP();
    updateStats();
    updateParentDropdown();
    renderTree();
    centerTree();

    showToast('✅ Added skill: ' + name);

    // Clear inputs
    nameInput.value = '';
    catInput.value = '';
    iconInput.value = '';
    parentSelect.value = '';
}

// ─────────────────────────────────────
//  RENDER SVG ENGINE
// ─────────────────────────────────────
function renderTree() {
    const skills = getAllSkills();
    edgesGroup.innerHTML = '';
    nodesGroup.innerHTML = '';

    const nodeMap = new Map();
    computedNodes.forEach(n => nodeMap.set(n.id, n));

    // Draw edges (straight lines with slight curve)
    computedNodes.forEach(node => {
        node.prereqs.forEach(reqId => {
            const reqNode = nodeMap.get(reqId);
            if (!reqNode) return;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const dy = node.y - reqNode.y;
            const cy1 = reqNode.y + dy * 0.4;
            const cy2 = node.y - dy * 0.4;

            const d = `M ${reqNode.x} ${reqNode.y + config.nodeRadius} C ${reqNode.x} ${cy1}, ${node.x} ${cy2}, ${node.x} ${node.y - config.nodeRadius}`;

            path.setAttribute('d', d);
            path.classList.add('edge');

            const stNode = state[node.id];
            const stReq = state[reqNode.id];

            if (stNode === 'locked' && stReq !== 'learned') {
                path.classList.add('locked');
            } else if (stReq === 'learned') {
                if (stNode === 'learned') path.classList.add('learned');
                else if (stNode === 'progress') path.classList.add('progress');
                else path.classList.add('available');
            } else {
                path.classList.add('locked');
            }

            edgesGroup.appendChild(path);
        });
    });

    // Draw circular nodes
    computedNodes.forEach(node => {
        const st = state[node.id];

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${node.x}, ${node.y})`);
        g.classList.add('node', st);

        // Connect mode highlight
        if (connectMode && connectSource === node.id) {
            g.classList.add('connect-source');
        }

        // Circle background
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', config.nodeRadius);
        circle.setAttribute('cx', 0);
        circle.setAttribute('cy', 0);
        circle.classList.add('node-circle');

        // Star indicator for mastered/progress
        const star = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        star.classList.add('node-star');
        star.setAttribute('x', config.nodeRadius * 0.65);
        star.setAttribute('y', -config.nodeRadius * 0.65);
        star.textContent = st === 'learned' ? '⭐' : st === 'progress' ? '🔸' : '';

        // Icon
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        icon.classList.add('node-icon');
        icon.textContent = node.icon;

        // Label
        const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        labelText.classList.add('node-label');
        labelText.setAttribute('y', config.nodeRadius + 18);
        labelText.textContent = node.label.toUpperCase();

        // Category
        const categoryText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        categoryText.classList.add('node-category');
        categoryText.setAttribute('y', config.nodeRadius + 32);
        categoryText.textContent = node.category || '';

        g.appendChild(circle);
        g.appendChild(star);
        g.appendChild(icon);
        g.appendChild(labelText);
        g.appendChild(categoryText);

        g.addEventListener('mouseenter', (e) => showTooltip(e, node, st));
        g.addEventListener('mouseleave', hideTooltip);
        g.onclick = () => handleClick(node.id);

        nodesGroup.appendChild(g);
    });
}

// ─────────────────────────────────────
//  PARTICLE EFFECTS
// ─────────────────────────────────────
function triggerParticleBurst(node) {
    const rect = svgContainer.getBoundingClientRect();
    const screenX = rect.left + transform.x + (node.x * transform.scale);
    const screenY = rect.top + transform.y + (node.y * transform.scale);

    for (let i = 0; i < 20; i++) {
        createParticle(screenX, screenY);
    }
}

function createParticle(x, y) {
    const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 80;
    const duration = 600 + Math.random() * 400;

    particle.setAttribute('r', 1 + Math.random() * 3);
    particle.setAttribute('cx', x);
    particle.setAttribute('cy', y);
    particle.setAttribute('fill', '#d4a44a');
    particle.style.filter = 'drop-shadow(0 0 5px #d4a44a)';

    particlesContainer.appendChild(particle);

    particle.animate([
        { transform: `translate(0, 0) scale(1)`, opacity: 1 },
        { transform: `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px) scale(0)`, opacity: 0 }
    ], {
        duration: duration,
        easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)',
        fill: 'forwards'
    }).onfinish = () => particle.remove();
}

// ─────────────────────────────────────
//  TOOLTIP & UI
// ─────────────────────────────────────
function showTooltip(e, node, st) {
    const skills = getAllSkills();
    tooltip.classList.remove('hidden');
    document.getElementById('tooltip-title').textContent = `${node.icon} ${node.label}`;
    document.getElementById('tooltip-status').textContent = BADGE[st];
    document.getElementById('tooltip-xp').textContent = `+${node.xp} XP`;

    let instructionText = "Locked → Master Prerequisites";
    let reqText = "";
    if (st === 'locked') {
        const missing = node.prereqs.filter(p => state[p] !== 'learned').map(p => skills[p].label).join(', ');
        if(missing) reqText = 'Missing: ' + missing;
    } else if (st === 'available') {
        instructionText = "Click to initiate training!";
    } else if (st === 'progress') {
        instructionText = "Click to declare Mastery!";
    } else if (st === 'learned') {
        instructionText = "Click to undo mastery.";
    }

    document.getElementById('tooltip-instruction').textContent = instructionText;

    let reqEl = document.getElementById('tooltip-req');
    if(!reqEl) {
        reqEl = document.createElement('p');
        reqEl.id = 'tooltip-req';
        reqEl.className = 'req-list';
        document.getElementById('tooltip-xp').after(reqEl);
    }
    reqEl.textContent = reqText;

    setTooltipPosition(e);
    window.addEventListener('mousemove', setTooltipPosition);
}

function setTooltipPosition(e) {
    let lx = e.clientX + 15;
    let ly = e.clientY + 15;
    if (lx + tooltip.offsetWidth > window.innerWidth) lx = window.innerWidth - tooltip.offsetWidth - 10;
    if (ly + tooltip.offsetHeight > window.innerHeight) ly = window.innerHeight - tooltip.offsetHeight - 10;
    tooltip.style.left = lx + 'px';
    tooltip.style.top = ly + 'px';
}

function hideTooltip() {
    tooltip.classList.add('hidden');
    window.removeEventListener('mousemove', setTooltipPosition);
}

let toastTimer;
function showToast(msg) {
    const el = document.getElementById('toast');
    el.innerHTML = `<span>🎮</span> ${msg}`;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

function resetAll() {
    if (!confirm('Eradicate all memory and start from level 1?')) return;
    state = {};
    customSkills = {};
    localStorage.removeItem('rpg_skilltree_state');
    localStorage.removeItem('rpg_skilltree_custom');
    loadState();
    computeLayout();
    recalculateXP();
    reEvaluateLocks();
    updateStats();
    updateParentDropdown();
    renderTree();
    centerTree();
    showToast('World Reset Completed.');
}

// ─────────────────────────────────────
//  PAN & ZOOM
// ─────────────────────────────────────
function applyTransform() {
    panZoomGroup.setAttribute('transform', `matrix(${transform.scale}, 0, 0, ${transform.scale}, ${transform.x}, ${transform.y})`);
}

function centerTree() {
    let minY = Infinity, maxY = -Infinity;
    let minX = Infinity, maxX = -Infinity;
    computedNodes.forEach(n => {
        if (n.y < minY) minY = n.y;
        if (n.y > maxY) maxY = n.y;
        if (n.x < minX) minX = n.x;
        if (n.x > maxX) maxX = n.x;
    });

    const svgRect = svgContainer.getBoundingClientRect();
    const treeWidth = maxX - minX + 200;
    const treeHeight = maxY - minY + 200;

    const scaleX = svgRect.width / treeWidth;
    const scaleY = svgRect.height / treeHeight;
    transform.scale = Math.min(scaleX, scaleY, 1.2);

    transform.x = svgRect.width / 2 - ((minX + maxX) / 2) * transform.scale;
    transform.y = svgRect.height / 2 - ((minY + maxY) / 2) * transform.scale;

    applyTransform();
}

treeWrap.addEventListener('mousedown', (e) => {
    isDragging = true;
    startDragParams = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    transform.x = startDragParams.tx + (e.clientX - startDragParams.x);
    transform.y = startDragParams.ty + (e.clientY - startDragParams.y);
    applyTransform();
});

window.addEventListener('mouseup', () => isDragging = false);

treeWrap.addEventListener('wheel', (e) => {
    e.preventDefault();
    const scaleAmount = 0.05;
    const direction = e.deltaY < 0 ? 1 : -1;
    const oldScale = transform.scale;
    let newScale = Math.max(0.3, Math.min(transform.scale + (direction * scaleAmount), 3));

    const rect = svgContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    transform.x = mouseX - (mouseX - transform.x) * (newScale / oldScale);
    transform.y = mouseY - (mouseY - transform.y) * (newScale / oldScale);
    transform.scale = newScale;
    applyTransform();
}, { passive: false });

document.getElementById('btn-recenter').addEventListener('click', centerTree);

// ─────────────────────────────────────
//  SIDEBAR EVENT LISTENERS
// ─────────────────────────────────────
document.getElementById('btn-add-skill').addEventListener('click', addSkill);
document.getElementById('btn-reset').addEventListener('click', resetAll);

document.getElementById('btn-connect-toggle').addEventListener('click', () => {
    connectMode = !connectMode;
    connectSource = null;
    const btn = document.getElementById('btn-connect-toggle');
    const hint = document.querySelector('.connect-hint');

    if (connectMode) {
        btn.classList.add('active');
        hint.textContent = 'Click two nodes';
        showToast('🔗 Connect Mode ON — click source then target');
    } else {
        btn.classList.remove('active');
        hint.textContent = 'Click to enable';
        showToast('Connect Mode OFF');
    }
    renderTree();
});

// Enter key in add-skill form
document.getElementById('new-skill-name').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addSkill();
});

// ─────────────────────────────────────
//  LIFECYCLE
// ─────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    loadState();
    computeLayout();
    reEvaluateLocks();
    recalculateXP();
    updateStats();
    updateParentDropdown();
    renderTree();
    setTimeout(centerTree, 50);
});

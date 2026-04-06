// ═══ State Management & XP Engine ═══

let customSkills = {}, state = {}, currentXP = 0, currentLevel = 1;
const computedNodes = [];

const getAllSkills = () => ({ ...SKILLS, ...customSkills });
const $ = id => document.getElementById(id);

function loadState() {
    try { state = JSON.parse(localStorage.getItem('rpg_skilltree_state')) || {}; } catch {}
    try { customSkills = JSON.parse(localStorage.getItem('rpg_skilltree_custom')) || {}; } catch {}
    const skills = getAllSkills();
    for (const id in skills)
        if (!state[id]) state[id] = skills[id].prereqs.length ? 'locked' : 'available';
}

function saveState() {
    localStorage.setItem('rpg_skilltree_state', JSON.stringify(state));
    localStorage.setItem('rpg_skilltree_custom', JSON.stringify(customSkills));
}

function reEvaluateLocks() {
    const skills = getAllSkills();
    let changed = true;
    while (changed) {
        changed = false;
        for (const id in skills) {
            const met = !skills[id].prereqs.length || skills[id].prereqs.every(p => state[p] === 'learned');
            if (state[id] === 'locked' && met)     { state[id] = 'available'; changed = true; }
            else if (state[id] === 'available' && !met) { state[id] = 'locked';    changed = true; }
        }
    }
}

function computeLayout() {
    const skills = getAllSkills();
    const maxRow = Math.max(...Object.values(skills).map(s => s.row));
    const rows = Array.from({length: maxRow + 1}, () => []);
    for (const id in skills) { skills[id].id = id; rows[skills[id].row].push(skills[id]); }

    computedNodes.length = 0;
    rows.forEach((row, ri) => {
        const startX = -((row.length - 1) * CFG.spacingX) / 2;
        row.forEach((n, i) => {
            n.x = startX + i * CFG.spacingX;
            n.y = ri * CFG.spacingY + 80;
            computedNodes.push(n);
        });
    });
}

function recalculateXP() {
    const skills = getAllSkills();
    let oldLvl = currentLevel;
    currentXP = Object.keys(skills).reduce((s, id) => s + (state[id] === 'learned' ? skills[id].xp : 0), 0);

    currentLevel = 1;
    let tmp = currentXP, tgt = currentLevel * 200;
    while (tmp >= tgt) { tmp -= tgt; currentLevel++; tgt = currentLevel * 200; }

    $('current-xp').textContent = tmp;
    $('target-xp').textContent = tgt;
    $('level-display').textContent = currentLevel;
    $('xp-bar').style.width = Math.min(100, (tmp / tgt) * 100) + '%';

    const t = TITLES.slice().reverse().find(t => currentLevel >= t.level);
    if (t) $('user-title').textContent = t.title;

    if (currentLevel > oldLvl) {
        const b = $('level-badge');
        b.style.animation = 'none'; b.offsetHeight; b.style.animation = 'level-up-pulse 1s ease';
        setTimeout(() => showToast('🎉 LEVEL UP!'), 500);
    }
}

function updateStats() {
    const skills = getAllSkills();
    let m = 0, p = 0, l = 0, t = 0;
    for (const id in skills) {
        t++;
        if (state[id] === 'learned') m++;
        else if (state[id] === 'progress') p++;
        else if (state[id] === 'locked') l++;
    }
    $('stat-mastered').textContent = m;
    $('stat-progress').textContent = p;
    $('stat-locked').textContent = l;
    $('stat-total').textContent = t;
}

// ═══ App Init & Event Bindings ═══

$('btn-add-skill').addEventListener('click', addSkill);
$('btn-reset').addEventListener('click', resetAll);
$('new-skill-name').addEventListener('keydown', e => { if (e.key === 'Enter') addSkill(); });

$('btn-connect-toggle').addEventListener('click', () => {
    connectMode = !connectMode; connectSource = null;
    $('btn-connect-toggle').classList.toggle('active', connectMode);
    document.querySelector('.connect-hint').textContent = connectMode ? 'Click two nodes' : 'Click to enable';
    showToast(connectMode ? '🔗 Connect Mode ON' : 'Connect Mode OFF');
    renderTree();
});

window.addEventListener('DOMContentLoaded', () => {
    loadState(); computeLayout(); reEvaluateLocks(); recalculateXP(); updateStats(); updateParentDropdown(); renderTree();
    setTimeout(centerTree, 50);
});

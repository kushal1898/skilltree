// ═══ SVG Render Engine ═══

const svgNS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}) => {
    const e = document.createElementNS(svgNS, tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (k === 'class') e.classList.add(...v.split(' '));
        else if (k === 'text') e.textContent = v;
        else e.setAttribute(k, v);
    }
    return e;
};

function renderTree() {
    const edgesG = $('edges-group'), nodesG = $('nodes-group');
    edgesG.innerHTML = ''; nodesG.innerHTML = '';

    const nodeMap = new Map(computedNodes.map(n => [n.id, n]));

    // Edges
    computedNodes.forEach(node => {
        node.prereqs.forEach(rid => {
            const r = nodeMap.get(rid);
            if (!r) return;
            const dy = node.y - r.y;
            const path = el('path', {
                d: `M ${r.x} ${r.y + CFG.nodeRadius} C ${r.x} ${r.y + dy*.4}, ${node.x} ${node.y - dy*.4}, ${node.x} ${node.y - CFG.nodeRadius}`,
                class: 'edge ' + getEdgeClass(state[node.id], state[r.id])
            });
            edgesG.appendChild(path);
        });
    });

    // Nodes
    computedNodes.forEach(node => {
        const st = state[node.id];
        const g = el('g', { transform: `translate(${node.x},${node.y})`, class: `node ${st}${connectMode && connectSource === node.id ? ' connect-source' : ''}` });

        g.appendChild(el('circle', { r: CFG.nodeRadius, cx: 0, cy: 0, class: 'node-circle' }));
        if (st === 'learned' || st === 'progress')
            g.appendChild(el('text', { class: 'node-star', x: CFG.nodeRadius*.65, y: -CFG.nodeRadius*.65, text: st === 'learned' ? '⭐' : '🔸' }));
        g.appendChild(el('text', { class: 'node-icon', text: node.icon }));
        g.appendChild(el('text', { class: 'node-label', y: CFG.nodeRadius + 18, text: node.label.toUpperCase() }));
        g.appendChild(el('text', { class: 'node-category', y: CFG.nodeRadius + 32, text: node.category || '' }));

        g.addEventListener('mouseenter', e => showTooltip(e, node, st));
        g.addEventListener('mouseleave', hideTooltip);
        g.onclick = () => handleClick(node.id);
        nodesG.appendChild(g);
    });
}

function getEdgeClass(sn, sr) {
    if (sn === 'locked' && sr !== 'learned') return 'locked';
    if (sr === 'learned') return sn === 'learned' ? 'learned' : sn === 'progress' ? 'progress' : 'available';
    return 'locked';
}

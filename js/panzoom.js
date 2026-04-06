// ═══ Pan & Zoom Controls ═══

let transform = { x:0, y:0, scale:1 }, isDragging = false, dragStart = {};
const treeWrap = $('tree-wrap'), svg = $('svg-tree'), pzg = $('svg-pan-zoom-group');

const applyTransform = () => pzg.setAttribute('transform', `matrix(${transform.scale},0,0,${transform.scale},${transform.x},${transform.y})`);

function centerTree() {
    let [minX,maxX,minY,maxY] = [Infinity,-Infinity,Infinity,-Infinity];
    computedNodes.forEach(n => { minX=Math.min(minX,n.x); maxX=Math.max(maxX,n.x); minY=Math.min(minY,n.y); maxY=Math.max(maxY,n.y); });
    const r = svg.getBoundingClientRect();
    transform.scale = Math.min(r.width/(maxX-minX+200), r.height/(maxY-minY+200), 1.2);
    transform.x = r.width/2 - ((minX+maxX)/2)*transform.scale;
    transform.y = r.height/2 - ((minY+maxY)/2)*transform.scale;
    applyTransform();
}

treeWrap.addEventListener('mousedown', e => { isDragging = true; dragStart = {x:e.clientX, y:e.clientY, tx:transform.x, ty:transform.y}; });
window.addEventListener('mousemove', e => { if (!isDragging) return; transform.x = dragStart.tx + e.clientX - dragStart.x; transform.y = dragStart.ty + e.clientY - dragStart.y; applyTransform(); });
window.addEventListener('mouseup', () => isDragging = false);

treeWrap.addEventListener('wheel', e => {
    e.preventDefault();
    const old = transform.scale, ns = Math.max(0.3, Math.min(old + (e.deltaY < 0 ? .05 : -.05), 3));
    const r = svg.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    transform.x = mx - (mx - transform.x) * ns / old;
    transform.y = my - (my - transform.y) * ns / old;
    transform.scale = ns; applyTransform();
}, { passive: false });

$('btn-recenter').addEventListener('click', centerTree);

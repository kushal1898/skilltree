// ═══ Skill Definitions & Constants ═══

const SKILLS = {
    html:    { label:'HTML',       icon:'🌐', row:0, prereqs:[],          xp:50,  category:'Web' },
    git:     { label:'Git',        icon:'🌿', row:0, prereqs:[],          xp:50,  category:'Tools' },
    css:     { label:'CSS',        icon:'🎨', row:1, prereqs:['html'],    xp:50,  category:'Web' },
    js:      { label:'JavaScript', icon:'⚡', row:1, prereqs:['html'],    xp:100, category:'Web' },
    github:  { label:'GitHub',     icon:'🐙', row:1, prereqs:['git'],     xp:60,  category:'Tools' },
    ts:      { label:'TypeScript', icon:'💎', row:2, prereqs:['js'],      xp:120, category:'Web' },
    nodejs:  { label:'Node.js',    icon:'🟩', row:2, prereqs:['js'],      xp:140, category:'Backend' },
    react:   { label:'React',      icon:'⚛️', row:3, prereqs:['ts'],      xp:150, category:'Frontend' },
    express: { label:'Express',    icon:'🚂', row:3, prereqs:['nodejs'],  xp:100, category:'Backend' },
    mongo:   { label:'MongoDB',    icon:'🍃', row:3, prereqs:['nodejs'],  xp:110, category:'Database' },
    nextjs:  { label:'Next.js',    icon:'▲',  row:4, prereqs:['react'],   xp:160, category:'Frontend' },
    graphql: { label:'GraphQL',    icon:'🕸️', row:4, prereqs:['express','react'], xp:140, category:'API' },
    docker:  { label:'Docker',     icon:'🐳', row:4, prereqs:['nodejs'],  xp:150, category:'DevOps' },
    aws:     { label:'AWS Cloud',  icon:'☁️', row:4, prereqs:['docker'],  xp:200, category:'Cloud' },
};

const TITLES = [
    {level:1,title:'NOVICE'},{level:2,title:'APPRENTICE'},{level:3,title:'ADEPT'},
    {level:4,title:'JOURNEYMAN'},{level:5,title:'EXPERT'},{level:6,title:'MASTER'},
    {level:8,title:'GRANDMASTER'},{level:10,title:'SORCERER'},
];

const BADGE = { locked:'Locked', available:'Available', progress:'In Progress', learned:'Mastered' };
const CFG = { nodeRadius:32, spacingX:160, spacingY:160 };

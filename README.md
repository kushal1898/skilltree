An interactive, gamified learning tracker built entirely with Vanilla JavaScript, HTML, and CSS. 

Turn your learning journey into an RPG-style skill tree. Connect your dependencies, gain XP by mastering new technologies, and level up your developer title from a humble *Novice* to a grand *Tech Sorcerer*.

## ✨ Features

- **Interactive SVG Tree Rendering:** Complex Directed Acyclic Graph (DAG) structures rendered beautifully through native SVG element manipulation.
- **Deep Progression System:** Earn XP by declaring mastery on technologies. Unlocks dynamically cascade down the tree using calculated dependencies.
- **Advanced Connect Mode 🔗:** Build your own learning roadmap on the fly. Click any two nodes to instantly link them via a prerequisite edge.
- **Custom Skill Creation:** Use the sidebar form to inject brand-new customizable skills complete with category groups and emojis into the tree memory.
- **Canvas Controls:** Drag-to-pan screen manipulation, scroll wheel zoom centering, and quick recenter snapping—all crafted via raw JavaScript mathematics.
- **Visual Micro-Interactions:** Custom keyframe glowing animations, dynamic SVG Bézier curves updating on-the-fly, and particle burst effects leveraging the Web Animations API.
- **Persistent LocalStorage:** Never lose your progress. The app automatically saves state flags, linked dependencies, and your custom nodes in browser memory.

## 🛠️ Tech Stack & Architecture

This application was developed as a fun challenge to build a fully robust visualization engine **without using any front-end frameworks (No React, Vue, D3.js, etc.)**. 

* **Vanilla JavaScript (ES6+):** Modularized logic separated into data mapping, state management, UI, pan/zoom canvas calculation, and engine rendering.
* **HTML5 / CSS3:** Utilizes extensive CSS Variables (Custom Properties), Grid/Flexbox layouts, glassmorphism overlays, and complex keyframe logic.
* **Native SVG API:** All the interconnected tree nodes and lines are drawn entirely by creating and manipulating SVG instances via namespace XML document methods. 

### File Structure
```text
📦 skilltree-rpg
 ┣ 📂 js
 ┃ ┣ 📜 app.js       # Core execution and event binding
 ┃ ┣ 📜 data.js      # Seed nodes and layout constants
 ┃ ┣ 📜 panzoom.js   # Canvas viewport mathematics
 ┃ ┣ 📜 render.js    # Edge + Node SVG rendering engine
 ┃ ┣ 📜 state.js     # Hierarchy traversal and Level/XP formulas
 ┃ ┗ 📜 ui.js        # DOM interaction, modals, and Web Animations API
 ┣ 📜 index.html     # Layout & UI scaffold
 ┗ 📜 style.css      # Theming & CSS logic
```

## 🚀 How to Run Locally

You don't need any complex build steps, webpack, or dependencies to run this tracking app locally. 

**Option 1: Live Server (Recommended)**
1. Clone the repository to your local machine.
2. Open the folder in VS Code.
3. Use the **Live Server** extension to launch `index.html`.

**Option 2: Direct File Open**
Since it's completely Vanilla JS without module imports that violate CORS policies, simply double-click the `index.html` file to open it in your web browser. 

*(Note: While file opening works, some browsers may restrict `localStorage` for `file://` protocols. A local server is always best.)*

## 🎮 How to Play / Use

1. **Start Learning:** Nodes with a blue border are available. Grey ones are currently locked. 
2. **Train & Learn:** Click an available blue node to set it completely in-progress (Gold border). Click it again once you've finished learning it to Master it!
3. **Gain Experience:** Every time you master a technology, you'll earn experience and see dependent skills magically unlock if all their required branches are met.
4. **Create the Tree:** Need to track something obscure? Fill out the "Add Skill" form on the left pane and assign it a category and a parent node. 
5. **Adjust the Path:** Toggle **Connect Mode** on. Click an existing acquired skill, and then click any other skill to generate a brand new prerequisite bridge. 

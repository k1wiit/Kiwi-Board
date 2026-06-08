# 🥝 Kiwi Board

Your personal library & file organizer. Built with Electron + vanilla JS.

---

## Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [VS Code](https://code.visualstudio.com/)

### Install dependencies
```bash
cd kiwi-board
npm install
```

### Run in development
```bash
npm start
```

### Build to .exe (Windows)
```bash
npm run build:win
```
The installer will appear in the `dist/` folder.

---

## Structure

```
kiwi-board/
├── src/
│   ├── main/
│   │   ├── main.js          # Electron main process
│   │   └── preload.js       # Secure bridge to renderer
│   ├── renderer/
│   │   ├── index.html       # App shell + splash
│   │   ├── css/
│   │   │   └── main.css     # All styles
│   │   └── js/
│   │       └── app.js       # App logic + data
│   └── assets/              # Icons go here
├── package.json
└── README.md
```

---

## Features (v1)

- ✅ Splash screen with startup animation
- ✅ Library with grid / list views
- ✅ Folder structure (create, delete, assign items)
- ✅ Add / edit / delete items
- ✅ Star items
- ✅ Tags + color accents per item
- ✅ Full-text search
- ✅ Recent view (last 20 items)
- ✅ Data persisted to disk (userData)
- ✅ Custom frameless window with titlebar
- ✅ Right-click context menu

## Coming up

- 🔜 Drag & drop items between folders
- 🔜 Better MC stackers
- 🔜 Import from URL (auto-fetch title/thumbnail)
- 🔜 Tags filter sidebar
- 🔜 Export / backup

---

*Made for Kiwi. Not for anyone else.*
# Kiwi-Board

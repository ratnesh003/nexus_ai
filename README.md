# DataNexus AI

## Overview

**DataNexus AI** is a next-generation data analysis platform that combines the reasoning power of **Google Gemini** with the execution speed of **WebAssembly (Pyodide)**. 

Unlike traditional tools that require heavy backend servers to process data, DataNexus runs a full **Python environment directly in your browser**. This means you can upload CSVs, ask for transformations in plain English, and execute complex Pandas operations instantly on your machine—ensuring speed and data privacy.

The app supports a **Hybrid Architecture**:
1.  **Local-First (Default)**: Projects and data are stored in your browser's LocalStorage. Python code runs locally.
2.  **Cloud-Sync (Optional)**: Connect to **MongoDB Atlas** and **Cloudinary** via the Settings menu to sync your projects across devices without needing a custom backend server.

---

## 🚀 Key Features

### 1. ⚡ Client-Side Python Execution (New)
*   **No Server Required**: The app downloads a lightweight Python kernel (Pyodide) to your browser.
*   **Instant Processing**: When you accept a transformation, the code runs locally on your CPU, processing thousands of rows in milliseconds rather than waiting for an API response.
*   **Pandas Support**: Full support for the Python Pandas library for professional-grade data manipulation.

### 2. 🛠️ Natural Language ETL
*   **Transform via Chat**: Simply type *"Remove rows where Sales < 500 and format the Date column"* and watch the app write and execute the Python code for you.
*   **Review & Rollback**: Preview changes before committing them. Navigate through version history to undo mistakes.

### 3. 📊 Smart Dashboards
*   **Auto-Generation**: The AI scans your dataset and creates a bespoke dashboard with **Bar**, **Line**, **Pie**, **Radar**, and **Radial** charts.
*   **Persistent & Dynamic**: Dashboards are saved to your project. You can add new analysis layers or refresh them with a single click.

### 4. 💬 Context-Aware Chat
*   **Q&A**: Ask questions like *"Which region had the highest profit margin in Q4?"*.
*   **Transparency**: The AI explains its answer by showing you the exact Python logic it used to derive the result.

---

## 🛠️ Technology Stack

*   **Frontend**: React 18, Vite, TypeScript
*   **AI Model**: Google Gemini 2.5 Flash (via `@google/genai`)
*   **Runtime**: Pyodide (Python compiled to WebAssembly)
*   **Visualization**: Recharts
*   **Styling**: Tailwind CSS
*   **Storage**: LocalStorage / MongoDB Data API / Cloudinary

---

## 💻 Installation & Setup

### Prerequisites
*   **Node.js** (v18 or higher)
*   **Google Gemini API Key**: Get one for free at [aistudio.google.com](https://aistudio.google.com).

### 1. Clone & Install
```bash
git clone https://github.com/your-username/datanexus-ai.git
cd datanexus-ai
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:

```env
# Required for AI Features
API_KEY=your_google_gemini_api_key
```

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal).

---

## ☁️ Optional Cloud Setup (MongoDB & Cloudinary)

By default, the app works 100% offline using LocalStorage. To enable cloud sync:

1.  Launch the app and log in.
2.  Click **Settings & Keys** in the bottom-left sidebar.
3.  Toggle **"Enable Real Backend Integration"**.

### MongoDB Atlas (Database)
1.  Create a cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2.  Enable the **Data API** in Atlas Services.
3.  Enter your **API Key**, **Cluster Name**, **Database Name** (`datanexus`), and **Collection Name** (`projects`).

### Cloudinary (File Storage)
1.  Create a free [Cloudinary](https://cloudinary.com/) account.
2.  Create an **Unsigned Upload Preset** in Settings > Upload.
3.  Enter your **Cloud Name** and **Upload Preset** in the app.

---

## 📖 User Guide

### Transformation Workflow
1.  **Create Project**: Start a new project from the home screen.
2.  **Upload**: Click the Upload icon in the Transformation view.
3.  **Prompt**: Type a command like *"Group by Category and sum the Amount column"*.
4.  **Review**: The app generates Python code. Click **"Accept & Save"** to execute it locally via Pyodide.

### Dashboarding
1.  Navigate to the **Smart Dashboard** tab.
2.  The app will auto-generate an "Executive Overview".
3.  Use the "Add Analysis" button to ask the AI to find more patterns and append them to your view.

---

## License

MIT License

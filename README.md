# DataNexus AI

## Overview

DataNexus AI is an intelligent data analysis platform powered by **Google Gemini 2.5 Flash**. It bridges the gap between raw data and actionable insights by allowing users to perform complex ETL (Extract, Transform, Load) operations using natural language, chat with their datasets, and automatically generate visualization dashboards.

The application uses a **Hybrid Architecture**:
1.  **Offline Mode (Default)**: Runs entirely in the browser using LocalStorage and the FileReader API. Perfect for testing and demos.
2.  **Online Mode**: Connects to **MongoDB Atlas** (via Data API) and **Cloudinary** for persistent storage and file hosting. This can be configured directly within the app's UI without needing a separate backend server.

---

## Key Features

### 1. 🛠️ Natural Language Transformation (ETL)
*   **Upload CSVs**: Drag and drop your datasets.
*   **Speak to your Data**: Describe transformations in plain English (e.g., *"Remove rows where 'Status' is 'Cancelled' and convert the 'Date' column to YYYY-MM-DD format"*).
*   **AI-Driven Code**: The app uses Gemini to generate Python Pandas code, simulates the execution, and creates a new version of your dataset.
*   **Version Control**: Roll back to previous versions of your data at any time.

### 2. 💬 Conversational Data Assistant
*   **Context-Aware Chat**: Ask questions about your specific CSV files (e.g., *"What is the average revenue per region?"*).
*   **Code-Backed Answers**: The AI provides the answer along with the Python code logic used to derive it, ensuring transparency.

### 3. 📊 Automated Dashboards
*   **Instant Visualization**: The AI analyzes your dataset's structure and automatically generates a comprehensive dashboard.
*   **Smart Chart Selection**: Automatically chooses between Bar, Pie, Line, Radar, and Radial charts based on the data type.
*   **Categorized Views**: Filter charts by specific types or view the Executive Overview ("Main") which aggregates top insights.

---

## Getting Started

### Prerequisites
*   **Node.js** (v18 or higher)
*   **NPM** or **Yarn**
*   **Google Gemini API Key**: Get one for free at [aistudio.google.com](https://aistudio.google.com).

### Installation Steps

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/datanexus-ai.git
    cd datanexus-ai
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory:
    ```env
    # Required for the AI features to work
    API_KEY=your_google_gemini_api_key
    ```
    *(Note: If running in a web-based code sandbox, the API_KEY is often handled via the platform's secrets management)*

4.  **Run the Application**
    ```bash
    npm start
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Configuration (MongoDB & Cloudinary)

To enable persistent storage, you do not need to edit code. You can configure the backend connections directly in the App UI.

1.  Log in to the app (you can use any email/name in the mock auth).
2.  Click the **Settings & Keys** button in the bottom left of the sidebar.
3.  Check **"Enable Real Backend Integration"**.

### MongoDB Atlas Setup (Database)
1.  Create a cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2.  Create a Database: `datanexus`
3.  Create a Collection: `projects`
4.  Navigate to **Data API** in the Atlas sidebar and enable it.
5.  Copy your **API Key** and **URL Endpoint** into the DataNexus Settings dialog.

### Cloudinary Setup (File Storage)
1.  Create a free account on [Cloudinary](https://cloudinary.com/).
2.  Go to **Settings > Upload**.
3.  Add a new **Upload Preset**:
    *   **Signing Mode**: Unsigned
    *   **Name**: (e.g., `datanexus_preset`)
4.  Copy your **Cloud Name** and **Upload Preset** into the DataNexus Settings dialog.

---

## How to Use

### 1. Create a Project
From the Home Dashboard, click **New Project**. Give it a name (e.g., "Q1 Sales Analysis").

### 2. Upload Data
Enter the project. You will land on the **Transformation** tab. Click "Upload CSV" to select a file from your computer.

### 3. Transform Data
Type a request in the floating chat bar at the bottom:
> *"Filter top 10 products by sales"*
Press Enter. The table will update with the transformed data.

### 4. Analyze Data
Switch to the **Chat Assistant** tab (Sidebar). Ask:
> *"What is the trend of sales over time?"*
The bot will answer based on your uploaded CSV.

### 5. View Dashboard
Switch to the **Smart Dashboard** tab. The AI will generate charts. Use the sidebar on the left to toggle between different chart types (Bar, Pie, Line, etc.). The **Main** tab shows the top chart from every category.

---

## Technologies Used

*   **Frontend**: React 19, React Router v7, Tailwind CSS
*   **AI Model**: Google Gemini 2.5 Flash (`@google/genai` SDK)
*   **Visualization**: Recharts
*   **Storage**: LocalStorage / MongoDB Data API / Cloudinary

## License

MIT License

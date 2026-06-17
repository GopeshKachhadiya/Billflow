# BillFlow

**BillFlow** is a modern, local-first billing and GST management desktop application built specifically for Indian SMBs (Small and Medium Businesses). It is designed with a seamless "thin UI" architecture, combining the speed of a local SQLite database with the powerful automation capabilities of n8n and cloud-sync via Supabase.

---

## 🚀 Features

*   **Local-First Architecture**: Fast, offline-capable data entry utilizing a local SQLite database (`better-sqlite3`).
*   **Comprehensive GST Management**: Built-in GST calculators, HSN/SAC lookups, tax record management, and GSTR-1 export generation tailored for Indian compliance.
*   **Maximum Automation via n8n**: The application offloads all external communications, task scheduling, and remote database syncs to a locally running n8n instance.
    *   Fires webhooks for every significant event.
    *   Orchestrates 22 distinct workflows.
    *   Handles Email, WhatsApp, and SMS communications.
*   **Cloud Synchronization**: Uses Supabase to securely back up and sync tenant data, completely managed by n8n behind the scenes.
*   **Professional PDF Invoices**: Generates elegant, print-ready PDF invoices using `pdfkit`.
*   **Secure & Sandboxed**: Built on Electron with robust Content Security Policies (CSP) and secure IPC messaging.

## 🏗 Architecture

BillFlow employs a unique decoupled architecture for maximum reliability and extensibility:

1.  **Frontend (Electron Renderer)**: A vanilla HTML/CSS/JS single-page application focused solely on user interactions, data entry, and local UI state.
2.  **Backend (Electron Main)**: Handles secure local SQLite operations, PDF generation, and fires HTTP Webhooks to the automation engine.
3.  **Automation Engine (n8n)**: Runs on port `5678`, listens to webhooks from the Electron app, and executes workflows for sending emails, syncing data to Supabase, and triggering scheduled jobs.
4.  **Cloud Storage (Supabase)**: Acts as the central cloud repository ensuring data is securely backed up and enabling multi-device sync.

## 🛠 Tech Stack

*   **Desktop Framework**: [Electron](https://www.electronjs.org/) (v30)
*   **Local Database**: [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
*   **Cloud Database**: [Supabase](https://supabase.com/) (PostgreSQL)
*   **Automation**: [n8n](https://n8n.io/)
*   **PDF Generation**: [PDFKit](https://pdfkit.org/)
*   **Styling**: Custom CSS with modern UI tokens (Glassmorphism, Inter font).

## ⚙️ Installation & Setup

### Prerequisites
*   Node.js (v20 or higher)
*   Git

### Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/GopeshKachhadiya/Billflow.git
    cd Billflow
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Run in Development Mode:**
    ```bash
    npm run dev
    ```

4.  **Build for Production:**
    ```bash
    npm run build:modern
    ```

## 📂 Project Structure

```text
├── src/
│   ├── main.js                 # Electron main process & IPC handlers
│   ├── preload.js              # Secure bridge between main and renderer
│   ├── db/                     # SQLite connection, queries, and migrations
│   ├── gst/                    # GST calculation logic and validators
│   ├── n8n/                    # Webhook dispatchers for automation
│   ├── pdf/                    # PDFKit invoice generation
│   ├── renderer/               # Frontend HTML, CSS, and JS files
│   └── supabase/               # Supabase auth and client logic
├── scripts/                    # Automation and utility scripts
├── package.json                # Project dependencies and scripts
└── supabase_schema.sql         # Supabase PostgreSQL schema definition
```

## 🔒 Security

*   **Row Level Security (RLS)**: Data isolated on Supabase with strict PostgreSQL RLS policies to ensure tenant isolation.
*   **Local Encryption**: Key operations securely manage local database encryption and secure storage of sensitive keys.
*   **Strict CSP**: The Electron app enforces strict Content-Security-Policy rules to prevent XSS and unsafe code execution.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📝 License

This project is proprietary and confidential. Unauthorized copying of files, via any medium, is strictly prohibited.
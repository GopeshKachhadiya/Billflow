# BillFlow Docker Environment Setup Guide

This guide provides instructions on how to build, run, and interact with the **BillFlow** services (n8n automation engine, admin panel, and consumer desktop client) in a Dockerized environment.

---

## 🛠️ Overview of Services

The Docker Compose configuration orchestrates three main services:

| Service | Port | Description |
|---------|------|-------------|
| **n8n** | `5678` | The automation and workflow backend. |
| **billadmin** | `5173` | React/Vite-based Administrator Dashboard. |
| **consumer** | `8080` | Electron Desktop application running in a GUI container accessible via your web browser (noVNC). |

---

## 🚀 How to Run the Project

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- [Docker Compose](https://docs.docker.com/compose/install/) (comes bundled with Docker Desktop).

### Step 1: Clone and Set Up Configuration (Optional)
If you have Supabase API credentials, create a `.env` file in the `billadmin` directory or pass them directly when building.
If they are not provided, the Admin panel will automatically fall back to **LocalStorage Sandbox Mode** with pre-seeded mock data for testing.

### Step 2: Build and Launch Services
Open a terminal in the root project folder (`e:\automation`) and run:

```bash
docker-compose up --build -d
```

This command will:
1. Build the Admin React app.
2. Build the Consumer Electron app (installing Debian Chromium/GUI libraries and compiling the `better-sqlite3` native bindings for Linux).
3. Pull and configure the `n8n` image.
4. Launch all containers in detached mode.

### Step 3: Access the Dashboards

Once all containers are running, open your web browser to access the following endpoints:

#### 1. Consumer Desktop Application (via Browser VNC)
- **URL**: [http://localhost:8080](http://localhost:8080)
- **VNC URL**: [http://localhost:8080/vnc.html](http://localhost:8080/vnc.html) (if the redirect doesn't trigger automatically)
- **Description**: Interact with the BillFlow desktop client GUI directly inside your web browser. Type, click, configure settings, and generate GST billing invoices.

#### 2. Admin Dashboard
- **URL**: [http://localhost:5173](http://localhost:5173)
- **Description**: Access the SaaS Owner panel to manage trials, billing status, onboarding users, and viewing consolidated analytics.

#### 3. n8n Automation Engine
- **URL**: [http://localhost:5678](http://localhost:5678)
- **Description**: Open the workflow automation editor to import workflows or configure webhooks. Follow the import guide inside the `n8n-workflows/` directory.

---

## 💾 Persistence & Storage

- **Local SQLite DB (`data.db`)**: Stored under `/root/.config/billflow` inside the consumer container. It is persisted locally on your host machine using the `consumer_config` volume. Your database is safe across container recreations.
- **n8n Workflows & Configuration**: Stored inside the `n8n_data` volume.

---

## 🛑 How to Stop Services

To stop and remove the active containers without deleting persistent database volumes, run:

```bash
docker-compose down
```

If you want to clear the database and start fresh, run:
```bash
docker-compose down -v
```

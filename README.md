# 🌍 Geo JSON Manager – Frontend

This is the React frontend for the **Geo JSON Service**, a part of the **MapX** project. It allows users to upload, view, update, and delete historical empire data in GeoJSON format, which is rendered and managed through a timeline-based map UI.

---

## 🚀 Features

- 📤 Upload GeoJSON files of historical empires
- 📋 List all empires with name and timeline info
- ✏️ Edit empire details
- ❌ Delete an empire

---

## 📦 Getting Started

### 🔁 1. Clone the repository

git clone https://gitea.com/kvarun007/geo-json-manager-forntend.git
cd mapx-frontend

### 📁 2. Install dependencies

npm install

Or if you’re using **Yarn**:

yarn install

---

## 🧪 Running Locally

npm run dev

Open http://localhost:5173 in your browser.

> The app uses **Vite** as the bundler (fast dev server).

---

## 🌐 Changing the API Base URL

This project connects to a Express or similar backend server.

By default, the frontend points to:

http://localhost:5000

To change this (e.g., if your backend is deployed somewhere else):

### 🔧 Edit the base URL

Open the file:  
mapx-frontend/.env

Update the BASE_URL variable like this:

export const BASE_URL = "http://localhost:5000"; // 🔁 Replace this

Then save and restart the frontend server.

# StreetPulse 🚦
### Edge-Vision Municipal Fleet Infrastructure Scanner

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://streetpulse-dashboard.vercel.app/)
[![GitHub Pages](https://img.shields.io/badge/Mirror-GitHub%20Pages-24292e?style=for-the-badge&logo=github)](https://notpiyushc.github.io/StreetPulse/)
[![Status](https://img.shields.io/badge/System-Operational-00ff88?style=for-the-badge)](https://streetpulse-dashboard.vercel.app/)

> 🌐 **Official Live Dashboard:** [https://streetpulse-dashboard.vercel.app/](https://streetpulse-dashboard.vercel.app/)  
> 🔗 **GitHub Pages Mirror:** [https://notpiyushc.github.io/StreetPulse/](https://notpiyushc.github.io/StreetPulse/)

---

## 🌟 The Concept
**StreetPulse** transforms municipal vehicle fleets (garbage trucks, transit buses, public utility vehicles) into a real-time smart city infrastructure scanning network.

- **Low-Cost Edge Hardware:** Edge-AI compute (e.g. Raspberry Pi + Coral Edge TPU) mounted behind windshields.
- **On-Device Computer Vision:** Detects potholes, missing/damaged traffic signs, overflowing bins, and waterlogging in real-time.
- **Bandwidth-Efficient:** Instead of streaming heavy HD video, only lightweight telemetry metadata (coordinates, severity score, image chips, classification) is sent to city operations.
- **Interactive City Command Center:** A live dashboard for city municipal commissioners and maintenance teams to monitor, prioritize, and dispatch repair crews across Pune, Maharashtra.

---

## ✨ Features
- 🗺️ **High-Performance Vector Canvas Map:** Real-time Baner–Aundh Loop simulation, live GPS tracking of `FLEET-042` and `FLEET-019`, radar sweep, and color-coded hazard markers.
- 📹 **Dashcam Simulation:** Real-time HUD view with bounding box detections, edge confidence metrics, and dynamic road anomaly alerts.
- 📋 **Live Infrastructure Feed:** Sortable, filterable incident queue across Pune wards (Baner, Aundh, Shivaji Nagar, Kothrud, Hadapsar).
- 🚨 **Priority Zones & Heatmap:** Severity distribution analysis and ward-level repair priority ranking.
- 🚚 **Dispatch & Ticket Management:** Interactive crew assignment modal with ETA and team routing.
- 🌓 **Day / Night Operations Mode:** Adaptive cyber-neon dark mode and clean tactical light mode.
- 💾 **Data Export:** Instant JSON export for integration with municipal GIS and ERP databases.

---

## 🚀 Quick Start (Local Setup)
This is a zero-dependency, pure web application:
```bash
# Clone the repository
git clone https://github.com/NotPiyushC/StreetPulse.git

# Navigate to the folder
cd StreetPulse

# Run with any local HTTP server, e.g.:
python -m http.server 3000
# or
npx serve
```
Open your browser at `http://localhost:3000`.

---

## 🌐 Live Deployments
- **Primary (Vercel):** [https://streetpulse-dashboard.vercel.app/](https://streetpulse-dashboard.vercel.app/)
- **Secondary (GitHub Pages):** [https://notpiyushc.github.io/StreetPulse/](https://notpiyushc.github.io/StreetPulse/)

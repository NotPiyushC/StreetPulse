# StreetPulse 🚦
### Edge-Vision Municipal Fleet Infrastructure Scanner

> **GitHub Pages Live Demo:** [https://notpiyushc.github.io/StreetPulse/](https://notpiyushc.github.io/StreetPulse/)  
> **Vercel Deploy:** [Deploy with Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FNotPiyushC%2FStreetPulse)

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

## 🌐 Permanent Deployment (GitHub Pages)
1. Fork or push this repository to your GitHub account.
2. Navigate to **Settings** > **Pages**.
3. Under **Source**, choose **Deploy from a branch**.
4. Select `main` branch and `/ (root)` folder, then click **Save**.
5. Your live app will be published at `https://<username>.github.io/StreetPulse/`.

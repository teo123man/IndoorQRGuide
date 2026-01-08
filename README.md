# QR Indoor Navigation Assistant

This project is a HCI prototype that helps students and visitors find offices on one floor of the FASS building in Sabanci University using:

- their own **phone**
- a **browser-based web app**
- **printed QR codes** taped to the walls

The user selects a destination, then walks and scans QR codes on the corridor.  
Each QR encodes a node ID (N1–N13). The app computes the shortest path and shows only the next step with:

- a big arrow  
- a short text instruction  
- an animated character (with optional voice lines)

---

## Repository layout

```text
.
├── WebApp/                 # Main web application (React-based)
├── index.html              # Simple static prototype / landing page
├── RealTimeQR_Detector.py  # Early Python + OpenCV QR prototype
├── make_all_qrs.py         # Python script to generate QR images
└── CS449_Milestone_...pdf  # Milestone report (for reference)

```

---

## Repository layout
This is the version we use with phones in the corridor.

## Clone the repo
```text
git clone https://github.com/Namoet3/indoornav.git
cd indoornav

# Go into the web app folder
cd WebApp

# Install Node dependencies
npm install        # or: yarn

# Start development server
npm run dev        # or: npm start / yarn dev (depending on package.json)

```

The terminal will show a local URL, for example:

```text
http://localhost:5173 or http://localhost:3000
```

Open this URL in your browser.

To test on a phone, make sure the phone and your laptop are on the same Wi-Fi network and open the LAN URL (e.g. http://192.168.x.x:5173) in the phone browser.
Allow camera access when the browser asks.


## 2. Generating QR Codes

```text
make_all_qrs.py creates QR code images for all node IDs (N1–N13).

cd indoornav
```

## (optional) create a virtual environment

```text

python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate


## Install dependency
pip install "qrcode[pil]"

## Run the script
python make_all_qrs.py

```

This will create a folder like qr_codes/ with:

qr_N1.png, qr_N2.png, …, qr_N13.png

Print these PNG files and tape them to the walls according to your floor plan.

## 3. Desktop QR Prototype (optional)

RealTimeQR_Detector.py is an earlier prototype that runs on a laptop with a webcam using OpenCV.

```text

cd indoornav

(reuse the same venv or create a new one)
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

pip install opencv-python pyzbar numpy

python RealTimeQR_Detector.py

```


A window will open showing the webcam feed and drawing rectangles around detected QR codes.

## Notes

The main user-facing system is the WebApp folder (browser-based mobile UI).

Python scripts are only for generating QR images and for the earlier desktop demo.

---

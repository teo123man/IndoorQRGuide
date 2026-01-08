import qrcode
import os

OUTPUT_DIR = "qr_codes"

node_ids = ["N6", "N7", "N8", "N9", "N10", "N11", "N12", "N13"]

os.makedirs(OUTPUT_DIR, exist_ok=True)

for node_id in node_ids:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(node_id)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    filename = os.path.join(OUTPUT_DIR, f"qr_{node_id}.png")
    img.save(filename)
    print(f"Saved {filename}")

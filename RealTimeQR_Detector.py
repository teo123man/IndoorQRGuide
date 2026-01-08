import cv2
import numpy as np
from pyzbar.pyzbar import decode
from collections import deque


DESTINATION_ROOM = "CLASS101"


NODES = {
    "N1": {"room": None},           
    "N2": {"room": None},          
    "N3": {"room": "CLASS101"},     
    "N4": {"room": "CLASS102"},     
}


EDGES = {
    "N1": [("N2", "forward")],
    "N2": [("N1", "back"), ("N3", "right"), ("N4", "left")],
    "N3": [("N2", "back")],
    "N4": [("N2", "back")],
}



class QRNavigator:
    """
    Indoor navigation using QR markers as location nodes.
    - Each QR encodes a node ID, e.g. "N1", "N2".
    - We know which node contains the destination room.
    - Each time we see a QR, we:
        - Update current node
        - Compute path to destination
        - Show arrow + instruction text for the NEXT step
    """

    def __init__(self, destination_room: str):
        self.destination_room = destination_room
        self.current_node = None
        self.next_direction = None  
        self.status_msg = "Scan a QR marker to start."
        self.last_qr_data = None

        self.destination_node = self._find_destination_node()
        if self.destination_node is None:
            print(f"[ERROR] No node has room = {self.destination_room}. "
                  f"Check NODES configuration.")

    def _find_destination_node(self):
        for node_id, info in NODES.items():
            if info.get("room") == self.destination_room:
                return node_id
        return None

    def _bfs_path(self, start, goal):
        """
        Breadth-first search for a path from start to goal (by node IDs).
        Returns a list [start, ..., goal]. If no path, returns [start].
        """
        if start == goal:
            return [start]

        queue = deque([start])
        prev = {start: None}

        while queue:
            node = queue.popleft()
            if node == goal:
                break

            for neighbor, _direction in EDGES.get(node, []):
                if neighbor not in prev:
                    prev[neighbor] = node
                    queue.append(neighbor)

        if goal not in prev:
            return [start]

        path = []
        n = goal
        while n is not None:
            path.append(n)
            n = prev[n]
        path.reverse()
        return path

    def handle_qr_data(self, qr_data: str):
        """
        Called whenever a QR is detected.
        qr_data should be a node ID (e.g. "N1").
        """
        
        if qr_data == self.last_qr_data:
            return
        self.last_qr_data = qr_data

        if qr_data not in NODES:
            self.status_msg = f"Unknown marker: {qr_data}"
            self.next_direction = None
            print(f"[WARN] QR data '{qr_data}' not found in NODES.")
            return

        self.current_node = qr_data
        print(f"[INFO] Current node: {self.current_node}")

        if self.destination_node is None:
            self.status_msg = "Destination room not configured."
            self.next_direction = None
            return


        if self.current_node == self.destination_node:
            self.status_msg = f"You have arrived at {self.destination_room}."
            self.next_direction = "done"
            print("[INFO] Arrived at destination.")
            return

        path = self._bfs_path(self.current_node, self.destination_node)
        print(f"[DEBUG] Path from {self.current_node} to {self.destination_node}: {path}")

        if len(path) < 2:
            self.status_msg = "No path found from here."
            self.next_direction = None
            print("[ERROR] No path found.")
            return


        next_node = path[1]

        direction = None
        for neighbor, d in EDGES.get(self.current_node, []):
            if neighbor == next_node:
                direction = d
                break

        if direction is None:
            self.status_msg = "No direction info for the next step."
            self.next_direction = None
            print("[ERROR] Direction not found in EDGES.")
            return

        self.next_direction = direction

 
        if direction == "forward":
            self.status_msg = "Walk straight until you see the next QR marker."
        elif direction == "left":
            self.status_msg = "Turn left at the next junction and look for a QR marker."
        elif direction == "right":
            self.status_msg = "Turn right at the next junction and look for a QR marker."
        elif direction == "back":
            self.status_msg = "Turn back and walk towards the previous QR marker."
        else:
            self.status_msg = "Follow the direction shown."

        print(f"[INFO] Next direction: {self.next_direction} | {self.status_msg}")

    def draw_navigation_overlay(self, frame):
        """
        Draw arrow + status text on top of the camera frame.
        """
        h, w, _ = frame.shape

        if self.status_msg:
            cv2.rectangle(frame, (0, 0), (w, 40), (0, 0, 0), -1)
            cv2.putText(
                frame,
                self.status_msg,
                (10, 25),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (255, 255, 255),
                2,
                cv2.LINE_AA
            )

        arrow_text = None
        color = (0, 255, 0)

        if self.next_direction == "forward":
            arrow_text = "↑"
        elif self.next_direction == "left":
            arrow_text = "←"
        elif self.next_direction == "right":
            arrow_text = "→"
        elif self.next_direction == "back":
            arrow_text = "↓"
        elif self.next_direction == "done":
            arrow_text = "✓"

        if arrow_text is not None:
            font_scale = 3.0
            thickness = 5
            text_size, _ = cv2.getTextSize(arrow_text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)
            text_w, text_h = text_size
            x = int((w - text_w) / 2)
            y = int(h * 0.65)

            cv2.putText(
                frame,
                arrow_text,
                (x, y),
                cv2.FONT_HERSHEY_SIMPLEX,
                font_scale,
                color,
                thickness,
                cv2.LINE_AA
            )


class QRCodeDetector:
    def __init__(self, navigator: QRNavigator):
        self.navigator = navigator

    def detect_qr_codes(self, frame):
        gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        qr_codes = decode(gray_frame)
        return qr_codes

    def process_qr_codes(self, qr_codes):
        if qr_codes:
            for qr_code in qr_codes:
                qr_data = qr_code.data.decode('utf-8')
                print("QR Code Data:", qr_data)
                self.navigator.handle_qr_data(qr_data)

    def draw_qr_code_rectangles(self, frame, qr_codes):
        if qr_codes:
            for qr_code in qr_codes:
                points = qr_code.polygon
                pts = np.array([(p.x, p.y) for p in points], dtype=np.int32)
                pts = pts.reshape((-1, 1, 2))
                cv2.polylines(frame, [pts], True, (255, 0, 255), 3)

    def run(self):
        cap = cv2.VideoCapture(0)

        if not cap.isOpened():
            print("[ERROR] Cannot open webcam.")
            return

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            qr_codes = self.detect_qr_codes(frame)
            self.process_qr_codes(qr_codes)
            self.draw_qr_code_rectangles(frame, qr_codes)

            # Draw navigation overlay
            self.navigator.draw_navigation_overlay(frame)

            cv2.imshow("QR Indoor Navigation Prototype", frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    navigator = QRNavigator(destination_room=DESTINATION_ROOM)
    qr_detector = QRCodeDetector(navigator)
    qr_detector.run()

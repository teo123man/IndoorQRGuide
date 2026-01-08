// Navigation graph and BFS logic

const STEPS_PER_EDGE = 20;

export const NODES: Record<string, { room: string | null }> = {
  N1: { room: "Main Stairs" },
  N2: { room: null },
  N3: { room: null },
  N4: { room: "Dean's Office - 2053" },
  N5: { room: null },
  N6: { room: null },
  N7: { room: null },
  N8: { room: "Alpay Filiztekin - 2001" },
  N9: { room: null },
  N10: { room: null },
  N11: { room: null },
  N12: { room: null },
  N13: { room: "Mehmet Kuru - 2143" },
};

export const EDGES: Record<string, [string, string][]> = {
  N1: [["N2", "left"]],
  N2: [
    ["N1", "back"],
    ["N3", "right"],
    ["N5", "left"],
  ],
  N3: [
    ["N2", "back"],
    ["N4", "left"],
  ],
  N4: [["N3", "back"]],
  N5: [
    ["N2", "back"],
    ["N6", "forward"],
  ],
  N6: [
    ["N5", "back"],
    ["N7", "right"],
    ["N10", "left"],
  ],
  N7: [["N6", "back"]],
  N8: [
    ["N7", "back"],
    ["N9", "left"],
  ],
  N9: [
    ["N8", "back"],
    ["N10", "left"],
  ],
  N10: [
    ["N9", "back"],
    ["N11", "right"],
    ["N6", "left"],
  ],
  N11: [
    ["N10", "back"],
    ["N12", "forward"],
  ],
  N12: [
    ["N11", "back"],
    ["N13", "right"],
  ],
  N13: [["N12", "back"]],
};

export const DESTINATIONS = Object.entries(NODES)
  .filter(([_, info]) => info.room !== null)
  .map(([_, info]) => info.room as string);

export type Direction = "forward" | "left" | "right" | "back" | "done" | null;

export type ScanResult = "direction" | "arrival" | "unknown_marker" | "no_change" | null;

export interface NavigatorState {
  destinationRoom: string;
  currentNode: string | null;
  startNode: string | null;
  nextDirection: Direction;
  stepsRemaining: number | null;
  statusMsg: string;
  lastScanResult: ScanResult;
}

export class Navigator {
  destinationRoom: string;
  destinationNode: string | null;
  currentNode: string | null = null;
  startNode: string | null = null;
  lastQrData: string | null = null;
  nextDirection: Direction = null;
  stepsRemaining: number | null = null;
  statusMsg: string = "Scan a QR marker to start.";
  lastScanResult: ScanResult = null;

  constructor(defaultRoom: string) {
    this.destinationRoom = defaultRoom;
    this.destinationNode = this.findDestinationNode();
  }

  private findDestinationNode(): string | null {
    for (const [id, info] of Object.entries(NODES)) {
      if (info.room === this.destinationRoom) return id;
    }
    return null;
  }

  setDestinationRoom(room: string): void {
    this.destinationRoom = room;
    this.destinationNode = this.findDestinationNode();
    if (!this.destinationNode) {
      this.statusMsg = `Destination ${room} not configured.`;
    } else {
      this.statusMsg = `Destination set to ${room}. Scan a QR to start.`;
    }
  }

  private bfsPath(start: string, goal: string): string[] {
    if (start === goal) return [start];
    const queue: string[] = [start];
    const prev: Record<string, string | null> = { [start]: null };

    while (queue.length > 0) {
      const node = queue.shift()!;
      if (node === goal) break;
      const neighbors = EDGES[node] || [];
      for (const [neighbor] of neighbors) {
        if (!(neighbor in prev)) {
          prev[neighbor] = node;
          queue.push(neighbor);
        }
      }
    }

    if (!(goal in prev)) return [start];

    const path: string[] = [];
    let n: string | null = goal;
    while (n !== null) {
      path.push(n);
      n = prev[n];
    }
    path.reverse();
    return path;
  }

  handleQr(qrData: string): void {
    if (qrData === this.lastQrData) {
      this.lastScanResult = "no_change";
      return;
    }
    this.lastQrData = qrData;

    if (!NODES[qrData]) {
      this.statusMsg = `Unknown marker: ${qrData}`;
      this.nextDirection = null;
      this.stepsRemaining = null;
      this.lastScanResult = "unknown_marker";
      return;
    }

    this.currentNode = qrData;
    if (!this.startNode) this.startNode = qrData;

    if (!this.destinationNode) {
      this.statusMsg = "Destination room not configured.";
      this.nextDirection = null;
      this.stepsRemaining = null;
      this.lastScanResult = null;
      return;
    }

    // Already at destination
    if (this.currentNode === this.destinationNode) {
      this.statusMsg = `You have arrived at ${this.destinationRoom}.`;
      this.nextDirection = "done";
      this.stepsRemaining = 0;
      this.lastScanResult = "arrival";
      return;
    }

    const path = this.bfsPath(this.currentNode, this.destinationNode);
    if (path.length < 2) {
      this.statusMsg = "No path found from here.";
      this.nextDirection = null;
      this.stepsRemaining = null;
      this.lastScanResult = null;
      return;
    }

    const edgesLeft = Math.max(0, path.length - 1);
    this.stepsRemaining = edgesLeft * STEPS_PER_EDGE;

    const nextNode = path[1];
    let direction: Direction = null;
    const neighbors = EDGES[this.currentNode] || [];
    for (const [neighbor, d] of neighbors) {
      if (neighbor === nextNode) {
        direction = d as Direction;
        break;
      }
    }
    if (!direction) {
      this.statusMsg = "No direction info for the next step.";
      this.nextDirection = null;
      this.lastScanResult = null;
      return;
    }
    this.nextDirection = direction;

    let baseMsg: string;
    switch (direction) {
      case "forward":
        baseMsg = "Walk straight until you see the next QR marker.";
        break;
      case "left":
        baseMsg = "Turn left at the next junction and look for a QR marker.";
        break;
      case "right":
        baseMsg = "Turn right at the next junction and look for a QR marker.";
        break;
      case "back":
        baseMsg = "Turn back towards the previous QR marker.";
        break;
      default:
        baseMsg = "Follow the direction shown.";
    }

    if (this.stepsRemaining != null) {
      this.statusMsg = `${baseMsg} (~${this.stepsRemaining} steps remaining)`;
    } else {
      this.statusMsg = baseMsg;
    }
    this.lastScanResult = "direction";
  }

  getState(): NavigatorState {
    return {
      destinationRoom: this.destinationRoom,
      currentNode: this.currentNode,
      startNode: this.startNode,
      nextDirection: this.nextDirection,
      stepsRemaining: this.stepsRemaining,
      statusMsg: this.statusMsg,
      lastScanResult: this.lastScanResult,
    };
  }
}

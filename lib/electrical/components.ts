// Basic circuit components library for Excalidraw
export type CircuitComponent = {
  type: string;
  version: number;
  elements: Array<{
    type: string;
    version: number;
    x: number;
    y: number;
    width: number;
    height: number;
    strokeColor: string;
    backgroundColor: string;
    fillStyle: string;
    strokeWidth: number;
    roughness: number;
    points?: number[][];
  }>;
};

export const circuitComponents: Record<string, CircuitComponent> = {
  // Logic Gates
  AND: {
    type: "excalidraw",
    version: 2,
    elements: [
      {
        type: "line",
        version: 2,
        x: 0,
        y: 0,
        width: 30,
        height: 40,
        strokeColor: "#000000",
        backgroundColor: "transparent",
        fillStyle: "hachure",
        strokeWidth: 2,
        roughness: 0,
        points: [
          [0, 0],
          [0, 40],
          [20, 40],
          [30, 20],
          [20, 0],
          [0, 0]
        ]
      }
    ]
  },
  OR: {
    type: "excalidraw",
    version: 2,
    elements: [
      {
        type: "line",
        version: 2,
        x: 0,
        y: 0,
        width: 40,
        height: 40,
        strokeColor: "#000000",
        backgroundColor: "transparent",
        fillStyle: "hachure",
        strokeWidth: 2,
        roughness: 0,
        points: [
          [0, 0],
          [10, 0],
          [35, 20],
          [10, 40],
          [0, 40],
          [20, 20],
          [0, 0]
        ]
      }
    ]
  },
  NOT: {
    type: "excalidraw",
    version: 2,
    elements: [
      {
        type: "line",
        version: 2,
        x: 0,
        y: 0,
        width: 30,
        height: 30,
        strokeColor: "#000000",
        backgroundColor: "transparent",
        fillStyle: "hachure",
        strokeWidth: 2,
        roughness: 0,
        points: [
          [0, 0],
          [25, 15],
          [0, 30],
          [0, 0]
        ]
      },
      {
        type: "ellipse",
        version: 2,
        x: 25,
        y: 12,
        width: 6,
        height: 6,
        strokeColor: "#000000",
        backgroundColor: "transparent",
        fillStyle: "hachure",
        strokeWidth: 2,
        roughness: 0
      }
    ]
  },
  // Connection elements
  WIRE: {
    type: "excalidraw",
    version: 2,
    elements: [
      {
        type: "line",
        version: 2,
        x: 0,
        y: 0,
        width: 40,
        height: 0,
        strokeColor: "#000000",
        backgroundColor: "transparent",
        fillStyle: "hachure",
        strokeWidth: 2,
        roughness: 0,
        points: [
          [0, 0],
          [40, 0]
        ]
      }
    ]
  },
  CONNECTION_DOT: {
    type: "excalidraw",
    version: 2,
    elements: [
      {
        type: "ellipse",
        version: 2,
        x: 0,
        y: 0,
        width: 8,
        height: 8,
        strokeColor: "#000000",
        backgroundColor: "#000000",
        fillStyle: "solid",
        strokeWidth: 2,
        roughness: 0
      }
    ]
  }
}
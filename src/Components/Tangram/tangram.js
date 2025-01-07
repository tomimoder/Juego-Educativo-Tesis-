export const generateTangramShapes = (tL) => {
    const shapes = [
      {
        id: 1,
        type: 'large-triangle',
        centroid: [-2 / 3 * tL, -2 / 3 * tL],
        orientation: 180,
        vertices: [
          [0, 0],
          [-1.96 * tL, 0],
          [-1.97 * tL, -0.03 * tL],
          [-0.03 * tL, -1.97 * tL],
          [0, -1.96 * tL],
        ],
        area: (2 * tL) ** 2 / 2,
      },
      {
        id: 2,
        type: 'large-triangle',
        centroid: [2 / 3 * tL, -2 / 3 * tL],
        orientation: -90,
        vertices: [
          [0, 0],
          [0, -1.96 * tL],
          [0.03 * tL, -1.97 * tL],
          [1.97 * tL, -0.03 * tL],
          [1.96 * tL, 0],
        ],
        area: (2 * tL) ** 2 / 2,
      },
      {
        id: 3,
        type: 'parallelogram',
        centroid: [-1 * tL, 0.5 * tL],
        orientation: 0,
        flipped: false,
        vertices: [
          [-1 * tL, 0],
          [-0.03 * tL, 0.97 * tL],
          [-0.04 * tL, 1 * tL],
          [-1 * tL, 1 * tL],
          [-1.97 * tL, 0.03 * tL],
          [-1.96 * tL, 0],
        ],
        area: tL ** 2,
      },
      {
        id: 4,
        type: 'square',
        centroid: [0.5 * tL, 0.5 * tL],
        orientation: 0,
        vertices: [
          [0, 0],
          [1 * tL, 0],
          [1 * tL, 1 * tL],
          [0, 1 * tL],
        ],
        area: tL ** 2,
      },
      {
        id: 5,
        type: 'medium-triangle',
        centroid: [0, 4 / 3 * tL],
        orientation: -135,
        vertices: [
          [0.96 * tL, 1 * tL],
          [0.97 * tL, 1.03 * tL],
          [0, 2 * tL],
          [-0.97 * tL, 1.03 * tL],
          [-0.96 * tL, 1 * tL],
        ],
        area: tL ** 2,
      },
      {
        id: 6,
        type: 'small-triangle',
        centroid: [-1 / 3 * tL, 1 / 3 * tL],
        orientation: 90,
        vertices: [
          [0, 0],
          [0, 0.96 * tL],
          [-0.03 * tL, 0.97 * tL],
          [-0.97 * tL, 0.03 * tL],
          [-0.96 * tL, 0],
        ],
        area: tL ** 2 / 2,
      },
      {
        id: 7,
        type: 'small-triangle',
        centroid: [4 / 3 * tL, 1 / 3 * tL],
        orientation: 0,
        vertices: [
          [1 * tL, 0],
          [1.96 * tL, 0],
          [1.97 * tL, 0.03 * tL],
          [1.03 * tL, 0.97 * tL],
          [1 * tL, 0.96 * tL],
        ],
        area: tL ** 2 / 2,
      },
    ];
  
    // Offset and fine adjustment
    const offset = [2 * tL, 2 * tL];
    const fineAdjust = 0.04 * tL;
    const moveAdjustments = [
      [-fineAdjust, -fineAdjust],
      [fineAdjust, -fineAdjust],
      [-3 * fineAdjust, fineAdjust],
      [fineAdjust, fineAdjust],
      [0, 3 * fineAdjust],
      [-fineAdjust, fineAdjust],
      [3 * fineAdjust, fineAdjust],
    ];
  
    shapes.forEach((shape, idx) => {
      shape.vertices = shape.vertices.map(([x, y]) => [x + offset[0] + moveAdjustments[idx][0], y + offset[1] + moveAdjustments[idx][1]]);
      shape.centroid = shape.centroid.map((coord, i) => coord + offset[i] + moveAdjustments[idx][i]);
    });
  
    return shapes;
  };
  
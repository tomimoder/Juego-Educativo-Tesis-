import React from 'react';

const TangramPreview = ({ solutionData = [] }) => {
  const getPieceShape = (shape) => {
    switch (shape) {
      case 'large-triangle':
        return 'polygon(0 0, 200px 0, 100px 100px)';
      case 'medium-triangle':
        return 'polygon(0 0, 100px 0, 50px 50px)';
      case 'small-triangle':
        return 'polygon(0 0, 50px 0, 25px 25px)';
      case 'diamond':
        return 'polygon(0 50px, 50px 0, 100px 50px, 50px 100px)';
      case 'parallelogram':
        return 'polygon(0 10px, 50px 10px, 75px 50px, 50px 50px, 0 50px, 25px 50px)';
      default:
        return '';
    }
  };

  const getBaseSize = (shape) => {
    const base = {
      'large-triangle': { w: 200, h: 100 },
      'medium-triangle': { w: 150, h: 150 },
      'small-triangle': { w: 100, h: 100 },
      'diamond': { w: 100, h: 100 },
      'parallelogram': { w: 150, h: 100 }
    };
    return base[shape] || { w: 50, h: 50 };
  };

  const getPieceColor = (shape) => {
    const colors = {
      'large-triangle': 'red',
      'medium-triangle': 'green',
      'small-triangle': 'purple',
      'diamond': 'gray',
      'parallelogram': 'blue'
    };
    return colors[shape] || 'gray';
  };

  return (
    <div
      style={{
        width: '1316px',
        height: '1250px',
        backgroundColor: '#f0f0f0',
        border: '1px solid #ccc',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
      }}
    >
      <div style={{ position: 'relative', transform: 'translate(20px, 0)' }}>
        {solutionData.map((piece, index) => {
          if (!piece.coordenadas?.[0]) return null;

          const { x, y } = piece.coordenadas[0];
          const { w, h } = getBaseSize(piece.shape);

          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                width: `${w}px`,
                height: `${h}px`,
                backgroundColor: getPieceColor(piece.shape),
                transform: `rotate(${piece.orientacion || 0}deg)`,
                transformOrigin: '50% 50%',
                clipPath: getPieceShape(piece.shape),
                pointerEvents: 'none'
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default TangramPreview;
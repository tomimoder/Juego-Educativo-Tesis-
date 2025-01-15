import React, { useEffect, useState } from 'react';

const PredefinedPieces = ({ predefinedPieces, onPiecesRendered }) => {
  const [renderedPieces, setRenderedPieces] = useState([]);

  useEffect(() => {
    if (predefinedPieces.length > 0) {
      const piecesWithCoordinates = predefinedPieces.map((piece, index) => {
        // Calcular coordenadas de ejemplo para las piezas predefinidas
        // Distribuirlas en el tablero con un patrón predefinido
        const xOffset = 100 * (index % 2) + 50; // Ejemplo de distribución horizontal
        const yOffset = 100 * Math.floor(index / 2) + 50; // Ejemplo de distribución vertical

        return {
          ...piece,
          coordinates: {
            x: xOffset,
            y: yOffset,
          },
        };
      });

      setRenderedPieces(piecesWithCoordinates);
      onPiecesRendered(piecesWithCoordinates);
    }
  }, [predefinedPieces, onPiecesRendered]);

  return (
    <div>
      {renderedPieces.map((piece, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: `${piece.coordinates.x}px`,
            top: `${piece.coordinates.y}px`,
            width: '50px', // Ancho de ejemplo
            height: '50px', // Altura de ejemplo
            backgroundColor: 'rgba(0, 0, 255, 0.5)', // Color para identificar
          }}
        >
          P{index + 1}
        </div>
      ))}
    </div>
  );
};

export default PredefinedPieces;

import React, { useState } from 'react';
import Draggable from 'react-draggable';

const TangramPiece = ({ shape, initialPosition, id, onDragStop, rotation = 0, bloqueada,  draggable = true, assignedToMe = false, playerName = '', nivelActual, boardRef      }) => {
    let svgPath;
    let fillColor;
    let centerPoint;

    // Definir formas y colores según el tipo de figura
    switch (shape) {
       // Triángulos grandes (naranja y verde agua)
        case 'large-triangle':
            svgPath = "M 0 0 L 140 0 L 70 70 Z"; // Lado: 140px
            fillColor = "#FFA500"; // Naranja
            centerPoint = "70,23.33";
            break;

        // Segundo triángulo grande (verde agua)
        case 'large-triangle2':
            svgPath = "M 0 0 L 140 0 L 70 70 Z";
            fillColor = "#7FFFD4"; // Verde agua
            centerPoint = "70,23.33";
            break;

        // Triángulo mediano (amarillo)
        case 'medium-triangle':
            svgPath = "M 0 0 L 100 0 L 50 50 Z"; // Lado: 100px
            fillColor = "#FFD700"; // Amarillo
            centerPoint = "50,16.67";
            break;

        // Triángulos pequeños (celeste y verde)
        case 'small-triangle':
            svgPath = "M 0 0 L 70 0 L 35 35 Z"; // Lado: 70px (igual al cuadrado)
            fillColor = id === 4 ? "#00BFFF" : "#32CD32"; // Celeste y Verde
            centerPoint = "35,11.67";
            break;

        // Cuadrado (rojo - diamante)
        case 'diamond':
            svgPath = "M 0 35 L 35 0 L 70 35 L 35 70 Z"; // Lado: 70px
            fillColor = "#FF0000"; // Rojo
            centerPoint = "35,35";
            break;

        // Paralelogramo (azul)
        case 'parallelogram':
            svgPath = "M 90 25 H 25 L 0 50 L 65 50 Z";
            fillColor = "#0000FF"; // Azul
            centerPoint = "45,37.5";
            break;

        default:
            svgPath = "";
            fillColor = "gray";
            centerPoint = "0,0";
    }

    const [dragEnabled, setDragEnabled] = useState(false);
    const [centerX, centerY] = centerPoint.split(',').map(Number);

    const handleCircleMouseDown = () => {
        setDragEnabled(true);
    };

    const handleCircleMouseUp = () => {
        setDragEnabled(false);
    };


    return (
      <Draggable
        bounds={boardRef}
        position={initialPosition}
        onStop={(e, data) => {
          if (!dragEnabled || !draggable) return;
          onDragStop(id, { x: data.x, y: data.y });
        }}
        disabled={!dragEnabled || bloqueada || !draggable}
      >
        <div style={{ position: 'absolute', pointerEvents: 'none' }}>
          <svg width="120" height="120" viewBox="-10 -10 100 100" style={{ overflow: 'visible', pointerEvents: 'none' }}>
            <g transform={`rotate(${rotation} ${centerX} ${centerY})`}>
              <path d={svgPath} fill={fillColor} />
              <circle
                cx={centerX}
                cy={centerY}
                r="15"
                fill="rgba(0,0,0,0)"
                onMouseDown={handleCircleMouseDown}
                onMouseUp={handleCircleMouseUp}
                style={{ cursor: draggable ? 'pointer' : 'not-allowed', pointerEvents: 'all' }}
              />
              <circle cx={centerX} cy={centerY} r="5" fill="black" style={{ pointerEvents: 'none' }} />
            </g>
          </svg>
  
          {nivelActual === 2 && (
            <div
              style={{
                position: 'absolute',
                top: '-15px', // claramente arriba de la pieza
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '12px',
                fontWeight: 'bold',
                color: assignedToMe ? 'blue' : 'red',
                pointerEvents: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              {assignedToMe ? 'Tú' : playerName}
            </div>
          )}
        </div>
      </Draggable>
    );
      
};

export default TangramPiece;

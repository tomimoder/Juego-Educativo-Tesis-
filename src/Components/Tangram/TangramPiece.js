import React from 'react';
import Draggable from 'react-draggable';

const TangramPiece = ({ shape, initialPosition, id, onDragStop }) => {
    let svgPath;
    let fillColor;

    // Definir formas y colores según el tipo de figura
    switch (shape) {
        case 'large-triangle': // Triángulo grande
            svgPath = "M 0 0 L 200 0 L 100 100 Z";
            fillColor = "red";
            break;
        case 'medium-triangle': // Triángulo mediano
            svgPath = "M 0 0 L 100 0 L 50 50 Z";
            fillColor = "green";
            break;
        case 'small-triangle': // Triángulo pequeño
            svgPath = "M 0 0 L 50 0 L 25 25 Z";
            fillColor = "purple";
            break;
        case 'diamond': // Diamante
            svgPath = "M 0 50 L 50 0 L 100 50 L 50 100 Z";
            fillColor = "gray";
            break;
        case 'parallelogram': // Paralelogramo
            svgPath = "M 0 10 H 50 L 75 50 L 50 50 H 0 L 25 50 Z";
            fillColor = "blue";
            break;
        default:
            svgPath = "";
            fillColor = "gray";
    }

    return (
        <Draggable
            bounds="parent"
            position={initialPosition} // Usar la posición actualizada del estado
            onStop={(e, data) => onDragStop(id, { x: data.x, y: data.y })} // Llamar a la función al soltar
        >
            <svg width="100" height="100" style={{ position: 'absolute' }}>
                <path d={svgPath} fill={fillColor} />
            </svg>
        </Draggable>
    );
};

export default TangramPiece;



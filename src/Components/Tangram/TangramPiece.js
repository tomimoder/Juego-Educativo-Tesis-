import React from 'react';
import Draggable from 'react-draggable';

const TangramPiece = ({ shape, initialPosition, id, onDragStop }) => {
    let svgPath;
    let fillColor;

    // Definir formas y colores según el tipo de figura
    switch (shape) {
        case 'triangle':
            svgPath = "M 0 100 L 100 100 L 50 0 Z";
            fillColor = "blue";
            break;
        case 'square':
            svgPath = "M 0 0 L 100 0 L 100 100 L 0 100 Z";
            fillColor = "red";
            break;
        case 'parallelogram':
            svgPath = "M 0 0 L 100 25 L 75 100 L -25 75 Z";
            fillColor = "green";
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

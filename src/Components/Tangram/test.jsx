import React, { useRef, useEffect, useState } from 'react';

const TangramGame = () => {
    const canvasRef = useRef(null);
    const [draggingPiece, setDraggingPiece] = useState(null);
    const [offset, setOffset] = useState([0, 0]);
    const [pieces, setPieces] = useState([
        { id: 1, points: [[0, 0], [100, 0], [50, 100]], position: [50, 50], rotation: 0 },
        { id: 2, points: [[0, 0], [100, 0], [50, 100]], position: [150, 150], rotation: 0 },
        { id: 3, points: [[0, 0], [50, 0], [25, 50]], position: [250, 50], rotation: 0 },
        { id: 4, points: [[0, 0], [50, 0], [50, 50], [0, 50]], position: [200, 200], rotation: 0 },
        { id: 5, points: [[0, 0], [50, 0], [25, 50]], position: [300, 300], rotation: 0 },
    ]);

    const targetShape = [
        [100, 100],
        [300, 100],
        [300, 300],
        [100, 300],
    ];

    const rotatePoint = (point, angle, origin) => {
        const [px, py] = point;
        const [ox, oy] = origin;
        const radians = (Math.PI / 180) * angle;
        return [
            Math.cos(radians) * (px - ox) - Math.sin(radians) * (py - oy) + ox,
            Math.sin(radians) * (px - ox) + Math.cos(radians) * (py - oy) + oy,
        ];
    };

    const polygonsOverlap = (poly1, poly2) => {
        // Implementación simple de Separating Axis Theorem (SAT)
        const polygons = [poly1, poly2];
        for (let i = 0; i < polygons.length; i++) {
            const polygon = polygons[i];
            for (let j = 0; j < polygon.length; j++) {
                const k = (j + 1) % polygon.length;
                const edge = [polygon[k][0] - polygon[j][0], polygon[k][1] - polygon[j][1]];
                const normal = [-edge[1], edge[0]];

                let minA = null;
                let maxA = null;
                for (const p of poly1) {
                    const projected = p[0] * normal[0] + p[1] * normal[1];
                    if (minA === null || projected < minA) minA = projected;
                    if (maxA === null || projected > maxA) maxA = projected;
                }

                let minB = null;
                let maxB = null;
                for (const p of poly2) {
                    const projected = p[0] * normal[0] + p[1] * normal[1];
                    if (minB === null || projected < minB) minB = projected;
                    if (maxB === null || projected > maxB) maxB = projected;
                }

                if (maxA < minB || maxB < minA) {
                    return false; // No se superponen
                }
            }
        }
        return true; // Superposición detectada
    };

    const isPointInsidePolygon = (point, polygon) => {
        const [x, y] = point;
        let inside = false;

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const [xi, yi] = polygon[i];
            const [xj, yj] = polygon[j];

            const intersect =
                yi > y !== yj > y &&
                x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

            if (intersect) inside = !inside;
        }

        return inside;
    };

    const validateTangram = () => {
        for (let i = 0; i < pieces.length; i++) {
            const piece1 = pieces[i];
            const poly1 = piece1.points.map(([x, y]) => [x + piece1.position[0], y + piece1.position[1]]);

            // Verificar si cada pieza está dentro del objetivo
            for (const [x, y] of poly1) {
                if (!isPointInsidePolygon([x, y], targetShape)) {
                    alert(`La pieza ${piece1.id} está fuera del área objetivo.`);
                    return false;
                }
            }

            // Verificar superposición entre piezas
            for (let j = i + 1; j < pieces.length; j++) {
                const piece2 = pieces[j];
                const poly2 = piece2.points.map(([x, y]) => [x + piece2.position[0], y + piece2.position[1]]);

                if (polygonsOverlap(poly1, poly2)) {
                    alert(`Las piezas ${piece1.id} y ${piece2.id} se están superponiendo.`);
                    return false;
                }
            }
        }

        alert('¡La solución es válida!');
        return true;
    };

    const handleMouseDown = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        for (const piece of pieces) {
            const [offsetX, offsetY] = piece.position;
            const translatedPoints = piece.points.map(p => [p[0] + offsetX, p[1] + offsetY]);

            if (isPointInsidePolygon([mouseX, mouseY], translatedPoints)) {
                setDraggingPiece(piece);
                setOffset([mouseX - offsetX, mouseY - offsetY]);
                return;
            }
        }
    };

    const handleMouseMove = (e) => {
        if (!draggingPiece) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const updatedPieces = pieces.map(piece => {
            if (piece.id === draggingPiece.id) {
                return {
                    ...piece,
                    position: [mouseX - offset[0], mouseY - offset[1]],
                };
            }
            return piece;
        });

        setPieces(updatedPieces);
    };

    const handleMouseUp = () => {
        setDraggingPiece(null);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Dibuja la figura objetivo
        ctx.beginPath();
        targetShape.forEach(([x, y], index) => {
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.strokeStyle = 'black';
        ctx.stroke();

        // Dibuja las piezas
        pieces.forEach(({ points, position }) => {
            const [offsetX, offsetY] = position;
            const translatedPoints = points.map(([x, y]) => [x + offsetX, y + offsetY]);

            ctx.beginPath();
            translatedPoints.forEach(([x, y], index) => {
                if (index === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
            ctx.fill();
            ctx.stroke();
        });
    }, [pieces]);

    return (
        <div style={{ textAlign: 'center' }}>
            <canvas
                ref={canvasRef}
                width={500}
                height={500}
                style={{ border: '1px solid black' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            ></canvas>
            <button onClick={validateTangram} style={{ marginTop: '10px' }}>
                Validar Solución
            </button>
        </div>
    );
};

export default TangramGame;

import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';

const TangramPiece = ({ shape, position, id, onDragStop, rotation = 0, bloqueada, draggable = true, assignedToMe = false, playerName = '', nivelActual, boardRef, isSelected, onSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragEnabled, setDragEnabled] = useState(false);
  
  // Detección de dispositivo móvil
  const isMobile = window.innerWidth < 768;
  const scaleFactor = isMobile 
    ? Math.min(window.innerWidth / 768, 1) * 1.5  // Para móviles
    : Math.min(window.innerWidth / 1920, 1) * 0.5; // Para desktop

  // Resetear el estado de arrastre cuando cambia la selección
  useEffect(() => {
    if (isMobile) {
      // Si la pieza es seleccionada, permitimos el arrastre después de la selección
      setDragEnabled(isSelected);
    } else {
      // En desktop, el arrastre está siempre habilitado si la pieza está seleccionada
      setDragEnabled(isSelected);
    }
    // Resetear el estado de arrastre cuando la selección cambia
    setIsDragging(false);
  }, [isSelected, isMobile]);

  // Configuración de las formas
  let svgPath;
  let fillColor;
  let centerPoint;
  let svgWidth, svgHeight, viewBox;

  // Ajustar las formas, colores y dimensiones del SVG según el tipo de figura y dispositivo
  switch (shape) {
    case 'large-triangle':
    case 'large-triangle2':
      if (isMobile) {
        svgPath = `M 0 0 L ${200 * scaleFactor} 0 L ${100 * scaleFactor} ${100 * scaleFactor} Z`;
        centerPoint = `${100 * scaleFactor},${(100 * scaleFactor) / 3}`;
        svgWidth = 200 * scaleFactor;
        svgHeight = 100 * scaleFactor;
        viewBox = `-20 -20 ${200 * scaleFactor + 40} ${100 * scaleFactor + 40}`;
      } else {
        svgPath = `M 0 0 L ${140 * scaleFactor} 0 L ${70 * scaleFactor} ${70 * scaleFactor} Z`;
        centerPoint = `${70 * scaleFactor},${(70 * scaleFactor) / 3}`;
        svgWidth = 240;
        svgHeight = 240;
        viewBox = `-10 -10 100 100`;
      }
      fillColor = shape === 'large-triangle' ? "#FFA500" : "#7FFFD4";
      break;
  
    case 'medium-triangle':
      if (isMobile) {
        svgPath = `M 0 0 L ${140 * scaleFactor} 0 L ${70 * scaleFactor} ${70 * scaleFactor} Z`;
        centerPoint = `${70 * scaleFactor},${(70 * scaleFactor) / 3}`;
        svgWidth = 140 * scaleFactor;
        svgHeight = 70 * scaleFactor;
        viewBox = `-20 -20 ${140 * scaleFactor + 40} ${70 * scaleFactor + 40}`;
      } else {
        svgPath = `M 0 0 L ${100 * scaleFactor} 0 L ${50 * scaleFactor} ${50 * scaleFactor} Z`;
        centerPoint = `${50 * scaleFactor},${(50 * scaleFactor) / 3}`;
        svgWidth = 240;
        svgHeight = 240;
        viewBox = `-10 -10 100 100`;
      }
      fillColor = "#FFD700";
      break;
  
    case 'small-triangle':
      if (isMobile) {
        svgPath = `M 0 0 L ${100 * scaleFactor} 0 L ${50 * scaleFactor} ${50 * scaleFactor} Z`;
        centerPoint = `${50 * scaleFactor},${(50 * scaleFactor) / 3}`;
        svgWidth = 100 * scaleFactor;
        svgHeight = 50 * scaleFactor;
        viewBox = `-20 -20 ${100 * scaleFactor + 40} ${50 * scaleFactor + 40}`;
      } else {
        svgPath = `M 0 0 L ${70 * scaleFactor} 0 L ${35 * scaleFactor} ${35 * scaleFactor} Z`;
        centerPoint = `${35 * scaleFactor},${(35 * scaleFactor) / 3}`;
        svgWidth = 240;
        svgHeight = 240;
        viewBox = `-10 -10 100 100`;
      }
      fillColor = id === 4 ? "#00BFFF" : "#32CD32";
      break;
  
    case 'diamond':
      if (isMobile) {
        svgPath = `M 0 ${50 * scaleFactor} L ${50 * scaleFactor} 0 L ${100 * scaleFactor} ${50 * scaleFactor} L ${50 * scaleFactor} ${100 * scaleFactor} Z`;
        centerPoint = `${50 * scaleFactor},${50 * scaleFactor}`;
        svgWidth = 100 * scaleFactor;
        svgHeight = 100 * scaleFactor;
        viewBox = `-20 -20 ${100 * scaleFactor + 40} ${100 * scaleFactor + 40}`;
      } else {
        svgPath = `M 0 ${35 * scaleFactor} L ${35 * scaleFactor} 0 L ${70 * scaleFactor} ${35 * scaleFactor} L ${35 * scaleFactor} ${70 * scaleFactor} Z`;
        centerPoint = `${35 * scaleFactor},${35 * scaleFactor}`;
        svgWidth = 240;
        svgHeight = 240;
        viewBox = `-10 -10 100 100`;
      }
      fillColor = "#FF0000";
      break;
  
    case 'parallelogram':
      if (isMobile) {
        svgPath = `M ${130 * scaleFactor} ${35 * scaleFactor} H ${35 * scaleFactor} L 0 ${70 * scaleFactor} L ${95 * scaleFactor} ${70 * scaleFactor} Z`;
        centerPoint = `${65 * scaleFactor},${52.5 * scaleFactor}`;
        svgWidth = 130 * scaleFactor;
        svgHeight = 70 * scaleFactor;
        viewBox = `-20 -20 ${130 * scaleFactor + 40} ${70 * scaleFactor + 40}`;
      } else {
        svgPath = `M ${90 * scaleFactor} ${25 * scaleFactor} H ${25 * scaleFactor} L 0 ${50 * scaleFactor} L ${65 * scaleFactor} ${50 * scaleFactor} Z`;
        centerPoint = `${45 * scaleFactor},${37.5 * scaleFactor}`;
        svgWidth = 240;
        svgHeight = 240;
        viewBox = `-10 -10 100 100`;
      }
      fillColor = "#0000FF";
      break;
  
    default:
      svgPath = "";
      fillColor = "gray";
      centerPoint = "0,0";
      svgWidth = 0;
      svgHeight = 0;
      viewBox = "0 0 0 0";
  }

  const [centerX, centerY] = centerPoint.split(',').map(Number);

  // Manejador unificado para selección
  const handleSelect = (e) => {
    if (bloqueada || !draggable) return;
    
    e.stopPropagation();
    onSelect(id);
  };

  // Nuevos controladores para móvil
  const handleTouchStart = (e) => {
    if (bloqueada || !draggable) return;
    
    e.stopPropagation();
    
    if (!isSelected) {
      // Si no está seleccionada, solo seleccionamos
      onSelect(id);
    }
  };

  // Determinar el cursor adecuado según el estado
  const getCursorStyle = () => {
    if (bloqueada || !draggable) return 'not-allowed';
    if (!isSelected) return 'pointer'; // No seleccionada: mostrar que es seleccionable
    return isMobile ? (dragEnabled ? 'grabbing' : 'move') : 'grabbing'; // Seleccionada: mostrar que es movible
  };

  return (
    <Draggable
      position={position}
      onStart={(e, data) => {
        // Sólo permitir arrastre en desktop o si está habilitado en móvil después de selección
        if (!isSelected || !draggable || bloqueada || (isMobile && !dragEnabled)) {
          return false;
        }
        setIsDragging(true);
        return true;
      }}
      onDrag={(e, data) => {
        // Mantener el arrastre activo si todas las condiciones son válidas
        if (isSelected && draggable && !bloqueada && (!isMobile || dragEnabled)) {
          return true;
        }
        return false;
      }}
      onStop={(e, data) => {
        if (!isSelected || !draggable || bloqueada) return;
        
        // Solo actualizamos la posición si realmente estábamos arrastrando
        if (isDragging) {
          onDragStop(id, { x: data.x, y: data.y });
          setIsDragging(false);
        }
      }}
      disabled={!isSelected || bloqueada || !draggable || (isMobile && !dragEnabled)}
      // Se eliminó la restricción bounds para permitir el movimiento por toda la pantalla
    >
      <div 
        style={{ 
          position: 'absolute',
          cursor: getCursorStyle(),
          touchAction: 'none' // Crucial para eventos táctiles
        }}
      >
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={viewBox}
          style={{ 
            overflow: 'visible', 
            touchAction: 'none' // Importante para dispositivos táctiles
          }}
        >
          <g transform={`rotate(${rotation} ${centerX} ${centerY})`}>
            <path
              d={svgPath}
              fill={fillColor}
              stroke={isSelected ? 'rgba(0, 255, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)'}
              strokeWidth={isSelected ? 2 : 1}
              style={{
                filter: isSelected ? 'drop-shadow(0 0 8px rgba(0, 255, 0, 0.8))' : 'none',
                opacity: isSelected ? 1 : 0.85,
                pointerEvents: 'all',
                touchAction: 'none', // Importante para dispositivos táctiles
              }}
              onClick={handleSelect}
              onTouchStart={handleTouchStart}
            />
          </g>
        </svg>

        {/* Etiqueta del jugador */}
        {(nivelActual === 2 || nivelActual === 4) && (
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: isMobile ? '14px' : '12px',
              fontWeight: 'bold',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              padding: '2px 4px',
              borderRadius: '3px',
              color: assignedToMe ? 'blue' : 'red',
              pointerEvents: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            {assignedToMe ? 'Tú' : playerName}
          </div>
        )}

        {/* Indicador visual de que la pieza está seleccionada y lista para mover (móviles) */}
        {isSelected && isMobile && (
          <div
            style={{
              position: 'absolute',
              bottom: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '12px',
              fontWeight: 'bold',
              backgroundColor: 'rgba(0, 255, 0, 0.7)',
              padding: '2px 8px',
              borderRadius: '10px',
              color: 'white',
              pointerEvents: 'none'
            }}
          >
            {dragEnabled ? '✓ Mueve ahora' : '✓ Seleccionada'}
          </div>
        )}

        {/* Control adicional para móviles - Botón para habilitar el movimiento */}
        {isSelected && isMobile && !dragEnabled && (
          <div
            style={{
              position: 'absolute',
              bottom: '-45px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0, 100, 255, 0.9)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '5px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
              zIndex: 1000,
              touchAction: 'manipulation'
            }}
            onClick={(e) => {
              e.stopPropagation();
              setDragEnabled(true);
            }}
          >
            Mover pieza
          </div>
        )}
      </div>
    </Draggable>
  );
};

export default TangramPiece;
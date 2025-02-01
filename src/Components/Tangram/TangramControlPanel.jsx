import React from 'react';

const TangramControlPanel = ({ pieces, onRotatePiece }) => {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '10px' }}>
            {pieces.map(piece => (
                <div key={piece.id} style={{ textAlign: 'center', margin: '0 5px' }}>
                    <div>{piece.shape}</div>
                    <button
                        onClick={() => onRotatePiece(piece.id, -15)}
                        style={{ padding: '2px', margin: '2px', cursor: 'pointer' }}
                    >
                        ⟲
                    </button>
                    <button
                        onClick={() => onRotatePiece(piece.id, 15)}
                        style={{ padding: '2px', margin: '2px', cursor: 'pointer' }}
                    >
                        ⟳
                    </button>
                </div>
            ))}
        </div>
    );
};

export default TangramControlPanel;
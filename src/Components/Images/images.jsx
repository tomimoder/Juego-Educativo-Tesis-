import React, { useEffect, useState } from 'react';
import im1 from './tangram_figures/figure_1.png';
import im2 from './tangram_figures/figure_2.png';
import im3 from './tangram_figures/figure_3.png';
import im4 from './tangram_figures/figure_4.png';
import im5 from './tangram_figures/figure_5.png';
import im6 from './tangram_figures/figure_6.png';
import im7 from './tangram_figures/figure_7.png';
import im8 from './tangram_figures/figure_8.png';
import im9 from './tangram_figures/figure_9.png';
import im10 from './tangram_figures/figure_10.png';

const   RandomBackgroundDiv = () => {
    const [backgroundImage, setBackgroundImage] = useState('');

    useEffect(() => {
        // Lista de imágenes en tu carpeta
        const images = [im1, im2, im3, im4, im5, im6, im7, im8, im9, im10];

        // Seleccionar una imagen al azar
        const randomImage = images[Math.floor(Math.random() * images.length)];

        // Establecer la imagen como fondo
        setBackgroundImage(randomImage);
    }, []);

    return (
        <div
            className="flex-grow bg-white rounded-lg shadow-lg p-4 mb-4"
            style={{
                height: '550px',
                width: '600px',
                backgroundImage: `url(${backgroundImage})`,
                
                backgroundPosition: 'center', // Centra la imagen
                backgroundRepeat: 'no-repeat', // Evita que se repita
            }}
        >
            {/* Puedes agregar contenido adicional aquí si lo necesitas */}
        </div>
    );
};

export default RandomBackgroundDiv;

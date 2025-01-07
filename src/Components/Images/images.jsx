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
import im11 from './tangram_figures/figure_11.png';
import im12 from './tangram_figures/figure_12.png';
import im13 from './tangram_figures/figure_13.png';
import im14 from './tangram_figures/figure_14.png';
import im15 from './tangram_figures/figure_15.png';
import im16 from './tangram_figures/figure_16.png';
import im17 from './tangram_figures/figure_17.png';
import im18 from './tangram_figures/figure_18.png';
import im19 from './tangram_figures/figure_19.png';
import im20 from './tangram_figures/figure_20.png';
import im21 from './tangram_figures/figure_21.png';
import im22 from './tangram_figures/figure_22.png';
import im23 from './tangram_figures/figure_23.png';
import im24 from './tangram_figures/figure_24.png';
import im25 from './tangram_figures/figure_25.png';
import im26 from './tangram_figures/figure_26.png';
import im27 from './tangram_figures/figure_27.png';
import im28 from './tangram_figures/figure_28.png';
import im29 from './tangram_figures/figure_29.png';
import im30 from './tangram_figures/figure_30.png';
import im31 from './tangram_figures/figure_31.png';
import im32 from './tangram_figures/figure_32.png';
import im33 from './tangram_figures/figure_33.png';
import im37 from './tangram_figures/figure_37.png';
import im38 from './tangram_figures/figure_38.png';
import im39 from './tangram_figures/figure_39.png';
import im40 from './tangram_figures/figure_40.png';
import im41 from './tangram_figures/figure_41.png';

const RandomBackgroundDiv = () => {
    const [backgroundImage, setBackgroundImage] = useState('');

    useEffect(() => {
        // Lista de imágenes en tu carpeta
        const images = [im1, im2, im3, im4, im5, im6, im7, im8, im9, im10, im11, im12, im13, im14, im15, im16, im17, im18, im19, im20, im21, im22, im23, im24, im25, im26, im27, im28, im29, im30, im31, im32, im33, im37, im38, im39, im40, im41];

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
                backgroundSize: '250px 350px', // Ajusta la imagen para cubrir el div
                backgroundPosition: 'center', // Centra la imagen
                backgroundRepeat: 'no-repeat', // Evita que se repita
            }}
        >
            {/* Puedes agregar contenido adicional aquí si lo necesitas */}
        </div>
    );
};

export default RandomBackgroundDiv;

import './SignUp.css';
import user_icon from '../Assets/person.png';
import React, { useState } from 'react';
import Axios from "axios";
import { useNavigate } from 'react-router-dom';

function SignUp(){
    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const navigate = useNavigate();
    const [error, setError] = useState("");


    const handleSignUp = ()=>{

        Axios.post("http://localhost:3001/api/users/signup",{
            nombre: nombre,
            apellido: apellido
        }).then((response) => {
            console.log(response.data);
            if (response.data.error) {
                setError("Datos incorrectos, Por favor, intenta de nuevo.");
            } else {
                navigate('/');
            }
        }).catch((error) => {
            console.error("Error en la solicitud de login", error);
        });

    }
        return(
            <div className="container">
                <div className="header">
                    <div className="text">Login</div>
                    <div className="underline"></div>
                </div>
                <div className="inputs">
                    <div className="input">
                        <img src={user_icon} alt="" />
                        <input type="text" placeholder="Nombre" onChange={(e) => setNombre(e.target.value)}/>
                    </div>
                    <div className="input">
                        <img src={user_icon} alt="" />
                        <input type="text" placeholder="Apellido" onChange={(e) => setApellido(e.target.value)}/>
                    </div>
                </div>
                <div className="submit-container">
                    <div><button className="submit" onClick={handleSignUp}>Crear Cuenta</button></div>
                </div>
            </div>
        )
    
}

export default SignUp
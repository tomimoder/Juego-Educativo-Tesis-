const express = require("express");
const router = express.Router();
const mysql = require("mysql");

// Conexión a la base de datos (si no se comparte la conexión con el archivo principal)
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "Test-Game"
});

db.connect((err) => {
    if (err) {
        console.error("Error al conectar a la base de datos:", err);
    } else {
        console.log("Conexión a la base de datos establecida desde Users.js");
    }
});

// Ruta para agregar un nuevo usuario falta comprobar que el usuario no existe.
router.post("/signup", (req, res) => {
    const {nombre, apellido} = req.body;

    if(!nombre || !apellido){
        return res.status(400).json({error: "Por favor, envía nombre y apellido"});
    }

    //Verificar si ya existe un usuario con el mismo nombre y apellido.
    const checkUserQuery = "SELECT * FROM Users WHERE nombre = ? AND apellido = ?";
    db.query(checkUserQuery, [nombre, apellido], (err, results) =>{
        if(err){
            console.error(err);
            return res.status(500).json({error: "Error al verificar el usuario"});
        }
        if(results.length > 0){
            return res.status(400).json({rerror: "El usuario ya existe"});
        }
        else{
            const insertQuery = "INSERT INTO Users (nombre, apellido) VALUES (?, ?)";
            db.query(insertQuery, [nombre,  apellido], (err, results) =>{
                if(err){
                    console.error(err);
                    return res.status(500).json({error: "Error al insertat los datos"});
                }
                res.status(201).json({ message: "Usuario agregado exitosamente!!!"});
            })
        }
    })
});

router.post("/login", (req, res)=>{
    const{nombre, apellido} = req.body;

    if(!nombre || !apellido){
        return res.status(400).json({ error: "Por favor, ingrese nombre y apellido"});
    }

    const query = "SELECT * FROM Users WHERE nombre = ? AND apellido = ?";
    db.query(query, [nombre, apellido], (err, result)=>{
        if(err){
            console.log(err);
            return res.status(500).json({ error: "Error en la base de datos." });
        }
        if (result.length > 0) {
            // Si el usuario existe, devolvemos un éxito
            res.status(200).json({ message: "Login exitoso", user: result[0] });
        } else {
            // Si el usuario no existe o la contraseña es incorrecta
            res.status(401).json({ error: "Credenciales incorrectas" });
        }
    });
});




/*router.get("/test", (req, res) => {
    db.query("SELECT 1", (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Error al conectar a la base de datos" });
        }
        res.status(200).json({ message: "Conexión exitosa", result });
    });
});*/

// Exportar el router
module.exports = router;

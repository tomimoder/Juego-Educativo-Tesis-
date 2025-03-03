const express = require("express");
const cors = require("cors");
const http = require("http");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const { initializeSocket } = require("./socket/index");
const schoolRoutes = require('./routes/schoolRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const levelRoutes = require('./routes/levelRoutes');
const solutionRoutes = require('./routes/solutionRoutes');

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: 'http://localhost:3000', //https://magisters.pages.dev
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Middleware de depuración para ver las cookies en cada petición HTTP
app.use((req, res, next) => {
  console.log("🍪 Cookies recibidas:", req.cookies);
  next();
});

app.use(cookieParser());

// 🔥 Inicializar `socket.io`
const io = initializeSocket(server);


// Use routes
app.use('/api', schoolRoutes);
app.use('/api', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/levels', levelRoutes);
app.use('/api', solutionRoutes);

app.get("/api/me", (req, res) => {
  console.log("🍪 Cookies recibidas en backend:", req.cookies);

  if (!req.cookies || !req.cookies.userSession) {
    return res.status(401).json({ error: "Usuario no autenticado" });
  }

  try {
    const user = JSON.parse(req.cookies.userSession);
    console.log("✅ Usuario autenticado desde cookies:", user);
    res.json(user);
  } catch (error) {
    console.error("❌ Error leyendo la cookie:", error);
    res.status(500).json({ error: "Error interno al leer la sesión" });
  }
});

app.get("/api/logout", (req, res) => {
  req.session.destroy();
  res.clearCookie("connect.sid"); // 🔥 Elimina la cookie de sesión
  res.json({ success: true });
});


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
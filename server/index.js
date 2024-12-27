const express = require("express");
const cors = require("cors");
const http = require("http");
const schoolRoutes = require('./routes/schoolRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const levelRoutes = require('./routes/levelRoutes');
const { initializeSocket } = require('./socket/index');
const solutionRoutes = require('./routes/solutionRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Use routes
app.use('/api', schoolRoutes);
app.use('/api', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/levels', levelRoutes);
app.use('/api', solutionRoutes);

const server = http.createServer(app);
initializeSocket(server);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
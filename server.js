import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './DB/db.js';
import airlineRoutes from './Routes/routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
// Connect to MongoDB
connectDB();
// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/airline', airlineRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'SkyWings Airline Reservation API' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
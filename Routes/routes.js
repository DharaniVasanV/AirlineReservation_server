import express from 'express';
import { 
  registerUser,
  loginUser,
  addFlight,
  getFlights,
  getFlightsWithBookings,
  getFlightPassengers,
  searchFlights,
  updateFlight,
  deleteFlight,
  addReservation, 
  getReservations,
  getUserReservations,
  getReservationByReference, 
  updateReservationStatus 
} from '../Controller/controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Auth Routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Flight Routes
router.get('/flights', getFlights);
router.get('/flights/search', searchFlights);
router.get('/admin/flights', authenticateToken, requireAdmin, getFlightsWithBookings);
router.get('/admin/flights/:flightId/passengers', authenticateToken, requireAdmin, getFlightPassengers);
router.post('/flights', authenticateToken, requireAdmin, addFlight);
router.put('/flights/:id', authenticateToken, requireAdmin, updateFlight);
router.delete('/flights/:id', authenticateToken, requireAdmin, deleteFlight);

// Reservation Routes
router.post('/addReservation', authenticateToken, addReservation);
router.get('/getReservations', authenticateToken, requireAdmin, getReservations);
router.get('/myReservations', authenticateToken, getUserReservations);
router.get('/reservation/:reference', getReservationByReference);
router.put('/updateStatus/:id', authenticateToken, updateReservationStatus);

export default router;
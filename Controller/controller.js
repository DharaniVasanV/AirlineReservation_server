import { User, Flight, Reservation } from '../Model/model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Generate booking reference
const generateBookingReference = () => {
  return 'SW' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase();
};

// User Registration
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, phone });
    await user.save();

    const token = jwt.sign({ userId: user._id, role: user.role }, 'your-secret-key', { expiresIn: '24h' });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// User Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, 'your-secret-key', { expiresIn: '24h' });
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add Flight (Admin only)
export const addFlight = async (req, res) => {
  try {
    const flight = new Flight(req.body);
    await flight.save();
    res.status(201).json({ success: true, message: 'Flight added successfully', data: flight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Flights
export const getFlights = async (req, res) => {
  try {
    const flights = await Flight.find({ status: 'active' });
    res.json({ success: true, data: flights });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Flights with booking count (Admin only)
export const getFlightsWithBookings = async (req, res) => {
  try {
    const flights = await Flight.aggregate([
      {
        $lookup: {
          from: 'reservations',
          localField: '_id',
          foreignField: 'flightId',
          as: 'bookings'
        }
      },
      {
        $addFields: {
          bookedSeats: { $size: '$bookings' },
          passengers: '$bookings'
        }
      }
    ]);
    res.json({ success: true, data: flights });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get passengers for a specific flight (Admin only)
export const getFlightPassengers = async (req, res) => {
  try {
    const { flightId } = req.params;
    const passengers = await Reservation.find({ flightId }).populate('userId', 'name email');
    res.json({ success: true, data: passengers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Search Flights
export const searchFlights = async (req, res) => {
  try {
    const { departure, destination, date } = req.query;
    const query = { status: 'active' };
    
    if (departure) query.departure = new RegExp(departure, 'i');
    if (destination) query.destination = new RegExp(destination, 'i');
    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.flightDate = { $gte: searchDate, $lt: nextDay };
    }
    
    const flights = await Flight.find(query);
    res.json({ success: true, data: flights });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Flight (Admin only)
export const updateFlight = async (req, res) => {
  try {
    const flight = await Flight.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Flight not found' });
    }
    res.json({ success: true, message: 'Flight updated successfully', data: flight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Flight (Admin only)
export const deleteFlight = async (req, res) => {
  try {
    const flight = await Flight.findByIdAndDelete(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Flight not found' });
    }
    res.json({ success: true, message: 'Flight deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add new reservation
export const addReservation = async (req, res) => {
  try {
    const { passengerName, email, phone, flightId, seatNumber, passportNumber, aadharNumber } = req.body;
    const userId = req.user.userId;
    
    const flight = await Flight.findById(flightId);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Flight not found' });
    }

    if (flight.availableSeats <= 0) {
      return res.status(400).json({ success: false, message: 'No seats available' });
    }
    
    const bookingReference = generateBookingReference();
    
    const newReservation = new Reservation({
      passengerName,
      email,
      phone,
      flightNumber: flight.flightNumber,
      departure: flight.departure,
      destination: flight.destination,
      departureDate: flight.flightDate,
      seatNumber,
      bookingReference,
      userId,
      flightId,
      price: flight.price,
      passportNumber: flight.country?.toLowerCase() === 'india' ? undefined : passportNumber,
      aadharNumber: flight.country?.toLowerCase() === 'india' ? aadharNumber : undefined
    });

    await newReservation.save();
    
    // Update available seats
    flight.availableSeats -= 1;
    await flight.save();

    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: newReservation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating reservation',
      error: error.message
    });
  }
};

// Get user reservations
export const getUserReservations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const reservations = await Reservation.find({ userId }).populate('flightId').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reservations',
      error: error.message
    });
  }
};

// Get all reservations (Admin only)
export const getReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find().populate('userId flightId').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reservations',
      error: error.message
    });
  }
};

// Get reservation by booking reference
export const getReservationByReference = async (req, res) => {
  try {
    const { reference } = req.params;
    const reservation = await Reservation.findOne({ bookingReference: reference });
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: reservation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reservation',
      error: error.message
    });
  }
};

// Update reservation status
export const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Find the reservation first
    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // Check if user owns the reservation or is admin
    if (userRole !== 'admin' && reservation.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own reservations'
      });
    }

    // Users can only confirm their bookings (set status to true), not cancel them
    if (userRole !== 'admin' && status === false) {
      return res.status(403).json({
        success: false,
        message: 'You can only confirm bookings, not cancel them'
      });
    }

    const updatedReservation = await Reservation.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Reservation status updated',
      data: updatedReservation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating reservation',
      error: error.message
    });
  }
};

// Get occupied seats for a flight
export const getOccupiedSeats = async (req, res) => {
  try {
    const { flightId } = req.params;
    const reservations = await Reservation.find({ 
      flightId, 
      seatNumber: { $ne: 'Not Assigned', $ne: '' } 
    }).select('seatNumber');
    
    const occupiedSeats = reservations.map(r => r.seatNumber).filter(seat => seat);
    
    res.json({ 
      success: true, 
      data: occupiedSeats 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Cancel reservation
export const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Find the reservation first
    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // Check if user owns the reservation or is admin
    if (userRole !== 'admin' && reservation.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own reservations'
      });
    }

    // Only allow cancellation of unconfirmed bookings
    if (reservation.status === true) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel confirmed bookings. Please contact support.'
      });
    }

    // Delete the reservation
    await Reservation.findByIdAndDelete(id);
    
    // Restore available seats
    const flight = await Flight.findById(reservation.flightId);
    if (flight) {
      flight.availableSeats += 1;
      await flight.save();
    }

    res.status(200).json({
      success: true,
      message: 'Reservation cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling reservation',
      error: error.message
    });
  }
};
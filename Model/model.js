import mongoose from 'mongoose';

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, {
  timestamps: true
});

// Flight Schema
const flightSchema = new mongoose.Schema({
  flightNumber: {
    type: String,
    required: true,
    unique: true
  },
  airline: {
    type: String,
    required: true
  },
  departure: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  departureTime: {
    type: String,
    required: true
  },
  arrivalTime: {
    type: String,
    required: true
  },
  flightDate: {
    type: Date,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  availableSeats: {
    type: Number,
    required: true
  },
  totalSeats: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'delayed'],
    default: 'active'
  }
}, {
  timestamps: true
});

const reservationSchema = new mongoose.Schema({
  passengerName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  flightNumber: {
    type: String,
    required: true,
    trim: true
  },
  departure: {
    type: String,
    required: true,
    trim: true
  },
  destination: {
    type: String,
    required: true,
    trim: true
  },
  departureDate: {
    type: Date,
    required: true
  },
  seatNumber: {
    type: String,
    default: 'Not Assigned'
  },
  status: {
    type: Boolean,
    default: false
  },
  bookingReference: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  flightId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flight',
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  passportNumber: {
    type: String,
    trim: true
  },
  aadharNumber: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);
const Flight = mongoose.model('Flight', flightSchema);
const Reservation = mongoose.model('Reservation', reservationSchema);

export { User, Flight, Reservation };
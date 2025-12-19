import mongoose from 'mongoose';

const connectDB = () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    console.log('URI exists:', !!process.env.MONGODB_URI);
    
    mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Atlas Connected Successfully!');
   
  } catch (error) {
    console.error('MongoDB Atlas connection failed:', error.message);
    throw error;
  }
};

export default connectDB;
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import transporter from "../config/nodeMailer.js";

// Register a new user
export const register = async (req, res) => {
   const { name, email, password } = req.body;

   // Check for missing fields
   if (!name || !email || !password) {
      return res.json({ success: false, message: "Missing Details" });
   }

   try {
      // Check if the user already exists
      const existingUser = await userModel.findOne({ email });

      if (existingUser) {
         return res.json({ success: false, message: "Email already exists" });
      }

      // Hash the user's password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create and save the new user
      const user = new userModel({ name, email, password: hashedPassword });
      await user.save();

      // Generate a JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
         expiresIn: "7d",
      });

      // Set a cookie with the token
      res.cookie("token", token, {
         httpOnly: true,
         secure: process.env.NODE_ENV === "production", // Use secure cookies in production
         sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", // Adjust same-site settings based on environment
         maxAge: 7 * 24 * 60 * 60 * 1000, // Token expiry time in milliseconds
      });

      // sending wellcome email
      const mailOptions = {
         from: process.env.SENDER_EMAIL,
         to: email,
         subject: "Welcome to My Website!",
         text: `Thank you for registering on our website! Your account has been created successfully with email id:${email}.`,
      };

      await transporter.sendMail(mailOptions);

      // Respond with success message
      res.json({ success: true, message: "User registered successfully" });
   } catch (error) {
      // Handle errors
      res.json({ success: false, message: error.message });
   }
};

export const login = async (req, res) => {
   const { email, password } = req.body;

   // Check for missing fields
   if (!email || !password) {
      return res.json({
         success: false,
         message: "Email and password are required",
      });
   }

   try {
      // Find the user by email
      const user = await userModel.findOne({ email });

      if (!user) {
         return res.json({ success: false, message: "User not found" });
      }

      // Check if the password matches the hashed password in the database
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
         return res.json({ success: false, message: "Invalid password" });
      }

      // Generate a JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
         expiresIn: "7d",
      });

      // Set a cookie with the token
      res.cookie("token", token, {
         httpOnly: true,
         secure: process.env.NODE_ENV === "production", // Use secure cookies in production
         sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", // Adjust same-site settings based on environment
         maxAge: 7 * 24 * 60 * 60 * 1000, // Token expiry time in milliseconds
      });

      // Respond with success message
      res.json({ success: true, message: "User login successfully" });
   } catch (error) {
      // Handle errors
      res.json({ success: false, message: error.message });
   }
};

export const logout = async (req, res) => {
   try {
      // Clear the token cookie
      res.clearCookie("token", {
         httpOnly: true,
         secure: process.env.NODE_ENV === "production", // Use secure cookies in production
         sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", // Adjust same-site settings based on environment
      });

      // Respond with success message
      res.json({ success: true, message: "Logged Out" });
   } catch (error) {
      // Handle errors
      res.json({ success: false, message: error.message });
   }
};

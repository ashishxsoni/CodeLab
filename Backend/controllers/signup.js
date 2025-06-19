const User = require("../models/user");
const { createTokenForUser } = require("../services/authentication.js");
// Email validation function
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

async function handleSignUp(req, res) {
  try {
    const { fullname, email, password } = req.body;
    console.log("📩 Signup request received:", req.body, "\n");

    // ✅ Validate Required Fields
    if (!fullname?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(200).json({
        status: "warning",
        message: "⚠ All fields are required.",
      });
    }

    // ✅ Validate Email Format
    if (!validateEmail(email)) {
      return res.status(200).json({
        status: "warning",
        message: "⚠ Please enter a valid email address.",
      });
    }

    // ✅ Validate Password Length
    if (password.length < 6) {
      return res.status(200).json({
        status: "warning",
        message: "⚠ Password must be at least 6 characters long.",
      });
    }

    // ✅ Check If User Already Exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("🚨 User already exists!");
      return res.status(409).json({
        status: "error",
        message: "User with this email already exists.",
      });
    }


      // ✅ Get Profile Image Path from Multer as we cofigured multer as an middleware after succefully uploading the file 
      // const profileImage = req.file ? `/uploads/userProfiles/${req.file.filename}` : `/public/uploads/userProfile/man.png`;
      // as we server /uploads as static in app.js file 
       // ✅ Check for Uploaded Image, Else Use Default

       const profileImagePath = req.file
       ? `/uploads/userProfiles/${req.file.filename}`
       : `/uploads/userProfiles/man.png`; // Default profile image 

     
      console.log("after Upoading middleware the path is :", profileImagePath,"\n","the req.file in signup is : ",req.file);
    // ✅ Create a New User , and stored the image path in database
    const newUser = await User.create({
      fullname,
      email,
      password,
      profileImage:profileImagePath,
    });
    await newUser.save();

    console.log("✅ Signup Successful:", newUser);
    //genrating token
    const token = createTokenForUser(newUser);
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction, // Secure in production, not in development
      sameSite: isProduction ? "None" : "Lax", // "None" for cross-site cookies, "Lax" for localhost
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days expiration
    });
    console.log("✅ Login Successful for:", newUser.email);

    // ✅ Send Response with Safe User Data (excluding password)
    return res.status(200).json({
      success: true,
      message: " User Registered & Logged In Successfully!",
      status: "success",
      user: {
        _id: newUser._id,
        fullname: newUser.fullname,
        email: newUser.email,
        profileImage: newUser.profileImage,
      },
    });
  } catch (error) {
    console.error(" Signup Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Server error during registration. Please try again later.",
    });
  }
}

module.exports = { handleSignUp };

import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

// GET /api/admin/users — list all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// POST /api/admin/users — create a user (admin can set role)
export const createUser = async (req, res) => {
  const { fullName, userName, email, password, role } = req.body;

  try {
    if (!fullName || !userName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res.status(400).json({ message: "Email already taken" });

    const existingUserName = await User.findOne({ userName });
    if (existingUserName)
      return res.status(400).json({ message: "Username already taken" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      userName,
      email,
      password: hashedPassword,
      role: ["admin", "analyst"].includes(role) ? role : "user", // only allow valid roles
    });

    const savedUser = await newUser.save();

    res.status(201).json({
      _id: savedUser._id,
      fullName: savedUser.fullName,
      userName: savedUser.userName,
      email: savedUser.email,
      role: savedUser.role,
      status: savedUser.status,
    });
  } catch (error) {
    console.error("Error in createUser (admin):", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// PATCH /api/admin/users/:id/role — assign role
export const assignRole = async (req, res) => {
  const { role } = req.body;

  if (!["user", "admin", "analyst"].includes(role)) {
    return res.status(400).json({
      message: "Invalid role. Must be 'user', 'admin', or 'analyst'.",
    });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "Role updated", user });
  } catch (error) {
    console.error("Error in assignRole:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// PATCH /api/admin/users/:id/status — activate or deactivate
export const updateUserStatus = async (req, res) => {
  const { status } = req.body;

  if (!["active", "inactive"].includes(status)) {
    return res
      .status(400)
      .json({ message: "Invalid status. Must be 'active' or 'inactive'." });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "Status updated", user });
  } catch (error) {
    console.error("Error in updateUserStatus:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// DELETE /api/admin/users/:id — delete a user
export const deleteUser = async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account." });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

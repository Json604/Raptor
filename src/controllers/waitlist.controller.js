import Waitlist from "../models/joinList.model.js";

export const waitlistController = async (req, res, next) => {
  try {
    const { email } = req.body;

    // 1️⃣ Check empty
    if (!email) {
      const error = new Error("Email is required.");
      error.status = 400;
      throw error;
    }

    // 2️⃣ Validate format (simple and reliable)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const error = new Error("Please enter a valid email address.");
      error.status = 400;
      throw error;
    }

    // 3️⃣ Check for duplicates
    const existingUser = await Waitlist.findOne({ email });
    if (existingUser) {
      const error = new Error("You already joined the waitlist!");
      error.status = 409;
      throw error;
    }

    // 4️⃣ Add to DB
    await Waitlist.create({ email });
    res.status(201).json({ message: "User added to waitlist successfully." });

  } catch (error) {
    next(error);
  }
};

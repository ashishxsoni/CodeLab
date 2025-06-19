const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const { globalRooms, createRoom, handleRoomAccess } = require('../controllers/roomManager.js');

router
  .get("/generate-roomId", generateRoomId)
  .get("/:roomId", handleRoomAccess)
  .post("/create-room", createRoomHandler);

function generateRoomId(req, res) {
  try {
    const roomId = crypto.randomBytes(8).toString("hex"); // 16-character hex ID
    console.log("Generated RoomId is:", roomId); // Fixed typo in console.log

    return res.status(201).json({
      status: "success",
      roomId,
      message: "Room created successfully.",
    });
  } catch (err) {
    console.error("⚠ Error during room ID generation:", err.message);

    return res.status(500).json({
      success: false,
      message: err.message || "❌ Internal Server Error.",
      status: "error",
    });
  }
}

function createRoomHandler(req, res) {
  const { meetingName, hostName, roomId, host } = req.body;

  if (!meetingName?.trim() || !hostName?.trim() || !roomId || !host) {
    return res.status(400).json({
      status: "error",
      message: "All fields are required before generating a room ID.",
    });
  }

  if (createRoom(roomId, host)) {
    console.log("Backend room created:", { meetingName, hostName, roomId, host });
    return res.status(201).json({ status: "success", message: "Room created successfully." });
  }

  return res.status(400).json({ status: "error", message: "Room already exists." });
}

module.exports = router;

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from "lucide-react";
const LeaveRoomComponent = ({ 
  darkMode, 
  navigate, 
  socket,
  redirectPath = "/", 
  redirectTimer = 3,
  title = "Leave Room",
  message = "Are you sure you want to leave this room?",
  redirectMessage = "Redirecting in",
  redirectState = {},
  showCloseButton = true,
  showButtons =true,
  onSaveCode = () => {},
  onClose = () => {},
  roomCode = "",
  blurBackground = true,
  initialRedirecting = false,
  initialCountDown=null,
}) => {
  const [countdown, setCountdown] = useState(initialCountDown);
  const [isRedirecting, setIsRedirecting] = useState(initialRedirecting);

  useEffect(() => {
    // Only start countdown if redirecting is active
    if (!isRedirecting) return;
    
    // If countdown reaches 0, navigate to the specified path
    if (countdown === 0) {
      // Disconnect from socket if provided
      if (socket) {
        socket.emit('leave-room', { roomCode });
      }
      
      navigate(redirectPath, { 
        state: { 
          message: "You have left the room.",
        } 
      });
      return;
    }

    // Set up the interval if countdown is active
    const timer = setInterval(() => {
      setCountdown(prevCount => prevCount - 1);
    }, 1000);

    // Clean up the interval on component unmount
    return () => clearInterval(timer);
  }, [countdown, navigate, redirectPath, redirectState, isRedirecting, socket, roomCode]);

  const handleConfirmLeave = () => {
    setIsRedirecting(true);
    setCountdown(redirectTimer);
  };

  const handleSaveAndLeave = () => {
    onSaveCode();
    handleConfirmLeave();
  };

  const handleClose = () => {
    // Just close the modal without leaving
    onClose();
    // This will be handled by the parent component
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${
      blurBackground ? "bg-opacity-50 backdrop-blur-sm" : "bg-transparent"
    }`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`p-8 rounded-xl shadow-xl text-center relative max-w-md ${
          darkMode
          ? "border-2 border-cyan-600 bg-gradient-to-b from-slate-800 to-slate-900 text-white"
          : "border-2 border-teal-400 bg-gradient-to-b from-white to-cyan-50 text-gray-800"
        }`}
      >
        {/* Close Icon - Optional */}
        {showCloseButton && (
          <motion.div
            onClick={handleClose}
            whileHover={{ scale: 1.2, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className={`absolute top-4 right-4 cursor-pointer ${
              darkMode 
                ? "text-gray-300 hover:text-white" 
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <X size={24} />
          </motion.div>
        )}

        <h2 className={`text-2xl font-bold mb-4 ${
          darkMode ? "text-cyan-400" : "text-sky-600"
        }`}>
          {title}
        </h2>
        <p className={`mb-6 ${
          darkMode ? "text-gray-300" : "text-gray-600"
        }`}>
          {message}
        </p>
        
        {/* Action Buttons */}
        {
        showButtons ? !isRedirecting  ? (
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <motion.button
                onClick={handleSaveAndLeave}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-3 rounded-lg transition ${
                  darkMode
                  ? "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white"
                  : "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white"
                }`}
              >
                Save & Leave
              </motion.button>
              
              <motion.button
                onClick={handleConfirmLeave}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-3 rounded-lg transition ${
                  darkMode
                  ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white"
                  : "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white"
                }`}
              >
                Leave Now
              </motion.button>
            </div>
          ) : (
            <p className={`text-sm ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}>
              {redirectMessage} {countdown} seconds
            </p>
          ) 
          :
          ""
        }
      </motion.div>
    </div>
  );
};

export default LeaveRoomComponent;
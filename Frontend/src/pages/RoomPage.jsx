import axios from "axios";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { io } from "socket.io-client";
import {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
} from "../utils/toast";
import { setLoading } from "../redux/authSlice";

import {
  Footer,
  LeaveRoomComponent,
  Header,
  LoadingScreen,
  AccessDeniedScreen,
  ControlBar,
  EscNotification,
  ShareLinkPopup,
  Sidebar,
  CodeEditor,
} from "../components";

const RoomPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { roomId } = useParams(); // Get roomId from URL params
  const codeEditorRef = useRef(null);
  const socketRef = useRef(null);
  const userData = useSelector((state) => state.auth.userData); // Using userData as in authSlice
  const isAuthenticated = useSelector((state) => state.auth.isAuth);
  const darkMode = useSelector((state) => state.theme.darkMode);
  const isLoading = useSelector((state) => state.auth.isLoading);

  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [code, setCode] = useState(`// Write your code here...`);
  const [language, setLanguage] = useState("javascript");
  const [isTyping, setIsTyping] = useState(false);
  const [typingContent, setTypingContent] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [host, setHost] = useState({});
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [roomLink, setRoomLink] = useState("");
  const [showCopyPopup, setShowCopyPopup] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarContent, setSidebarContent] = useState("participants");
  const [isFullScreenApp, setIsFullScreenApp] = useState(false);
  const [showEscNotification, setShowEscNotification] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [notification, setNotification] = useState(null);
  const socketInitialized = useRef(false);
  const [hostLeft,toggleHostLeft] = useState(false);

  // Authentication check and redirect
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      AccessDeniedScreenComponent(
        darkMode,
        navigate,
        "/login",
        4,
        "Access Denied",
        "Please log in to access the room.",
        "Redirecting in"
      );
      const timer = setTimeout(() => {
        navigate("/login", {
          state: {
            message: "Please log in to access the room.",
            redirectFrom: "/room",
          },
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show notification with auto-dismiss
  const showNotification = useCallback((message, type = "info") => {
    setNotification({
      message,
      type,
      timestamp: new Date().toLocaleTimeString(),
    });

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  }, []);
  

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated && userData && roomId && !socketInitialized.current) {
      socketInitialized.current = true;
      //validtion check for roomId and user
      dispatch(setLoading(true));
      // const url = `http://localhost:5000/room/${roomId}`;
      const url = `${String(import.meta.env.VITE_API_URL)}/room/${roomId}`;
      axios
        .get(url, {
          params: { user: userData }, // Send userId for backend validation
          withCredentials: true,
        })
        .then((response) => {
          if (response.data.status === "error") {
            console.log("Frontend error ");
            navigate("/join", {
              state: {
                message: response.data.message,
              },
            });
          } else if (response.data.status === "warning") {
            console.log("Frontend warning ");
            navigate("/join", {
              state: {
                message: response.data.message,
              },
            });
          } else if (response.data.status === "success") {
            showSuccessToast(response.data.message); //show like welcome to the meeting

            setHost((prev) => response.data.host); // set actual host in this state
            setIsHost((prev) => response.data.host._id === userData._id); // set the current user state that he is host or not
            console.log(
              `for meeting ${roomId} Host is ${response.data.host.fullname}`
            );
            console.log(
              `${userData.fullname} is ${
                response.data.host._id === userData._id ? "Host" : "Not Host"
              }`
            );

            // const socketOptions = {
            //   path: "/socket.io",
            //   autoConnect: true,
            //   withCredentials: true,
            //   transports: ["websocket", "polling"],
            //   reconnection: true,
            //   reconnectionAttempts: 5,
            //   reconnectionDelay: 3000,
            //   forceNew: false,
            //   timeout: 10000,
            //   secure: process.env.NODE_ENV === "production",
            //   rejectUnauthorized: false
            // };
            if (isLoading) return;
            const socketOptions = {
              transports: ["websocket", "polling"],
              reconnectionAttempts: 5,
            };

            // socketRef.current = io("http://localhost:5000", socketOptions);
            socketRef.current = io(`${String(import.meta.env.VITE_API_URL)}`, socketOptions);

            // Handle connection errors
            socketRef.current.on("connect_error", (err) => {
              console.error("Socket connection error:", err.message);
              showErrorToast(
                "Failed to connect to the server. Please try again."
              );
              navigate("/join", {
                state: {
                  message: "Failed to connect to the server. Please try again.",
                },
              });
            });
            // Join room when socket is connected

            socketRef.current.emit("join-room", {
              roomId,
              user: {
                ...userData,
                isHost: response.data.host._id === userData._id,
                isMicOn,
                isCameraOn,
              },
            });
            socketRef.current.on("room-state", (data) => {
              setParticipants((prev) => data.roomUsers);
              setCode((prev) => data.code);
              setLanguage((prev) => data.language);
              setMessages((prev) => data.messages);
              setIsHost((prev) => data.isHost);
            });

            socketRef.current.on("user-joined", (data) => {
              // Show notification for user joining
              if (data.user) {
                showNotification(
                  `${data.user?.fullname || "unknown"} joined the room`,
                  "success"
                );
              }
              setParticipants(data.roomUsers);
            });

            // Socket event listeners
            socketRef.current.on("code-update", (newCode) => {
              console.log("New Code Update Received", newCode);

              setCode(newCode);
            });

            socketRef.current.on("language-update", (newLanguage, user) => {
              showNotification(
                `Language updated to ${newLanguage} by ${user.fullname}`
              );

              console.log("New Language  Update Received", newLanguage);
              setLanguage(newLanguage);
            });
            //messagedata is an array of objects
            socketRef.current.on("new-message", (messageData) => {
              console.log("New message received", messageData);
              setMessages(messageData);
              if (!showSidebar)
                showNotification(
                  `${messageData.sender.fullname} sent a message in chats`,
                  "info"
                );
            });

            socketRef.current.on("user-left", (data) => {
              setParticipants(data.roomUsers);

              // Show notification for user leaving
              if (data.user && data.user._id !== userData._id) {
                showNotification(`${data.user.fullname} left the room`, "info");
              }
            });

            socketRef.current.on("user-typing", (username) => {
              setTypingContent(`${username} is Typing...`);
              setIsTyping(true);

              // Clear previous timeout
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }

              // Set new timeout
              typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
              }, 1000);
            });

            socketRef.current.on("room-closed", () => {
              console.log("Host left the room. The session is ending.");
             toggleHostLeft((prev)=>!prev);
              // showNotification(
              //   "The host left the room. The session is ending.",
              //   "error"
              // );
              // // socketRef.current.disconnect();// this is done when we redirect to homepage auto via unmount state using return

              // // Redirect after a delay to allow seeing the notification
              // setTimeout(() => {
              //   navigate("/");
              // }, 3000);
            });

            socketRef.current.on("user-blocked", (user) => {
              if (user._id === userData._id) {
                AccessDeniedScreenComponent(
                  darkMode,
                  navigate,
                  "/login",
                  3,
                  "Access Denied",
                  "Please ask the Host to Unblocked you from the Meeting.",
                  "Redirecting in"
                );
              } else {
                showNotification(
                  `User ${user.fullname} has been blocked from this room.`,
                  "error"
                );
              }
            });
          }
          // Create room link
          setRoomLink(`${window.location.origin}/room/${roomId}`);
        })
        .catch((err) => {
          console.log("Frontend catch error ");
          err.response?.data?.message || "Something went wrong!";
          navigate("/join", {
            state: {
              message: err.response?.data?.message || "Something went wrong!",
            },
          });
        })
        .finally(() => {
          dispatch(setLoading(false));
        });

      // Clean up function when unmounts from this website
      return () => {
        if (socketRef?.current) {
          socketRef.current.emit("leave-room");
          socketRef.current.off("code-update");
          socketRef.current.off("language-update");
          socketRef.current.off("new-message");
          socketRef.current.off("user-joined");
          socketRef.current.off("user-left");
          socketRef.current.off("user-typing");
          socketRef.current.off("room-closed");
          socketRef.current.off("user-blocked");
          socketRef.current.disconnect();
        }
        if (typingTimeoutRef?.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      };
    }
  }, [isAuthenticated, userData, roomId, navigate, showNotification, dispatch]);

  // Handle full screen ESC notification
  useEffect(() => {
    if (isFullScreenApp) {
      setShowEscNotification(true);
      const timer = setTimeout(() => {
        setShowEscNotification(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isFullScreenApp]);

  // UI control functions
  const toggleCamera = useCallback(() => setIsCameraOn((prev) => !prev), []);
  const toggleMic = useCallback(() => setIsMicOn((prev) => !prev), []);
  const toggleFullScreenApp = useCallback(
    () => setIsFullScreenApp((prev) => !prev),
    []
  );

  const shareRoomLink = useCallback(
    (flag) => {
      setShowCopyPopup(flag);
      if (!flag) return;
      navigator.clipboard.writeText(roomLink).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    },
    [roomLink]
  );

  const toggleSidebar = useCallback(
    (content) => {
      setShowSidebar((prev) => {
        // If the sidebar is already open and the same content is clicked, close it
        if (prev && sidebarContent === content) {
          return false;
        } else {
          setSidebarContent(content);

          return true;
        }
      });
    },
    [sidebarContent]
  );

  const closeCopyPopup = useCallback(() => {
    setShowCopyPopup(false);
    setIsCopied(false);
  }, []);

  // Loading screen
  if (isLoading) {
    return (
      <LoadingScreen title="Loading" message="Verifying your credentials..." />
    );
  }

  // Access denied screen
  if (!isAuthenticated) {
    return (
      <AccessDeniedScreenComponent darkMode={darkMode} navigate={navigate} />
    );
  }
 

  return (
    <div
      className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 ${
        darkMode
          ? "bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white"
          : "bg-gradient-to-br from-white via-blue-50 to-indigo-100 text-gray-800"
      }`}
      style={{
        position: isFullScreenApp ? "fixed" : "relative",
        top: isFullScreenApp ? 0 : "auto",
        left: isFullScreenApp ? 0 : "auto",
        right: isFullScreenApp ? 0 : "auto",
        bottom: isFullScreenApp ? 0 : "auto",
        zIndex: isFullScreenApp ? 9999 : "auto",
        height: isFullScreenApp ? "100vh" : "100vh",
        width: isFullScreenApp ? "100vw" : "100%",
      }}
    >
       {hostLeft && (
      <LeaveRoomComponent
        darkMode={darkMode}
        navigate={navigate}
        socket={socketRef.current}
        title={"Room Closed"}
        message={"Host has Left the Meeting, You Will be Redirected. You can Save the Code Meanwhile"}
        showCloseButton={true}
        showButtons={false}
        initialRedirecting={true}
        initialCountDown={4}
      />
    )}

      {!isFullScreenApp && <Header />}

      <div className="flex flex-grow overflow-hidden relative">
        <ControlBar
          isCameraOn={isCameraOn}
          toggleCamera={toggleCamera}
          isMicOn={isMicOn}
          toggleMic={toggleMic}
          sidebarContent={sidebarContent}
          toggleSidebar={toggleSidebar}
          showSidebar={showSidebar}
          shareRoomLink={shareRoomLink}
          isFullScreenApp={isFullScreenApp}
          toggleFullScreenApp={toggleFullScreenApp}
          darkMode={darkMode}
          isHost={isHost}
        />

        <AnimatePresence>
          {showEscNotification && (
            <EscNotification
              show={isFullScreenApp}
              darkMode={darkMode}
              onClose={() => setShowEscNotification(false)}
            />
          )}
        </AnimatePresence>

        {/* User notification system */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`absolute top-4 right-4 z-50 p-3 rounded-lg shadow-lg ${
                notification.type === "success"
                  ? "bg-green-600 text-white"
                  : notification.type === "error"
                  ? "bg-red-600 text-white"
                  : "bg-yellow-300 text-white"
              }`}
            >
              <div className="flex items-center">
                <span className="font-medium mr-2">
                  {notification.timestamp}
                </span>
                <span>{notification.message}</span>
                <button
                  onClick={() => setNotification(null)}
                  className="ml-4 text-white hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={`transition-all duration-300 ease-in-out ${
            showSidebar &&
            (sidebarContent === "participants" || sidebarContent === "messages")
              ? "w-[calc(100%-21rem)]"
              : "w-[calc(100%-4rem)]"
          }`}
          ref={codeEditorRef}
        >
          <CodeEditor
            className="h-full rounded-none"
            parentIsFullScreen={isFullScreenApp}
            code={code}
            language={language}
            setCode={setCode}
            setLanguage={setLanguage}
            roomId={roomId}
            socket={socketRef.current}
            isTyping={isTyping}
            typingContent={typingContent}
          />
        </div>

        <AnimatePresence>
          {showSidebar && (
            <Sidebar
              show={true}
              navigate={navigate}
              content={sidebarContent}
              onClose={() => setShowSidebar(false)}
              socket={socketRef.current}
              roomId={roomId}
              participants={participants}
              messages={messages}
              setMessages={setMessages}
              host={host}
              setHost={setHost}
              darkMode={darkMode}
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showCopyPopup && (
          <ShareLinkPopup
            show={true}
            roomLink={roomLink}
            isCopied={isCopied}
            setIsCopied={setIsCopied}
            onClose={closeCopyPopup}
            darkMode={darkMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoomPage;

const AccessDeniedScreenComponent = (
  darkMode,
  navigate,
  redirectPath,
  redirectTimer,
  title,
  message,
  redirectMessage,
  redirectState = {}
) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="w-full h-full flex flex-col flex-grow">
        <AccessDeniedScreen
          darkMode={darkMode}
          navigate={navigate}
          title={title}
          redirectPath={redirectPath}
          redirectMessage={redirectMessage}
          redirectTimer={redirectTimer}
          redirectState={redirectState}
          message={message}
        />
      </main>
      <Footer />
    </div>
  );
};

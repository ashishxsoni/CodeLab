// utils/toast.jsx
import { toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Configure toast defaults
const toastConfig = {
  position: "top-center",
  autoClose: 2000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: false,
  draggable: false,
  progress: undefined,
  transition: Slide,
  className: "rounded-md",
  closeButton: ({ closeToast }) => (
    <button 
      onClick={closeToast} 
      className="text-gray-600 hover:text-gray-800 focus:outline-none"
    >
      ×
    </button>
  )
};

// Success toast function
export const showSuccessToast = (message) => {
  toast.success(message, {
    ...toastConfig,
    className: "bg-white border-l-4 border-green-500"
  });
};

// Error toast function
export const showErrorToast = (message) => {
  toast.error(message, {
    ...toastConfig,
    className: "bg-white border-l-4 border-red-500"
  });
};

// Info toast function (optional)
export const showInfoToast = (message) => {
  toast.info(message, {
    ...toastConfig,
    className: "bg-white border-l-4 border-blue-500"
  });
};

// Warning toast function (optional)
export const showWarningToast = (message) => {
  toast.warning(message, {
    ...toastConfig,
    className: "bg-white border-l-4 border-yellow-500"
  });
};
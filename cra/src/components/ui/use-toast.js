// src/components/ui/use-toast.js
import { createContext, useContext, useState } from "react";
import { ToastActionElement } from "./toast";

const ToastContext = createContext({});

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const toast = ({
    title,
    description,
    action,
    variant = "default",
    duration = 5000, // 5 seconds default
  }) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    const newToast = {
      id,
      title,
      description,
      action,
      variant,
      duration,
    };
    
    setToasts((prevToasts) => [...prevToasts, newToast]);
    
    // Auto dismiss after duration
    if (duration) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
    
    return id;
  };
  
  const dismissToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast, dismissToast, toasts }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  
  return context;
};
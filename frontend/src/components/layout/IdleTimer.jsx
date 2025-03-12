// frontend/src/components/utils/IdleTimer.jsx
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { MAX_IDLE_TIME } from '../../config';

// Component to handle user inactivity and auto logout
const IdleTimer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  // Reference to the timer
  const idleTimerRef = useRef(null);
  
  // Reset the timer when user interacts with the page
  const resetTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    
    if (isAuthenticated) {
      // Set a new timer for auto logout
      idleTimerRef.current = setTimeout(() => {
        // Log out the user after idle time
        dispatch(logout());
        navigate('/login', { state: { from: window.location.pathname, reason: 'idle' } });
      }, MAX_IDLE_TIME * 60 * 1000); // Convert minutes to milliseconds
    }
  };
  
  useEffect(() => {
    // Only set up the timer if the user is authenticated
    if (isAuthenticated) {
      // Set initial timer
      resetTimer();
      
      // Add event listeners for user activity
      const events = [
        'mousedown',
        'mousemove',
        'keypress',
        'scroll',
        'touchstart',
        'click',
      ];
      
      // Attach event listeners
      events.forEach((event) => {
        document.addEventListener(event, resetTimer);
      });
      
      // Clean up
      return () => {
        if (idleTimerRef.current) {
          clearTimeout(idleTimerRef.current);
        }
        
        // Remove event listeners
        events.forEach((event) => {
          document.removeEventListener(event, resetTimer);
        });
      };
    }
  }, [isAuthenticated]);
  
  // This component doesn't render anything
  return null;
};

export default IdleTimer;

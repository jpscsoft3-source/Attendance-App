import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function useForceLogout() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === "activeUser") {
        const currentUser = localStorage.getItem("username");
        const newUser = event.newValue;

        if (currentUser && newUser && currentUser !== newUser) {
          toast.warning("You have been logged out because another user logged in.");
          localStorage.clear();
          navigate("/");
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [navigate]);
}

export default useForceLogout;

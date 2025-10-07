import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to campaign hub
    navigate("/campaign-hub");
  }, [navigate]);

  return null;
};

export default Index;

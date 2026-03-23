import { useEffect } from "react";
import { useLocation } from "wouter";

export default function WareMHD() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate("/marktplan", { replace: true }); }, []);
  return null;
}

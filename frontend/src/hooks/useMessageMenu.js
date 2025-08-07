import { useRef, useEffect, useState } from "react";

export default function useMessageMenu() {
  const messageRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shouldOpenUpwards, setShouldOpenUpwards] = useState(false);

  const openMenu = () => setMenuOpen(true);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (menuOpen && messageRef.current) {
      const rect = messageRef.current.getBoundingClientRect();
      const distanceFromBottom = window.innerHeight - rect.bottom;
      setShouldOpenUpwards(distanceFromBottom < 200);
    }
  }, [menuOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!messageRef.current?.contains(e.target)) {
        closeMenu();
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return {
    messageRef,
    menuOpen,
    shouldOpenUpwards,
    openMenu,
    closeMenu,
  };
}

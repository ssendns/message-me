import { useRef, useEffect, useState } from "react";

export default function useMessageMenu() {
  const messageRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shouldOpenUpwards, setShouldOpenUpwards] = useState(false);

  const openMenu = () => setMenuOpen(true);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen || !messageRef.current) return;

    const { bottom } = messageRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - bottom;

    setShouldOpenUpwards(spaceBelow < 200);
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

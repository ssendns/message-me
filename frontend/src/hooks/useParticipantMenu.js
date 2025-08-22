import { useEffect, useRef, useState } from "react";

export default function useParticipantMenu() {
  const rowRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);

  const openMenu = () => setOpen(true);
  const closeMenu = () => setOpen(false);
  const toggleMenu = () => setOpen((v) => !v);

  useEffect(() => {
    if (!open || !rowRef.current) return;
    const { bottom } = rowRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - bottom;
    setOpenUpwards(spaceBelow < 180);
  }, [open]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!rowRef.current?.contains(e.target)) closeMenu();
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return { rowRef, open, openUpwards, openMenu, closeMenu, toggleMenu };
}

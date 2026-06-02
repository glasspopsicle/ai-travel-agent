
import { useState, useEffect } from "react";

export function useLocationHashName() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onHashChange = () => {
      setHash(
        window.location.hash.substring(
          window.location.hash.lastIndexOf("#") + 1,
        ),
      );
    };
    window.addEventListener("hashchange", onHashChange);
    onHashChange();
    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);
  useEffect(() => {
    window.location.hash = "#" + hash.substring(hash.lastIndexOf("#") + 1);
  }, [hash]);
  return [hash, setHash];
}


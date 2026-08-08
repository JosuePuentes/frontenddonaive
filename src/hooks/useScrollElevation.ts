import { useEffect, useState } from "react";

type UseScrollElevationOptions = {
  threshold?: number;
};

function useScrollElevation({
  threshold = 12,
}: UseScrollElevationOptions = {}) {
  const [isElevated, setIsElevated] = useState(false);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      setIsElevated(window.scrollY > threshold);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [threshold]);

  return isElevated;
}

export { useScrollElevation };

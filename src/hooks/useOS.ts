import { useState, useEffect } from "react";

interface UseOSReturn {
  isMacOS: boolean;
  isWindows: boolean;
  isLinux: boolean;
  isMobile: boolean;
  platform: string;
}

export const useOS = (): UseOSReturn => {
  const [osInfo, setOsInfo] = useState<UseOSReturn>({
    isMacOS: false,
    isWindows: false,
    isLinux: false,
    isMobile: false,
    platform: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const platform = navigator.platform.toUpperCase();
    const userAgent = navigator.userAgent.toLowerCase();

    const isMacOS = platform.indexOf("MAC") >= 0;
    const isWindows = platform.indexOf("WIN") >= 0;
    const isLinux = platform.indexOf("LINUX") >= 0;
    const isMobile =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent
      );

    setOsInfo({
      isMacOS,
      isWindows,
      isLinux,
      isMobile,
      platform: navigator.platform,
    });
  }, []);

  return osInfo;
};

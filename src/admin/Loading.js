import React from "react";

const LoadingOverlay = ({ message = "Loading, please wait..." }) => {
  return (
    <div style={styles.overlay}>
      <div style={styles.box}>
        <img src="/logo_meeo.png" alt="Loading..." style={styles.logo} />
        <p style={styles.text}>{message}</p>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(17, 24, 39, 0.9)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000,
  },
  box: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1.2rem",
    background: "rgba(31,41,55,0.85)",
    padding: "2rem 3rem",
    borderRadius: "1rem",
    boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
    backdropFilter: "blur(8px)",
    animation: "zoomLift 0.6s ease-in-out",
  },
  logo: {
    width: "100px",
    height: "100px",
    objectFit: "cover",
    borderRadius: "50%",
    animation: "pulse 2s infinite ease-in-out",
  },
  text: {
    color: "#f9fafb",
    fontSize: "1.1rem",
    fontWeight: "600",
    letterSpacing: "0.5px",
    textShadow: "0 0 6px rgba(96,165,250,0.5)", // soft blue glow
    animation: "waveGlow 2.2s infinite ease-in-out",
  },
};

// 🔹 Animation helper
const addKeyframes = (name, frames) => {
  const styleSheet = document.styleSheets[0];
  if (styleSheet) {
    const rule = `@keyframes ${name} { ${frames} }`;
    styleSheet.insertRule(rule, styleSheet.cssRules.length);
  }
};

// 🔹 Logo animation
addKeyframes(
  "pulse",
  `0%, 100% { transform: scale(1); opacity: 0.9; }
   50% { transform: scale(1.15); opacity: 1; }`
);

// 🔹 Box animation
addKeyframes(
  "zoomLift",
  `0% { transform: scale(0.8) translateY(30px); opacity: 0; }
   60% { transform: scale(1.05) translateY(-5px); opacity: 1; }
   100% { transform: scale(1) translateY(0); }`
);

// 🔹 Text animation (glow + wave effect)
addKeyframes(
  "waveGlow",
  `0%, 100% {
      transform: translateY(0);
      text-shadow: 0 0 6px rgba(96,165,250,0.6);
    }
   50% {
      transform: translateY(-4px);
      text-shadow: 0 0 14px rgba(96,165,250,1);
    }`
);

export default LoadingOverlay;

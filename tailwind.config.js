/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      backdropFilter: {
        none: "none",
        blur: "blur(30px)",
      },
      borderColor: ["focus"],
      ringColor: ["focus"],
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        mont: ["Montserrat", "sans-serif"],
        raleway: ["Raleway", "sans-serif"],
        sui: ["system-ui", "sans-serif"]
      },
      colors: {
        glass: "rgba(240, 245, 255, 0.7)",
        bgGray: "#2F2F2F",
        bgBlack: "#1F1F1F",
        blu: "#004080",
        name: "#B1B1B1",
        flo: "#1b52c1",
        prime: "#071A30", // Correct hex code for blue-950
        second: "#ebeef5",
        box: "#ffffff",
        label: "#172554",
        login: "#ffffff",
        gcolor: "#ab01ea",
        scolor: "rgba(0, 66, 255, 0.08)",
      },
      boxShadow: {
        custom: "rgba(149, 157, 165, 0.2) 0px 8px 24px",
      },
      height: {
        height: "39.5rem",
      },
    },
    variants: {
      backdropFilter: ["responsive"], // Enable backdrop-filter for responsive variants
    },
  },
  plugins: [],
};

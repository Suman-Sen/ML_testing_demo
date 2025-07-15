import React from "react";

export default function NavBar({ logoSrc }: { logoSrc: string }) {
  return (
    <div className="flex p-2 gap-1.5">
      <img src={logoSrc} alt="Classify IQ" className="ml-2.5" width={"60px"}></img>
      <span className="text-5xl font-bold font-mono">ClassifyIQ</span>
    </div>
  );
}

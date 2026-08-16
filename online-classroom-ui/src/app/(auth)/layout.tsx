
import React from "react";
export default function Authpage({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
   
    <div className="min-h-screen bg-background">
          {children}
    </div>
 
  );
}
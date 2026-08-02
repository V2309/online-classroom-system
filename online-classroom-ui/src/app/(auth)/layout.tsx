
import React from "react";
export default function Authpage({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
   
    <div className="bg-gray-100">
          {children}
    </div>
 
  );
}
"use client";

import { useEffect, useState } from "react";

export default function ProvinceSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const [provinces, setProvinces] = useState<{ code: number; name: string }[]>([]);

  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/p/")
      .then((res) => res.json())
      .then((data) => setProvinces(data))
      .catch((err) => console.error("Error loading provinces:", err));
  }, []);

  return (
    <select
      id="province"
      name="province"
      required
      className="w-full bg-card text-foreground border border-border rounded-2xl px-3.5 py-2 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition outline-none shadow-2xs h-[38px] sm:h-[42px]"
      defaultValue=""
      {...props}
    >
      <option value="" disabled>
        Chọn Tỉnh / TP
      </option>
      {provinces.map((province) => (
        <option key={province.code} value={province.name}>
          {province.name}
        </option>
      ))}
    </select>
  );
}
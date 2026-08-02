import { useEffect, useState } from "react";

export default function ProvinceSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const [provinces, setProvinces] = useState<{ code: number; name: string }[]>([]);

  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/p/")
      .then((res) => res.json())
      .then((data) => setProvinces(data));
  }, []);

  return (
    <select
      id="province"
      name="province"
      required
      className="w-full h-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
      defaultValue=""
      {...props}
    >
      <option value="" disabled>
         Tỉnh/Thành phố
      </option>
      {provinces.map((province) => (
        <option key={province.code} value={province.name}>
          {province.name}
        </option>
      ))}
    </select>
  );
}
import React, { useEffect, useState } from "react";
import ValidateStatus from "./ValidateStatus";
import AQIDashboard from "./AQIDashboard";

const DataDashboard = () => {
  const [aqi, setAqi] = useState(null);
  const [city, setCity] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [pollutionSources, setPollutionSources] = useState([]);
  const [validation, setValidation] = useState(null);

  const API_KEY = "35dabf98-d383-44c3-add8-7f699dc32bcc"; // replace with real

  useEffect(() => {
    const fetchData = async () => {
      try {
        const loc = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) =>
              resolve({
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
              }),
            reject
          );
        });

        const url = `https://api.airvisual.com/v2/nearest_city?lat=${loc.lat}&lon=${loc.lon}&key=${API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === "success" && data.data?.current?.pollution) {
          const pollution = data.data.current.pollution;
          setAqi(pollution);
          setCity(`${data.data.city}, ${data.data.country}`);

          // Mock data for sources
          const co = 40,
            no2 = 30,
            waste = 20,
            noise = 10;
          const total = co + no2 + waste + noise;

          setPollutionSources([
            {
              name: "Vehicles",
              value: parseFloat(((co / total) * 100).toFixed(1)),
            },
            {
              name: "Factories",
              value: parseFloat(((no2 / total) * 100).toFixed(1)),
            },
            {
              name: "Waste Burning",
              value: parseFloat(((waste / total) * 100).toFixed(1)),
            },
            {
              name: "Noise",
              value: parseFloat(((noise / total) * 100).toFixed(1)),
            },
          ]);

          // Mock trend data
          const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          const baseAqi = pollution.aqius || 100;
          const randomTrend = days.map((day) => ({
            day,
            aqi: Math.max(10, baseAqi + Math.floor(Math.random() * 40 - 20)),
          }));
          setTrendData(randomTrend);
        }
      } catch (err) {
        console.error("Error fetching AQI:", err);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 text-gray-800">
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold mb-6 text-blue-700 drop-shadow-sm">
          🌍 Pollution Dashboard
        </h1>

        {/* Validation Component */}
        <div className="bg-white border border-blue-100 p-4 rounded-xl shadow-sm hover:shadow-md transition">
          <ValidateStatus onValidate={setValidation} />
        </div>

        {/* AQI Dashboard */}
        <div className="bg-white border border-blue-100 p-4 rounded-xl shadow-sm hover:shadow-md transition">
          <AQIDashboard
            aqi={aqi}
            city={city}
            pollutionSources={pollutionSources}
            trendData={trendData}
            validation={validation}
          />
        </div>
      </div>
    </div>
  );
};

export default DataDashboard;

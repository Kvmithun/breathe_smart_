import CitizenAQI from "./CitizenAQI";
import CitizenImageReport from "./CitizenImageReport";

export default function CitizenPortal() {
  // 🔑 Get user from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="min-h-screen w-full bg-gradient-to-r from-green-100 via-white to-green-200 text-gray-800 px-6 py-10">
      {/* Header */}
      <header className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-wide bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent drop-shadow-sm">
          🧑‍🤝‍🧑 Citizen Portal
        </h1>
        {user?.name && (
          <p className="mt-2 text-lg text-gray-700">
            Welcome, <span className="font-semibold text-green-700">{user.name}</span> 👋
          </p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          Stay informed. Stay safe. Take action.
        </p>
      </header>

      {/* Content Grid */}
      <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* AQI Module */}
        <section className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-md border border-gray-200 hover:shadow-lg transition">
          <CitizenAQI />
        </section>

        {/* Citizen Image Report Module */}
        <section className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-md border border-gray-200 hover:shadow-lg transition">
          <CitizenImageReport />
        </section>
      </main>
    </div>
  );
}

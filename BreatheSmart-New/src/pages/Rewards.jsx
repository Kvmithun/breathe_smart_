import React from "react";
import { motion } from "framer-motion";
import { Medal, Award, Trophy, TreePine } from "lucide-react";

export default function RewardsPage() {
  const rewards = [
    {
      id: 1,
      title: "Eco Warrior",
      description: "Reported 10 pollution issues",
      icon: <Medal className="w-10 h-10 text-yellow-500" />,
      points: 100,
    },
    {
      id: 2,
      title: "Tree Planter",
      description: "Pledged to plant 5 trees",
      icon: <TreePine className="w-10 h-10 text-green-600" />,
      points: 50,
    },
    {
      id: 3,
      title: "Smog Reporter",
      description: "Uploaded vehicle smoke evidence",
      icon: <Award className="w-10 h-10 text-blue-500" />,
      points: 30,
    },
    {
      id: 4,
      title: "Community Hero",
      description: "Shared eco-friendly tips",
      icon: <Trophy className="w-10 h-10 text-orange-500" />,
      points: 80,
    },
  ];

  return (
    <motion.div
      className="min-h-screen w-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 text-slate-800"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="p-6 w-full max-w-6xl mx-auto">
        <motion.h1
          className="text-3xl font-bold mb-6 text-center text-blue-600"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          🏆 Your Rewards
        </motion.h1>

        {/* Rewards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward, index) => (
            <motion.div
              key={reward.id}
              className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center text-center border border-slate-200"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              whileHover={{ scale: 1.05 }}
            >
              {reward.icon}
              <h2 className="text-xl font-bold mt-4 text-slate-800">{reward.title}</h2>
              <p className="text-slate-500">{reward.description}</p>
              <span className="mt-3 px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                {reward.points} Points
              </span>
            </motion.div>
          ))}
        </div>

        {/* Leaderboard */}
        <motion.div
          className="mt-10 bg-white p-6 rounded-xl shadow-md border border-slate-200"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">🌍 Leaderboard</h2>
          <ul className="space-y-3">
            <li className="flex justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span>1️⃣ Udhay</span>
              <span className="font-bold text-green-600">300 pts</span>
            </li>
            <li className="flex justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span>2️⃣ Priya</span>
              <span className="font-bold text-yellow-600">250 pts</span>
            </li>
            <li className="flex justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span>3️⃣ Arjun</span>
              <span className="font-bold text-orange-600">220 pts</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </motion.div>
  );
}

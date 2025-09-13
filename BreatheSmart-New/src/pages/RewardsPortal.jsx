import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE; // ✅ use from .env

export default function RewardsPortal() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState({});

  const token = localStorage.getItem("access_token");

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/reports/leaderboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLeaderboard(res.data);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const handleApprove = async (user) => {
    setApproving((prev) => ({ ...prev, [user.username]: true }));
    try {
      await axios.post(
        `${API_BASE}/api/rewards/approve`,
        {
          user_id: user.username,
          reward_type: "Amazon Voucher 🎁",
          reward_value: user.green_credits,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert(`Reward approved for ${user.username}`);
    } catch (error) {
      console.error("Error approving reward:", error);
      alert("Failed to approve reward");
    } finally {
      setApproving((prev) => ({ ...prev, [user.username]: false }));
    }
  };

  const medals = ["🥇", "🥈", "🥉", "🎖️", "🏅"];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Rewards Portal (Admin)</h1>
      <p className="mb-6">
        Government admin can approve rewards for top 5 leaderboard members.
      </p>

      {loading ? (
        <p>Loading leaderboard...</p>
      ) : (
        <div className="bg-gray-100 rounded-lg shadow-md p-4">
          {leaderboard.length === 0 ? (
            <p>No leaderboard data available.</p>
          ) : (
            <ul className="space-y-2">
              {leaderboard.slice(0, 5).map((user, index) => (
                <li
                  key={user.username}
                  className="flex justify-between items-center p-2 bg-white rounded shadow-sm"
                >
                  <span>
                    {medals[index] || "⭐"} {user.username}
                  </span>
                  <span className="font-semibold">{user.green_credits} credits</span>

                  <button
                    onClick={() => handleApprove(user)}
                    disabled={approving[user.username]}
                    className="ml-4 px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                  >
                    {approving[user.username] ? "Approving..." : "Approve Reward"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

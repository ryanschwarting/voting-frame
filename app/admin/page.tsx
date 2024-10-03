"use client";

import { useState, useEffect } from "react";

export default function AdminPage() {
  const [data, setData] = useState<any>(null);
  const [resetUserId, setResetUserId] = useState("");
  const [voteId, setVoteId] = useState("");
  const [voteData, setVoteData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    fetch("/api/admin")
      .then((response) => response.json())
      .then((data) => setData(data))
      .catch((error) => console.error("Error fetching data:", error));
  };

  const handleReset = async (action: string) => {
    try {
      const body =
        action === "reset-user"
          ? JSON.stringify({ action, userId: resetUserId })
          : action === "reset-vote"
          ? JSON.stringify({ action, voteId })
          : JSON.stringify({ action });

      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (response.ok) {
        alert("Reset successful");
        fetchData(); // Refresh the data
        if (action === "reset-user") setResetUserId("");
        if (action === "reset-vote") setVoteId("");
      } else {
        alert("Failed to reset");
      }
    } catch (error) {
      console.error("Error resetting:", error);
      alert("Error resetting");
    }
  };

  const handleLookupVote = async () => {
    try {
      const response = await fetch(`/api/admin/vote/${voteId}`);
      if (response.ok) {
        const data = await response.json();
        setVoteData(data);
      } else {
        alert("Failed to fetch vote data");
        setVoteData(null);
      }
    } catch (error) {
      console.error("Error looking up vote:", error);
      alert("Error looking up vote");
    }
  };

  if (!data) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Reset Vote</h2>
        <input
          type="text"
          value={voteId}
          onChange={(e) => setVoteId(e.target.value)}
          placeholder="Enter vote ID to reset"
          className="border p-2 mr-2"
        />
        <button
          onClick={() => handleReset("reset-vote")}
          className="bg-red-500 text-white p-2 rounded"
        >
          Reset Vote
        </button>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Look Up Vote</h2>
        <input
          type="text"
          value={voteId}
          onChange={(e) => setVoteId(e.target.value)}
          placeholder="Enter vote ID to look up"
          className="border p-2 mr-2"
        />
        <button
          onClick={handleLookupVote}
          className="bg-blue-500 text-white p-2 rounded"
        >
          Look Up Vote
        </button>
      </div>

      {voteData && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Vote Data:</h3>
          <pre>{JSON.stringify(voteData, null, 2)}</pre>
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Reset User</h2>
        <input
          type="text"
          value={resetUserId}
          onChange={(e) => setResetUserId(e.target.value)}
          placeholder="Enter user ID to reset"
          className="border p-2 mr-2"
        />
        <button
          onClick={() => handleReset("reset-user")}
          className="bg-yellow-500 text-white p-2 rounded"
        >
          Reset User
        </button>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Global Actions</h2>
        <button
          onClick={() => handleReset("reset-all")}
          className="bg-red-700 text-white p-2 rounded mr-2"
        >
          Reset All Data
        </button>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Voted Users:</h2>
        <ul className="list-disc pl-5">
          {data.votedUsers.map((user: string) => (
            <li key={user}>{user}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

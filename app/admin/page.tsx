"use client";

import { useState, useEffect } from "react";

export default function AdminPage() {
  const [data, setData] = useState<any>(null);
  const [resetUserId, setResetUserId] = useState("");

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
      } else {
        alert("Failed to reset");
      }
    } catch (error) {
      console.error("Error resetting:", error);
      alert("Error resetting");
    }
  };

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>
        Yes Votes: {data.yesVotes}{" "}
        <button onClick={() => handleReset("reset-yes")}>
          Reset Yes Votes
        </button>
      </p>
      <p>
        No Votes: {data.noVotes}{" "}
        <button onClick={() => handleReset("reset-no")}>Reset No Votes</button>
      </p>
      <h2>Voted Users:</h2>
      <ul>
        {data.votedUsers.map((user: string) => (
          <li key={user}>{user}</li>
        ))}
      </ul>
      <div>
        <input
          type="text"
          value={resetUserId}
          onChange={(e) => setResetUserId(e.target.value)}
          placeholder="Enter user ID to reset"
        />
        <button onClick={() => handleReset("reset-user")}>Reset User</button>
      </div>
      <div style={{ marginTop: "20px" }}>
        <button onClick={() => handleReset("reset-all")}>Reset All Data</button>
      </div>
    </div>
  );
}

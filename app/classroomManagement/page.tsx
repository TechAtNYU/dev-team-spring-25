"use client";

import { useState } from "react";
import "./classroomManagement.css"; // Import the CSS file that contains your hstack class

export default function ClassroomManagementPage() {
  const [message, setMessage] = useState("");

  const [adminClassrooms, setAdminClassrooms] = useState([
    "Class 1",
    "Class 2",
    "Class 3",
  ]);

  const handleAddClassroom = () => {
    setMessage("Classroom Added!");
    console.log("Hey"); // Update state to display message
    const newClassroom = `Class ${adminClassrooms.length + 1}`; // Dynamically add classroom names
    setAdminClassrooms([...adminClassrooms, newClassroom]);
    setMessage(`${newClassroom} Added!`);
  };

  const handleDeleteClassroom = () => {
    setMessage("Classroom Deleted!"); // Update state to display delete message
  };

  return (
    <div>
      <h1>My Classrooms:</h1>
      <div className="hstack">
        <h1>List Classrooms</h1>
        <button onClick={handleAddClassroom}>Add Classroom</button>
      </div>

      <div className="hstack">
        <h1>Class 1</h1>
        <button onClick={handleDeleteClassroom}>Add Classroom</button>
      </div>

      {/* Conditionally render the message */}
      {message && <p>{message}</p>}
    </div>
  );
}

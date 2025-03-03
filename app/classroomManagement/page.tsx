"use client";

import { useState, useEffect } from "react";
import {
  classroomApi,
  membersApi,
  userApi,
  Classroom,
  User,
} from "../lib/supabase-api";

export default function ClassroomManagement() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [members, setMembers] = useState<{ [key: number]: User[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [currentClassroom, setCurrentClassroom] = useState<Classroom | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    metadata: {} as Record<string, unknown>,
  });

  const [memberEmail, setMemberEmail] = useState("");
  const [selectedClassroomId, setSelectedClassroomId] = useState<number | null>(
    null
  );
  const [adminStatus, setAdminStatus] = useState<{ [key: number]: boolean }>(
    {}
  );

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchedClassrooms = await classroomApi.getClassrooms();
      setClassrooms(fetchedClassrooms);
      const membersByClassroom: { [key: number]: User[] } = {};
      const adminStatusByClassroom: { [key: number]: boolean } = {};

      for (const classroom of fetchedClassrooms) {
        const classroomMembers = await membersApi.getClassroomMembers(
          classroom.id
        );
        membersByClassroom[classroom.id] = classroomMembers;

        adminStatusByClassroom[classroom.id] =
          await userApi.isClassroomAdmin(classroom);
      }

      setMembers(membersByClassroom);
      setAdminStatus(adminStatusByClassroom);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(
        `Failed to load classrooms: ${err instanceof Error ? err.message : "Please try again."}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClassroom = async () => {
    try {
      const newClassroom = await classroomApi.createClassroom(
        formData.name,
        formData.metadata || {}
      );

      setClassrooms([...classrooms, newClassroom]);
      setMembers({ ...members, [newClassroom.id]: [] });
      resetForm();
    } catch (err) {
      console.error("Error creating classroom:", err);
      setError(
        `Failed to create classroom: ${err instanceof Error ? err.message : "Please try again."}`
      );
    }
  };

  const handleUpdateClassroom = async () => {
    if (!currentClassroom) return;

    try {
      const updatedClassroom = await classroomApi.updateClassroom(
        currentClassroom.id,
        formData.name,
        formData.metadata || {}
      );

      setClassrooms(
        classrooms.map((c) =>
          c.id === currentClassroom.id ? updatedClassroom : c
        )
      );
      resetForm();
    } catch (err) {
      console.error("Error updating classroom:", err);
      setError(
        `Failed to update classroom: ${err instanceof Error ? err.message : "Please try again."}`
      );
    }
  };

  const handleDeleteClassroom = async (classroomId: number) => {
    if (!window.confirm("Are you sure you want to delete this classroom?"))
      return;

    try {
      await classroomApi.deleteClassroom(classroomId);

      setClassrooms(classrooms.filter((c) => c.id !== classroomId));

      const newMembers = { ...members };
      delete newMembers[classroomId];
      setMembers(newMembers);
    } catch (err) {
      console.error("Error deleting classroom:", err);
      setError(
        `Failed to delete classroom: ${err instanceof Error ? err.message : "Please try again."}`
      );
    }
  };

  const handleAddMember = async () => {
    if (!selectedClassroomId || !memberEmail.trim()) return;

    try {
      const newMember = await membersApi.addMember(
        selectedClassroomId,
        memberEmail
      );

      setMembers({
        ...members,
        [selectedClassroomId]: [
          ...(members[selectedClassroomId] || []),
          newMember,
        ],
      });

      setMemberEmail("");
      setSelectedClassroomId(null);
    } catch (err) {
      console.error("Error adding member:", err);
      setError(
        `${err instanceof Error ? err.message : "Failed to add member. Please try again."}`
      );
    }
  };

  const handleRemoveMember = async (classroomId: number, userId: string) => {
    try {
      await membersApi.removeMember(classroomId, userId);

      setMembers({
        ...members,
        [classroomId]: members[classroomId].filter(
          (user) => user.id !== userId
        ),
      });
    } catch (err) {
      console.error("Error removing member:", err);
      setError(
        `Failed to remove member: ${err instanceof Error ? err.message : "Please try again."}`
      );
    }
  };

  const editClassroom = (classroom: Classroom) => {
    setCurrentClassroom(classroom);
    setFormData({
      name: classroom.name,
      metadata: classroom.metadata || {},
    });
    setIsEditing(true);
  };

  const resetForm = () => {
    setFormData({ name: "", metadata: {} });
    setCurrentClassroom(null);
    setIsEditing(false);
  };

  const handleJSONChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const metadata = e.target.value ? JSON.parse(e.target.value) : {};
      setFormData({ ...formData, metadata });
    } catch {
      
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-black">
            Classroom Management
          </h1>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-black">
            <p>{error}</p>
            <button
              className="ml-2 text-sm text-black underline"
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="mb-8 rounded-lg bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold text-black">
            {isEditing ? "Edit Classroom" : "Create New Classroom"}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-black">
                Classroom Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-black"
                placeholder="Enter classroom name"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-black">
                Metadata
              </label>
              <textarea
                value={
                  typeof formData.metadata === "object"
                    ? JSON.stringify(formData.metadata, null, 2)
                    : ""
                }
                onChange={handleJSONChange}
                className="h-10 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-black"
                placeholder='{"key": "value"}'
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={
                  isEditing ? handleUpdateClassroom : handleCreateClassroom
                }
                disabled={!formData.name}
                className="rounded bg-blue-600 px-4 py-2 text-black hover:bg-blue-700 disabled:bg-blue-300"
              >
                {isEditing ? "Update Classroom" : "Create Classroom"}
              </button>

              {isEditing && (
                <button
                  onClick={resetForm}
                  className="rounded bg-gray-500 px-4 py-2 text-black hover:bg-gray-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {classrooms.length > 0 && (
          <div className="mb-8 rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold text-black">
              Add Member to Classroom
            </h2>

            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-black">
                  Classroom
                </label>
                <select
                  value={selectedClassroomId || ""}
                  onChange={(e) =>
                    setSelectedClassroomId(Number(e.target.value) || null)
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-black"
                >
                  <option value="">Select a classroom</option>
                  {classrooms
                    .filter((c) => adminStatus[c.id])
                    .map((classroom) => (
                      <option key={classroom.id} value={classroom.id}>
                        {classroom.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-black">
                  User Email
                </label>
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-black"
                  placeholder="user@example.com"
                />
              </div>

              <button
                onClick={handleAddMember}
                disabled={!selectedClassroomId || !memberEmail}
                className="rounded bg-green-600 px-4 py-2 text-black hover:bg-green-700 disabled:bg-green-300"
              >
                Add Member
              </button>
            </div>
          </div>
        )}

        <div className="rounded-lg bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold text-black">
            Your Classrooms
          </h2>

          {isLoading ? (
            <div className="py-8 text-center text-black">
              <p>Loading</p>
            </div>
          ) : classrooms.length === 0 ? (
            <div className="py-8 text-center text-black">
              <p>No classrooms</p>
              <button
                onClick={fetchClassrooms}
                className="mt-4 rounded bg-blue-600 px-4 py-2 text-black hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {classrooms.map((classroom) => (
                <div key={classroom.id} className="rounded-lg border p-4">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-black">
                        {classroom.name}
                      </h3>
                      <p className="text-sm text-black">
                        Created:{" "}
                        {new Date(classroom.created_at).toLocaleDateString()}
                      </p>
                      {adminStatus[classroom.id] && (
                        <span className="mt-1 inline-block rounded bg-blue-100 px-2 py-1 text-xs text-black">
                          Admin
                        </span>
                      )}
                    </div>

                    {adminStatus[classroom.id] && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => editClassroom(classroom)}
                          className="text-black hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClassroom(classroom.id)}
                          className="text-black hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="mb-2 font-medium text-black">Members</h4>
                    {members[classroom.id]?.length > 0 ? (
                      <ul className="space-y-1">
                        {members[classroom.id].map((member) => (
                          <li
                            key={member.id}
                            className="flex items-center justify-between"
                          >
                            <span className="text-black">{member.email}</span>
                            {adminStatus[classroom.id] && (
                              <button
                                onClick={() =>
                                  handleRemoveMember(classroom.id, member.id)
                                }
                                className="text-xs text-black hover:underline"
                              >
                                Remove
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-black">No members yet.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

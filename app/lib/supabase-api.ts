import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
  },
});
export type Classroom = {
  id: number;
  created_at: string;
  name: string;
  metadata: Record<string, unknown>;
  admin_user_id: string;
  ragflow_dataset_id: string;
};

export type User = {
  id: string;
  email: string;
};

export const getCurrentUserId = async (): Promise<string> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("No authenticated user found");
  }
  return user.id;
};

export const classroomApi = {
  getClassrooms: async (): Promise<Classroom[]> => {
    const { data: classrooms, error } = await supabase
      .from("Classroom")
      .select("*");

    if (error) {
      throw new Error(`Failed to fetch classrooms: ${error.message}`);
    }

    return classrooms || [];
  },

  getClassroomById: async (id: number): Promise<Classroom> => {
    const { data, error } = await supabase
      .from("Classroom")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch classroom: ${error.message}`);
    }

    return data;
  },

  createClassroom: async (
    name: string,
    metadata: Record<string, unknown> = {}
  ): Promise<Classroom> => {
    const userId = await getCurrentUserId();
    const placeholderId = `classroom-${Date.now()}`;

    const { data, error } = await supabase
      .from("Classroom")
      .insert([
        {
          name,
          metadata,
          admin_user_id: userId,
          ragflow_dataset_id: placeholderId,
        },
      ])
      .select();

    if (error) {
      throw new Error(`Failed to create classroom: ${error.message}`);
    }

    return data[0];
  },

  updateClassroom: async (
    id: number,
    name: string,
    metadata: Record<string, unknown> = {}
  ): Promise<Classroom> => {
    const { data, error } = await supabase
      .from("Classroom")
      .update({ name, metadata })
      .eq("id", id)
      .select();

    if (error) {
      throw new Error(`Failed to update classroom`);
    }
    return data[0];
  },

  deleteClassroom: async (id: number): Promise<void> => {
    const { error: membersError } = await supabase
      .from("Classroom_Members")
      .delete()
      .eq("classroom_id", id);
    if (membersError) {
      throw new Error(
        `Failed to delete classroom members: ${membersError.message}`
      );
    }
    const { error } = await supabase.from("Classroom").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete classroom: ${error.message}`);
    }
  },
};

export const membersApi = {
  getClassroomMembers: async (classroomId: number): Promise<User[]> => {
    const { data: classroomMembers, error: membersError } = await supabase
      .from("Classroom_Members")
      .select("user_id")
      .eq("classroom_id", classroomId);

    if (membersError) {
      throw new Error(
        `Failed to fetch classroom members: ${membersError.message}`
      );
    }

    if (!classroomMembers || classroomMembers.length === 0) {
      return [];
    }

    const userIds = classroomMembers.map((member) => member.user_id);

    const { data: users, error: usersError } = await supabase
      .from("Users")
      .select("*")
      .in("id", userIds);

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    return users || [];
  },

  addMember: async (classroomId: number, email: string): Promise<User> => {
    const { data: user, error: userError } = await supabase
      .from("Users")
      .select("*")
      .eq("email", email.trim())
      .maybeSingle();

    if (userError) {
      throw new Error(`Failed to find user: ${userError.message}`);
    }

    if (!user) {
      throw new Error("User with this email does not exist.");
    }

    const { data: existingMember, error: memberCheckError } = await supabase
      .from("Classroom_Members")
      .select("*")
      .eq("classroom_id", classroomId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberCheckError) {
      throw new Error(
        `Failed to check existing membership: ${memberCheckError.message}`
      );
    }

    if (existingMember) {
      throw new Error("User is already a member of this classroom.");
    }

    const { error: addError } = await supabase
      .from("Classroom_Members")
      .insert([
        {
          classroom_id: classroomId,
          user_id: user.id,
        },
      ]);

    if (addError) {
      throw new Error(`Failed to add member: ${addError.message}`);
    }

    return user;
  },

  removeMember: async (classroomId: number, userId: string): Promise<void> => {
    const { error } = await supabase
      .from("Classroom_Members")
      .delete()
      .eq("classroom_id", classroomId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to remove member: ${error.message}`);
    }
  },
};

export const userApi = {
  isClassroomAdmin: async (classroom: Classroom): Promise<boolean> => {
    try {
      const userId = await getCurrentUserId();
      return classroom.admin_user_id === userId;
    } catch {
      return false;
    }
  },

  getUserByEmail: async (email: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from("Users")
      .select("*")
      .eq("email", email.trim())
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find user: ${error.message}`);
    }

    return data;
  },
};

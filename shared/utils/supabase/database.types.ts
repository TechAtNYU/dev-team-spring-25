export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      Allowed_Domains: {
        Row: {
          domain: string;
          id: number;
        };
        Insert: {
          domain: string;
          id?: number;
        };
        Update: {
          domain?: string;
          id?: number;
        };
        Relationships: [];
      };
      Chatroom_Members: {
        Row: {
          chatroom_id: string;
          created_at: string;
          id: number;
          is_active: boolean;
          member_id: number;
        };
        Insert: {
          chatroom_id: string;
          created_at?: string;
          id?: number;
          is_active?: boolean;
          member_id: number;
        };
        Update: {
          chatroom_id?: string;
          created_at?: string;
          id?: number;
          is_active?: boolean;
          member_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "Chatroom_Members_chatroom_id_fkey";
            columns: ["chatroom_id"];
            isOneToOne: false;
            referencedRelation: "Chatrooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Chatroom_Members_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "Classroom_Members";
            referencedColumns: ["id"];
          },
        ];
      };
      Chatrooms: {
        Row: {
          classroom_id: number;
          created_at: string;
          creater_user_id: string;
          id: string;
          name: string;
          ragflow_session_id: string | null;
        };
        Insert: {
          classroom_id: number;
          created_at?: string;
          creater_user_id: string;
          id?: string;
          name: string;
          ragflow_session_id?: string | null;
        };
        Update: {
          classroom_id?: number;
          created_at?: string;
          creater_user_id?: string;
          id?: string;
          name?: string;
          ragflow_session_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "Chatrooms_classroom_id_fkey";
            columns: ["classroom_id"];
            isOneToOne: false;
            referencedRelation: "Classrooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Chatrooms_creater_user_id_fkey";
            columns: ["creater_user_id"];
            isOneToOne: false;
            referencedRelation: "Users";
            referencedColumns: ["id"];
          },
        ];
      };
      Classroom_Members: {
        Row: {
          classroom_id: number;
          created_at: string;
          id: number;
          ragflow_session_id: string | null;
          user_id: string;
        };
        Insert: {
          classroom_id: number;
          created_at?: string;
          id?: number;
          ragflow_session_id?: string | null;
          user_id?: string;
        };
        Update: {
          classroom_id?: number;
          created_at?: string;
          id?: number;
          ragflow_session_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "Classroom_Members_classroom_id_fkey";
            columns: ["classroom_id"];
            isOneToOne: false;
            referencedRelation: "Classrooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Classroom_Members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "Users";
            referencedColumns: ["id"];
          },
        ];
      };
      Classrooms: {
        Row: {
          admin_user_id: string | null;
          archived: boolean | null;
          chat_assistant_id: string | null;
          chatroom_assistant_id: string | null;
          created_at: string;
          id: number;
          join_code: string | null;
          metadata: Json | null;
          name: string | null;
          ragflow_dataset_id: string | null;
        };
        Insert: {
          admin_user_id?: string | null;
          archived?: boolean | null;
          chat_assistant_id?: string | null;
          chatroom_assistant_id?: string | null;
          created_at?: string;
          id?: number;
          join_code?: string | null;
          metadata?: Json | null;
          name?: string | null;
          ragflow_dataset_id?: string | null;
        };
        Update: {
          admin_user_id?: string | null;
          archived?: boolean | null;
          chat_assistant_id?: string | null;
          chatroom_assistant_id?: string | null;
          created_at?: string;
          id?: number;
          join_code?: string | null;
          metadata?: Json | null;
          name?: string | null;
          ragflow_dataset_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "Classroom_admin_user_id_fkey";
            columns: ["admin_user_id"];
            isOneToOne: false;
            referencedRelation: "Users";
            referencedColumns: ["id"];
          },
        ];
      };
      Messages: {
        Row: {
          chatroom_id: string;
          content: string;
          created_at: string;
          id: string;
          is_ask: boolean;
          is_new: boolean;
          member_id: number | null;
        };
        Insert: {
          chatroom_id: string;
          content: string;
          created_at?: string;
          id?: string;
          is_ask?: boolean;
          is_new?: boolean;
          member_id?: number | null;
        };
        Update: {
          chatroom_id?: string;
          content?: string;
          created_at?: string;
          id?: string;
          is_ask?: boolean;
          is_new?: boolean;
          member_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "Messages_chatroom_id_fkey";
            columns: ["chatroom_id"];
            isOneToOne: false;
            referencedRelation: "Chatrooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Messages_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "Chatroom_Members";
            referencedColumns: ["id"];
          },
        ];
      };
      Users: {
        Row: {
          avatar_url: string | null;
          email: string;
          full_name: string | null;
          id: string;
        };
        Insert: {
          avatar_url?: string | null;
          email: string;
          full_name?: string | null;
          id?: string;
        };
        Update: {
          avatar_url?: string | null;
          email?: string;
          full_name?: string | null;
          id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      user_in_classroom: {
        Args: {
          _classroom_id: number;
        };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

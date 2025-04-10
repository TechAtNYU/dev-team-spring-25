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
        Args: { _classroom_id: number };
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

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

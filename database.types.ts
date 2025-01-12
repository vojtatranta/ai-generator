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
      ai_results: {
        Row: {
          ai_response_id: string | null;
          ai_result: Json | null;
          created_at: string;
          id: number;
          image_url: string | null;
          prompt: string | null;
          prompt_slug: string;
          user_id: string | null;
          uuid: string;
        };
        Insert: {
          ai_response_id?: string | null;
          ai_result?: Json | null;
          created_at?: string;
          id?: number;
          image_url?: string | null;
          prompt?: string | null;
          prompt_slug: string;
          user_id?: string | null;
          uuid?: string;
        };
        Update: {
          ai_response_id?: string | null;
          ai_result?: Json | null;
          created_at?: string;
          id?: number;
          image_url?: string | null;
          prompt?: string | null;
          prompt_slug?: string;
          user_id?: string | null;
          uuid?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          chunk: string | null;
          created_at: string;
          embedding_type: string | null;
          embeddings: string | null;
          file: number | null;
          id: number;
          user_id: string | null;
          uuid: string;
        };
        Insert: {
          chunk?: string | null;
          created_at?: string;
          embedding_type?: string | null;
          embeddings?: string | null;
          file?: number | null;
          id?: number;
          user_id?: string | null;
          uuid?: string;
        };
        Update: {
          chunk?: string | null;
          created_at?: string;
          embedding_type?: string | null;
          embeddings?: string | null;
          file?: number | null;
          id?: number;
          user_id?: string | null;
          uuid?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_file_fkey";
            columns: ["file"];
            isOneToOne: false;
            referencedRelation: "files";
            referencedColumns: ["id"];
          },
        ];
      };
      feedback: {
        Row: {
          created_at: string;
          id: number;
          positive: boolean;
          score: number | null;
          text: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          positive?: boolean;
          score?: number | null;
          text?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          positive?: boolean;
          score?: number | null;
          text?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      file_chunks: {
        Row: {
          base64: string;
          bytes: string | null;
          common_file_uuid: string;
          created_at: string;
          file_id: number | null;
          id: number;
          mime: string;
          text: string | null;
          user_id: string;
          uuid: string;
        };
        Insert: {
          base64: string;
          bytes?: string | null;
          common_file_uuid: string;
          created_at?: string;
          file_id?: number | null;
          id?: number;
          mime: string;
          text?: string | null;
          user_id: string;
          uuid?: string;
        };
        Update: {
          base64?: string;
          bytes?: string | null;
          common_file_uuid?: string;
          created_at?: string;
          file_id?: number | null;
          id?: number;
          mime?: string;
          text?: string | null;
          user_id?: string;
          uuid?: string;
        };
        Relationships: [
          {
            foreignKeyName: "file_chunks_file_id_fkey";
            columns: ["file_id"];
            isOneToOne: false;
            referencedRelation: "files";
            referencedColumns: ["id"];
          },
        ];
      };
      files: {
        Row: {
          common_file_uuid: string | null;
          created_at: string;
          file_summary: string | null;
          filename: string | null;
          id: number;
          local_file_path: string | null;
          type: string | null;
          url: string | null;
          user_id: string;
          uuid: string;
        };
        Insert: {
          common_file_uuid?: string | null;
          created_at?: string;
          file_summary?: string | null;
          filename?: string | null;
          id?: number;
          local_file_path?: string | null;
          type?: string | null;
          url?: string | null;
          user_id: string;
          uuid?: string;
        };
        Update: {
          common_file_uuid?: string | null;
          created_at?: string;
          file_summary?: string | null;
          filename?: string | null;
          id?: number;
          local_file_path?: string | null;
          type?: string | null;
          url?: string | null;
          user_id?: string;
          uuid?: string;
        };
        Relationships: [];
      };
      stripe_plans: {
        Row: {
          created_at: string;
          id: number;
          plans_json: Json;
          user: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          plans_json: Json;
          user: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          plans_json?: Json;
          user?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          active: boolean;
          created_at: string;
          id: number;
          is_admin: boolean;
          plan_id: string | null;
          plan_name: string;
          stripe_subscription_id: string | null;
          user: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          id?: number;
          is_admin?: boolean;
          plan_id?: string | null;
          plan_name: string;
          stripe_subscription_id?: string | null;
          user: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          id?: number;
          is_admin?: boolean;
          plan_id?: string | null;
          plan_name?: string;
          stripe_subscription_id?: string | null;
          user?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      match_documents2: {
        Args: {
          query_embedding: string;
          match_threshold: number;
          match_count: number;
          file_ids: number[];
        };
        Returns: {
          id: number;
          chunk: string;
          similarity: number;
        }[];
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

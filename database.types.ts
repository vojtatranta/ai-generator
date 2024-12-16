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
      answers: {
        Row: {
          answers: Json;
          client_email: string | null;
          created_at: string;
          id: number;
          questions: Json;
          quiz: number;
          quiz_result: number | null;
          scoring: Json;
          user: string;
        };
        Insert: {
          answers: Json;
          client_email?: string | null;
          created_at?: string;
          id?: number;
          questions: Json;
          quiz: number;
          quiz_result?: number | null;
          scoring: Json;
          user: string;
        };
        Update: {
          answers?: Json;
          client_email?: string | null;
          created_at?: string;
          id?: number;
          questions?: Json;
          quiz?: number;
          quiz_result?: number | null;
          scoring?: Json;
          user?: string;
        };
        Relationships: [
          {
            foreignKeyName: "answers_quiz_fkey";
            columns: ["quiz"];
            isOneToOne: false;
            referencedRelation: "quizes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "answers_quiz_result_fkey";
            columns: ["quiz_result"];
            isOneToOne: false;
            referencedRelation: "quiz_results";
            referencedColumns: ["id"];
          },
        ];
      };
      attribute_product_connection: {
        Row: {
          attribute_id: number;
          attribute_product_hash: string;
          attribute_uuid: string;
          created_at: string;
          id: number;
          product_id: number;
          product_xml_id: number;
        };
        Insert: {
          attribute_id: number;
          attribute_product_hash: string;
          attribute_uuid?: string;
          created_at?: string;
          id?: number;
          product_id: number;
          product_xml_id: number;
        };
        Update: {
          attribute_id?: number;
          attribute_product_hash?: string;
          attribute_uuid?: string;
          created_at?: string;
          id?: number;
          product_id?: number;
          product_xml_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "attribute_product_connection_attribute_id_fkey";
            columns: ["attribute_id"];
            isOneToOne: false;
            referencedRelation: "product_attributes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attribute_product_connection_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_attributes: {
        Row: {
          attribute_category_name: string | null;
          created_at: string;
          description: string | null;
          id: number;
          name: string;
          user: string;
          uuid: string;
        };
        Insert: {
          attribute_category_name?: string | null;
          created_at?: string;
          description?: string | null;
          id?: number;
          name: string;
          user: string;
          uuid?: string;
        };
        Update: {
          attribute_category_name?: string | null;
          created_at?: string;
          description?: string | null;
          id?: number;
          name?: string;
          user?: string;
          uuid?: string;
        };
        Relationships: [];
      };
      product_categories: {
        Row: {
          created_at: string;
          description: string | null;
          id: number;
          name: string | null;
          updated_at: string | null;
          user: string;
          xml_id: number;
          xml_url: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: number;
          name?: string | null;
          updated_at?: string | null;
          user: string;
          xml_id: number;
          xml_url?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: number;
          name?: string | null;
          updated_at?: string | null;
          user?: string;
          xml_id?: number;
          xml_url?: string | null;
        };
        Relationships: [];
      };
      product_category_connection: {
        Row: {
          category: number;
          created_at: string;
          id: number;
          product: number;
        };
        Insert: {
          category: number;
          created_at?: string;
          id?: number;
          product: number;
        };
        Update: {
          category?: number;
          created_at?: string;
          id?: number;
          product?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_category_connection_category_fkey";
            columns: ["category"];
            isOneToOne: false;
            referencedRelation: "product_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_category_connection_product_fkey";
            columns: ["product"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          available: boolean | null;
          brand: string | null;
          buy_link: string | null;
          category_id: number | null;
          category_xml_id: number;
          created_at: string;
          description: string | null;
          id: number;
          image_url: string | null;
          price: number | null;
          product_link: string | null;
          title: string;
          updated_at: string | null;
          user: string;
          xml_id: number;
          xml_url: string | null;
        };
        Insert: {
          available?: boolean | null;
          brand?: string | null;
          buy_link?: string | null;
          category_id?: number | null;
          category_xml_id: number;
          created_at?: string;
          description?: string | null;
          id?: number;
          image_url?: string | null;
          price?: number | null;
          product_link?: string | null;
          title: string;
          updated_at?: string | null;
          user: string;
          xml_id: number;
          xml_url?: string | null;
        };
        Update: {
          available?: boolean | null;
          brand?: string | null;
          buy_link?: string | null;
          category_id?: number | null;
          category_xml_id?: number;
          created_at?: string;
          description?: string | null;
          id?: number;
          image_url?: string | null;
          price?: number | null;
          product_link?: string | null;
          title?: string;
          updated_at?: string | null;
          user?: string;
          xml_id?: number;
          xml_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "product_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          created_at: string;
          description: string | null;
          id: number;
          options: Json | null;
          options_type: string | null;
          text: string | null;
          user: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: number;
          options?: Json | null;
          options_type?: string | null;
          text?: string | null;
          user: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: number;
          options?: Json | null;
          options_type?: string | null;
          text?: string | null;
          user?: string;
        };
        Relationships: [];
      };
      quiz_evaluation_results: {
        Row: {
          answer: number | null;
          attribute: number | null;
          category: number | null;
          created_at: string;
          id: number;
          quiz: number;
          quiz_result: number;
          quiz_result_uuid: string;
          score: number;
          user: string;
        };
        Insert: {
          answer?: number | null;
          attribute?: number | null;
          category?: number | null;
          created_at?: string;
          id?: number;
          quiz: number;
          quiz_result: number;
          quiz_result_uuid: string;
          score?: number;
          user: string;
        };
        Update: {
          answer?: number | null;
          attribute?: number | null;
          category?: number | null;
          created_at?: string;
          id?: number;
          quiz?: number;
          quiz_result?: number;
          quiz_result_uuid?: string;
          score?: number;
          user?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_evaluation_result_category_fkey";
            columns: ["category"];
            isOneToOne: false;
            referencedRelation: "product_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quiz_evaluation_result_quiz_fkey";
            columns: ["quiz"];
            isOneToOne: false;
            referencedRelation: "quizes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quiz_evaluation_result_quiz_result_fkey";
            columns: ["quiz_result"];
            isOneToOne: false;
            referencedRelation: "quiz_results";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quiz_evaluation_result_quiz_result_uuid_fkey";
            columns: ["quiz_result_uuid"];
            isOneToOne: false;
            referencedRelation: "quiz_results";
            referencedColumns: ["uuid"];
          },
          {
            foreignKeyName: "quiz_evaluation_results_answer_fkey";
            columns: ["answer"];
            isOneToOne: false;
            referencedRelation: "answers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quiz_evaluation_results_attribute_fkey";
            columns: ["attribute"];
            isOneToOne: false;
            referencedRelation: "product_attributes";
            referencedColumns: ["id"];
          },
        ];
      };
      quiz_results: {
        Row: {
          answer: number;
          client_email: string | null;
          created_at: string;
          evaluation: Json | null;
          id: number;
          quiz_uuid: string;
          uuid: string;
        };
        Insert: {
          answer: number;
          client_email?: string | null;
          created_at?: string;
          evaluation?: Json | null;
          id?: number;
          quiz_uuid: string;
          uuid?: string;
        };
        Update: {
          answer?: number;
          client_email?: string | null;
          created_at?: string;
          evaluation?: Json | null;
          id?: number;
          quiz_uuid?: string;
          uuid?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_result_answer_fkey";
            columns: ["answer"];
            isOneToOne: false;
            referencedRelation: "answers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quiz_result_quiz_uuid_fkey";
            columns: ["quiz_uuid"];
            isOneToOne: false;
            referencedRelation: "quizes";
            referencedColumns: ["uuid"];
          },
        ];
      };
      quizes: {
        Row: {
          background_image_url: string | null;
          created_at: string;
          description: string | null;
          gather_email: boolean;
          id: number;
          max_number_of_products_to_display: number;
          name: string | null;
          published: boolean;
          questions: Json | null;
          quiz_result_description: string | null;
          quiz_result_headline: string | null;
          result_page_slots: Json | null;
          user: string;
          uuid: string;
        };
        Insert: {
          background_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          gather_email?: boolean;
          id?: number;
          max_number_of_products_to_display?: number;
          name?: string | null;
          published?: boolean;
          questions?: Json | null;
          quiz_result_description?: string | null;
          quiz_result_headline?: string | null;
          result_page_slots?: Json | null;
          user: string;
          uuid?: string;
        };
        Update: {
          background_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          gather_email?: boolean;
          id?: number;
          max_number_of_products_to_display?: number;
          name?: string | null;
          published?: boolean;
          questions?: Json | null;
          quiz_result_description?: string | null;
          quiz_result_headline?: string | null;
          result_page_slots?: Json | null;
          user?: string;
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
      [_ in never]: never;
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

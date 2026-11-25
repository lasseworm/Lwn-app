// Genereret fra databaseskemaet (npm run db:types). Rediger ikke manuelt.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "ai_usage": {
                  Row: {
                    "cost_usd": number | null,"created_at": string,"feature": string,"gym_id": string | null,"id": string,"input_tokens": number | null,"model": string | null,"output_tokens": number | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cost_usd"?: number | null,"created_at"?: string,"feature": string,"gym_id"?: string | null,"id"?: string,"input_tokens"?: number | null,"model"?: string | null,"output_tokens"?: number | null,"user_id": string
                  }
                  Update: {
                    "cost_usd"?: number | null,"created_at"?: string,"feature"?: string,"gym_id"?: string | null,"id"?: string,"input_tokens"?: number | null,"model"?: string | null,"output_tokens"?: number | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ai_usage_gym_id_fkey"
      columns: ["gym_id"]
isOneToOne: false
      referencedRelation: "gyms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ai_usage_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"equipment_confirmations": {
                  Row: {
                    "created_at": string | null,"equipment_id": string,"note": string | null,"user_id": string,"vote": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"equipment_id": string,"note"?: string | null,"user_id": string,"vote"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"equipment_id"?: string,"note"?: string | null,"user_id"?: string,"vote"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "equipment_confirmations_equipment_id_fkey"
      columns: ["equipment_id"]
isOneToOne: false
      referencedRelation: "gym_equipment"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "equipment_confirmations_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"exercise_preferences": {
                  Row: {
                    "excluded": boolean | null,"original_exercise_id": string,"reason": string | null,"replacement_exercise_id": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "excluded"?: boolean | null,"original_exercise_id": string,"reason"?: string | null,"replacement_exercise_id"?: string | null,"user_id": string
                  }
                  Update: {
                    "excluded"?: boolean | null,"original_exercise_id"?: string,"reason"?: string | null,"replacement_exercise_id"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "exercise_preferences_original_exercise_id_fkey"
      columns: ["original_exercise_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "exercise_preferences_replacement_exercise_id_fkey"
      columns: ["replacement_exercise_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "exercise_preferences_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"exercise_progress": {
                  Row: {
                    "baseline_weight_kg": number | null,"current_reps": number | null,"current_sets": number | null,"current_weight_kg": number | null,"equipment_id": string,"exercise_id": string,"hold_level": boolean | null,"last_performed_at": string | null,"last_successful_reps": number | null,"last_successful_sets": number | null,"last_successful_weight_kg": number | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "baseline_weight_kg"?: number | null,"current_reps"?: number | null,"current_sets"?: number | null,"current_weight_kg"?: number | null,"equipment_id": string,"exercise_id": string,"hold_level"?: boolean | null,"last_performed_at"?: string | null,"last_successful_reps"?: number | null,"last_successful_sets"?: number | null,"last_successful_weight_kg"?: number | null,"user_id": string
                  }
                  Update: {
                    "baseline_weight_kg"?: number | null,"current_reps"?: number | null,"current_sets"?: number | null,"current_weight_kg"?: number | null,"equipment_id"?: string,"exercise_id"?: string,"hold_level"?: boolean | null,"last_performed_at"?: string | null,"last_successful_reps"?: number | null,"last_successful_sets"?: number | null,"last_successful_weight_kg"?: number | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "exercise_progress_equipment_id_fkey"
      columns: ["equipment_id"]
isOneToOne: false
      referencedRelation: "gym_equipment"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "exercise_progress_exercise_id_fkey"
      columns: ["exercise_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "exercise_progress_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"exercises": {
                  Row: {
                    "beginner_friendly": boolean,"default_rep_max": number | null,"default_rep_min": number | null,"default_sets": number | null,"id": string,"instructions": Json | null,"is_free_weight": boolean | null,"is_sample": boolean | null,"machine_type_id": string | null,"movement_pattern": string | null,"name": string,"primary_muscles": (string)[] | null,"secondary_muscles": (string)[] | null,"slug": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "beginner_friendly"?: boolean,"default_rep_max"?: number | null,"default_rep_min"?: number | null,"default_sets"?: number | null,"id"?: string,"instructions"?: Json | null,"is_free_weight"?: boolean | null,"is_sample"?: boolean | null,"machine_type_id"?: string | null,"movement_pattern"?: string | null,"name": string,"primary_muscles"?: (string)[] | null,"secondary_muscles"?: (string)[] | null,"slug"?: string | null
                  }
                  Update: {
                    "beginner_friendly"?: boolean,"default_rep_max"?: number | null,"default_rep_min"?: number | null,"default_sets"?: number | null,"id"?: string,"instructions"?: Json | null,"is_free_weight"?: boolean | null,"is_sample"?: boolean | null,"machine_type_id"?: string | null,"movement_pattern"?: string | null,"name"?: string,"primary_muscles"?: (string)[] | null,"secondary_muscles"?: (string)[] | null,"slug"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "exercises_machine_type_id_fkey"
      columns: ["machine_type_id"]
isOneToOne: false
      referencedRelation: "machine_types"
      referencedColumns: ["id"]
    }
                  ]
                },"feedback": {
                  Row: {
                    "created_at": string | null,"id": string,"message": string | null,"screen": string | null,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"id"?: string,"message"?: string | null,"screen"?: string | null,"user_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"id"?: string,"message"?: string | null,"screen"?: string | null,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "feedback_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"gym_equipment": {
                  Row: {
                    "added_by": string | null,"ai_confidence": number | null,"confirmations": number | null,"custom_name": string | null,"extra_plate_kg": number | null,"gym_id": string | null,"id": string,"machine_type_id": string | null,"max_weight_kg": number | null,"min_weight_kg": number | null,"photo_path": string | null,"status": string | null,"updated_at": string | null,"weight_step_kg": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "added_by"?: string | null,"ai_confidence"?: number | null,"confirmations"?: number | null,"custom_name"?: string | null,"extra_plate_kg"?: number | null,"gym_id"?: string | null,"id"?: string,"machine_type_id"?: string | null,"max_weight_kg"?: number | null,"min_weight_kg"?: number | null,"photo_path"?: string | null,"status"?: string | null,"updated_at"?: string | null,"weight_step_kg"?: number | null
                  }
                  Update: {
                    "added_by"?: string | null,"ai_confidence"?: number | null,"confirmations"?: number | null,"custom_name"?: string | null,"extra_plate_kg"?: number | null,"gym_id"?: string | null,"id"?: string,"machine_type_id"?: string | null,"max_weight_kg"?: number | null,"min_weight_kg"?: number | null,"photo_path"?: string | null,"status"?: string | null,"updated_at"?: string | null,"weight_step_kg"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "gym_equipment_added_by_fkey"
      columns: ["added_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gym_equipment_gym_id_fkey"
      columns: ["gym_id"]
isOneToOne: false
      referencedRelation: "gyms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gym_equipment_machine_type_id_fkey"
      columns: ["machine_type_id"]
isOneToOne: false
      referencedRelation: "machine_types"
      referencedColumns: ["id"]
    }
                  ]
                },"gyms": {
                  Row: {
                    "city": string,"created_at": string | null,"created_by": string | null,"id": string,"is_sample": boolean | null,"name": string,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "city": string,"created_at"?: string | null,"created_by"?: string | null,"id"?: string,"is_sample"?: boolean | null,"name": string,"updated_at"?: string | null
                  }
                  Update: {
                    "city"?: string,"created_at"?: string | null,"created_by"?: string | null,"id"?: string,"is_sample"?: boolean | null,"name"?: string,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "gyms_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"machine_types": {
                  Row: {
                    "category": string,"id": string,"instructions": Json | null,"is_multipurpose": boolean | null,"is_sample": boolean | null,"media_url": string | null,"name": string,"primary_muscles": (string)[] | null,"secondary_muscles": (string)[] | null,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category": string,"id"?: string,"instructions"?: Json | null,"is_multipurpose"?: boolean | null,"is_sample"?: boolean | null,"media_url"?: string | null,"name": string,"primary_muscles"?: (string)[] | null,"secondary_muscles"?: (string)[] | null,"slug": string
                  }
                  Update: {
                    "category"?: string,"id"?: string,"instructions"?: Json | null,"is_multipurpose"?: boolean | null,"is_sample"?: boolean | null,"media_url"?: string | null,"name"?: string,"primary_muscles"?: (string)[] | null,"secondary_muscles"?: (string)[] | null,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"plan_limits": {
                  Row: {
                    "feature": string,"max_uses": number | null,"period": string,"plan": string
                  }
                  ComputedFields: never
                  Insert: {
                    "feature": string,"max_uses"?: number | null,"period": string,"plan": string
                  }
                  Update: {
                    "feature"?: string,"max_uses"?: number | null,"period"?: string,"plan"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "active_gym_id": string | null,"created_at": string | null,"display_name": string | null,"experience_level": string | null,"goal": string | null,"id": string,"program_review_snoozed_until": string | null,"sessions_per_week": number | null,"training_type": string | null,"warmup_enabled": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "active_gym_id"?: string | null,"created_at"?: string | null,"display_name"?: string | null,"experience_level"?: string | null,"goal"?: string | null,"id": string,"program_review_snoozed_until"?: string | null,"sessions_per_week"?: number | null,"training_type"?: string | null,"warmup_enabled"?: boolean
                  }
                  Update: {
                    "active_gym_id"?: string | null,"created_at"?: string | null,"display_name"?: string | null,"experience_level"?: string | null,"goal"?: string | null,"id"?: string,"program_review_snoozed_until"?: string | null,"sessions_per_week"?: number | null,"training_type"?: string | null,"warmup_enabled"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_active_gym_id_fkey"
      columns: ["active_gym_id"]
isOneToOne: false
      referencedRelation: "gyms"
      referencedColumns: ["id"]
    }
                  ]
                },"program_days": {
                  Row: {
                    "day_index": number | null,"id": string,"name": string | null,"program_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "day_index"?: number | null,"id"?: string,"name"?: string | null,"program_id"?: string | null
                  }
                  Update: {
                    "day_index"?: number | null,"id"?: string,"name"?: string | null,"program_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "program_days_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "programs"
      referencedColumns: ["id"]
    }
                  ]
                },"program_exercises": {
                  Row: {
                    "equipment_id": string | null,"exercise_id": string | null,"id": string,"position": number | null,"program_day_id": string | null,"rep_max": number | null,"rep_min": number | null,"sets": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "equipment_id"?: string | null,"exercise_id"?: string | null,"id"?: string,"position"?: number | null,"program_day_id"?: string | null,"rep_max"?: number | null,"rep_min"?: number | null,"sets"?: number | null
                  }
                  Update: {
                    "equipment_id"?: string | null,"exercise_id"?: string | null,"id"?: string,"position"?: number | null,"program_day_id"?: string | null,"rep_max"?: number | null,"rep_min"?: number | null,"sets"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "program_exercises_equipment_id_fkey"
      columns: ["equipment_id"]
isOneToOne: false
      referencedRelation: "gym_equipment"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "program_exercises_exercise_id_fkey"
      columns: ["exercise_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "program_exercises_program_day_id_fkey"
      columns: ["program_day_id"]
isOneToOne: false
      referencedRelation: "program_days"
      referencedColumns: ["id"]
    }
                  ]
                },"programs": {
                  Row: {
                    "active": boolean | null,"generated_at": string | null,"gym_id": string | null,"id": string,"sessions_per_week": number | null,"source": string,"user_id": string | null,"version": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean | null,"generated_at"?: string | null,"gym_id"?: string | null,"id"?: string,"sessions_per_week"?: number | null,"source"?: string,"user_id"?: string | null,"version"?: number | null
                  }
                  Update: {
                    "active"?: boolean | null,"generated_at"?: string | null,"gym_id"?: string | null,"id"?: string,"sessions_per_week"?: number | null,"source"?: string,"user_id"?: string | null,"version"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "programs_gym_id_fkey"
      columns: ["gym_id"]
isOneToOne: false
      referencedRelation: "gyms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "programs_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"stripe_events": {
                  Row: {
                    "id": string,"received_at": string,"type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id": string,"received_at"?: string,"type": string
                  }
                  Update: {
                    "id"?: string,"received_at"?: string,"type"?: string
                  }
                  Relationships: [
                    
                  ]
                },"subscriptions": {
                  Row: {
                    "cancel_at_period_end": boolean,"created_at": string,"current_period_end": string | null,"price_id": string | null,"status": string,"stripe_customer_id": string | null,"stripe_subscription_id": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cancel_at_period_end"?: boolean,"created_at"?: string,"current_period_end"?: string | null,"price_id"?: string | null,"status"?: string,"stripe_customer_id"?: string | null,"stripe_subscription_id"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "cancel_at_period_end"?: boolean,"created_at"?: string,"current_period_end"?: string | null,"price_id"?: string | null,"status"?: string,"stripe_customer_id"?: string | null,"stripe_subscription_id"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "subscriptions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"user_gyms": {
                  Row: {
                    "gym_id": string,"label": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "gym_id": string,"label"?: string | null,"user_id": string
                  }
                  Update: {
                    "gym_id"?: string,"label"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_gyms_gym_id_fkey"
      columns: ["gym_id"]
isOneToOne: false
      referencedRelation: "gyms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "user_gyms_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"workout_sets": {
                  Row: {
                    "completed": boolean | null,"created_at": string | null,"equipment_id": string | null,"exercise_id": string | null,"id": string,"is_warmup": boolean | null,"pain_reported": boolean | null,"reps": number | null,"set_index": number | null,"weight_kg": number | null,"workout_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "completed"?: boolean | null,"created_at"?: string | null,"equipment_id"?: string | null,"exercise_id"?: string | null,"id"?: string,"is_warmup"?: boolean | null,"pain_reported"?: boolean | null,"reps"?: number | null,"set_index"?: number | null,"weight_kg"?: number | null,"workout_id"?: string | null
                  }
                  Update: {
                    "completed"?: boolean | null,"created_at"?: string | null,"equipment_id"?: string | null,"exercise_id"?: string | null,"id"?: string,"is_warmup"?: boolean | null,"pain_reported"?: boolean | null,"reps"?: number | null,"set_index"?: number | null,"weight_kg"?: number | null,"workout_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "workout_sets_equipment_id_fkey"
      columns: ["equipment_id"]
isOneToOne: false
      referencedRelation: "gym_equipment"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workout_sets_exercise_id_fkey"
      columns: ["exercise_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workout_sets_workout_id_fkey"
      columns: ["workout_id"]
isOneToOne: false
      referencedRelation: "workouts"
      referencedColumns: ["id"]
    }
                  ]
                },"workouts": {
                  Row: {
                    "finished_at": string | null,"gym_id": string | null,"id": string,"program_day_id": string | null,"started_at": string | null,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "finished_at"?: string | null,"gym_id"?: string | null,"id"?: string,"program_day_id"?: string | null,"started_at"?: string | null,"user_id"?: string | null
                  }
                  Update: {
                    "finished_at"?: string | null,"gym_id"?: string | null,"id"?: string,"program_day_id"?: string | null,"started_at"?: string | null,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "workouts_gym_id_fkey"
      columns: ["gym_id"]
isOneToOne: false
      referencedRelation: "gyms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workouts_program_day_id_fkey"
      columns: ["program_day_id"]
isOneToOne: false
      referencedRelation: "program_days"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workouts_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "ai_remaining":
{ Args: { "p_feature": string,"p_user": string }; Returns: number
                           },
"create_program":
{ Args: { "p_days": Json,"p_gym_id": string,"p_sessions_per_week": number }; Returns: string
                           },
"delete_my_account":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"finish_workout":
{ Args: { "p_progress": Json,"p_workout_id": string }; Returns: undefined
                           },
"is_pro":
{ Args: { "p_user": string }; Returns: boolean
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const

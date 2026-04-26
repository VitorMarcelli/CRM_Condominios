-- CreateTable
CREATE TABLE "condominiums" (
    "id" UUID NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "document" VARCHAR(30),
    "address" VARCHAR(300),
    "phone" VARCHAR(30),
    "email" VARCHAR(180),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "condominiums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocks" (
    "id" UUID NOT NULL,
    "condominium_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "code" VARCHAR(30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL,
    "condominium_id" UUID NOT NULL,
    "block_id" UUID NOT NULL,
    "number" VARCHAR(20) NOT NULL,
    "floor" VARCHAR(20),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "residents" (
    "id" UUID NOT NULL,
    "condominium_id" UUID NOT NULL,
    "unit_id" UUID,
    "full_name" VARCHAR(180) NOT NULL,
    "phone" VARCHAR(30),
    "email" VARCHAR(180),
    "document" VARCHAR(30),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "residents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_users" (
    "id" UUID NOT NULL,
    "condominium_id" UUID,
    "full_name" VARCHAR(180) NOT NULL,
    "email" VARCHAR(180) NOT NULL,
    "phone" VARCHAR(30),
    "role" VARCHAR(40) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "refresh_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internal_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "condominium_id" UUID NOT NULL,
    "resident_id" UUID,
    "channel" VARCHAR(30) NOT NULL,
    "external_reference" VARCHAR(180),
    "status" VARCHAR(30) NOT NULL DEFAULT 'open',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_message_at" TIMESTAMP(3),

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "direction" VARCHAR(10) NOT NULL,
    "sender_name" VARCHAR(180),
    "sender_phone" VARCHAR(30),
    "body" TEXT,
    "media_url" TEXT,
    "raw_payload" JSONB,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occurrence_categories" (
    "id" UUID NOT NULL,
    "condominium_id" UUID,
    "name" VARCHAR(120) NOT NULL,
    "severity_default" VARCHAR(20),
    "is_emergency" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "occurrence_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occurrences" (
    "id" UUID NOT NULL,
    "condominium_id" UUID NOT NULL,
    "resident_id" UUID,
    "conversation_id" UUID,
    "category_id" UUID,
    "title" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(30) NOT NULL DEFAULT 'new',
    "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "assigned_user_id" UUID,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occurrence_timelines" (
    "id" UUID NOT NULL,
    "occurrence_id" UUID NOT NULL,
    "action" VARCHAR(60) NOT NULL,
    "description" TEXT,
    "actor_type" VARCHAR(30) NOT NULL,
    "actor_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "occurrence_timelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" UUID NOT NULL,
    "occurrence_id" UUID,
    "file_name" VARCHAR(255) NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" VARCHAR(50),
    "file_size" INTEGER,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" UUID NOT NULL,
    "condominium_id" UUID NOT NULL,
    "occurrence_id" UUID NOT NULL,
    "trigger_type" VARCHAR(40) NOT NULL,
    "urgency_level" VARCHAR(20) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'triggered',
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_recipients" (
    "id" UUID NOT NULL,
    "alert_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "channel" VARCHAR(30) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',

    CONSTRAINT "alert_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalation_rules" (
    "id" UUID NOT NULL,
    "condominium_id" UUID NOT NULL,
    "category_id" UUID,
    "name" VARCHAR(120) NOT NULL,
    "trigger_keywords" JSONB,
    "active_hours" JSONB,
    "urgency_level" VARCHAR(20) NOT NULL,
    "dispatch_group_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escalation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispatch_groups" (
    "id" UUID NOT NULL,
    "condominium_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispatch_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispatch_group_members" (
    "id" UUID NOT NULL,
    "dispatch_group_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispatch_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_hours" (
    "id" UUID NOT NULL,
    "condominium_id" UUID NOT NULL,
    "weekday" INTEGER NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_channels" (
    "id" UUID NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "identifier" VARCHAR(180) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "condominium_id" UUID,
    "entity_type" VARCHAR(60) NOT NULL,
    "entity_id" UUID,
    "action" VARCHAR(60) NOT NULL,
    "actor_type" VARCHAR(30) NOT NULL,
    "actor_id" UUID,
    "metadata" JSONB,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "internal_users_email_key" ON "internal_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "dispatch_group_members_dispatch_group_id_user_id_key" ON "dispatch_group_members"("dispatch_group_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_hours_condominium_id_weekday_key" ON "business_hours"("condominium_id", "weekday");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_type_actor_id_idx" ON "audit_logs"("actor_type", "actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_condominium_id_idx" ON "audit_logs"("condominium_id");

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_condominium_id_fkey" FOREIGN KEY ("condominium_id") REFERENCES "condominiums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_condominium_id_fkey" FOREIGN KEY ("condominium_id") REFERENCES "condominiums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residents" ADD CONSTRAINT "residents_condominium_id_fkey" FOREIGN KEY ("condominium_id") REFERENCES "condominiums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residents" ADD CONSTRAINT "residents_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_users" ADD CONSTRAINT "internal_users_condominium_id_fkey" FOREIGN KEY ("condominium_id") REFERENCES "condominiums"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_condominium_id_fkey" FOREIGN KEY ("condominium_id") REFERENCES "condominiums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occurrence_categories" ADD CONSTRAINT "occurrence_categories_condominium_id_fkey" FOREIGN KEY ("condominium_id") REFERENCES "condominiums"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_condominium_id_fkey" FOREIGN KEY ("condominium_id") REFERENCES "condominiums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "occurrence_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "internal_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occurrence_timelines" ADD CONSTRAINT "occurrence_timelines_occurrence_id_fkey" FOREIGN KEY ("occurrence_id") REFERENCES "occurrences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_occurrence_id_fkey" FOREIGN KEY ("occurrence_id") REFERENCES "occurrences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_condominium_id_fkey" FOREIGN KEY ("condominium_id") REFERENCES "condominiums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_occurrence_id_fkey" FOREIGN KEY ("occurrence_id") REFERENCES "occurrences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_recipients" ADD CONSTRAINT "alert_recipients_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_recipients" ADD CONSTRAINT "alert_recipients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "internal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalation_rules" ADD CONSTRAINT "escalation_rules_condominium_id_fkey" FOREIGN KEY ("condominium_id") REFERENCES "condominiums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalation_rules" ADD CONSTRAINT "escalation_rules_dispatch_group_id_fkey" FOREIGN KEY ("dispatch_group_id") REFERENCES "dispatch_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_groups" ADD CONSTRAINT "dispatch_groups_condominium_id_fkey" FOREIGN KEY ("condominium_id") REFERENCES "condominiums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_group_members" ADD CONSTRAINT "dispatch_group_members_dispatch_group_id_fkey" FOREIGN KEY ("dispatch_group_id") REFERENCES "dispatch_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_group_members" ADD CONSTRAINT "dispatch_group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "internal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_hours" ADD CONSTRAINT "business_hours_condominium_id_fkey" FOREIGN KEY ("condominium_id") REFERENCES "condominiums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_condominium_id_fkey" FOREIGN KEY ("condominium_id") REFERENCES "condominiums"("id") ON DELETE SET NULL ON UPDATE CASCADE;

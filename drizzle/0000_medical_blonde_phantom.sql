CREATE TYPE "public"."club_creation_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."court_surface" AS ENUM('terre battue', 'dur', 'gazon', 'indoor');--> statement-breakpoint
CREATE TYPE "public"."elo_change_reason" AS ENUM('match_win', 'match_loss', 'inactivity_decay', 'manual_adjustment');--> statement-breakpoint
CREATE TYPE "public"."forum_category" AS ENUM('général', 'recherche-partenaire', 'résultats', 'équipement', 'annonces');--> statement-breakpoint
CREATE TYPE "public"."game_type" AS ENUM('simple', 'double');--> statement-breakpoint
CREATE TYPE "public"."join_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."player_level" AS ENUM('débutant', 'intermédiaire', 'avancé', 'expert');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('pending', 'accepted', 'declined', 'expired');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'premium', 'pro');--> statement-breakpoint
CREATE TYPE "public"."time_slot" AS ENUM('matin', 'midi', 'après-midi', 'soir');--> statement-breakpoint
CREATE TYPE "public"."weekday" AS ENUM('lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"sender_id" uuid,
	"content" text NOT NULL,
	"message_type" varchar(20) DEFAULT 'text' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_edited" boolean DEFAULT false NOT NULL,
	"edited_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_room_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"last_read_at" timestamp,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid NOT NULL,
	"name" varchar(100),
	"description" text,
	"icon" varchar(50),
	"is_direct" boolean DEFAULT false NOT NULL,
	"is_group" boolean DEFAULT false NOT NULL,
	"is_section" boolean DEFAULT false NOT NULL,
	"section_order" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "club_creation_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"requester_name" varchar(100) NOT NULL,
	"requester_email" varchar(255) NOT NULL,
	"requester_phone" varchar(20),
	"club_name" varchar(100) NOT NULL,
	"club_slug" varchar(50) NOT NULL,
	"club_description" text,
	"club_address" text,
	"club_website" text,
	"estimated_members" integer,
	"approval_token" varchar(64) NOT NULL,
	"status" "club_creation_status" DEFAULT 'pending' NOT NULL,
	"reviewed_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "club_creation_requests_approval_token_unique" UNIQUE("approval_token")
);
--> statement-breakpoint
CREATE TABLE "club_join_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"message" text,
	"self_assessed_level" "player_level" DEFAULT 'intermédiaire' NOT NULL,
	"status" "join_request_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clubs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(50) NOT NULL,
	"description" text,
	"logo_url" text,
	"banner_url" text,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"contact_email" varchar(255),
	"website_url" text,
	"address" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clubs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "elo_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"match_id" uuid,
	"elo" integer NOT NULL,
	"delta" integer NOT NULL,
	"reason" "elo_change_reason" NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"target_type" varchar(10) NOT NULL,
	"target_id" uuid NOT NULL,
	"emoji" varchar(10) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"author_id" uuid,
	"parent_reply_id" uuid,
	"content" text NOT NULL,
	"is_bot" boolean DEFAULT false NOT NULL,
	"is_solution" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid NOT NULL,
	"author_id" uuid,
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"category" "forum_category" DEFAULT 'général' NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"is_bot" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"reply_count" integer DEFAULT 0 NOT NULL,
	"last_reply_at" timestamp,
	"last_reply_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_now_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"club_id" uuid NOT NULL,
	"available_until" timestamp NOT NULL,
	"message" varchar(200),
	"game_types" jsonb DEFAULT '["simple"]'::jsonb NOT NULL,
	"elo_min" integer,
	"elo_max" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_now_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"availability_id" uuid NOT NULL,
	"responder_id" uuid NOT NULL,
	"message" varchar(200),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid NOT NULL,
	"from_player_id" uuid NOT NULL,
	"to_player_id" uuid NOT NULL,
	"proposed_date" timestamp,
	"proposed_time" varchar(10),
	"message" text,
	"status" "proposal_status" DEFAULT 'pending' NOT NULL,
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid NOT NULL,
	"player1_id" uuid NOT NULL,
	"player2_id" uuid NOT NULL,
	"winner_id" uuid NOT NULL,
	"score" varchar(50) NOT NULL,
	"game_type" "game_type" DEFAULT 'simple' NOT NULL,
	"surface" "court_surface",
	"location" varchar(100),
	"player1_elo_before" integer NOT NULL,
	"player2_elo_before" integer NOT NULL,
	"player1_elo_after" integer NOT NULL,
	"player2_elo_after" integer NOT NULL,
	"modifiers_applied" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"played_at" timestamp NOT NULL,
	"reported_by" uuid,
	"validated" boolean DEFAULT false NOT NULL,
	"validated_by" uuid,
	"validated_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subscription_id" uuid,
	"stripe_payment_intent_id" varchar(255),
	"stripe_invoice_id" varchar(255),
	"amount" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'eur' NOT NULL,
	"status" varchar(50) NOT NULL,
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"badge_type" varchar(50) NOT NULL,
	"badge_name" varchar(100) NOT NULL,
	"badge_description" text,
	"badge_icon" varchar(50),
	"earned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY NOT NULL,
	"club_id" uuid NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"avatar_url" text,
	"phone" varchar(20),
	"bio" text,
	"current_elo" integer DEFAULT 1200 NOT NULL,
	"best_elo" integer DEFAULT 1200 NOT NULL,
	"lowest_elo" integer DEFAULT 1200 NOT NULL,
	"self_assessed_level" "player_level" DEFAULT 'intermédiaire' NOT NULL,
	"availability" jsonb DEFAULT '{"days":[],"timeSlots":[]}'::jsonb NOT NULL,
	"preferences" jsonb DEFAULT '{"gameTypes":["simple"],"surfaces":[]}'::jsonb NOT NULL,
	"matches_played" integer DEFAULT 0 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"win_streak" integer DEFAULT 0 NOT NULL,
	"best_win_streak" integer DEFAULT 0 NOT NULL,
	"unique_opponents" integer DEFAULT 0 NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_active_at" timestamp DEFAULT now() NOT NULL,
	"last_match_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stripe_customer_id" varchar(255) NOT NULL,
	"stripe_subscription_id" varchar(255),
	"stripe_price_id" varchar(255),
	"tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"canceled_at" timestamp,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text,
	"email_verified" timestamp,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_room_id_chat_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_players_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_room_members" ADD CONSTRAINT "chat_room_members_room_id_chat_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_room_members" ADD CONSTRAINT "chat_room_members_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_created_by_players_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_creation_requests" ADD CONSTRAINT "club_creation_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_join_requests" ADD CONSTRAINT "club_join_requests_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_join_requests" ADD CONSTRAINT "club_join_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_join_requests" ADD CONSTRAINT "club_join_requests_reviewed_by_players_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "elo_history" ADD CONSTRAINT "elo_history_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "elo_history" ADD CONSTRAINT "elo_history_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_reactions" ADD CONSTRAINT "forum_reactions_user_id_players_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_replies" ADD CONSTRAINT "forum_replies_thread_id_forum_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."forum_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_replies" ADD CONSTRAINT "forum_replies_author_id_players_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_author_id_players_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_last_reply_by_players_id_fk" FOREIGN KEY ("last_reply_by") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_now_availability" ADD CONSTRAINT "match_now_availability_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_now_availability" ADD CONSTRAINT "match_now_availability_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_now_responses" ADD CONSTRAINT "match_now_responses_availability_id_match_now_availability_id_fk" FOREIGN KEY ("availability_id") REFERENCES "public"."match_now_availability"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_now_responses" ADD CONSTRAINT "match_now_responses_responder_id_players_id_fk" FOREIGN KEY ("responder_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_proposals" ADD CONSTRAINT "match_proposals_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_proposals" ADD CONSTRAINT "match_proposals_from_player_id_players_id_fk" FOREIGN KEY ("from_player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_proposals" ADD CONSTRAINT "match_proposals_to_player_id_players_id_fk" FOREIGN KEY ("to_player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_player1_id_players_id_fk" FOREIGN KEY ("player1_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_player2_id_players_id_fk" FOREIGN KEY ("player2_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_id_players_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_reported_by_players_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_validated_by_players_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_players_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_badges" ADD CONSTRAINT "player_badges_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_messages_room_id_idx" ON "chat_messages" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "chat_messages_sender_id_idx" ON "chat_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "chat_messages_created_at_idx" ON "chat_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "chat_room_members_room_id_idx" ON "chat_room_members" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "chat_room_members_player_id_idx" ON "chat_room_members" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "chat_room_members_unique_idx" ON "chat_room_members" USING btree ("room_id","player_id");--> statement-breakpoint
CREATE INDEX "chat_rooms_club_id_idx" ON "chat_rooms" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "chat_rooms_section_idx" ON "chat_rooms" USING btree ("club_id","is_section");--> statement-breakpoint
CREATE INDEX "club_creation_requests_user_id_idx" ON "club_creation_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "club_creation_requests_status_idx" ON "club_creation_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "club_creation_requests_token_idx" ON "club_creation_requests" USING btree ("approval_token");--> statement-breakpoint
CREATE INDEX "club_join_requests_club_id_idx" ON "club_join_requests" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "club_join_requests_user_id_idx" ON "club_join_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "club_join_requests_status_idx" ON "club_join_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "elo_history_player_id_idx" ON "elo_history" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "elo_history_recorded_at_idx" ON "elo_history" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "forum_reactions_user_target_idx" ON "forum_reactions" USING btree ("user_id","target_type","target_id");--> statement-breakpoint
CREATE INDEX "forum_replies_thread_id_idx" ON "forum_replies" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "forum_threads_club_id_idx" ON "forum_threads" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "forum_threads_category_idx" ON "forum_threads" USING btree ("category");--> statement-breakpoint
CREATE INDEX "forum_threads_created_at_idx" ON "forum_threads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "match_now_player_id_idx" ON "match_now_availability" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "match_now_club_id_idx" ON "match_now_availability" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "match_now_active_until_idx" ON "match_now_availability" USING btree ("is_active","available_until");--> statement-breakpoint
CREATE INDEX "match_now_responses_availability_id_idx" ON "match_now_responses" USING btree ("availability_id");--> statement-breakpoint
CREATE INDEX "match_now_responses_responder_id_idx" ON "match_now_responses" USING btree ("responder_id");--> statement-breakpoint
CREATE INDEX "match_proposals_from_player_id_idx" ON "match_proposals" USING btree ("from_player_id");--> statement-breakpoint
CREATE INDEX "match_proposals_to_player_id_idx" ON "match_proposals" USING btree ("to_player_id");--> statement-breakpoint
CREATE INDEX "match_proposals_status_idx" ON "match_proposals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "matches_club_id_idx" ON "matches" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "matches_player1_id_idx" ON "matches" USING btree ("player1_id");--> statement-breakpoint
CREATE INDEX "matches_player2_id_idx" ON "matches" USING btree ("player2_id");--> statement-breakpoint
CREATE INDEX "matches_played_at_idx" ON "matches" USING btree ("played_at");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_is_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "payments_user_id_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payments_stripe_payment_intent_id_idx" ON "payments" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "player_badges_player_id_idx" ON "player_badges" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "players_club_id_idx" ON "players" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "players_current_elo_idx" ON "players" USING btree ("current_elo");--> statement-breakpoint
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_stripe_customer_id_idx" ON "subscriptions" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "subscriptions_stripe_subscription_id_idx" ON "subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");
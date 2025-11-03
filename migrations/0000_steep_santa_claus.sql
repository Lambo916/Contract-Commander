CREATE TABLE "bizplan_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text DEFAULT '' NOT NULL,
	"title" text NOT NULL,
	"company" text,
	"industry" text,
	"content_html" text NOT NULL,
	"approx_char_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"entity_name" text NOT NULL,
	"entity_type" text NOT NULL,
	"jurisdiction" text NOT NULL,
	"filing_type" text NOT NULL,
	"deadline" text,
	"html_content" text NOT NULL,
	"checksum" text NOT NULL,
	"metadata" json,
	"toolkit_code" text DEFAULT 'grantgenie' NOT NULL,
	"owner_id" text DEFAULT '' NOT NULL,
	"user_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_tracking" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip_address" text NOT NULL,
	"tool" text DEFAULT 'grantgenie' NOT NULL,
	"report_count" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "usage_tracking_ip_address_tool_unique" UNIQUE("ip_address","tool")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);

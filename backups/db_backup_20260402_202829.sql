--
-- PostgreSQL database dump
--

\restrict gmSTUVGxdMqcYqee2V7xtMJ5NAPbrQKj8YAHvETZtU8M0Srfa59GLbjMiFRLoZh

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: agent_stats_period_type_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.agent_stats_period_type_enum AS ENUM (
    'day',
    'week',
    'month',
    'all_time'
);


ALTER TYPE public.agent_stats_period_type_enum OWNER TO admin;

--
-- Name: agents_role_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.agents_role_enum AS ENUM (
    'admin',
    'worker'
);


ALTER TYPE public.agents_role_enum OWNER TO admin;

--
-- Name: agents_status_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.agents_status_enum AS ENUM (
    'online',
    'offline',
    'busy'
);


ALTER TYPE public.agents_status_enum OWNER TO admin;

--
-- Name: agents_type_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.agents_type_enum AS ENUM (
    'developer',
    'designer',
    'qa',
    'architect',
    'pm',
    'devops'
);


ALTER TYPE public.agents_type_enum OWNER TO admin;

--
-- Name: notifications_type_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.notifications_type_enum AS ENUM (
    'task_created',
    'task_assigned',
    'task_completed',
    'task_updated',
    'system_message',
    'agent_message',
    'comment_added'
);


ALTER TYPE public.notifications_type_enum OWNER TO admin;

--
-- Name: task_dependencies_dependencytype_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.task_dependencies_dependencytype_enum AS ENUM (
    'blocking',
    'related',
    'sequential'
);


ALTER TYPE public.task_dependencies_dependencytype_enum OWNER TO admin;

--
-- Name: task_templates_category_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.task_templates_category_enum AS ENUM (
    'development',
    'design',
    'marketing',
    'operations',
    'general'
);


ALTER TYPE public.task_templates_category_enum OWNER TO admin;

--
-- Name: task_templates_defaultpriority_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.task_templates_defaultpriority_enum AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE public.task_templates_defaultpriority_enum OWNER TO admin;

--
-- Name: tasks_priority_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.tasks_priority_enum AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE public.tasks_priority_enum OWNER TO admin;

--
-- Name: tasks_status_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.tasks_status_enum AS ENUM (
    'todo',
    'in_progress',
    'review',
    'done',
    'blocked'
);


ALTER TYPE public.tasks_status_enum OWNER TO admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: agent_stats; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.agent_stats (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    agent_id uuid NOT NULL,
    total_tasks integer DEFAULT 0 NOT NULL,
    completed_tasks integer DEFAULT 0 NOT NULL,
    accepted_tasks integer DEFAULT 0 NOT NULL,
    rejected_tasks integer DEFAULT 0 NOT NULL,
    avg_completion_time_hours numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    on_time_rate numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    period_type public.agent_stats_period_type_enum NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    calculated_at timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.agent_stats OWNER TO admin;

--
-- Name: agents; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.agents (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    type public.agents_type_enum DEFAULT 'developer'::public.agents_type_enum NOT NULL,
    description text,
    capabilities text,
    status public.agents_status_enum DEFAULT 'offline'::public.agents_status_enum NOT NULL,
    max_concurrent_tasks integer DEFAULT 5 NOT NULL,
    api_token character varying(64),
    api_token_hash character varying(255),
    api_token_expires_at timestamp without time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_by uuid,
    token_created_at timestamp without time zone,
    last_api_call_at timestamp without time zone,
    last_api_access_at timestamp without time zone,
    role public.agents_role_enum DEFAULT 'worker'::public.agents_role_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.agents OWNER TO admin;

--
-- Name: api_access_logs; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.api_access_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    agent_id character varying(100) NOT NULL,
    endpoint character varying(255) NOT NULL,
    method character varying(10) NOT NULL,
    status_code integer NOT NULL,
    response_time_ms integer,
    ip_address character varying(50),
    user_agent character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.api_access_logs OWNER TO admin;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    color character varying(7) DEFAULT '#10B981'::character varying,
    usage_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.categories OWNER TO admin;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.comments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    content text NOT NULL,
    task_id uuid NOT NULL,
    author_id uuid NOT NULL,
    author_type character varying(20) DEFAULT 'user'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.comments OWNER TO admin;

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying(255) NOT NULL
);


ALTER TABLE public.migrations OWNER TO admin;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.migrations_id_seq OWNER TO admin;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    recipient_id uuid NOT NULL,
    sender_id uuid,
    type public.notifications_type_enum NOT NULL,
    title character varying(200) NOT NULL,
    content text,
    related_task_id uuid,
    related_comment_id uuid,
    is_read boolean DEFAULT false NOT NULL,
    read_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.notifications OWNER TO admin;

--
-- Name: subtasks; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.subtasks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "taskId" uuid NOT NULL,
    title character varying NOT NULL,
    description text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.subtasks OWNER TO admin;

--
-- Name: tags; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    color character varying(7) DEFAULT '#3B82F6'::character varying,
    usage_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tags OWNER TO admin;

--
-- Name: task_categories; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.task_categories (
    task_id uuid NOT NULL,
    category_id uuid NOT NULL
);


ALTER TABLE public.task_categories OWNER TO admin;

--
-- Name: task_dependencies; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.task_dependencies (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    task_id uuid NOT NULL,
    depends_on_task_id uuid NOT NULL,
    dependency_type public.task_dependencies_dependencytype_enum DEFAULT 'blocking'::public.task_dependencies_dependencytype_enum NOT NULL,
    is_blocking boolean DEFAULT true NOT NULL,
    auto_resolve boolean DEFAULT false NOT NULL,
    resolve_after_hours integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.task_dependencies OWNER TO admin;

--
-- Name: task_status_histories; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.task_status_histories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    old_status character varying(20),
    new_status character varying(20) NOT NULL,
    changed_by uuid NOT NULL,
    changed_by_type character varying(20) DEFAULT 'user'::character varying NOT NULL,
    reason text,
    changed_at timestamp without time zone DEFAULT now(),
    changer_name text,
    changer_id text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.task_status_histories OWNER TO admin;

--
-- Name: task_tags; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.task_tags (
    task_id uuid NOT NULL,
    tag_id uuid NOT NULL
);


ALTER TABLE public.task_tags OWNER TO admin;

--
-- Name: task_templates; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.task_templates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    description text,
    category public.task_templates_category_enum DEFAULT 'general'::public.task_templates_category_enum NOT NULL,
    "defaultPriority" public.task_templates_defaultpriority_enum DEFAULT 'medium'::public.task_templates_defaultpriority_enum NOT NULL,
    "defaultTitle" text,
    "defaultDescription" text,
    "defaultMetadata" jsonb,
    tags jsonb,
    "estimatedMinutes" integer DEFAULT 0 NOT NULL,
    "usageCount" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.task_templates OWNER TO admin;

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.tasks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying NOT NULL,
    description text,
    status public.tasks_status_enum DEFAULT 'todo'::public.tasks_status_enum NOT NULL,
    priority public.tasks_priority_enum DEFAULT 'medium'::public.tasks_priority_enum NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    "dueDate" timestamp without time zone,
    "assigneeId" uuid,
    creator_id uuid NOT NULL,
    "parentId" character varying,
    metadata jsonb,
    "templateId" character varying,
    version integer NOT NULL,
    "startedAt" timestamp without time zone,
    "completedAt" timestamp without time zone,
    "blockedAt" timestamp without time zone,
    "blockReason" text,
    "lastApiCallAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp without time zone,
    due_date timestamp without time zone,
    assignee_id uuid,
    parent_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    template_id uuid,
    started_at timestamp without time zone,
    blocked_at timestamp without time zone,
    completed_at timestamp without time zone,
    block_reason text,
    deleted_at timestamp without time zone,
    short_id bigint NOT NULL,
    project_id uuid
);


ALTER TABLE public.tasks OWNER TO admin;

--
-- Name: tasks_short_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.tasks_short_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tasks_short_id_seq OWNER TO admin;

--
-- Name: tasks_short_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.tasks_short_id_seq OWNED BY public.tasks.short_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    name character varying(100),
    role character varying(20) DEFAULT 'user'::character varying NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    avatar character varying(255),
    feishu_open_id character varying(255),
    is_active boolean DEFAULT true,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone,
    display_name character varying(255),
    avatar_url character varying(500),
    feishu_name character varying(255),
    feishu_avatar_url text,
    phone character varying(20),
    department character varying(100),
    "position" character varying(100),
    bio text,
    preferences jsonb DEFAULT '{}'::jsonb,
    last_login_at timestamp without time zone,
    login_count integer DEFAULT 0
);


ALTER TABLE public.users OWNER TO admin;

--
-- Name: votes; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.votes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    user_id uuid NOT NULL,
    vote_type character varying(20) NOT NULL,
    voted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT votes_vote_type_check CHECK (((vote_type)::text = ANY ((ARRAY['upvote'::character varying, 'downvote'::character varying])::text[])))
);


ALTER TABLE public.votes OWNER TO admin;

--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: tasks short_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tasks ALTER COLUMN short_id SET DEFAULT nextval('public.tasks_short_id_seq'::regclass);


--
-- Data for Name: agent_stats; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.agent_stats (id, agent_id, total_tasks, completed_tasks, accepted_tasks, rejected_tasks, avg_completion_time_hours, on_time_rate, period_type, period_start, period_end, calculated_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: agents; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.agents (id, name, type, description, capabilities, status, max_concurrent_tasks, api_token, api_token_hash, api_token_expires_at, metadata, created_by, token_created_at, last_api_call_at, last_api_access_at, role, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: api_access_logs; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.api_access_logs (id, agent_id, endpoint, method, status_code, response_time_ms, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.categories (id, name, description, color, usage_count, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.comments (id, content, task_id, author_id, author_type, created_at, updated_at, deleted_at) FROM stdin;
d85d39eb-5860-49bf-913b-eb21304ff9f2	架构师验收测试评论	189d33a9-a120-4295-bef2-7c9b84372052	7dc68852-31bb-481b-a9ce-308451a82659	user	2026-03-21 04:17:05.252659	2026-03-21 04:17:05.252659	\N
fd2015fa-ddd9-4106-acc6-40834ac818e0	这是一条测试评论，用于验证评论功能	4a2937e4-34ba-46b2-aaa5-032c7fd8790a	550e8400-e29b-41d4-a716-446655440001	user	2026-03-21 05:21:19.639985	2026-03-21 05:21:19.639985	\N
f6fc27f5-6733-4f26-a20e-a920289a0819	架构师最终验收测试评论	37afd829-471d-4f46-b6aa-297df724f4e8	c7ba7113-bf1c-4f32-82f2-6ce32ba3659d	user	2026-03-21 05:26:45.576597	2026-03-21 05:26:45.576597	\N
0d9a92d5-d28f-46d2-9c69-2c5540645512	V5.5验收测试已完成（09:27，6&#x2F;6测试通过），建议标记为已完成	2036025a-fc83-4d82-b5cf-e885a4ad9775	49e7b692-61e9-451f-a755-34f82e724e65	user	2026-03-21 08:25:02.301379	2026-03-21 08:25:02.301379	\N
5f208c8c-c2a1-4d51-808b-05d239fd8730	V5.5验收测试已完成（09:27，6&#x2F;6测试通过），建议标记为已完成	37afd829-471d-4f46-b6aa-297df724f4e8	49e7b692-61e9-451f-a755-34f82e724e65	user	2026-03-21 08:25:13.505225	2026-03-21 08:25:13.505225	\N
b5b4232c-29cd-402e-a832-25886de236b4	V5.5验收测试已完成（09:27，6&#x2F;6测试通过），建议标记为已完成	87baaf57-8f2c-4a24-8c37-3635c94b16ac	49e7b692-61e9-451f-a755-34f82e724e65	user	2026-03-21 08:25:13.505817	2026-03-21 08:25:13.505817	\N
4f1e71ca-49a6-4795-ac8a-41ce0d05730f	V5.5验收测试已完成（09:27，6&#x2F;6测试通过），建议标记为已完成	189d33a9-a120-4295-bef2-7c9b84372052	49e7b692-61e9-451f-a755-34f82e724e65	user	2026-03-21 08:25:13.516728	2026-03-21 08:25:13.516728	\N
31b654dc-46d0-4319-aa91-ede742faf90c	V5.5验收已在13:22完成,此任务为过时任务	2036025a-fc83-4d82-b5cf-e885a4ad9775	49e7b692-61e9-451f-a755-34f82e724e65	user	2026-03-21 10:32:01.147558	2026-03-21 10:32:01.147558	\N
fcc47d79-889e-4b4a-af3a-d524282061f7	V5.5验收已在13:22完成,此任务为过时任务	87baaf57-8f2c-4a24-8c37-3635c94b16ac	49e7b692-61e9-451f-a755-34f82e724e65	user	2026-03-21 10:32:01.155699	2026-03-21 10:32:01.155699	\N
777c0719-9fe1-4165-b776-0fdc762caf63	V5.5验收已在13:22完成,此任务为过时任务	37afd829-471d-4f46-b6aa-297df724f4e8	49e7b692-61e9-451f-a755-34f82e724e65	user	2026-03-21 10:32:01.178998	2026-03-21 10:32:01.178998	\N
2bfa6561-c1c6-4440-a541-87e98df757bf	V5.5验收已在13:22完成,此任务为过时任务	189d33a9-a120-4295-bef2-7c9b84372052	49e7b692-61e9-451f-a755-34f82e724e65	user	2026-03-21 10:32:01.189388	2026-03-21 10:32:01.189388	\N
999a234f-bf71-445a-b6f5-e2a7c1acf0dd	这是第一条验收测试评论	616a22b7-ec00-41b8-b489-080f0e249db4	550e8400-e29b-41d4-a716-446655440001	user	2026-03-21 17:07:44.068429	2026-03-21 17:07:44.068429	\N
42e7ccf7-c546-4f4c-8db8-cd52e642ea6f	这是第二条验收测试评论，用于测试评论列表显示	616a22b7-ec00-41b8-b489-080f0e249db4	550e8400-e29b-41d4-a716-446655440001	user	2026-03-21 17:07:44.15052	2026-03-21 17:07:44.15052	\N
44d8cb80-8f0c-4764-9963-b9979a294a11	⚠️ 验收阻塞中：等待ops部署V5.5到TEST环境（已超时80分钟+）。部署完成后立即开始验收。	ce48263a-4432-4398-9b23-63d4b6141d2a	49e7b692-61e9-451f-a755-34f82e724e65	user	2026-03-23 02:15:53.069962	2026-03-23 02:15:53.069962	\N
7943e3af-89dc-40a7-afcf-f0812e621b52	⚠️ 验收阻塞中：等待ops部署V5.5到TEST环境（已超时80分钟+）。部署完成后立即开始验收。	04711f7f-b179-450a-a462-4fa37458220b	49e7b692-61e9-451f-a755-34f82e724e65	user	2026-03-23 02:16:11.57652	2026-03-23 02:16:11.57652	\N
80b9baf4-c67d-4565-887e-bd671ba291d1	⚠️ 验收阻塞中：等待ops部署V5.5到TEST环境（已超时80分钟+）。部署完成后立即开始验收。	bc25e0d8-d045-4668-b401-f2e50ebb46a1	49e7b692-61e9-451f-a755-34f82e724e65	user	2026-03-23 02:16:11.585836	2026-03-23 02:16:11.585836	\N
4200a908-f27e-4cda-877d-d45271795f31	延后执行：根据@claw-admin 2026-03-23 20:03决策，优先完成V5.5功能验收。此任务延后到V5.5发布后执行，等待@product确认版本归属和优先级。	b2073826-db89-49db-9336-2eb6dbe870be	49e7b692-61e9-451f-a755-34f82e724e65	user	2026-03-23 12:04:58.164639	2026-03-23 12:04:58.164639	\N
8e162e10-1c31-4aa8-acd7-7f6a3b8dd29c	延后执行：根据@claw-admin 2026-03-23 20:03决策，优先完成V5.5功能验收。此任务延后到V5.5发布后执行，等待@product确认版本归属和优先级。	e151a1cf-54f3-4dd4-8d15-402a99eee5ce	49e7b692-61e9-451f-a755-34f82e724e65	user	2026-03-23 12:04:58.433942	2026-03-23 12:04:58.433942	\N
e5a4fdcf-41ba-4090-9228-ffa69ea053ac	延后执行：根据@claw-admin 2026-03-23 20:03决策，优先完成V5.5功能验收。此任务延后到V5.5发布后执行，等待@product确认版本归属和优先级。	6ffd08f8-6368-4ee0-90ed-e397aa5d7664	49e7b692-61e9-451f-a755-34f82e724e65	user	2026-03-23 12:04:58.699821	2026-03-23 12:04:58.699821	\N
07c7db0c-53d4-464e-b547-c6492e4dc286	延后执行：根据@claw-admin 2026-03-23 20:03决策，优先完成V5.5功能验收。此任务延后到V5.5发布后执行，等待@product确认版本归属和优先级。	f3426e45-358c-4a1c-a860-9588a816c43c	49e7b692-61e9-451f-a755-34f82e724e65	user	2026-03-23 12:04:58.968103	2026-03-23 12:04:58.968103	\N
67391446-80ec-4ad6-b397-1060ef2d67ee	延后执行：根据@claw-admin 2026-03-23 20:03决策，优先完成V5.5功能验收。此任务延后到V5.5发布后执行，等待@product确认版本归属和优先级。	2b7d3f67-4a55-4c50-ab79-5869e8e2d504	49e7b692-61e9-451f-a755-34f82e724e65	user	2026-03-23 12:04:59.238899	2026-03-23 12:04:59.238899	\N
6a60690c-32f1-49f4-b854-c972691f1432	延后执行：根据@claw-admin 2026-03-23 20:03决策，优先完成V5.5功能验收。此任务延后到V5.5发布后执行，等待@product确认版本归属和优先级。	13c2c085-f379-4878-adb4-88ddbe3fc312	49e7b692-61e9-451f-a755-34f82e724e65	user	2026-03-23 12:04:59.506045	2026-03-23 12:04:59.506045	\N
d7f9eb9e-2247-42d4-be8c-437be86caea0	延后执行：根据@claw-admin 2026-03-23 20:03决策，优先完成V5.5功能验收。此任务延后到V5.5发布后执行，等待@product确认版本归属和优先级。	bc25e0d8-d045-4668-b401-f2e50ebb46a1	49e7b692-61e9-451f-a755-34f82e724e65	user	2026-03-23 12:04:59.771784	2026-03-23 12:04:59.771784	\N
3aac15b2-f92b-4b06-9dc0-ff92b88546a9	延后执行：根据@claw-admin 2026-03-23 20:03决策，优先完成V5.5功能验收。此任务延后到V5.5发布后执行，等待@product确认版本归属和优先级。	71773a61-e5ad-4a36-a2e1-43261968f0f5	49e7b692-61e9-451f-a755-34f82e724e65	user	2026-03-23 12:05:00.040225	2026-03-23 12:05:00.040225	\N
907f3187-c997-4c7d-9cbe-20b289d8640e	延后执行：根据@claw-admin 2026-03-23 20:03决策，优先完成V5.5功能验收。此任务延后到V5.5发布后执行，等待@product确认版本归属和优先级。	04711f7f-b179-450a-a462-4fa37458220b	49e7b692-61e9-451f-a755-34f82e724e65	user	2026-03-23 12:05:00.307627	2026-03-23 12:05:00.307627	\N
045a6ad9-b276-40e3-b1ad-288c46b6e36e	延后执行：根据@claw-admin 2026-03-23 20:03决策，优先完成V5.5功能验收。此任务延后到V5.5发布后执行，等待@product确认版本归属和优先级。	ce48263a-4432-4398-9b23-63d4b6141d2a	49e7b692-61e9-451f-a755-34f82e724e65	user	2026-03-23 12:05:00.578282	2026-03-23 12:05:00.578282	\N
47246318-7942-47ca-ad05-e8bea2e34dbe	【项目经理跟进】第一阶段API稳定性排查完成（01:53-02:15，22分钟）。发现并修复前端API配置错误（VITE_API_BASE_URL），需要重启nginx代理才能生效。准备开始第二阶段UI稳定性排查。	b2073826-db89-49db-9336-2eb6dbe870be	49e7b692-61e9-451f-a755-34f82e724e65	user	2026-03-23 18:31:40.098878	2026-03-23 18:31:40.098878	\N
05dfba70-5739-45f1-9282-b4b8e38cbcc2	V5.6统计报表页面验收通过（2026-03-24 10:52）。验收结果：6&#x2F;6（100%），0个缺陷。修复过程：5轮测试，修复了认证API、统计API、localStorage键名、数据提取逻辑等问题。前端镜像版本：v5.7.5。任务已完成。	b2073826-db89-49db-9336-2eb6dbe870be	49e7b692-61e9-451f-a755-34f82e724e65	user	2026-03-24 03:15:38.966113	2026-03-24 03:15:38.966113	\N
c5f79c97-65f4-439b-9a08-ab4a2888b3b7	⚠️ 监控发现：任务状态为review但进度为0%，需要确认是否可以开始开发或存在阻塞问题。	0aa1c533-fb70-4392-8822-f58783aae5ad	49e7b692-61e9-451f-a755-34f82e724e65	user	2026-03-27 09:42:56.950602	2026-03-27 09:42:56.950602	\N
3515a4fd-bf0c-4f90-8d59-70edc615a94b	V5.4项目管理API已完成！\n\n✅ 已完成的所有API接口（共9个）：\n1. POST &#x2F;api&#x2F;v1&#x2F;projects - 创建项目\n2. GET &#x2F;api&#x2F;v1&#x2F;projects - 查询项目列表\n3. GET &#x2F;api&#x2F;v1&#x2F;projects&#x2F;:id - 查询单个项目\n4. PUT &#x2F;api&#x2F;v1&#x2F;projects&#x2F;:id - 更新项目\n5. DELETE &#x2F;api&#x2F;v1&#x2F;projects&#x2F;:id - 删除项目\n6. GET &#x2F;api&#x2F;v1&#x2F;projects&#x2F;:id&#x2F;tasks - 查询项目任务列表\n7. POST &#x2F;api&#x2F;v1&#x2F;projects&#x2F;:id&#x2F;members - 添加项目成员\n8. DELETE &#x2F;api&#x2F;v1&#x2F;projects&#x2F;:id&#x2F;members&#x2F;:userId - 移除项目成员\n9. GET &#x2F;api&#x2F;v1&#x2F;projects&#x2F;:id&#x2F;members - 查询项目成员列表（新接口）\n\n✅ 已完成的所有内容：\n1. 实现Project数据模型（添加status、startDate、endDate字段）\n2. 实现项目管理CRUD API（全部5个）\n3. 实现任务按项目筛选API\n4. 实现项目成员管理API（3个接口）\n5. 数据库迁移完成\n\n完成时间：2026-03-27 18:01\n后端服务：正在运行\nAPI测试：全部通过\narchitect确认：18:02\n\n等待QA验收测试。	488c7a45-a037-4e4e-b6b7-c329d412d5a4	49e7b692-61e9-451f-a755-34f82e724e65	user	2026-03-27 13:30:25.663703	2026-03-27 13:30:25.663703	\N
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.notifications (id, recipient_id, sender_id, type, title, content, related_task_id, related_comment_id, is_read, read_at, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: subtasks; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.subtasks (id, "taskId", title, description, "sortOrder", completed, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.tags (id, name, description, color, usage_count, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: task_categories; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.task_categories (task_id, category_id) FROM stdin;
\.


--
-- Data for Name: task_dependencies; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.task_dependencies (id, task_id, depends_on_task_id, dependency_type, is_blocking, auto_resolve, resolve_after_hours, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: task_status_histories; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.task_status_histories (id, task_id, old_status, new_status, changed_by, changed_by_type, reason, changed_at, changer_name, changer_id, created_at) FROM stdin;
\.


--
-- Data for Name: task_tags; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.task_tags (task_id, tag_id) FROM stdin;
\.


--
-- Data for Name: task_templates; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.task_templates (id, name, description, category, "defaultPriority", "defaultTitle", "defaultDescription", "defaultMetadata", tags, "estimatedMinutes", "usageCount", "isActive", created_by, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.tasks (id, title, description, status, priority, progress, "dueDate", "assigneeId", creator_id, "parentId", metadata, "templateId", version, "startedAt", "completedAt", "blockedAt", "blockReason", "lastApiCallAt", "createdAt", "updatedAt", "deletedAt", due_date, assignee_id, parent_id, created_at, updated_at, template_id, started_at, blocked_at, completed_at, block_reason, deleted_at, short_id, project_id) FROM stdin;
05a82678-ed1d-44d5-a879-37f3a37f9c76	[V5.4] 设计依赖关系和标签数据模型	## 任务背景\nV5.4版本需要实现任务依赖关系和标签管理功能，需要先设计数据模型。\n\n## 任务内容\n1. 设计任务依赖关系的数据模型（TaskDependency表）\n2. 设计标签管理的数据模型（Tag表、TaskTag关联表）\n3. 绘制ER图\n4. 编写数据模型设计文档\n\n## 验收标准\n- ✅ 数据模型设计文档完整\n- ✅ ER图清晰\n- ✅ 支持循环依赖检测\n- ✅ 支持标签多对多关系\n\n## 相关资源\n- V5.4计划：docs&#x2F;v5.4-task-plan.md\n\n## 分配建议\n- 负责人：claw2-architect\n- 优先级：P0\n- 工作量：S（1天）	todo	high	0	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	1	\N	\N	\N	\N	\N	2026-03-16 00:43:50.08847	2026-03-16 00:43:50.08847	\N	2026-03-17 18:00:00	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-16 00:43:50.08847	2026-03-16 00:43:50.08847	\N	\N	\N	\N	\N	\N	1	\N
c01a7bbf-3980-4aa1-a354-8fd42d24539b	[V5.4] 设计API接口文档	## 任务背景\nV5.4版本需要实现任务依赖关系和标签管理功能，需要先设计API接口。\n\n## 任务内容\n1. 设计依赖关系API接口\n2. 设计标签管理API接口\n3. 编写API接口文档\n4. 提供示例请求和响应\n\n## 验收标准\n- ✅ API接口文档完整\n- ✅ 包含所有端点的请求和响应示例\n- ✅ 符合RESTful规范\n\n## 相关资源\n- V5.4计划：docs&#x2F;v5.4-task-plan.md\n\n## 分配建议\n- 负责人：claw2-architect\n- 优先级：P0\n- 工作量：S（1天）	todo	high	0	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	1	\N	\N	\N	\N	\N	2026-03-16 00:45:23.042058	2026-03-16 00:45:23.042058	\N	2026-03-17 18:00:00	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-16 00:45:23.042058	2026-03-16 00:45:23.042058	\N	\N	\N	\N	\N	\N	2	\N
ecac59ab-3ae5-4ca1-9df3-33bf299f0b38	[V5.4] 实现依赖关系API	## 任务背景\nV5.4版本需要实现任务依赖关系功能。\n\n## 任务内容\n1. 实现POST &#x2F;api&#x2F;v1&#x2F;tasks&#x2F;:id&#x2F;dependencies - 添加依赖关系\n2. 实现DELETE &#x2F;api&#x2F;v1&#x2F;tasks&#x2F;:id&#x2F;dependencies&#x2F;:depId - 删除依赖关系\n3. 实现GET &#x2F;api&#x2F;v1&#x2F;tasks&#x2F;:id&#x2F;dependencies - 获取依赖关系\n4. 编写单元测试\n\n## 验收标准\n- ✅ API接口实现完成\n- ✅ 单元测试覆盖率&gt;80%\n- ✅ API响应符合文档规范\n\n## 相关资源\n- V5.4计划：docs&#x2F;v5.4-task-plan.md\n\n## 分配建议\n- 负责人：claw2-dev1\n- 优先级：P0\n- 工作量：M（2天）	todo	high	0	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	1	\N	\N	\N	\N	\N	2026-03-16 00:45:23.057463	2026-03-16 00:45:23.057463	\N	2026-03-19 18:00:00	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-16 00:45:23.057463	2026-03-16 00:45:23.057463	\N	\N	\N	\N	\N	\N	3	\N
20f99066-06c1-4828-8de5-ed4235a77cfc	[V5.4] 实现依赖关系业务逻辑	## 任务背景\nV5.4版本需要实现循环依赖检测和自动通知功能。\n\n## 任务内容\n1. 实现循环依赖检测算法\n2. 实现前置任务完成时自动通知\n3. 实现任务状态变更时检查前置任务\n4. 编写单元测试\n\n## 验收标准\n- ✅ 循环依赖检测正确\n- ✅ 自动通知功能正常\n- ✅ 单元测试覆盖率&gt;80%\n\n## 相关资源\n- V5.4计划：docs&#x2F;v5.4-task-plan.md\n\n## 分配建议\n- 负责人：claw2-dev1\n- 优先级：P0\n- 工作量：M（1天）	todo	high	0	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	1	\N	\N	\N	\N	\N	2026-03-16 00:45:23.082377	2026-03-16 00:45:23.082377	\N	2026-03-20 18:00:00	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-16 00:45:23.082377	2026-03-16 00:45:23.082377	\N	\N	\N	\N	\N	\N	4	\N
6746b5cf-1dfc-48a4-a8e1-33a90f8628e4	[V5.4] 实现标签管理API	## 任务背景\nV5.4版本需要实现标签管理功能。\n\n## 任务内容\n1. 实现POST &#x2F;api&#x2F;v1&#x2F;tags - 创建标签\n2. 实现GET &#x2F;api&#x2F;v1&#x2F;tags - 获取标签列表\n3. 实现PUT &#x2F;api&#x2F;v1&#x2F;tags&#x2F;:id - 更新标签\n4. 实现DELETE &#x2F;api&#x2F;v1&#x2F;tags&#x2F;:id - 删除标签\n5. 实现POST &#x2F;api&#x2F;v1&#x2F;tasks&#x2F;:id&#x2F;tags - 为任务添加标签\n6. 实现DELETE &#x2F;api&#x2F;v1&#x2F;tasks&#x2F;:id&#x2F;tags&#x2F;:tagId - 移除任务标签\n7. 编写单元测试\n\n## 验收标准\n- ✅ 所有API接口实现完成\n- ✅ 单元测试覆盖率&gt;80%\n- ✅ API响应符合文档规范\n\n## 相关资源\n- V5.4计划：docs&#x2F;v5.4-task-plan.md\n\n## 分配建议\n- 负责人：claw2-dev1\n- 优先级：P0\n- 工作量：M（2天）	todo	high	0	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	1	\N	\N	\N	\N	\N	2026-03-16 00:45:49.108866	2026-03-16 00:45:49.108866	\N	2026-03-21 18:00:00	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-16 00:45:49.108866	2026-03-16 00:45:49.108866	\N	\N	\N	\N	\N	\N	5	\N
e54df23e-4185-4530-91e0-89eaa4f98cab	[V5.4] 设计标签管理UI原型	## 任务背景\nV5.4版本需要实现标签管理功能的前端界面。\n\n## 任务内容\n1. 设计标签管理页面原型\n2. 设计任务标签选择器组件原型\n3. 提供设计稿\n4. 与项目经理确认设计方案\n\n## 验收标准\n- ✅ 设计稿完整\n- ✅ UI符合现有系统风格\n- ✅ 项目经理确认通过\n\n## 相关资源\n- V5.4计划：docs&#x2F;v5.4-task-plan.md\n\n## 分配建议\n- 负责人：claw2-dev2\n- 优先级：P1\n- 工作量：S（1天）	todo	medium	0	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	1	\N	\N	\N	\N	\N	2026-03-16 00:45:49.126299	2026-03-16 00:45:49.126299	\N	2026-03-18 18:00:00	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-16 00:45:49.126299	2026-03-16 00:45:49.126299	\N	\N	\N	\N	\N	\N	6	\N
d46a543a-fd2f-4f45-8207-14e437e4fa8f	[V5.4] 实现标签管理前端页面	## 任务背景\nV5.4版本需要实现标签管理功能的前端界面。\n\n## 任务内容\n1. 实现标签管理页面（创建、编辑、删除标签）\n2. 实现标签列表展示\n3. 实现标签颜色选择器\n4. 编写组件测试\n\n## 验收标准\n- ✅ 页面功能完整\n- ✅ UI符合设计稿\n- ✅ 组件测试通过\n\n## 相关资源\n- V5.4计划：docs&#x2F;v5.4-task-plan.md\n\n## 分配建议\n- 负责人：claw2-dev2\n- 优先级：P0\n- 工作量：M（2天）	todo	high	0	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	1	\N	\N	\N	\N	\N	2026-03-16 00:45:49.151346	2026-03-16 00:45:49.151346	\N	2026-03-20 18:00:00	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-16 00:45:49.151346	2026-03-16 00:45:49.151346	\N	\N	\N	\N	\N	\N	7	\N
122e4faf-8fb7-43c5-b2cb-48144171d72b	[V5.4] 实现任务标签选择器组件	## 任务背景\nV5.4版本需要实现任务标签选择功能。\n\n## 任务内容\n1. 实现任务标签选择器组件\n2. 支持多选标签\n3. 支持创建新标签\n4. 编写组件测试\n\n## 验收标准\n- ✅ 组件功能完整\n- ✅ 支持多选和创建\n- ✅ 组件测试通过\n\n## 相关资源\n- V5.4计划：docs&#x2F;v5.4-task-plan.md\n\n## 分配建议\n- 负责人：claw2-dev2\n- 优先级：P0\n- 工作量：M（1天）	todo	high	0	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	1	\N	\N	\N	\N	\N	2026-03-16 00:46:17.187493	2026-03-16 00:46:17.187493	\N	2026-03-21 18:00:00	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-16 00:46:17.187493	2026-03-16 00:46:17.187493	\N	\N	\N	\N	\N	\N	8	\N
e3cd7a46-804b-42de-b29d-ee896ffd0925	[V5.4] 功能测试	## 任务背景\nV5.4版本开发完成，需要进行功能测试。\n\n## 任务内容\n1. 测试依赖关系功能\n2. 测试标签管理功能\n3. 测试边界情况\n4. 记录bug并跟踪修复\n\n## 验收标准\n- ✅ 所有功能测试通过\n- ✅ 边界测试覆盖完整\n- ✅ bug列表清晰\n\n## 相关资源\n- V5.4计划：docs&#x2F;v5.4-task-plan.md\n\n## 分配建议\n- 负责人：claw2-qa\n- 优先级：P0\n- 工作量：M（2天）	todo	high	0	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	1	\N	\N	\N	\N	\N	2026-03-16 00:46:17.203723	2026-03-16 00:46:17.203723	\N	2026-03-26 18:00:00	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-16 00:46:17.203723	2026-03-16 00:46:17.203723	\N	\N	\N	\N	\N	\N	9	\N
558ea607-513e-4354-965f-683fb7742ffe	[V5.4] 验收测试	## 任务背景\nV5.4版本功能测试完成，需要进行验收测试。\n\n## 任务内容\n1. 验收依赖关系功能\n2. 验收标签管理功能\n3. 验收性能要求\n4. 编写验收测试报告\n\n## 验收标准\n- ✅ 所有验收标准满足\n- ✅ 验收测试报告完整\n- ✅ 项目经理确认通过\n\n## 相关资源\n- V5.4计划：docs&#x2F;v5.4-task-plan.md\n\n## 分配建议\n- 负责人：claw2-qa\n- 优先级：P0\n- 工作量：S（1天）	todo	high	0	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	1	\N	\N	\N	\N	\N	2026-03-16 00:46:17.230318	2026-03-16 00:46:17.230318	\N	2026-03-27 18:00:00	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-16 00:46:17.230318	2026-03-16 00:46:17.230318	\N	\N	\N	\N	\N	\N	10	\N
f5a054be-109c-4c70-beec-253914ea402d	[V5.4] 发布到生产环境	## 任务背景\nV5.4版本验收测试通过，需要发布到生产环境。\n\n## 任务内容\n1. 准备发布脚本\n2. 发布到测试环境\n3. UAT验收测试\n4. 发布到生产环境\n5. 发布后验证\n\n## 验收标准\n- ✅ 生产环境发布成功\n- ✅ 功能验证通过\n- ✅ 发布报告完整\n\n## 相关资源\n- V5.4计划：docs&#x2F;v5.4-task-plan.md\n\n## 分配建议\n- 负责人：claw2-ops\n- 优先级：P0\n- 工作量：S（1天）	todo	high	0	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	1	\N	\N	\N	\N	\N	2026-03-16 00:46:17.256212	2026-03-16 00:46:17.256212	\N	2026-03-30 18:00:00	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-16 00:46:17.256212	2026-03-16 00:46:17.256212	\N	\N	\N	\N	\N	\N	11	\N
2036025a-fc83-4d82-b5cf-e885a4ad9775	投票功能测试任务	测试P1修复	todo	medium	0	\N	\N	c7ba7113-bf1c-4f32-82f2-6ce32ba3659d	\N	\N	\N	1	\N	\N	\N	\N	\N	2026-03-21 05:26:01.842944	2026-03-21 05:26:01.842944	\N	\N	c7ba7113-bf1c-4f32-82f2-6ce32ba3659d	\N	2026-03-21 05:26:01.842944	2026-03-21 05:26:01.842944	\N	\N	\N	\N	\N	\N	12	\N
7b681629-df9f-4f72-8b1e-1b35bb0263f6	[V5.4] 实现项目管理界面	## 任务背景\n主人指令新增项目管理（CRUD）功能。\n\n## 任务内容\n1. 实现项目管理页面（创建、编辑、删除项目）\n2. 实现项目列表展示\n3. 实现任务按项目筛选\n4. 实现项目成员管理界面\n5. 编写组件测试\n\n## 功能描述\n- 项目管理页面：创建、编辑、删除项目\n- 项目列表展示：显示所有项目，支持筛选和搜索\n- 任务按项目筛选：在任务列表中按项目筛选\n- 项目成员管理：添加和移除项目成员\n\n## 验收标准\n- ✅ 页面功能完整\n- ✅ UI符合设计稿\n- ✅ 组件测试通过\n\n## 相关资源\n- V5.4调整计划：docs&#x2F;v5.4-task-plan-adjusted.md\n\n## 分配建议\n- 负责人：claw2-dev2\n- 优先级：P0\n- 工作量：M（2天）	todo	high	0	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	1	\N	\N	\N	\N	\N	2026-03-16 01:17:04.157174	2026-03-16 01:17:04.157174	\N	2026-03-24 18:00:00	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-16 01:17:04.157174	2026-03-16 01:17:04.157174	\N	\N	\N	\N	\N	\N	13	\N
d227c4e3-a0c5-4265-996d-9f85a96dc692	[V5.4] QA工作流程调整：编写测试脚本	## 任务背景\n主人指令调整QA工作流程（5个阶段），必须使用测试脚本进行验收。\n\n## 任务内容\n1. 根据测试用例编写自动化测试脚本\n2. 覆盖所有测试场景\n3. 脚本评审\n4. 准备DEV验收、TEST验收、生产环境验收\n\n## 测试脚本要求\n- 覆盖所有测试用例\n- 支持自动化执行\n- 生成测试报告\n- 支持多环境运行（DEV、TEST、PROD）\n\n## 验收标准\n- ✅ 测试脚本覆盖所有场景\n- ✅ 脚本评审通过\n- ✅ 可以自动化执行\n- ✅ 生成测试报告\n\n## 相关资源\n- V5.4调整计划：docs&#x2F;v5.4-task-plan-adjusted.md\n\n## 分配建议\n- 负责人：claw2-qa\n- 优先级：P0\n- 工作量：M（2天）	todo	high	0	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	1	\N	\N	\N	\N	\N	2026-03-16 01:17:04.199555	2026-03-16 01:17:04.199555	\N	2026-03-26 18:00:00	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-16 01:17:04.199555	2026-03-16 01:17:04.199555	\N	\N	\N	\N	\N	\N	14	\N
2b9a3a69-a491-4f22-90af-cdfbe8550cd6	[V5.5] 显示&#x2F;查询任务ID功能	## 任务背景\n主人指令：任务传递过程保留任务ID，方便跟踪。\n\n## 功能需求\n1. **任务ID显示**\n   - 任务列表中显示任务ID\n   - 任务详情中显示任务ID\n   - 任务创建后返回任务ID\n\n2. **任务唯一定位链接**\n   - 生成任务唯一定位链接（如 http:&#x2F;&#x2F;localhost:5100&#x2F;tasks&#x2F;:id）\n   - 支持通过链接直接访问任务详情\n\n3. **任务ID查询**\n   - 支持通过任务ID查询任务\n   - API: GET &#x2F;api&#x2F;v1&#x2F;tasks&#x2F;:id\n\n## 验收标准\n- ✅ 任务列表显示任务ID\n- ✅ 任务详情显示任务ID\n- ✅ 生成唯一定位链接\n- ✅ 支持通过ID查询任务\n- ✅ 任务传递过程保留任务ID\n\n## 分配建议\n- 负责人：待定（建议产品经理先编写PRD，架构师设计技术方案）\n- 优先级：P1（中）\n- 工作量：S（1天）\n\n## 备注\n- 需要产品经理明确UI设计\n- 需要架构师确认技术实现方案\n- 截止日期待定（建议与V5.5版本整体规划协调）	todo	medium	0	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	1	\N	\N	\N	\N	\N	2026-03-16 10:55:17.260921	2026-03-16 10:55:17.260921	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-16 10:55:17.260921	2026-03-16 10:55:17.260921	\N	\N	\N	\N	\N	\N	15	\N
14fb7533-ab12-4e3d-84e0-1455cd1c9700	[V5.4] 设计项目管理数据结构和API	## 任务背景\n主人指令新增项目管理（CRUD）功能。\n\n## 任务内容\n1. 设计Project数据模型\n2. 设计Task与Project的关联关系\n3. 设计项目管理API接口\n4. 编写API文档\n\n## 数据模型\n- Project表（id, name, description, userId, createdAt, updatedAt）\n- Task表添加projectId字段\n- ProjectMember关联表（projectId, userId, role）\n\n## API设计\n- POST &#x2F;api&#x2F;v1&#x2F;projects - 创建项目\n- GET &#x2F;api&#x2F;v1&#x2F;projects - 获取项目列表\n- GET &#x2F;api&#x2F;v1&#x2F;projects&#x2F;:id - 获取项目详情\n- PUT &#x2F;api&#x2F;v1&#x2F;projects&#x2F;:id - 更新项目\n- DELETE &#x2F;api&#x2F;v1&#x2F;projects&#x2F;:id - 删除项目\n- GET &#x2F;api&#x2F;v1&#x2F;projects&#x2F;:id&#x2F;tasks - 获取项目的任务列表\n\n## 验收标准\n- ✅ 数据模型设计完整\n- ✅ API接口文档完整\n- ✅ 符合RESTful规范\n\n## 相关资源\n- V5.4调整计划：docs&#x2F;v5.4-task-plan-adjusted.md\n\n## 分配建议\n- 负责人：claw2-architect\n- 优先级：P0\n- 工作量：S（1天）	done	high	100	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	2	\N	\N	\N	\N	\N	2026-03-16 01:16:25.135397	2026-03-16 01:16:25.135397	\N	2026-03-16 18:00:00	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-16 01:16:25.135397	2026-03-16 14:11:07.960854	\N	\N	\N	\N	\N	\N	17	\N
be7c7d57-9847-47c0-af6e-86d40820a4a6	[V5.4] 编写项目管理功能需求	## 任务背景\n主人指令新增项目管理（CRUD）功能。\n\n## 任务内容\n1. 分析项目管理功能需求\n2. 编写项目管理功能PRD\n3. 定义验收标准\n4. 与架构师确认技术可行性\n\n## 功能描述\n- 支持根据需要创建多个项目\n- 支持按项目管理任务\n- 任务必须归属某个项目\n\n## 验收标准\n- ✅ PRD文档完整\n- ✅ 功能描述清晰\n- ✅ 验收标准明确\n- ✅ 技术可行性确认\n\n## 相关资源\n- V5.4调整计划：docs&#x2F;v5.4-task-plan-adjusted.md\n\n## 分配建议\n- 负责人：claw2-product\n- 优先级：P0\n- 工作量：S（1天）	done	high	100	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	2	\N	\N	\N	\N	\N	2026-03-16 01:16:25.121286	2026-03-16 01:16:25.121286	\N	2026-03-16 18:00:00	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-16 01:16:25.121286	2026-03-16 14:14:36.408159	\N	\N	\N	\N	\N	\N	18	\N
99542fff-f2e1-41fe-8495-c84e9e8e2d03	冒烟测试任务	这是一个冒烟测试任务	done	medium	100	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	3	\N	\N	\N	\N	\N	2026-03-16 10:25:00.88098	2026-03-16 10:25:00.88098	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-16 10:25:00.88098	2026-03-21 02:35:43.601442	\N	\N	\N	\N	\N	\N	19	\N
616a22b7-ec00-41b8-b489-080f0e249db4	验收测试任务-任务详情页面（已更新）	这是更新后的任务描述	in_progress	urgent	50	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	\N	\N	5	\N	\N	\N	\N	\N	2026-03-21 17:07:13.275903	2026-03-21 17:07:13.275903	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	2026-03-21 17:07:13.275903	2026-03-21 17:09:28.229101	\N	\N	\N	\N	\N	2026-03-21 17:09:28.229101	20	\N
04711f7f-b179-450a-a462-4fa37458220b	V5.5-UI-任务列表页面验收	UI验收：任务列表页面（6项，含V5.5新增任务ID显示与查询功能），验收任务文件：team-docs&#x2F;testing&#x2F;tasks&#x2F;V5.5-UI-任务列表页面-acceptance.md	done	high	100	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	2	\N	\N	\N	\N	\N	2026-03-22 12:33:23.185702	2026-03-22 12:33:23.185702	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	2026-03-22 12:33:23.185702	2026-03-24 05:35:05.678217	\N	\N	\N	\N	\N	\N	22	\N
ce48263a-4432-4398-9b23-63d4b6141d2a	V5.5-UI-登录页面验收	UI验收：登录页面（5项P0），验收任务文件：team-docs&#x2F;testing&#x2F;tasks&#x2F;V5.5-UI-登录页面-acceptance.md	done	high	100	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	2	\N	\N	\N	\N	\N	2026-03-22 12:33:22.867048	2026-03-22 12:33:22.867048	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	2026-03-22 12:33:22.867048	2026-03-24 05:35:05.950137	\N	\N	\N	\N	\N	\N	21	\N
216bb0b7-ffb3-4687-a969-d82e9d63ddbd	[V5.4] QA工作流程调整：编写测试计划及用例	## 任务背景\n主人指令调整QA工作流程（5个阶段）。\n\n## 任务内容\n1. 分析V5.4所有功能需求\n2. 编写测试计划\n3. 设计测试用例（正常流程、异常流程、边界情况）\n4. 评审测试计划\n\n## 测试范围\n- 项目管理功能\n- 任务依赖关系\n- 标签管理\n\n## 测试计划内容\n- 测试策略\n- 测试环境\n- 测试范围\n- 测试用例\n- 测试数据\n\n## 验收标准\n- ✅ 测试计划完整\n- ✅ 测试用例覆盖所有场景\n- ✅ 评审通过\n\n## 相关资源\n- V5.4调整计划：docs&#x2F;v5.4-task-plan-adjusted.md\n\n## 分配建议\n- 负责人：claw2-qa\n- 优先级：P0\n- 工作量：S（1天）	done	high	100	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	6	\N	\N	\N	\N	\N	2026-03-16 01:17:04.17589	2026-03-16 01:17:04.17589	\N	2026-03-24 18:00:00	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-16 01:17:04.17589	2026-03-27 16:51:33.241416	\N	\N	\N	\N	\N	\N	16	\N
93f60809-e29a-48d6-8116-cc193c092cf7	[V5.4] 编写任务管理脚本工具及使用手册	## 任务背景\n主人指令：编写任务管理脚本工具及使用手册，简化及规范Agent任务管理使用方式。\n\n## 任务内容\n1. **任务管理脚本工具**\n   - 创建任务脚本（create-task.sh）\n   - 更新任务脚本（update-task.sh）\n   - 查询任务脚本（query-task.sh）\n   - 分配任务脚本（assign-task.sh）\n   - 列出我的任务脚本（my-tasks.sh）\n\n2. **使用手册**\n   - 任务管理系统使用规范\n   - API调用示例（curl命令）\n   - 脚本工具使用说明\n   - 常见问题解答\n   - 最佳实践\n\n## 验收标准\n- ✅ 脚本工具完整（5个脚本）\n- ✅ 使用手册完整\n- ✅ 脚本工具可以正常运行\n- ✅ 使用手册清晰易懂\n- ✅ 所有Agent都能使用脚本工具\n\n## 分配建议\n- 负责人：项目经理（协调）、Ops（编写脚本）、管家（编写手册）\n- 优先级：P0\n- 工作量：M（2天）\n\n## 备注\n- 脚本工具应支持简单的命令行操作\n- 使用手册应包含详细的API调用示例\n- 建议在~&#x2F;.openclaw&#x2F;workspace-main&#x2F;scripts&#x2F;目录下创建脚本\n- 使用手册建议放在docs&#x2F;目录下	todo	high	0	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	1	\N	\N	\N	\N	\N	2026-03-16 11:03:56.241135	2026-03-16 11:03:56.241135	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-16 11:03:56.241135	2026-03-16 11:03:56.241135	\N	\N	\N	\N	\N	\N	23	\N
90d4cc77-465b-42ab-bae3-a4790dac759e	QA验证测试	QA验证API功能	done	medium	100	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	5	\N	\N	\N	\N	\N	2026-03-16 14:05:18.438641	2026-03-16 14:05:18.438641	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-16 14:05:18.438641	2026-03-18 04:50:36.072497	\N	\N	\N	\N	\N	\N	24	\N
757eeefa-f238-4895-9015-e7af33be0411	QA验收测试-看板页面-TC-KANBAN-001	用于验证任务看板页面创建任务功能的测试任务	done	high	0	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	\N	\N	4	\N	\N	\N	\N	\N	2026-03-21 17:07:49.257725	2026-03-21 17:07:49.257725	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	2026-03-21 17:07:49.257725	2026-03-21 17:07:49.327729	\N	\N	\N	\N	\N	2026-03-21 17:07:49.327729	25	\N
51e284b5-f62c-425c-a494-09637a96fb1a	子任务1：UI设计	完成任务详情页面的UI设计	done	high	0	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	\N	\N	3	\N	\N	\N	\N	\N	2026-03-21 17:08:03.669429	2026-03-21 17:08:03.669429	\N	\N	550e8400-e29b-41d4-a716-446655440001	616a22b7-ec00-41b8-b489-080f0e249db4	2026-03-21 17:08:03.669429	2026-03-21 17:09:28.188551	\N	\N	\N	\N	\N	2026-03-21 17:09:28.188551	26	\N
8e607872-9c2e-4abd-b80c-5d2039ca50b3	子任务2：后端API开发	开发任务详情页面的后端API	in_progress	high	0	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	\N	\N	2	\N	\N	\N	\N	\N	2026-03-21 17:08:03.70088	2026-03-21 17:08:03.70088	\N	\N	550e8400-e29b-41d4-a716-446655440001	616a22b7-ec00-41b8-b489-080f0e249db4	2026-03-21 17:08:03.70088	2026-03-21 17:09:28.204942	\N	\N	\N	\N	\N	2026-03-21 17:09:28.204942	27	\N
55fe0847-c242-43ca-8d8f-f8c17232fc53	[BUG] 生产环境登录后打开任务列表页面白屏	紧急BUG：生产环境登录后打开任务列表页面白屏\n\n**问题URL**：http:&#x2F;&#x2F;localhost:5100&#x2F;tasks\n\n**优先级**：urgent\n\n**问题描述**：\n用户在生产环境登录后，打开任务列表页面时出现白屏现象，无法正常显示任务列表。\n\n**影响范围**：\n- 生产环境（localhost:5100）\n- 所有登录用户\n\n**紧急程度**：高 - 影响生产环境核心功能	done	urgent	100	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	3	\N	\N	\N	\N	\N	2026-03-17 01:14:25.240596	2026-03-17 01:14:25.240596	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-17 01:14:25.240596	2026-03-19 15:01:49.507837	\N	\N	\N	\N	\N	\N	37	\N
b37669ea-4f02-4dc5-9562-a5c17087cd3e	QA验收测试任务	这是一个QA验收测试任务，用于测试创建任务API	in_progress	medium	50	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	3	\N	\N	\N	\N	\N	2026-03-18 01:09:06.621931	2026-03-18 01:09:06.621931	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-18 01:09:06.621931	2026-03-18 01:09:52.950444	\N	\N	\N	\N	\N	2026-03-18 01:09:52.950444	38	\N
488c7a45-a037-4e4e-b6b7-c329d412d5a4	[V5.4] 实现项目管理CRUD API	## 任务背景\n主人指令新增项目管理（CRUD）功能。\n\n## 任务内容\n1. 实现Project数据模型\n2. 实现项目管理CRUD API\n3. 实现任务按项目筛选API\n4. 实现项目成员管理API\n5. 编写单元测试\n\n## API列表\n- POST &#x2F;api&#x2F;v1&#x2F;projects\n- GET &#x2F;api&#x2F;v1&#x2F;projects\n- GET &#x2F;api&#x2F;v1&#x2F;projects&#x2F;:id\n- PUT &#x2F;api&#x2F;v1&#x2F;projects&#x2F;:id\n- DELETE &#x2F;api&#x2F;v1&#x2F;projects&#x2F;:id\n- GET &#x2F;api&#x2F;v1&#x2F;projects&#x2F;:id&#x2F;tasks\n- POST &#x2F;api&#x2F;v1&#x2F;projects&#x2F;:id&#x2F;members\n- DELETE &#x2F;api&#x2F;v1&#x2F;projects&#x2F;:id&#x2F;members&#x2F;:userId\n\n## 验收标准\n- ✅ 所有API实现完成\n- ✅ 单元测试覆盖率&gt;80%\n- ✅ API响应符合文档规范\n\n## 相关资源\n- V5.4调整计划：docs&#x2F;v5.4-task-plan-adjusted.md\n\n## 分配建议\n- 负责人：claw2-dev1\n- 优先级：P0\n- 工作量：M（2天）	done	high	100	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	6	\N	\N	\N	\N	\N	2026-03-16 01:16:25.157742	2026-03-16 01:16:25.157742	\N	2026-03-19 18:00:00	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-16 01:16:25.157742	2026-03-27 13:30:00.634028	\N	\N	\N	\N	\N	\N	36	\N
e151a1cf-54f3-4dd4-8d15-402a99eee5ce	V5.5-UI-通知中心页面验收	UI验收：通知中心页面（3项），验收任务文件：team-docs&#x2F;testing&#x2F;tasks&#x2F;V5.5-UI-通知中心页面-acceptance.md	done	high	100	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	2	\N	\N	\N	\N	\N	2026-03-22 12:33:25.280408	2026-03-22 12:33:25.280408	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	2026-03-22 12:33:25.280408	2026-03-24 05:35:03.757349	\N	\N	\N	\N	\N	\N	34	\N
6ffd08f8-6368-4ee0-90ed-e397aa5d7664	V5.5-UI-系统设置页面验收	UI验收：系统设置页面（4项），验收任务文件：team-docs&#x2F;testing&#x2F;tasks&#x2F;V5.5-UI-系统设置页面-acceptance.md	done	high	100	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	2	\N	\N	\N	\N	\N	2026-03-22 12:33:24.978755	2026-03-22 12:33:24.978755	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	2026-03-22 12:33:24.978755	2026-03-24 05:35:04.038298	\N	\N	\N	\N	\N	\N	33	\N
f3426e45-358c-4a1c-a860-9588a816c43c	V5.5-UI-权限管理页面验收	UI验收：权限管理页面（3项），验收任务文件：team-docs&#x2F;testing&#x2F;tasks&#x2F;V5.5-UI-权限管理页面-acceptance.md	done	high	100	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	2	\N	\N	\N	\N	\N	2026-03-22 12:33:24.664944	2026-03-22 12:33:24.664944	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	2026-03-22 12:33:24.664944	2026-03-24 05:35:04.318879	\N	\N	\N	\N	\N	\N	32	\N
2b7d3f67-4a55-4c50-ab79-5869e8e2d504	V5.5-UI-用户中心页面验收	UI验收：用户中心页面（2项P0），验收任务文件：team-docs&#x2F;testing&#x2F;tasks&#x2F;V5.5-UI-用户中心页面-acceptance.md	done	high	100	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	2	\N	\N	\N	\N	\N	2026-03-22 12:33:24.366677	2026-03-22 12:33:24.366677	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	2026-03-22 12:33:24.366677	2026-03-24 05:35:04.590469	\N	\N	\N	\N	\N	\N	31	\N
13c2c085-f379-4878-adb4-88ddbe3fc312	V5.5-UI-Agent管理页面验收	UI验收：Agent管理页面（5项），验收任务文件：team-docs&#x2F;testing&#x2F;tasks&#x2F;V5.5-UI-Agent管理页面-acceptance.md	done	high	100	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	2	\N	\N	\N	\N	\N	2026-03-22 12:33:24.062458	2026-03-22 12:33:24.062458	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	2026-03-22 12:33:24.062458	2026-03-24 05:35:04.861845	\N	\N	\N	\N	\N	\N	30	\N
bc25e0d8-d045-4668-b401-f2e50ebb46a1	V5.5-UI-Dashboard看板页面验收	UI验收：Dashboard看板页面（6项），验收任务文件：team-docs&#x2F;testing&#x2F;tasks&#x2F;V5.5-UI-Dashboard看板页面-acceptance.md	done	high	100	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	2	\N	\N	\N	\N	\N	2026-03-22 12:33:23.769361	2026-03-22 12:33:23.769361	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	2026-03-22 12:33:23.769361	2026-03-24 05:35:05.136081	\N	\N	\N	\N	\N	\N	29	\N
71773a61-e5ad-4a36-a2e1-43261968f0f5	V5.5-UI-任务详情页面验收	UI验收：任务详情页面（13项，含V5.5新增投票功能和任务ID功能），验收任务文件：team-docs&#x2F;testing&#x2F;tasks&#x2F;V5.5-UI-任务详情页面-acceptance.md	done	high	100	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	2	\N	\N	\N	\N	\N	2026-03-22 12:33:23.47296	2026-03-22 12:33:23.47296	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	2026-03-22 12:33:23.47296	2026-03-24 05:35:05.406482	\N	\N	\N	\N	\N	\N	28	\N
b2073826-db89-49db-9336-2eb6dbe870be	V5.5-UI-统计报表页面验收	UI验收：统计报表页面（5项），验收任务文件：team-docs&#x2F;testing&#x2F;tasks&#x2F;V5.5-UI-统计报表页面-acceptance.md	review	high	90	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	5	\N	\N	\N	\N	\N	2026-03-22 12:33:25.581889	2026-03-22 12:33:25.581889	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	2026-03-22 12:33:25.581889	2026-03-27 17:13:48.435733	\N	\N	\N	\N	\N	\N	35	\N
5fd3b665-5d0c-411c-9dd5-64537d2a3dca	[V5.4] 编写任务管理脚本及使用文档	## 任务背景\n主人指令：编写任务管理脚本，封装读取、查询、更新、评论等常用操作，支持token缓存。并编写使用文档，通知所有Agent使用。\n\n## 任务内容\n1. **封装常用操作**\n   - 读取任务：查询任务详情、任务列表\n   - 查询任务：按状态、负责人、关键词查询\n   - 更新任务：更新任务状态、进度\n   - 评论任务：添加任务评论、查看评论\n\n2. **Token缓存机制**\n   - 优先使用缓存token（避免频繁登录）\n   - 自动过期处理（token过期后自动重新登录）\n   - 缓存文件：~&#x2F;.openclaw&#x2F;task-system-token.cache\n\n3. **使用文档**\n   - 完整的使用文档（包含所有命令示例）\n   - API文档（详细的参数说明）\n   - 示例脚本（常见操作的示例）\n\n## 脚本列表\n1. **task-query.sh** - 查询任务\n   - 查询单个任务\n   - 查询任务列表\n   - 按状态&#x2F;负责人筛选\n\n2. **task-update.sh** - 更新任务\n   - 更新任务状态\n   - 更新任务进度\n   - 添加任务评论\n\n3. **task-create.sh** - 创建任务\n   - 创建新任务\n   - 设置任务属性\n\n4. **task-comment.sh** - 评论任务\n   - 添加评论\n   - 查看评论\n\n5. **task-system.sh** - 主脚本（统一入口）\n   - 支持所有操作\n   - Token管理\n\n## 使用文档格式\n1. **快速开始**：基本使用示例\n2. **命令参考**：所有命令的详细说明\n3. **示例脚本**：常见操作示例\n4. **故障排除**：常见问题解答\n\n## 验收标准\n- ✅ 所有脚本编写完成（5个脚本）\n- ✅ 使用文档完整\n- ✅ 所有Agent都能使用脚本\n- ✅ Token缓存机制正常工作\n\n## 分配建议\n- 负责人：项目经理（协调）、Ops（编写脚本）、管家（编写文档）\n- 优先级：P0\n- 工作量：M（2天）\n\n## 截止日期\n建议在**3月18日（周三）**前完成\n\n## 完成后行动\n1. 发送使用文档到工作群\n2. 通知所有Agent开始使用脚本\n3. 更新IDENTITY.md中的任务管理规范	done	high	100	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	3	\N	\N	\N	\N	\N	2026-03-16 14:50:18.535912	2026-03-16 14:50:18.535912	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-16 14:50:18.535912	2026-03-21 02:35:35.732011	\N	\N	\N	\N	\N	\N	39	\N
d32f42fc-0093-470c-81a5-3b49033f1b49	AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA	完整更新测试-所有字段	review	urgent	90	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	\N	\N	10	\N	\N	\N	\N	\N	2026-03-21 17:09:52.482026	2026-03-21 17:09:52.482026	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	2026-03-21 17:09:52.482026	2026-03-21 17:09:53.468674	\N	\N	\N	\N	\N	2026-03-21 17:09:53.468674	40	\N
91fe690a-c40a-498d-a52c-e76ab14d348c	【P0-Bug】登录功能验收失败 - API路径配置错误	## 问题描述\n\n### 现象\n- 按照API文档访问登录接口返回404\n- 前端登录功能无法使用\n\n### 根本原因\n- 后端API路由配置错误\n- 文档定义: &#x2F;api&#x2F;v1&#x2F;auth&#x2F;login\n- 实际实现: &#x2F;api&#x2F;v1&#x2F;v1&#x2F;auth&#x2F;login (多了一个v1)\n\n### 影响\n- 用户无法正常登录\n- 阻塞所有需要登录的功能验收\n\n### 证据\n- HAR文件: &#x2F;tmp&#x2F;login-har.json\n- Swagger截图: &#x2F;tmp&#x2F;swagger-docs.png\n- 测试时间: 2026-03-19 23:53\n\n### 建议\n1. 修改后端路由配置，移除重复的v1\n2. 或更新API文档，反映实际路径\n3. 重启服务后重新验收\n\n### 测试环境\n- URL: http:&#x2F;&#x2F;localhost:5100\n- 账号: test@test.com\n- 工具: agent-browser CDP	done	urgent	100	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	2	\N	\N	\N	\N	\N	2026-03-19 16:20:35.563589	2026-03-19 16:20:35.563589	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-19 16:20:35.563589	2026-03-19 18:58:41.799923	\N	\N	\N	\N	\N	\N	41	\N
6d3f9494-0867-4903-a4f4-b107b3bf9dc8	[V5.4] 编写UI登录到任务列表的冒烟测试用例和脚本	## 任务背景\n主人指令：编写从UI登录到打开任务页面，显示任务列表的测试用例和脚本，添加到冒烟测试集中。每次发布更新时，必须执行所有冒烟测试，保证100%通过。\n\n## 任务内容\n\n### 1. 测试范围\n- 登录流程：从UI登录到任务管理系统\n- 任务页面：打开任务页面，显示任务列表\n- 验证点：登录成功、任务列表正确显示\n\n### 2. 测试用例\n\n#### TC001：UI登录流程测试\n- 前置条件：用户已注册\n- 测试步骤：\n  1. 打开登录页面（http:&#x2F;&#x2F;localhost:5100）\n  2. 输入正确的用户名和密码\n  3. 点击登录按钮\n  4. 等待页面跳转到任务列表页面\n- 预期结果：\n  - 登录成功\n  - localStorage中有token\n  - 页面跳转到任务列表页面\n  - 任务列表正确显示\n\n#### TC002：任务列表显示测试\n- 前置条件：用户已登录\n- 测试步骤：\n  1. 打开任务列表页面\n  2. 验证任务列表显示\n- 预期结果：\n  - 任务列表正确加载\n  - 显示正确的任务数量\n  - 任务状态正确显示\n\n### 3. 自动化测试脚本\n\n#### 脚本要求\n- 语言：Python（遵循脚本规范）\n- 框架：Selenium 或 Playwright\n- 功能：\n  - 自动登录\n  - 自动验证任务列表\n  - 自动截图\n  - 自动生成测试报告\n\n### 4. 冒烟测试集\n\n#### 测试集定义\n- 名称：smoke-tests\n- 包含测试：\n  - TC001：UI登录流程测试\n  - TC002：任务列表显示测试\n- 执行频率：每次发布更新时\n- 通过标准：100%通过\n\n### 5. 发布流程集成\n\n#### 发布前检查\n1. 执行所有冒烟测试\n2. 确认100%通过\n3. 生成测试报告\n4. 如果测试失败，禁止发布\n\n## 验收标准\n- 测试用例编写完成（2个用例）\n- 自动化脚本编写完成（Python + Selenium）\n- 添加到冒烟测试集\n- 测试脚本可执行\n- 测试报告生成功能正常\n- 发布流程集成完成\n\n## 分配建议\n- 负责人：QA（claw2-qa）\n- 优先级：P0（高优先级）\n- 工作量：M（2-3小时）\n- 截止日期：2026-03-17 03:00（2小时内完成）\n\n## 相关文档\n- 脚本规范：简单脚本用sh，复杂脚本（涉及JSON等）用Python&#x2F;Node.js\n- 测试框架：Selenium 或 Playwright\n- 测试报告：HTML格式\n\n## 备注\n这是一个P0级高优先级任务，必须在每次发布更新时执行所有冒烟测试，保证100%通过！	done	high	100	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	6	\N	\N	\N	\N	\N	2026-03-16 17:15:39.312469	2026-03-16 17:15:39.312469	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-16 17:15:39.312469	2026-03-19 08:16:37.808994	\N	\N	\N	\N	\N	\N	42	\N
7eafe902-b4f3-4669-b7e4-e48f69744f93	[BUG] UI登录后token未写入localStorage	## BUG描述\n登录login api返回成功，状态码201，包含token，但localStorage没有写入token，导致用户无法正常使用系统。\n\n## 环境\n- **环境**：PROD环境（http:&#x2F;&#x2F;localhost:5100）\n- **浏览器**：Chrome&#x2F;Edge（未确认具体版本）\n- **发现时间**：2026-03-16 22:20\n\n## 复现步骤\n1. 打开PROD环境（http:&#x2F;&#x2F;localhost:5100）\n2. 输入正确的用户名和密码\n3. 点击&quot;登录&quot;按钮\n4. 观察登录API响应\n5. 检查localStorage中的token\n\n## 预期结果\n- ✅ 登录API返回成功（状态码201）\n- ✅ 响应包含token\n- ✅ **localStorage中应该写入token**\n- ✅ 用户可以正常访问需要认证的API\n\n## 实际结果\n- ✅ 登录API返回成功（状态码201）\n- ✅ 响应包含token\n- ❌ **localStorage中没有写入token**\n- ❌ 用户无法正常访问需要认证的API\n\n## 影响范围\n- 🔴 **影响级别**：P0（紧急） - 影响用户登录，无法使用系统\n- 🔴 **影响用户**：所有用户\n- 🔴 **影响功能**：所有需要认证的功能\n\n## 可能原因分析\n1. **前端代码问题**\n   - localStorage.setItem()调用失败\n   - token字段名称不匹配\n   - 异步问题导致token未写入\n\n2. **CORS配置问题**\n   - CORS配置阻止localStorage访问\n   - 跨域问题导致localStorage不可用\n\n3. **浏览器安全策略**\n   - 浏览器安全策略阻止localStorage访问\n   - 第三方cookie被阻止\n\n## 修复建议\n1. **检查前端代码**\n   - 检查localStorage.setItem()调用\n   - 确认token字段名称\n   - 添加错误处理和日志\n\n2. **检查CORS配置**\n   - 确认CORS配置允许credentials\n   - 确认Access-Control-Allow-Origin设置\n\n3. **添加调试日志**\n   - 在token写入前后添加日志\n   - 捕获localStorage异常\n\n## 验收标准\n- ✅ 登录后localStorage中有token\n- ✅ 刷新页面后token仍然存在\n- ✅ 可以正常访问需要认证的API\n- ✅ 用户登录流程正常\n\n## 分配建议\n- **负责人**：Dev2（前端开发）、Ops（运维）\n- **优先级**：P0（紧急）\n- **工作量**：S（半天）\n- **截止日期**：立即修复（今天完成）\n\n## 相关问题\n- 问题发现：主人指令（2026-03-16 22:20）\n- 问题确认：Dev1已确认API返回正常（2026-03-16 22:01）\n- Ops正在处理CORS问题（2026-03-16 22:22）\n\n## 备注\n这是一个**P0级紧急问题**，需要立即修复，影响所有用户登录！	done	high	100	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	3	\N	\N	\N	\N	\N	2026-03-16 14:53:41.368403	2026-03-16 14:53:41.368403	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-16 14:53:41.368403	2026-03-19 14:55:46.928259	\N	\N	\N	\N	\N	\N	43	\N
65f55571-3165-4a8c-9099-68651a59c952	[V5.5] 任务投票功能	## 任务背景\n主人指令：让Agent评价任务完成情况及好坏、存在的问题等，体现Agent共同决策能力。项目经理在版本验收时需要分析踩的记录，综合决策是否订正。\n\n## 功能需求\n1. **任务投票机制**\n   - Agent可以对任务进行点赞👍🏻或踩👎🏻\n   - 投票时必须附带文字评价（说明任务完成情况、好坏、存在的问题等）\n   - 一个Agent只能对一个任务投一次票\n\n2. **投票展示**\n   - 任务详情中显示投票统计（点赞数、踩数）\n   - 显示投票列表（Agent名称、投票类型、评价文字、投票时间）\n\n3. **项目经理决策支持**\n   - 提供投票统计报表\n   - 重点展示踩👎🏻的记录（包含评价文字）\n   - 帮助项目经理综合决策是否订正\n\n## 验收标准\n- ✅ Agent可以对任务点赞👍🏻或踩👎🏻\n- ✅ 投票时必须填写评价文字\n- ✅ 任务详情显示投票统计\n- ✅ 提供投票列表查询\n- ✅ 项目经理可以查看踩👎🏻的记录\n- ✅ 一个Agent只能对一个任务投一次票\n\n## 分配建议\n- 负责人：待定（建议产品经理先编写PRD，架构师设计数据模型）\n- 优先级：P1（中）\n- 工作量：M（2天）\n\n## 备注\n- 需要设计Vote数据模型（taskId, userId, voteType, comment, createdAt）\n- 需要产品经理明确投票UI交互\n- 需要架构师确认技术实现方案\n- 截止日期待定（建议与V5.5版本整体规划协调）	done	medium	100	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	4	\N	\N	\N	\N	\N	2026-03-16 11:00:54.829914	2026-03-16 11:00:54.829914	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-16 11:00:54.829914	2026-03-21 02:26:14.448415	\N	\N	\N	\N	\N	\N	44	\N
189d33a9-a120-4295-bef2-7c9b84372052	验收测试任务	架构师验收测试	todo	medium	0	\N	\N	7dc68852-31bb-481b-a9ce-308451a82659	\N	\N	\N	1	\N	\N	\N	\N	\N	2026-03-21 04:16:31.262052	2026-03-21 04:16:31.262052	\N	\N	7dc68852-31bb-481b-a9ce-308451a82659	\N	2026-03-21 04:16:31.262052	2026-03-21 04:16:31.262052	\N	\N	\N	\N	\N	\N	45	\N
1fd7b19f-0d04-478c-896f-8b51f7f32b8b	V5.5生产环境验收测试-已更新	测试V5.5所有14项功能	todo	high	50	\N	\N	7dc68852-31bb-481b-a9ce-308451a82659	\N	\N	\N	3	\N	\N	\N	\N	\N	2026-03-21 03:52:22.020294	2026-03-21 03:52:22.020294	\N	\N	7dc68852-31bb-481b-a9ce-308451a82659	\N	2026-03-21 03:52:22.020294	2026-03-21 03:52:22.099347	\N	\N	\N	\N	\N	2026-03-21 03:52:22.099347	46	\N
87baaf57-8f2c-4a24-8c37-3635c94b16ac	投票测试任务	测试投票功能	todo	medium	0	\N	\N	7dc68852-31bb-481b-a9ce-308451a82659	\N	\N	\N	1	\N	\N	\N	\N	\N	2026-03-21 04:16:31.26888	2026-03-21 04:16:31.26888	\N	\N	7dc68852-31bb-481b-a9ce-308451a82659	\N	2026-03-21 04:16:31.26888	2026-03-21 04:16:31.26888	\N	\N	\N	\N	\N	\N	47	\N
b3335732-9c6e-4d8a-8ad5-cc27343fedc6	投票功能测试任务	用于测试V5.5新增的投票功能	todo	medium	0	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	\N	\N	2	\N	\N	\N	\N	\N	2026-03-21 05:18:35.644838	2026-03-21 05:18:35.644838	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	2026-03-21 05:18:35.644838	2026-03-21 05:18:35.971729	\N	\N	\N	\N	\N	2026-03-21 05:18:35.971729	48	\N
2e3173bb-ac81-4210-ad3e-ed28bace8eca	更新后的任务标题 - 前端验收测试	任务已更新，用于验证更新功能	in_progress	high	50	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	\N	\N	4	\N	\N	\N	\N	\N	2026-03-21 05:18:26.195509	2026-03-21 05:18:26.195509	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	2026-03-21 05:18:26.195509	2026-03-21 05:18:26.495069	\N	\N	\N	\N	\N	2026-03-21 05:18:26.495069	49	\N
f1af6457-3c5e-441d-95ae-95ef539abcc5	更新后的任务标题 - 前端验收测试	任务已更新，用于验证更新功能	in_progress	high	50	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	\N	\N	4	\N	\N	\N	\N	\N	2026-03-21 05:18:27.757338	2026-03-21 05:18:27.757338	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	2026-03-21 05:18:27.757338	2026-03-21 05:18:28.026831	\N	\N	\N	\N	\N	2026-03-21 05:18:28.026831	50	\N
ef05f20b-866d-4914-84a4-53c717ae9c2d	验收测试任务-TC-TASKLIST-003	用于验证任务创建功能的测试任务	todo	medium	0	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	\N	\N	2	\N	\N	\N	\N	\N	2026-03-21 05:19:23.243442	2026-03-21 05:19:23.243442	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	2026-03-21 05:19:23.243442	2026-03-21 05:19:23.374556	\N	\N	\N	\N	\N	2026-03-21 05:19:23.374556	51	\N
c1b61879-dfdd-410d-9d81-b6c7859c75a6	投票功能测试任务	用于测试V5.5新增的投票功能	todo	medium	0	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	\N	\N	2	\N	\N	\N	\N	\N	2026-03-21 05:19:29.466963	2026-03-21 05:19:29.466963	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	2026-03-21 05:19:29.466963	2026-03-21 05:19:29.794815	\N	\N	\N	\N	\N	2026-03-21 05:19:29.794815	52	\N
18e3d6f1-975c-4aa3-83e4-09d329a9e382	投票功能测试任务	用于测试V5.5新增的投票功能	todo	medium	0	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	\N	\N	2	\N	\N	\N	\N	\N	2026-03-21 05:20:00.312235	2026-03-21 05:20:00.312235	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	2026-03-21 05:20:00.312235	2026-03-21 05:20:00.635822	\N	\N	\N	\N	\N	2026-03-21 05:20:00.635822	53	\N
4a2937e4-34ba-46b2-aaa5-032c7fd8790a	评论功能测试任务	用于测试评论功能	todo	medium	0	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	\N	\N	2	\N	\N	\N	\N	\N	2026-03-21 05:21:19.600848	2026-03-21 05:21:19.600848	\N	\N	550e8400-e29b-41d4-a716-446655440001	\N	2026-03-21 05:21:19.600848	2026-03-21 05:21:19.811435	\N	\N	\N	\N	\N	2026-03-21 05:21:19.811435	54	\N
37afd829-471d-4f46-b6aa-297df724f4e8	最终验收测试任务	架构师最终验收测试	todo	medium	0	\N	\N	c7ba7113-bf1c-4f32-82f2-6ce32ba3659d	\N	\N	\N	1	\N	\N	\N	\N	\N	2026-03-21 05:26:01.833623	2026-03-21 05:26:01.833623	\N	\N	c7ba7113-bf1c-4f32-82f2-6ce32ba3659d	\N	2026-03-21 05:26:01.833623	2026-03-21 05:26:01.833623	\N	\N	\N	\N	\N	\N	55	\N
af9890fb-b442-4f0e-a33c-6027cfbcb781	编写V5.7测试用例	根据V5.7 PRD和技术方案编写测试用例\n\n任务内容：\n1. 阅读PRD文档：&#x2F;home&#x2F;gongdewei&#x2F;.openclaw&#x2F;workspace-product&#x2F;docs&#x2F;prd&#x2F;v5.7-prd.md\n2. 阅读技术方案：team-docs&#x2F;tech-design&#x2F;v5.7-tech-review.md\n3. 阅读任务分解：user-stories&#x2F;v5.7-task-breakdown.md\n4. 编写测试用例\n   - API测试用例：team-docs&#x2F;testing&#x2F;test-cases&#x2F;api&#x2F;v5.7-api-test-cases.md\n   - 前端测试用例：team-docs&#x2F;testing&#x2F;test-cases&#x2F;frontend&#x2F;v5.7-frontend-test-cases.md\n5. 组织评审会议\n   - 参与人员：product, architect, fullstack-dev, qa\n   - 评审内容：测试覆盖率、测试场景完整性\n\n注意事项：\n- 忽略快捷键功能测试用例\n- 测试用例需要覆盖所有V5.7功能\n- 需要包含正常场景和异常场景\n- 评审通过后通知验收群QA\n\n职责说明：\n- 设计群QA：负责编写测试用例，组织评审\n- 验收群QA：只负责按测试用例验收（独立任务）	done	high	100	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	1	\N	\N	\N	\N	\N	2026-03-26 17:20:02.250696	2026-03-26 17:20:02.250696	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-26 17:20:02.250696	2026-03-27 08:08:52.528041	\N	\N	\N	2026-03-27 06:49:00	\N	\N	58	\N
c24ea500-e3ae-44d3-84a3-66edc7c66396	V5.7功能测试	根据V5.7测试用例进行功能测试\n\n任务内容：\n1. 阅读测试用例文档\n2. 准备测试环境\n3. 执行功能测试\n4. 记录测试结果\n5. 提交测试报告\n\n注意：忽略快捷键功能测试，无需测试快捷键功能。	review	high	100	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	4	\N	\N	\N	\N	\N	2026-03-26 17:16:32.963435	2026-03-26 17:16:32.963435	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-26 17:16:32.963435	2026-03-27 17:36:07.897983	\N	\N	\N	\N	\N	\N	57	\N
0aa1c533-fb70-4392-8822-f58783aae5ad	V5.7功能开发	根据V5.7 PRD和技术方案进行开发\n\n任务内容：\n1. 阅读PRD文档\n2. 阅读技术方案\n3. 阅读任务分解\n4. 准备开发环境\n5. 开始功能开发\n\n注意：忽略快捷键功能开发，无需设计开发快捷键功能。	done	high	100	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	\N	\N	10	\N	\N	\N	\N	\N	2026-03-26 17:16:21.07577	2026-03-26 17:16:21.07577	\N	\N	49e7b692-61e9-451f-a755-34f82e724e65	\N	2026-03-26 17:16:21.07577	2026-03-28 09:02:01.540418	\N	\N	\N	\N	\N	\N	56	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.users (id, username, email, password, name, role, status, created_at, avatar, feishu_open_id, is_active, updated_at, deleted_at, display_name, avatar_url, feishu_name, feishu_avatar_url, phone, department, "position", bio, preferences, last_login_at, login_count) FROM stdin;
49e7b692-61e9-451f-a755-34f82e724e65	test	test@test.com	$2b$10$C4VemUUz5lKMoCKqiJLYQObFDNSA6JhjTr9wjohFSMoMiipiUzr9u	\N	user	active	2026-03-15 22:46:37.85786	\N	\N	t	2026-03-15 22:46:37.85786	\N	Test User	\N	\N	\N	\N	\N	\N	\N	{}	\N	0
550e8400-e29b-41d4-a716-446655440001	qa-prod	qa@prod.com	$2b$10$leace5jV5h0rZTwCzTmFAe.EIWwJtyrQhSh0cv.0uAO6y6jSdTtC.	QA User (PROD)	QA	active	2026-03-08 02:14:12.671932	\N	\N	t	2026-03-08 02:41:41.646286	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	0
7dc68852-31bb-481b-a9ce-308451a82659	qa-test	qa-test@example.com	$2b$10$P4Hpjgt5zN9TB5OSUDTFU.SgJplu353IVLcXagdw8Tlk4TKW2f.bC	\N	user	active	2026-03-21 03:52:00.613366	\N	\N	t	2026-03-21 03:52:00.613366	\N	QA Test User	\N	\N	\N	\N	\N	\N	\N	{}	\N	0
c7ba7113-bf1c-4f32-82f2-6ce32ba3659d	test2	test2@example.com	$2b$12$gF0dTo96LRbpqvEgI3xHiu89zFR6hKku6vKFzxDSUGyWg2Dka6Hku	Test User 2	user	active	2026-03-17 03:04:17.321961	\N	\N	t	2026-03-17 03:04:17.321961	\N	Test User 2	\N	\N	\N	\N	\N	\N	\N	{}	\N	0
5c7eea9a-8560-4854-8b2c-002b18132e83	qa5	qa5@example.com	$2b$10$rBKU9NhrbwzHw.j0fc4rDODvhNChDXHW6fTXCEs4A6CSO6jDzDUMe	\N	user	active	2026-03-23 00:24:48.400607	\N	\N	t	2026-03-23 00:24:48.400607	\N	QA Test User 5	\N	\N	\N	\N	\N	\N	\N	{}	\N	0
550e8400-e29b-41d4-a716-446655440000	admin-prod	admin@prod.com	$2b$10$sXRK7ZuqeV4rD.ezaoO/veaXRip5J2RAnyrbVE9wHv/QQlP5tQNOC	Admin User (PROD)	ADMIN	active	2026-03-08 02:14:12.671932	\N	\N	t	2026-03-08 02:41:41.646286	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	0
9317b3a2-2385-4667-8e3c-9660195f5bc4	testuser	test@example.com	$2b$10$uqS4/vYcZcUTGkhDsAufbedM2UR0LWV6.U9.q.kvegiGua3txUb7a	Test User	USER	active	2026-03-24 04:14:33.421944	\N	\N	t	2026-03-24 04:14:33.421944	\N	\N	\N	\N	\N	13800000001	测试部门	测试工程师	测试账号	{"theme": "light", "language": "zh-CN"}	\N	0
1837e8db-df5d-42f3-a490-8f8061cb6fab	newuser2	newuser2@example.com	$2b$10$9FdhdnJImbHu24KZZcedr.qLVeiUZZc.Hy4ePzCXHXSENVK0Lp9fm	\N	user	active	2026-03-24 04:16:13.978526	\N	\N	t	2026-03-24 04:16:13.978526	\N	New User	\N	\N	\N	\N	\N	\N	\N	{}	\N	0
\.


--
-- Data for Name: votes; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.votes (id, task_id, user_id, vote_type, voted_at, created_at, updated_at) FROM stdin;
8e5605b0-454a-488a-8aab-18f2b9fd11b0	189d33a9-a120-4295-bef2-7c9b84372052	7dc68852-31bb-481b-a9ce-308451a82659	upvote	2026-03-21 04:20:10.967271	2026-03-21 04:20:10.967271	2026-03-21 04:20:10.967271
ad67faaf-00f8-4d6d-9914-5a71a9b0cc9e	18e3d6f1-975c-4aa3-83e4-09d329a9e382	550e8400-e29b-41d4-a716-446655440001	downvote	2026-03-21 05:20:00.513	2026-03-21 05:20:00.350967	2026-03-21 05:20:00.514899
3b77d82a-61e1-4a38-89c5-70d9bd742b8d	189d33a9-a120-4295-bef2-7c9b84372052	c7ba7113-bf1c-4f32-82f2-6ce32ba3659d	upvote	2026-03-21 05:24:34.851	2026-03-21 05:24:34.852252	2026-03-21 05:24:34.852252
6f279917-b9f3-4e6c-a2c4-ff4735066001	2036025a-fc83-4d82-b5cf-e885a4ad9775	c7ba7113-bf1c-4f32-82f2-6ce32ba3659d	upvote	2026-03-21 05:26:01.861	2026-03-21 05:26:01.861896	2026-03-21 05:26:01.861896
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.migrations_id_seq', 1, false);


--
-- Name: tasks_short_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.tasks_short_id_seq', 58, true);


--
-- Name: subtasks PK_035c1c153f0239ecc95be448d96; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.subtasks
    ADD CONSTRAINT "PK_035c1c153f0239ecc95be448d96" PRIMARY KEY (id);


--
-- Name: api_access_logs PK_175901cb45dc8f64a399de47ab3; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.api_access_logs
    ADD CONSTRAINT "PK_175901cb45dc8f64a399de47ab3" PRIMARY KEY (id);


--
-- Name: notifications PK_6a72c3c0f683f6462415e653c3a; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY (id);


--
-- Name: comments PK_8bf68bc960f2b69e818bdb90dcb; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "PK_8bf68bc960f2b69e818bdb90dcb" PRIMARY KEY (id);


--
-- Name: tasks PK_8d12ff38fcc62aaba2cab748772; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY (id);


--
-- Name: agents PK_9c653f28ae19c5884d5baf6a1d9; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT "PK_9c653f28ae19c5884d5baf6a1d9" PRIMARY KEY (id);


--
-- Name: agent_stats PK_9c751f42056367339181f6851b9; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.agent_stats
    ADD CONSTRAINT "PK_9c751f42056367339181f6851b9" PRIMARY KEY (id);


--
-- Name: task_templates PK_a1347b5446b9e3158e2b72f58b2; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.task_templates
    ADD CONSTRAINT "PK_a1347b5446b9e3158e2b72f58b2" PRIMARY KEY (id);


--
-- Name: task_dependencies PK_e31de0e173af595a21c4ec8e48b; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.task_dependencies
    ADD CONSTRAINT "PK_e31de0e173af595a21c4ec8e48b" PRIMARY KEY (id);


--
-- Name: agents UQ_02fdc2012a992ce2958fcaae471; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT "UQ_02fdc2012a992ce2958fcaae471" UNIQUE (api_token_hash);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: agents UQ_abd4cc922500b9e688dcef98bcc; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT "UQ_abd4cc922500b9e688dcef98bcc" UNIQUE (api_token);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: task_categories task_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.task_categories
    ADD CONSTRAINT task_categories_pkey PRIMARY KEY (task_id, category_id);


--
-- Name: task_status_histories task_status_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.task_status_histories
    ADD CONSTRAINT task_status_histories_pkey PRIMARY KEY (id);


--
-- Name: task_tags task_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.task_tags
    ADD CONSTRAINT task_tags_pkey PRIMARY KEY (task_id, tag_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: votes votes_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_pkey PRIMARY KEY (id);


--
-- Name: votes votes_task_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_task_id_user_id_key UNIQUE (task_id, user_id);


--
-- Name: IDX_0266b39213d39be42b60b6a4a5; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "IDX_0266b39213d39be42b60b6a4a5" ON public.notifications USING btree (recipient_id, is_read);


--
-- Name: IDX_0335be897cdf4e751c5b22c6d7; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "IDX_0335be897cdf4e751c5b22c6d7" ON public.task_templates USING btree (name);


--
-- Name: IDX_45fa39d17c258987d38ddd722b; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "IDX_45fa39d17c258987d38ddd722b" ON public.api_access_logs USING btree (endpoint, created_at);


--
-- Name: IDX_6537bb6e9e285b6a8d2ef8971a; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "IDX_6537bb6e9e285b6a8d2ef8971a" ON public.api_access_logs USING btree (agent_id, created_at);


--
-- Name: IDX_710886091b003788de4a03be38; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "IDX_710886091b003788de4a03be38" ON public.task_templates USING btree (created_by);


--
-- Name: IDX_77ee7b06d6f802000c0846f3a5; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "IDX_77ee7b06d6f802000c0846f3a5" ON public.notifications USING btree (created_at);


--
-- Name: IDX_abd4cc922500b9e688dcef98bc; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "IDX_abd4cc922500b9e688dcef98bc" ON public.agents USING btree (api_token);


--
-- Name: IDX_bde925a54d07ea729b91c404b0; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "IDX_bde925a54d07ea729b91c404b0" ON public.task_templates USING btree (category);


--
-- Name: IDX_f1a92021ca96e9b28d3501456f; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "IDX_f1a92021ca96e9b28d3501456f" ON public.agent_stats USING btree (agent_id, period_type, period_start);


--
-- Name: idx_comments_deleted_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_comments_deleted_at ON public.comments USING btree (deleted_at);


--
-- Name: idx_status_histories_task; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_status_histories_task ON public.task_status_histories USING btree (task_id, changed_at);


--
-- Name: idx_tasks_project_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_tasks_project_id ON public.tasks USING btree (project_id);


--
-- Name: idx_tasks_short_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX idx_tasks_short_id ON public.tasks USING btree (short_id);


--
-- Name: idx_users_feishu_open_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_users_feishu_open_id ON public.users USING btree (feishu_open_id);


--
-- Name: idx_users_is_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_users_is_active ON public.users USING btree (is_active);


--
-- Name: idx_votes_created_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_votes_created_at ON public.votes USING btree (created_at);


--
-- Name: idx_votes_task_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_votes_task_id ON public.votes USING btree (task_id);


--
-- Name: idx_votes_user_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_votes_user_id ON public.votes USING btree (user_id);


--
-- Name: votes update_votes_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER update_votes_updated_at BEFORE UPDATE ON public.votes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: comments FK_18c2493067c11f44efb35ca0e03; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "FK_18c2493067c11f44efb35ca0e03" FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- Name: notifications FK_4140c8b09ff58165daffbefbd7e; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "FK_4140c8b09ff58165daffbefbd7e" FOREIGN KEY (sender_id) REFERENCES public.agents(id);


--
-- Name: notifications FK_5332a4daa46fd3f4e6625dd275d; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "FK_5332a4daa46fd3f4e6625dd275d" FOREIGN KEY (recipient_id) REFERENCES public.agents(id);


--
-- Name: task_dependencies FK_70371fdc2193845ef4feb9fb879; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.task_dependencies
    ADD CONSTRAINT "FK_70371fdc2193845ef4feb9fb879" FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- Name: task_templates FK_710886091b003788de4a03be383; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.task_templates
    ADD CONSTRAINT "FK_710886091b003788de4a03be383" FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: notifications FK_7561ba318331eeccb5ce889acb9; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "FK_7561ba318331eeccb5ce889acb9" FOREIGN KEY (related_comment_id) REFERENCES public.comments(id);


--
-- Name: tasks FK_9a16d2c86252529f622fa53f1e3; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3" FOREIGN KEY ("assigneeId") REFERENCES public.users(id);


--
-- Name: subtasks FK_bde15cf8f7b07bb4ccad8ef6fa3; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.subtasks
    ADD CONSTRAINT "FK_bde15cf8f7b07bb4ccad8ef6fa3" FOREIGN KEY ("taskId") REFERENCES public.tasks(id);


--
-- Name: notifications FK_c20d7d32d57fb098afde8be7701; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "FK_c20d7d32d57fb098afde8be7701" FOREIGN KEY (related_task_id) REFERENCES public.tasks(id);


--
-- Name: agent_stats FK_c79040e59384ea80ca54b5d7325; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.agent_stats
    ADD CONSTRAINT "FK_c79040e59384ea80ca54b5d7325" FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;


--
-- Name: comments FK_e6d38899c31997c45d128a8973b; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "FK_e6d38899c31997c45d128a8973b" FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: task_dependencies FK_e94ede407a522714514c8471a81; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.task_dependencies
    ADD CONSTRAINT "FK_e94ede407a522714514c8471a81" FOREIGN KEY (depends_on_task_id) REFERENCES public.tasks(id);


--
-- Name: tasks FK_f4cb489461bc751498a28852356; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "FK_f4cb489461bc751498a28852356" FOREIGN KEY (creator_id) REFERENCES public.users(id);


--
-- Name: task_status_histories fk_status_histories_task; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.task_status_histories
    ADD CONSTRAINT fk_status_histories_task FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_categories fk_task_categories_category; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.task_categories
    ADD CONSTRAINT fk_task_categories_category FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: task_categories fk_task_categories_task; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.task_categories
    ADD CONSTRAINT fk_task_categories_task FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_tags fk_task_tags_tag; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.task_tags
    ADD CONSTRAINT fk_task_tags_tag FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: task_tags fk_task_tags_task; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.task_tags
    ADD CONSTRAINT fk_task_tags_task FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: votes votes_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: votes votes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict gmSTUVGxdMqcYqee2V7xtMJ5NAPbrQKj8YAHvETZtU8M0Srfa59GLbjMiFRLoZh


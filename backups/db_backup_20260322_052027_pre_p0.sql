--
-- PostgreSQL database dump
--

\restrict 2dNrZZbhRkytxoFLrWRUHXvl5EOcVI7b6dv5NNNEB1J3bCm4cGAI2YLnCUGrt6W

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
-- Name: task_status_history_changed_by_type_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.task_status_history_changed_by_type_enum AS ENUM (
    'user',
    'agent'
);


ALTER TYPE public.task_status_history_changed_by_type_enum OWNER TO admin;

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: agent_stats; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.agent_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_id uuid NOT NULL,
    total_tasks integer DEFAULT 0,
    completed_tasks integer DEFAULT 0,
    accepted_tasks integer DEFAULT 0,
    rejected_tasks integer DEFAULT 0,
    avg_completion_time_hours numeric(10,2) DEFAULT 0,
    on_time_rate numeric(5,2) DEFAULT 0,
    period_type public.agent_stats_period_type_enum NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    calculated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.agent_stats OWNER TO admin;

--
-- Name: agents; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.agents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    type public.agents_type_enum DEFAULT 'developer'::public.agents_type_enum,
    description text,
    capabilities text[],
    status public.agents_status_enum DEFAULT 'offline'::public.agents_status_enum,
    max_concurrent_tasks integer DEFAULT 5,
    api_token character varying(64),
    api_token_hash character varying(255),
    api_token_expires_at timestamp without time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_by uuid,
    token_created_at timestamp without time zone,
    last_api_call_at timestamp without time zone,
    last_api_access_at timestamp without time zone,
    role public.agents_role_enum DEFAULT 'worker'::public.agents_role_enum,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone
);


ALTER TABLE public.agents OWNER TO admin;

--
-- Name: api_access_logs; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.api_access_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_id uuid NOT NULL,
    endpoint character varying(255) NOT NULL,
    method character varying(10) NOT NULL,
    status_code integer NOT NULL,
    response_time_ms integer NOT NULL,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.api_access_logs OWNER TO admin;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone
);


ALTER TABLE public.comments OWNER TO admin;

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
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
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recipient_id uuid NOT NULL,
    sender_id uuid,
    type public.notifications_type_enum NOT NULL,
    title character varying(200) NOT NULL,
    content text,
    related_task_id uuid,
    related_comment_id uuid,
    is_read boolean DEFAULT false,
    read_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone
);


ALTER TABLE public.notifications OWNER TO admin;

--
-- Name: task_status_histories; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.task_status_histories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    old_status public.tasks_status_enum NOT NULL,
    new_status public.tasks_status_enum NOT NULL,
    changed_by uuid NOT NULL,
    changed_by_type public.task_status_history_changed_by_type_enum NOT NULL,
    reason text,
    changed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    changer_id uuid
);


ALTER TABLE public.task_status_histories OWNER TO admin;

--
-- Name: task_templates; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.task_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    category public.task_templates_category_enum DEFAULT 'general'::public.task_templates_category_enum,
    default_priority public.task_templates_defaultpriority_enum DEFAULT 'medium'::public.task_templates_defaultpriority_enum,
    default_title text,
    default_description text,
    default_metadata jsonb,
    tags jsonb,
    estimated_minutes integer DEFAULT 0,
    usage_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone
);


ALTER TABLE public.task_templates OWNER TO admin;

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    status public.tasks_status_enum DEFAULT 'todo'::public.tasks_status_enum,
    priority public.tasks_priority_enum DEFAULT 'medium'::public.tasks_priority_enum,
    progress integer DEFAULT 0,
    due_date timestamp without time zone,
    assignee_id uuid,
    creator_id uuid NOT NULL,
    parent_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    template_id character varying(36),
    version integer DEFAULT 0,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    blocked_at timestamp without time zone,
    block_reason text,
    last_api_call_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone
);


ALTER TABLE public.tasks OWNER TO admin;

--
-- Name: users; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    display_name character varying(255) NOT NULL,
    avatar_url character varying(255),
    role character varying(50) DEFAULT 'user'::character varying,
    feishu_open_id character varying(255),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO admin;

--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


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
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.comments (id, task_id, author_id, content, created_at, updated_at, deleted_at) FROM stdin;
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
-- Data for Name: task_status_histories; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.task_status_histories (id, task_id, old_status, new_status, changed_by, changed_by_type, reason, changed_at, changer_id) FROM stdin;
\.


--
-- Data for Name: task_templates; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.task_templates (id, name, description, category, default_priority, default_title, default_description, default_metadata, tags, estimated_minutes, usage_count, is_active, created_by, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.tasks (id, title, description, status, priority, progress, due_date, assignee_id, creator_id, parent_id, metadata, template_id, version, started_at, completed_at, blocked_at, block_reason, last_api_call_at, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.users (id, email, username, password, display_name, avatar_url, role, feishu_open_id, is_active, created_at, updated_at, deleted_at) FROM stdin;
61b91c65-672d-47f0-b9fb-d503b4dbffcf	admin@admin.com	admin	$2b$10$mv34qqpLlt4GsYy6WEKROeC9NbG6jW3Iuapjbfvc/SC2dcan2.7/K	Administrator	\N	admin	\N	t	2026-03-21 19:49:17.931613	2026-03-21 19:49:17.931613	\N
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.migrations_id_seq', 1, true);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: agent_stats agent_stats_agent_id_period_type_period_start_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.agent_stats
    ADD CONSTRAINT agent_stats_agent_id_period_type_period_start_key UNIQUE (agent_id, period_type, period_start);


--
-- Name: agent_stats agent_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.agent_stats
    ADD CONSTRAINT agent_stats_pkey PRIMARY KEY (id);


--
-- Name: agents agents_api_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_api_token_hash_key UNIQUE (api_token_hash);


--
-- Name: agents agents_api_token_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_api_token_key UNIQUE (api_token);


--
-- Name: agents agents_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_pkey PRIMARY KEY (id);


--
-- Name: api_access_logs api_access_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.api_access_logs
    ADD CONSTRAINT api_access_logs_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: task_status_histories task_status_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.task_status_histories
    ADD CONSTRAINT task_status_histories_pkey PRIMARY KEY (id);


--
-- Name: task_templates task_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.task_templates
    ADD CONSTRAINT task_templates_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


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
-- Name: idx_agent_stats_agent_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_agent_stats_agent_id ON public.agent_stats USING btree (agent_id);


--
-- Name: idx_agent_stats_period_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_agent_stats_period_type ON public.agent_stats USING btree (period_type);


--
-- Name: idx_agents_api_token; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_agents_api_token ON public.agents USING btree (api_token);


--
-- Name: idx_agents_api_token_hash; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_agents_api_token_hash ON public.agents USING btree (api_token_hash);


--
-- Name: idx_agents_name; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_agents_name ON public.agents USING btree (name);


--
-- Name: idx_agents_role; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_agents_role ON public.agents USING btree (role);


--
-- Name: idx_agents_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_agents_status ON public.agents USING btree (status);


--
-- Name: idx_agents_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_agents_type ON public.agents USING btree (type);


--
-- Name: idx_api_access_logs_agent_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_api_access_logs_agent_id ON public.api_access_logs USING btree (agent_id);


--
-- Name: idx_api_access_logs_created_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_api_access_logs_created_at ON public.api_access_logs USING btree (created_at);


--
-- Name: idx_comments_author_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_comments_author_id ON public.comments USING btree (author_id);


--
-- Name: idx_comments_created_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_comments_created_at ON public.comments USING btree (created_at);


--
-- Name: idx_comments_task_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_comments_task_id ON public.comments USING btree (task_id);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);


--
-- Name: idx_notifications_recipient_id_is_read; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_notifications_recipient_id_is_read ON public.notifications USING btree (recipient_id, is_read);


--
-- Name: idx_notifications_related_task_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_notifications_related_task_id ON public.notifications USING btree (related_task_id);


--
-- Name: idx_notifications_sender_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_notifications_sender_id ON public.notifications USING btree (sender_id);


--
-- Name: idx_task_status_histories_task_id_changed_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_task_status_histories_task_id_changed_at ON public.task_status_histories USING btree (task_id, changed_at);


--
-- Name: idx_task_templates_category; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_task_templates_category ON public.task_templates USING btree (category);


--
-- Name: idx_task_templates_created_by; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_task_templates_created_by ON public.task_templates USING btree (created_by);


--
-- Name: idx_task_templates_is_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_task_templates_is_active ON public.task_templates USING btree (is_active);


--
-- Name: idx_task_templates_name; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_task_templates_name ON public.task_templates USING btree (name);


--
-- Name: idx_tasks_assignee_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_tasks_assignee_id ON public.tasks USING btree (assignee_id);


--
-- Name: idx_tasks_creator_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_tasks_creator_id ON public.tasks USING btree (creator_id);


--
-- Name: idx_tasks_deleted_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_tasks_deleted_at ON public.tasks USING btree (deleted_at);


--
-- Name: idx_tasks_duedate; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_tasks_duedate ON public.tasks USING btree (due_date);


--
-- Name: idx_tasks_parent_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_tasks_parent_id ON public.tasks USING btree (parent_id);


--
-- Name: idx_tasks_priority; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_tasks_priority ON public.tasks USING btree (priority);


--
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_feishu_open_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_users_feishu_open_id ON public.users USING btree (feishu_open_id);


--
-- Name: idx_users_is_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_users_is_active ON public.users USING btree (is_active);


--
-- Name: agent_stats agent_stats_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.agent_stats
    ADD CONSTRAINT agent_stats_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;


--
-- Name: api_access_logs api_access_logs_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.api_access_logs
    ADD CONSTRAINT api_access_logs_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id);


--
-- Name: comments comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: comments comments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_status_histories task_status_histories_changer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.task_status_histories
    ADD CONSTRAINT task_status_histories_changer_id_fkey FOREIGN KEY (changer_id) REFERENCES public.users(id);


--
-- Name: task_status_histories task_status_histories_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.task_status_histories
    ADD CONSTRAINT task_status_histories_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_templates task_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.task_templates
    ADD CONSTRAINT task_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: tasks tasks_assignee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.users(id);


--
-- Name: tasks tasks_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 2dNrZZbhRkytxoFLrWRUHXvl5EOcVI7b6dv5NNNEB1J3bCm4cGAI2YLnCUGrt6W


--
-- PostgreSQL database dump
--

\restrict K4NQ5CqQhYIaYtSlccd6KXTIHVDve9gAvj0eRwUqwdRebjj2AeTZ0KBLXwuzjOf

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_invitations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_invitations (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    email text NOT NULL,
    token text NOT NULL,
    used boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone NOT NULL
);


ALTER TABLE public.admin_invitations OWNER TO postgres;

--
-- Name: admin_invitations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_invitations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_invitations_id_seq OWNER TO postgres;

--
-- Name: admin_invitations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_invitations_id_seq OWNED BY public.admin_invitations.id;


--
-- Name: anti_vektor_zertifikate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.anti_vektor_zertifikate (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    pruefer_name text NOT NULL,
    zertifikat_bezeichnung text,
    gueltig_bis text,
    foto_base64 text,
    notizen text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    market_id integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.anti_vektor_zertifikate OWNER TO postgres;

--
-- Name: anti_vektor_zertifikate_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.anti_vektor_zertifikate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.anti_vektor_zertifikate_id_seq OWNER TO postgres;

--
-- Name: anti_vektor_zertifikate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.anti_vektor_zertifikate_id_seq OWNED BY public.anti_vektor_zertifikate.id;


--
-- Name: anti_vektor_zugangsdaten; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.anti_vektor_zugangsdaten (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    website_url text DEFAULT 'https://www.av-ods.de'::text,
    benutzername text,
    passwort text,
    rufnummer text,
    notizen text,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    market_id integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.anti_vektor_zugangsdaten OWNER TO postgres;

--
-- Name: anti_vektor_zugangsdaten_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.anti_vektor_zugangsdaten_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.anti_vektor_zugangsdaten_id_seq OWNER TO postgres;

--
-- Name: anti_vektor_zugangsdaten_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.anti_vektor_zugangsdaten_id_seq OWNED BY public.anti_vektor_zugangsdaten.id;


--
-- Name: arzneimittel_sachkunde; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.arzneimittel_sachkunde (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    mitarbeiter_name text NOT NULL,
    zertifikat_bezeichnung text,
    ausstellungs_datum text,
    gueltig_bis text,
    dokument_base64 text,
    notizen text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    market_id integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.arzneimittel_sachkunde OWNER TO postgres;

--
-- Name: arzneimittel_sachkunde_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.arzneimittel_sachkunde_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.arzneimittel_sachkunde_id_seq OWNER TO postgres;

--
-- Name: arzneimittel_sachkunde_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.arzneimittel_sachkunde_id_seq OWNED BY public.arzneimittel_sachkunde.id;


--
-- Name: bescheinigungen; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bescheinigungen (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    kategorie text NOT NULL,
    mitarbeiter_name text NOT NULL,
    bezeichnung text,
    ausstellungs_datum text,
    gueltig_bis text,
    dokument_base64 text,
    notizen text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    market_id integer
);


ALTER TABLE public.bescheinigungen OWNER TO postgres;

--
-- Name: bescheinigungen_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bescheinigungen_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bescheinigungen_id_seq OWNER TO postgres;

--
-- Name: bescheinigungen_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bescheinigungen_id_seq OWNED BY public.bescheinigungen.id;


--
-- Name: besprechung_teilnehmer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.besprechung_teilnehmer (
    id integer NOT NULL,
    protokoll_id integer NOT NULL,
    name_manuel text,
    user_id integer,
    bestaetigt_name text,
    bestaetigt boolean DEFAULT false NOT NULL,
    bestaetigt_am timestamp without time zone,
    reihenfolge integer DEFAULT 0
);


ALTER TABLE public.besprechung_teilnehmer OWNER TO postgres;

--
-- Name: besprechung_teilnehmer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.besprechung_teilnehmer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.besprechung_teilnehmer_id_seq OWNER TO postgres;

--
-- Name: besprechung_teilnehmer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.besprechung_teilnehmer_id_seq OWNED BY public.besprechung_teilnehmer.id;


--
-- Name: besprechungsdokumente; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.besprechungsdokumente (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    kategorie text NOT NULL,
    datum text NOT NULL,
    leiter text,
    thema text,
    teilnehmer_anzahl text,
    naechste_besprechung text,
    dokument_base64 text,
    notizen text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.besprechungsdokumente OWNER TO postgres;

--
-- Name: besprechungsdokumente_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.besprechungsdokumente_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.besprechungsdokumente_id_seq OWNER TO postgres;

--
-- Name: besprechungsdokumente_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.besprechungsdokumente_id_seq OWNED BY public.besprechungsdokumente.id;


--
-- Name: besprechungsprotokoll; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.besprechungsprotokoll (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    datum text NOT NULL,
    leiter_name text,
    unterschrift_leiter_digital text,
    thema text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    market_id integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.besprechungsprotokoll OWNER TO postgres;

--
-- Name: besprechungsprotokoll_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.besprechungsprotokoll_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.besprechungsprotokoll_id_seq OWNER TO postgres;

--
-- Name: besprechungsprotokoll_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.besprechungsprotokoll_id_seq OWNED BY public.besprechungsprotokoll.id;


--
-- Name: betriebsbegehung; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.betriebsbegehung (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    quartal integer NOT NULL,
    year integer NOT NULL,
    durchgefuehrt_am text,
    durchgefuehrt_von text,
    section_data jsonb,
    aktionsplan text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    market_id integer
);


ALTER TABLE public.betriebsbegehung OWNER TO postgres;

--
-- Name: betriebsbegehung_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.betriebsbegehung_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.betriebsbegehung_id_seq OWNER TO postgres;

--
-- Name: betriebsbegehung_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.betriebsbegehung_id_seq OWNED BY public.betriebsbegehung.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name text NOT NULL,
    label text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: cleaning_plan_confirmations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cleaning_plan_confirmations (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    item_key text NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    initials text NOT NULL,
    user_id integer,
    confirmed_at timestamp without time zone DEFAULT now() NOT NULL,
    market_id integer
);


ALTER TABLE public.cleaning_plan_confirmations OWNER TO postgres;

--
-- Name: cleaning_plan_confirmations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cleaning_plan_confirmations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cleaning_plan_confirmations_id_seq OWNER TO postgres;

--
-- Name: cleaning_plan_confirmations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cleaning_plan_confirmations_id_seq OWNED BY public.cleaning_plan_confirmations.id;


--
-- Name: eingefrorenes_fleisch; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.eingefrorenes_fleisch (
    id integer NOT NULL,
    tenant_id integer DEFAULT 1 NOT NULL,
    market_id integer NOT NULL,
    year integer NOT NULL,
    artikel text NOT NULL,
    vkp text,
    menge_kg text,
    eingefroren_am date,
    eingefroren_durch text,
    entnahme_1_kg text,
    entnahme_2_kg text,
    entnahme_3_kg text,
    entnahme_4_kg text,
    aufgebraucht_am date,
    kuerzel text NOT NULL,
    user_id integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.eingefrorenes_fleisch OWNER TO postgres;

--
-- Name: eingefrorenes_fleisch_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.eingefrorenes_fleisch_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eingefrorenes_fleisch_id_seq OWNER TO postgres;

--
-- Name: eingefrorenes_fleisch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.eingefrorenes_fleisch_id_seq OWNED BY public.eingefrorenes_fleisch.id;


--
-- Name: email_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_settings (
    id integer NOT NULL,
    smtp_host text DEFAULT 'smtp.ionos.de'::text NOT NULL,
    smtp_port integer DEFAULT 587 NOT NULL,
    smtp_user text,
    smtp_pass text,
    from_name text DEFAULT 'EDEKA Dallmann HACCP'::text,
    default_recipient text DEFAULT 'qm.suedbayern@edeka.de'::text,
    enabled boolean DEFAULT false NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    telegram_bot_token text
);


ALTER TABLE public.email_settings OWNER TO postgres;

--
-- Name: email_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.email_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_settings_id_seq OWNER TO postgres;

--
-- Name: email_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.email_settings_id_seq OWNED BY public.email_settings.id;


--
-- Name: feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feedback (
    id integer NOT NULL,
    text text NOT NULL,
    page_path character varying(255),
    market_id integer,
    created_at timestamp without time zone DEFAULT now(),
    is_read boolean DEFAULT false
);


ALTER TABLE public.feedback OWNER TO postgres;

--
-- Name: feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.feedback_id_seq OWNER TO postgres;

--
-- Name: feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.feedback_id_seq OWNED BY public.feedback.id;


--
-- Name: form_definitions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.form_definitions (
    id integer NOT NULL,
    section_id integer NOT NULL,
    field_name text NOT NULL,
    field_type text NOT NULL,
    label text NOT NULL,
    required boolean DEFAULT false NOT NULL,
    validation_min real,
    validation_max real,
    warning_threshold real,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.form_definitions OWNER TO postgres;

--
-- Name: form_definitions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.form_definitions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.form_definitions_id_seq OWNER TO postgres;

--
-- Name: form_definitions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.form_definitions_id_seq OWNED BY public.form_definitions.id;


--
-- Name: form_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.form_entries (
    id integer NOT NULL,
    form_instance_id integer NOT NULL,
    form_definition_id integer NOT NULL,
    value text,
    signature text,
    pin text,
    photo_url text,
    entry_date date NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.form_entries OWNER TO postgres;

--
-- Name: form_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.form_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.form_entries_id_seq OWNER TO postgres;

--
-- Name: form_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.form_entries_id_seq OWNED BY public.form_entries.id;


--
-- Name: form_instances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.form_instances (
    id integer NOT NULL,
    market_id integer NOT NULL,
    section_id integer NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.form_instances OWNER TO postgres;

--
-- Name: form_instances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.form_instances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.form_instances_id_seq OWNER TO postgres;

--
-- Name: form_instances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.form_instances_id_seq OWNED BY public.form_instances.id;


--
-- Name: gesundheitszeugnisse; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gesundheitszeugnisse (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    mitarbeiter_name text NOT NULL,
    ausstellungs_datum text,
    naechste_pruefung text,
    dokument_base64 text,
    notizen text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    market_id integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.gesundheitszeugnisse OWNER TO postgres;

--
-- Name: gesundheitszeugnisse_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.gesundheitszeugnisse_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gesundheitszeugnisse_id_seq OWNER TO postgres;

--
-- Name: gesundheitszeugnisse_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.gesundheitszeugnisse_id_seq OWNED BY public.gesundheitszeugnisse.id;


--
-- Name: gq_begehung; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gq_begehung (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    market_id integer,
    quartal integer NOT NULL,
    year integer NOT NULL,
    durchgefuehrt_am text,
    durchgefuehrt_von text,
    kuerzel text,
    check_data jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.gq_begehung OWNER TO postgres;

--
-- Name: gq_begehung_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.gq_begehung_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gq_begehung_id_seq OWNER TO postgres;

--
-- Name: gq_begehung_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.gq_begehung_id_seq OWNED BY public.gq_begehung.id;


--
-- Name: hygienebelehrung_abt; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hygienebelehrung_abt (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    market_id integer,
    name text NOT NULL,
    firma_abteilung text,
    datum text NOT NULL,
    unterschrift text,
    eingetragen_von text,
    kuerzel text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.hygienebelehrung_abt OWNER TO postgres;

--
-- Name: hygienebelehrung_abt_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hygienebelehrung_abt_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hygienebelehrung_abt_id_seq OWNER TO postgres;

--
-- Name: hygienebelehrung_abt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hygienebelehrung_abt_id_seq OWNED BY public.hygienebelehrung_abt.id;


--
-- Name: kaesetheke_kontrolle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kaesetheke_kontrolle (
    id integer NOT NULL,
    tenant_id integer DEFAULT 1 NOT NULL,
    market_id integer NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    day integer NOT NULL,
    kontrolle_art character varying(30) NOT NULL,
    produkt character varying(200),
    temperatur character varying(20),
    luftfeuchtigkeit character varying(20),
    kern_temp_garen character varying(20),
    temp_heisshalten character varying(20),
    massnahme text,
    kuerzel character varying(20) NOT NULL,
    user_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    defekt boolean DEFAULT false,
    aenderungsgrund text,
    edited_at timestamp without time zone,
    edited_by text
);


ALTER TABLE public.kaesetheke_kontrolle OWNER TO postgres;

--
-- Name: kaesetheke_kontrolle_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.kaesetheke_kontrolle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kaesetheke_kontrolle_id_seq OWNER TO postgres;

--
-- Name: kaesetheke_kontrolle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.kaesetheke_kontrolle_id_seq OWNED BY public.kaesetheke_kontrolle.id;


--
-- Name: kontrollberichte; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kontrollberichte (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    kategorie text NOT NULL,
    bezeichnung text NOT NULL,
    kontrollstelle text,
    kontroll_datum text,
    gueltig_bis text,
    ergebnis text,
    dokument_base64 text,
    notizen text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    market_id integer
);


ALTER TABLE public.kontrollberichte OWNER TO postgres;

--
-- Name: kontrollberichte_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.kontrollberichte_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kontrollberichte_id_seq OWNER TO postgres;

--
-- Name: kontrollberichte_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.kontrollberichte_id_seq OWNED BY public.kontrollberichte.id;


--
-- Name: laden_bestellgebiete; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.laden_bestellgebiete (
    id integer NOT NULL,
    market_id integer NOT NULL,
    tenant_id integer DEFAULT 1 NOT NULL,
    name character varying(100) NOT NULL,
    farbe character varying(20) DEFAULT '#1a3a6b'::character varying,
    x integer DEFAULT 0 NOT NULL,
    y integer DEFAULT 0 NOT NULL,
    w integer DEFAULT 180 NOT NULL,
    h integer DEFAULT 100 NOT NULL,
    sort_order integer DEFAULT 99 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    sortiment text,
    zustaendig character varying(100),
    kategorie character varying(30)
);


ALTER TABLE public.laden_bestellgebiete OWNER TO postgres;

--
-- Name: laden_bestellgebiete_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.laden_bestellgebiete_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.laden_bestellgebiete_id_seq OWNER TO postgres;

--
-- Name: laden_bestellgebiete_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.laden_bestellgebiete_id_seq OWNED BY public.laden_bestellgebiete.id;


--
-- Name: laden_bestellungen; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.laden_bestellungen (
    id integer NOT NULL,
    market_id integer NOT NULL,
    tenant_id integer DEFAULT 1 NOT NULL,
    gebiet_id integer NOT NULL,
    datum date NOT NULL,
    kuerzel character varying(20),
    anmerkung text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.laden_bestellungen OWNER TO postgres;

--
-- Name: laden_bestellungen_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.laden_bestellungen_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.laden_bestellungen_id_seq OWNER TO postgres;

--
-- Name: laden_bestellungen_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.laden_bestellungen_id_seq OWNED BY public.laden_bestellungen.id;


--
-- Name: laden_lieferplaene; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.laden_lieferplaene (
    id integer NOT NULL,
    market_id integer NOT NULL,
    tenant_id integer DEFAULT 1 NOT NULL,
    name character varying(120) NOT NULL,
    kategorie character varying(30),
    liefertag integer NOT NULL,
    bestelltag integer,
    bestellschluss_uhrzeit character varying(10),
    notiz text,
    sort_order integer DEFAULT 99 NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.laden_lieferplaene OWNER TO postgres;

--
-- Name: laden_lieferplaene_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.laden_lieferplaene_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.laden_lieferplaene_id_seq OWNER TO postgres;

--
-- Name: laden_lieferplaene_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.laden_lieferplaene_id_seq OWNED BY public.laden_lieferplaene.id;


--
-- Name: market_email_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.market_email_configs (
    id integer NOT NULL,
    market_id integer NOT NULL,
    smtp_user text,
    smtp_pass text,
    from_name text,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.market_email_configs OWNER TO postgres;

--
-- Name: market_email_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.market_email_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.market_email_configs_id_seq OWNER TO postgres;

--
-- Name: market_email_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.market_email_configs_id_seq OWNED BY public.market_email_configs.id;


--
-- Name: market_info; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.market_info (
    id integer NOT NULL,
    market_id integer NOT NULL,
    market_number text,
    street text,
    plz_ort text,
    year integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.market_info OWNER TO postgres;

--
-- Name: market_info_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.market_info_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.market_info_id_seq OWNER TO postgres;

--
-- Name: market_info_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.market_info_id_seq OWNED BY public.market_info.id;


--
-- Name: markets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.markets (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    address text,
    lat text,
    lng text,
    geo_radius_km integer DEFAULT 10,
    plan_rotiert boolean DEFAULT false
);


ALTER TABLE public.markets OWNER TO postgres;

--
-- Name: markets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.markets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.markets_id_seq OWNER TO postgres;

--
-- Name: markets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.markets_id_seq OWNED BY public.markets.id;


--
-- Name: metz_reinigung; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.metz_reinigung (
    id integer NOT NULL,
    market_id integer NOT NULL,
    item_key character varying(60) NOT NULL,
    datum date NOT NULL,
    kuerzel character varying(20) NOT NULL,
    user_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.metz_reinigung OWNER TO postgres;

--
-- Name: metz_reinigung_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.metz_reinigung_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.metz_reinigung_id_seq OWNER TO postgres;

--
-- Name: metz_reinigung_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.metz_reinigung_id_seq OWNED BY public.metz_reinigung.id;


--
-- Name: mhd_kontrolle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mhd_kontrolle (
    id integer NOT NULL,
    market_id integer NOT NULL,
    datum date DEFAULT CURRENT_DATE NOT NULL,
    bereich character varying(100),
    artikel character varying(200) NOT NULL,
    mhd_datum date NOT NULL,
    menge integer DEFAULT 1 NOT NULL,
    aktion character varying(50) DEFAULT 'geprueft'::character varying NOT NULL,
    bemerkung text,
    kuerzel character varying(10),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.mhd_kontrolle OWNER TO postgres;

--
-- Name: mhd_kontrolle_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mhd_kontrolle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mhd_kontrolle_id_seq OWNER TO postgres;

--
-- Name: mhd_kontrolle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mhd_kontrolle_id_seq OWNED BY public.mhd_kontrolle.id;


--
-- Name: monatsbericht_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.monatsbericht_config (
    id integer NOT NULL,
    market_id integer NOT NULL,
    empfaenger_email text,
    auto_send boolean DEFAULT false NOT NULL,
    send_day integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.monatsbericht_config OWNER TO postgres;

--
-- Name: monatsbericht_config_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.monatsbericht_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.monatsbericht_config_id_seq OWNER TO postgres;

--
-- Name: monatsbericht_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.monatsbericht_config_id_seq OWNED BY public.monatsbericht_config.id;


--
-- Name: notification_channels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_channels (
    id integer NOT NULL,
    user_id integer NOT NULL,
    channel_type text DEFAULT 'off'::text NOT NULL,
    telegram_chat_id text,
    email_override text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notification_channels OWNER TO postgres;

--
-- Name: notification_channels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notification_channels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_channels_id_seq OWNER TO postgres;

--
-- Name: notification_channels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notification_channels_id_seq OWNED BY public.notification_channels.id;


--
-- Name: notification_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_log (
    id integer NOT NULL,
    rule_id integer,
    user_id integer,
    market_id integer,
    channel_type text,
    message text,
    status text DEFAULT 'sent'::text,
    sent_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notification_log OWNER TO postgres;

--
-- Name: notification_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notification_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_log_id_seq OWNER TO postgres;

--
-- Name: notification_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notification_log_id_seq OWNED BY public.notification_log.id;


--
-- Name: notification_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_rules (
    id integer NOT NULL,
    tenant_id integer DEFAULT 1 NOT NULL,
    section_key text NOT NULL,
    trigger_type text NOT NULL,
    trigger_value integer DEFAULT 7 NOT NULL,
    notify_user_ids integer[] DEFAULT '{}'::integer[] NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    market_ids integer[],
    check_rhythm character varying(30) DEFAULT 'daily'::character varying
);


ALTER TABLE public.notification_rules OWNER TO postgres;

--
-- Name: notification_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notification_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_rules_id_seq OWNER TO postgres;

--
-- Name: notification_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notification_rules_id_seq OWNED BY public.notification_rules.id;


--
-- Name: oeffnung_salate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.oeffnung_salate (
    id integer NOT NULL,
    tenant_id integer DEFAULT 1 NOT NULL,
    market_id integer NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    day integer NOT NULL,
    artikel_bezeichnung text NOT NULL,
    verbrauchsdatum character varying(20),
    eigenherstellung boolean DEFAULT false NOT NULL,
    kuerzel character varying(20) NOT NULL,
    user_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    aufgebraucht_am date,
    aufgebraucht_kuerzel character varying(20),
    aufgebraucht_user_id integer
);


ALTER TABLE public.oeffnung_salate OWNER TO postgres;

--
-- Name: oeffnung_salate_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.oeffnung_salate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oeffnung_salate_id_seq OWNER TO postgres;

--
-- Name: oeffnung_salate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.oeffnung_salate_id_seq OWNED BY public.oeffnung_salate.id;


--
-- Name: password_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_tokens (
    id integer NOT NULL,
    user_id integer,
    token text NOT NULL,
    type text DEFAULT 'invite'::text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.password_tokens OWNER TO postgres;

--
-- Name: password_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.password_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_tokens_id_seq OWNER TO postgres;

--
-- Name: password_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.password_tokens_id_seq OWNED BY public.password_tokens.id;


--
-- Name: probeentnahme; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.probeentnahme (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    markt text,
    ansprechpartner text,
    behoerde_bezeichnung text,
    grund_probenahme text,
    untersuchungsziel text,
    datum_entnahme text,
    gegenprobe_art text,
    gegenprobe_status text,
    probentyp text,
    ean text,
    artikel_nr text,
    verkehrsbezeichnung text,
    mhd text,
    losnummer text,
    fuellmenge text,
    hersteller text,
    durchschrift_gefaxt_durch text,
    durchschrift_gefaxt_am text,
    abholer_name text,
    abholer_firma_name text,
    abholer_firma_strasse text,
    abholer_firma_postfach text,
    abholer_firma_plz_ort text,
    amtliche_probennummer text,
    siegeldatum text,
    uebergabe_artikel text,
    uebergabe_ort_datum text,
    gegenprobe_abgeholt_am text,
    gegenprobe_abgeholt_durch text,
    unterschrift_abholer_digital text,
    unterschrift_mitarbeiter_digital text,
    amtliches_dokument_foto text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    market_id integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.probeentnahme OWNER TO postgres;

--
-- Name: probeentnahme_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.probeentnahme_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.probeentnahme_id_seq OWNER TO postgres;

--
-- Name: probeentnahme_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.probeentnahme_id_seq OWNED BY public.probeentnahme.id;


--
-- Name: produktfehlermeldung; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.produktfehlermeldung (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    markt text,
    ansprechpartner text,
    email text,
    telefon text,
    telefax text,
    erkennung_durch text,
    einwilligung_vorhanden boolean,
    markenname text,
    einzel_ean text,
    mhd text,
    losnummer text,
    lieferantencode text,
    belieferungsart text,
    grosshandelsstandort text,
    fehlerbeschreibung text,
    menge_verbraucher text,
    menge_markt text,
    kaufdatum text,
    kassenbon_vorhanden boolean,
    kunde_entschaedigt boolean,
    produkt_vorhanden boolean,
    fremdkoerper_vorhanden boolean,
    gleiches_mhd_im_markt boolean,
    gleicher_fehler_im_bestand boolean,
    ware_aus_regal_genommen boolean,
    datum_unterschrift text,
    unterschrift_marktleiter text,
    verbraucher_name text,
    verbraucher_adresse text,
    verbraucher_telefon text,
    verbraucher_email text,
    einwilligung_unterschrift_ort text,
    einwilligung_datum text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    unterschrift_foto text,
    unterschrift_personal_digital text,
    unterschrift_kunde_digital text,
    market_id integer
);


ALTER TABLE public.produktfehlermeldung OWNER TO postgres;

--
-- Name: produktfehlermeldung_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.produktfehlermeldung_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.produktfehlermeldung_id_seq OWNER TO postgres;

--
-- Name: produktfehlermeldung_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.produktfehlermeldung_id_seq OWNED BY public.produktfehlermeldung.id;


--
-- Name: registered_devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.registered_devices (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    name text NOT NULL,
    token text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    revoked_at timestamp without time zone
);


ALTER TABLE public.registered_devices OWNER TO postgres;

--
-- Name: registered_devices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.registered_devices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.registered_devices_id_seq OWNER TO postgres;

--
-- Name: registered_devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.registered_devices_id_seq OWNED BY public.registered_devices.id;


--
-- Name: reinigung_taeglich; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reinigung_taeglich (
    id integer NOT NULL,
    tenant_id integer DEFAULT 1 NOT NULL,
    market_id integer NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    day integer NOT NULL,
    area character varying(30) NOT NULL,
    kuerzel character varying(20) NOT NULL,
    user_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.reinigung_taeglich OWNER TO postgres;

--
-- Name: reinigung_taeglich_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reinigung_taeglich_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reinigung_taeglich_id_seq OWNER TO postgres;

--
-- Name: reinigung_taeglich_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reinigung_taeglich_id_seq OWNED BY public.reinigung_taeglich.id;


--
-- Name: responsibilities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.responsibilities (
    id integer NOT NULL,
    market_id integer NOT NULL,
    department text NOT NULL,
    responsible_name text,
    responsible_phone text,
    deputy_name text,
    deputy_phone text,
    sort_order integer DEFAULT 0 NOT NULL,
    year integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.responsibilities OWNER TO postgres;

--
-- Name: responsibilities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.responsibilities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.responsibilities_id_seq OWNER TO postgres;

--
-- Name: responsibilities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.responsibilities_id_seq OWNED BY public.responsibilities.id;


--
-- Name: rezeptur_kategorien; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rezeptur_kategorien (
    id integer NOT NULL,
    tenant_id integer DEFAULT 1 NOT NULL,
    name character varying(100) NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rezeptur_kategorien OWNER TO postgres;

--
-- Name: rezeptur_kategorien_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rezeptur_kategorien_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rezeptur_kategorien_id_seq OWNER TO postgres;

--
-- Name: rezeptur_kategorien_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rezeptur_kategorien_id_seq OWNED BY public.rezeptur_kategorien.id;


--
-- Name: rezepturen; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rezepturen (
    id integer NOT NULL,
    tenant_id integer DEFAULT 1 NOT NULL,
    kategorie_id integer,
    name character varying(200) NOT NULL,
    plu character varying(50),
    naehrwerte text,
    zutaten_text text,
    zutatenverzeichnis text,
    allergene text,
    allergene_spuren text,
    herstellungsablauf text,
    bild_dateiname character varying(200),
    rezeptur_datum date,
    ersetzt_datum date,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rezepturen OWNER TO postgres;

--
-- Name: rezepturen_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rezepturen_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rezepturen_id_seq OWNER TO postgres;

--
-- Name: rezepturen_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rezepturen_id_seq OWNED BY public.rezepturen.id;


--
-- Name: role_permission_defaults; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permission_defaults (
    id integer NOT NULL,
    tenant_id integer DEFAULT 1 NOT NULL,
    role text NOT NULL,
    label text NOT NULL,
    color text DEFAULT 'gray'::text NOT NULL,
    is_custom boolean DEFAULT false NOT NULL,
    permissions text[] DEFAULT '{}'::text[] NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.role_permission_defaults OWNER TO postgres;

--
-- Name: role_permission_defaults_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.role_permission_defaults_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.role_permission_defaults_id_seq OWNER TO postgres;

--
-- Name: role_permission_defaults_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.role_permission_defaults_id_seq OWNED BY public.role_permission_defaults.id;


--
-- Name: schulungs_ausnahmen; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schulungs_ausnahmen (
    id integer NOT NULL,
    tenant_id integer DEFAULT 1 NOT NULL,
    user_id integer NOT NULL,
    schulungs_pflicht_id integer NOT NULL,
    begruendung text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.schulungs_ausnahmen OWNER TO postgres;

--
-- Name: schulungs_ausnahmen_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.schulungs_ausnahmen_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schulungs_ausnahmen_id_seq OWNER TO postgres;

--
-- Name: schulungs_ausnahmen_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.schulungs_ausnahmen_id_seq OWNED BY public.schulungs_ausnahmen.id;


--
-- Name: schulungs_person_zuordnungen; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schulungs_person_zuordnungen (
    id integer NOT NULL,
    schulungs_pflicht_id integer NOT NULL,
    user_id integer NOT NULL,
    tenant_id integer NOT NULL
);


ALTER TABLE public.schulungs_person_zuordnungen OWNER TO postgres;

--
-- Name: schulungs_person_zuordnungen_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.schulungs_person_zuordnungen_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schulungs_person_zuordnungen_id_seq OWNER TO postgres;

--
-- Name: schulungs_person_zuordnungen_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.schulungs_person_zuordnungen_id_seq OWNED BY public.schulungs_person_zuordnungen.id;


--
-- Name: schulungs_pflichten; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schulungs_pflichten (
    id integer NOT NULL,
    tenant_id integer DEFAULT 1 NOT NULL,
    schulung_kategorie text NOT NULL,
    bezeichnung text NOT NULL,
    gueltige_gruppen text[] DEFAULT '{}'::text[] NOT NULL,
    intervall_monate integer DEFAULT 12 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    person_spezifisch boolean DEFAULT false NOT NULL,
    subbereich text,
    parent_pflicht_id integer,
    typ text DEFAULT 'schulung'::text NOT NULL,
    zuordnung_modus text DEFAULT 'gruppe'::text NOT NULL,
    training_topic_id integer,
    pruef_modus text DEFAULT 'zeitbasiert'::text NOT NULL
);


ALTER TABLE public.schulungs_pflichten OWNER TO postgres;

--
-- Name: schulungs_pflichten_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.schulungs_pflichten_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schulungs_pflichten_id_seq OWNER TO postgres;

--
-- Name: schulungs_pflichten_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.schulungs_pflichten_id_seq OWNED BY public.schulungs_pflichten.id;


--
-- Name: schulungsnachweise; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schulungsnachweise (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    kategorie text NOT NULL,
    mitarbeiter_name text NOT NULL,
    bezeichnung text,
    schulungs_datum text,
    naechste_schulung text,
    anbieter text,
    dokument_base64 text,
    notizen text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.schulungsnachweise OWNER TO postgres;

--
-- Name: schulungsnachweise_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.schulungsnachweise_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schulungsnachweise_id_seq OWNER TO postgres;

--
-- Name: schulungsnachweise_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.schulungsnachweise_id_seq OWNED BY public.schulungsnachweise.id;


--
-- Name: sections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sections (
    id integer NOT NULL,
    category_id integer NOT NULL,
    number text NOT NULL,
    title text NOT NULL,
    description text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sections OWNER TO postgres;

--
-- Name: sections_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sections_id_seq OWNER TO postgres;

--
-- Name: sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sections_id_seq OWNED BY public.sections.id;


--
-- Name: semmelliste; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.semmelliste (
    id integer NOT NULL,
    tenant_id integer DEFAULT 1 NOT NULL,
    market_id integer NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    day integer NOT NULL,
    semmel text,
    sandwich text,
    kuerzel text NOT NULL,
    user_id integer,
    created_at timestamp with time zone DEFAULT now(),
    items jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.semmelliste OWNER TO postgres;

--
-- Name: semmelliste_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.semmelliste_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.semmelliste_id_seq OWNER TO postgres;

--
-- Name: semmelliste_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.semmelliste_id_seq OWNED BY public.semmelliste.id;


--
-- Name: semmelliste_kontingent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.semmelliste_kontingent (
    market_id integer NOT NULL,
    tenant_id integer DEFAULT 1,
    semmel_standard integer DEFAULT 0,
    freifeld_label text DEFAULT 'Sandwich'::text,
    freifeld_standard integer DEFAULT 0,
    items jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public.semmelliste_kontingent OWNER TO postgres;

--
-- Name: shelf_markers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shelf_markers (
    id integer NOT NULL,
    market_id integer NOT NULL,
    label character varying(100) NOT NULL,
    x numeric(7,3) NOT NULL,
    y numeric(7,3) NOT NULL,
    sortiment text,
    reduzierungs_regel text,
    aktions_hinweis text,
    kontroll_intervall integer DEFAULT 7,
    naechste_kontrolle date,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    size character varying(10) DEFAULT 'md'::character varying,
    rotated boolean DEFAULT false,
    reduzierungs_datum text,
    knick_datum text,
    letzte_kontrolle_at timestamp without time zone,
    letzte_kontrolle_von character varying(100),
    kontroll_rhythmus text
);


ALTER TABLE public.shelf_markers OWNER TO postgres;

--
-- Name: shelf_markers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shelf_markers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shelf_markers_id_seq OWNER TO postgres;

--
-- Name: shelf_markers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shelf_markers_id_seq OWNED BY public.shelf_markers.id;


--
-- Name: strecken_bestellungen; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.strecken_bestellungen (
    id integer NOT NULL,
    market_id integer NOT NULL,
    tenant_id integer DEFAULT 1 NOT NULL,
    lieferant_id integer NOT NULL,
    bestellt_am timestamp with time zone DEFAULT now() NOT NULL,
    mitarbeiter_kuerzel character varying(50) NOT NULL,
    notiz text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.strecken_bestellungen OWNER TO postgres;

--
-- Name: strecken_bestellungen_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.strecken_bestellungen_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.strecken_bestellungen_id_seq OWNER TO postgres;

--
-- Name: strecken_bestellungen_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.strecken_bestellungen_id_seq OWNED BY public.strecken_bestellungen.id;


--
-- Name: strecken_lieferanten; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.strecken_lieferanten (
    id integer NOT NULL,
    market_id integer NOT NULL,
    tenant_id integer DEFAULT 1 NOT NULL,
    name character varying(150) NOT NULL,
    ansprechpartner character varying(150),
    telefon character varying(200),
    info text,
    kuerzel character varying(10),
    sort_order integer DEFAULT 99 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    wird_bestellt boolean DEFAULT false NOT NULL,
    aussendienst_bestellt boolean DEFAULT false NOT NULL,
    mindestbestellwert numeric(10,2) DEFAULT NULL::numeric
);


ALTER TABLE public.strecken_lieferanten OWNER TO postgres;

--
-- Name: strecken_lieferanten_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.strecken_lieferanten_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.strecken_lieferanten_id_seq OWNER TO postgres;

--
-- Name: strecken_lieferanten_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.strecken_lieferanten_id_seq OWNED BY public.strecken_lieferanten.id;


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenants (
    id integer NOT NULL,
    name text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    master_password text
);


ALTER TABLE public.tenants OWNER TO postgres;

--
-- Name: tenants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tenants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tenants_id_seq OWNER TO postgres;

--
-- Name: tenants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tenants_id_seq OWNED BY public.tenants.id;


--
-- Name: till_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.till_assignments (
    id integer NOT NULL,
    market_id integer NOT NULL,
    assignment_date date NOT NULL,
    shift text NOT NULL,
    till_number integer NOT NULL,
    user_id integer,
    user_name text,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    uhrzeit character varying(20)
);


ALTER TABLE public.till_assignments OWNER TO postgres;

--
-- Name: till_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.till_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.till_assignments_id_seq OWNER TO postgres;

--
-- Name: till_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.till_assignments_id_seq OWNED BY public.till_assignments.id;


--
-- Name: todo_adhoc_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.todo_adhoc_tasks (
    id integer NOT NULL,
    tenant_id integer DEFAULT 1 NOT NULL,
    market_id integer NOT NULL,
    title text NOT NULL,
    description text,
    priority text DEFAULT 'mittel'::text NOT NULL,
    deadline timestamp without time zone,
    photo_data text,
    created_by_pin text NOT NULL,
    created_by_name text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    is_completed boolean DEFAULT false NOT NULL,
    completed_by_pin text,
    completed_by_name text,
    completed_at timestamp without time zone,
    notify_at timestamp without time zone
);


ALTER TABLE public.todo_adhoc_tasks OWNER TO postgres;

--
-- Name: todo_adhoc_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.todo_adhoc_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.todo_adhoc_tasks_id_seq OWNER TO postgres;

--
-- Name: todo_adhoc_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.todo_adhoc_tasks_id_seq OWNED BY public.todo_adhoc_tasks.id;


--
-- Name: todo_daily_completions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.todo_daily_completions (
    id integer NOT NULL,
    task_id integer NOT NULL,
    market_id integer NOT NULL,
    completed_date date NOT NULL,
    completed_by_pin text NOT NULL,
    completed_by_name text,
    completed_at timestamp without time zone DEFAULT now() NOT NULL,
    photo_data text
);


ALTER TABLE public.todo_daily_completions OWNER TO postgres;

--
-- Name: todo_daily_completions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.todo_daily_completions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.todo_daily_completions_id_seq OWNER TO postgres;

--
-- Name: todo_daily_completions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.todo_daily_completions_id_seq OWNED BY public.todo_daily_completions.id;


--
-- Name: todo_standard_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.todo_standard_tasks (
    id integer NOT NULL,
    tenant_id integer DEFAULT 1 NOT NULL,
    market_id integer NOT NULL,
    title text NOT NULL,
    description text,
    weekday integer NOT NULL,
    priority text DEFAULT 'mittel'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    photo_data text
);


ALTER TABLE public.todo_standard_tasks OWNER TO postgres;

--
-- Name: todo_standard_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.todo_standard_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.todo_standard_tasks_id_seq OWNER TO postgres;

--
-- Name: todo_standard_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.todo_standard_tasks_id_seq OWNED BY public.todo_standard_tasks.id;


--
-- Name: training_attendances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.training_attendances (
    id integer NOT NULL,
    session_id integer NOT NULL,
    user_id integer NOT NULL,
    initials text NOT NULL,
    confirmed_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.training_attendances OWNER TO postgres;

--
-- Name: training_attendances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.training_attendances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.training_attendances_id_seq OWNER TO postgres;

--
-- Name: training_attendances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.training_attendances_id_seq OWNED BY public.training_attendances.id;


--
-- Name: training_session_topics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.training_session_topics (
    id integer NOT NULL,
    session_id integer NOT NULL,
    topic_id integer NOT NULL,
    custom_title text,
    checked boolean DEFAULT false NOT NULL
);


ALTER TABLE public.training_session_topics OWNER TO postgres;

--
-- Name: training_session_topics_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.training_session_topics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.training_session_topics_id_seq OWNER TO postgres;

--
-- Name: training_session_topics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.training_session_topics_id_seq OWNED BY public.training_session_topics.id;


--
-- Name: training_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.training_sessions (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    market_id integer NOT NULL,
    session_date date NOT NULL,
    trainer_id integer,
    trainer_name text,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    session_type character varying DEFAULT 'schulungsprotokoll'::character varying
);


ALTER TABLE public.training_sessions OWNER TO postgres;

--
-- Name: training_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.training_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.training_sessions_id_seq OWNER TO postgres;

--
-- Name: training_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.training_sessions_id_seq OWNED BY public.training_sessions.id;


--
-- Name: training_topics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.training_topics (
    id integer NOT NULL,
    title text NOT NULL,
    responsible text,
    training_material text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_default boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.training_topics OWNER TO postgres;

--
-- Name: training_topics_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.training_topics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.training_topics_id_seq OWNER TO postgres;

--
-- Name: training_topics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.training_topics_id_seq OWNED BY public.training_topics.id;


--
-- Name: tuev_jahresbericht; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tuev_jahresbericht (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    year integer NOT NULL,
    zertifikate_dokument text,
    zertifikate_notizen text,
    pruefungen_dokument text,
    pruefungen_notizen text,
    aktionsplan_foto text,
    aktionsplan_massnahmen text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    market_id integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.tuev_jahresbericht OWNER TO postgres;

--
-- Name: tuev_jahresbericht_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tuev_jahresbericht_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tuev_jahresbericht_id_seq OWNER TO postgres;

--
-- Name: tuev_jahresbericht_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tuev_jahresbericht_id_seq OWNED BY public.tuev_jahresbericht.id;


--
-- Name: user_market_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_market_assignments (
    id integer NOT NULL,
    user_id integer NOT NULL,
    market_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_market_assignments OWNER TO postgres;

--
-- Name: user_market_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_market_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_market_assignments_id_seq OWNER TO postgres;

--
-- Name: user_market_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_market_assignments_id_seq OWNED BY public.user_market_assignments.id;


--
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_permissions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    permission_type text NOT NULL,
    resource_type text NOT NULL,
    resource_id integer,
    granted boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_permissions OWNER TO postgres;

--
-- Name: user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_permissions_id_seq OWNER TO postgres;

--
-- Name: user_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_permissions_id_seq OWNED BY public.user_permissions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    name text NOT NULL,
    email text,
    role text DEFAULT 'USER'::text NOT NULL,
    initials text,
    pin text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    birth_date date,
    is_registered boolean DEFAULT false NOT NULL,
    password text,
    status text DEFAULT 'aktiv'::text NOT NULL,
    gruppe text,
    assigned_market_ids integer[]
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: ware_bestellungen; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ware_bestellungen (
    id integer NOT NULL,
    market_id integer NOT NULL,
    rayon_id integer NOT NULL,
    datum date DEFAULT CURRENT_DATE NOT NULL,
    kuerzel character varying(10),
    anmerkung text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ware_bestellungen OWNER TO postgres;

--
-- Name: ware_bestellungen_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ware_bestellungen_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ware_bestellungen_id_seq OWNER TO postgres;

--
-- Name: ware_bestellungen_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ware_bestellungen_id_seq OWNED BY public.ware_bestellungen.id;


--
-- Name: ware_einraeumservice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ware_einraeumservice (
    id integer NOT NULL,
    market_id integer NOT NULL,
    datum date DEFAULT CURRENT_DATE NOT NULL,
    dienstleister character varying(100),
    paletten integer,
    personal integer,
    beginn time without time zone,
    ende time without time zone,
    anmerkungen text,
    kuerzel character varying(10),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ware_einraeumservice OWNER TO postgres;

--
-- Name: ware_einraeumservice_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ware_einraeumservice_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ware_einraeumservice_id_seq OWNER TO postgres;

--
-- Name: ware_einraeumservice_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ware_einraeumservice_id_seq OWNED BY public.ware_einraeumservice.id;


--
-- Name: ware_mhd_bereiche; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ware_mhd_bereiche (
    id integer NOT NULL,
    market_id integer,
    name character varying(100) NOT NULL,
    beschreibung text,
    intervall_tage integer DEFAULT 1 NOT NULL,
    reduzierung_tage integer DEFAULT 3 NOT NULL,
    entnahme_tage integer DEFAULT 1 NOT NULL,
    sort_order integer DEFAULT 99 NOT NULL,
    aktiv boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    zone character varying(100),
    farbe character varying(20)
);


ALTER TABLE public.ware_mhd_bereiche OWNER TO postgres;

--
-- Name: ware_mhd_bereiche_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ware_mhd_bereiche_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ware_mhd_bereiche_id_seq OWNER TO postgres;

--
-- Name: ware_mhd_bereiche_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ware_mhd_bereiche_id_seq OWNED BY public.ware_mhd_bereiche.id;


--
-- Name: ware_mhd_kontrollen; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ware_mhd_kontrollen (
    id integer NOT NULL,
    market_id integer NOT NULL,
    bereich_id integer NOT NULL,
    datum date DEFAULT CURRENT_DATE NOT NULL,
    kuerzel character varying(10),
    bemerkung text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ware_mhd_kontrollen OWNER TO postgres;

--
-- Name: ware_mhd_kontrollen_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ware_mhd_kontrollen_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ware_mhd_kontrollen_id_seq OWNER TO postgres;

--
-- Name: ware_mhd_kontrollen_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ware_mhd_kontrollen_id_seq OWNED BY public.ware_mhd_kontrollen.id;


--
-- Name: ware_rayons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ware_rayons (
    id integer NOT NULL,
    market_id integer,
    name character varying(100) NOT NULL,
    beschreibung text,
    farbe character varying(20) DEFAULT '#1a3a6b'::character varying,
    sort_order integer DEFAULT 99 NOT NULL,
    aktiv boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ware_rayons OWNER TO postgres;

--
-- Name: ware_rayons_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ware_rayons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ware_rayons_id_seq OWNER TO postgres;

--
-- Name: ware_rayons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ware_rayons_id_seq OWNED BY public.ware_rayons.id;


--
-- Name: warencheck_og; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warencheck_og (
    id integer NOT NULL,
    tenant_id integer DEFAULT 1 NOT NULL,
    market_id integer NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    day integer NOT NULL,
    slot character varying(30) NOT NULL,
    kuerzel character varying(20) NOT NULL,
    user_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.warencheck_og OWNER TO postgres;

--
-- Name: warencheck_og_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.warencheck_og_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.warencheck_og_id_seq OWNER TO postgres;

--
-- Name: warencheck_og_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.warencheck_og_id_seq OWNED BY public.warencheck_og.id;


--
-- Name: wareneingang_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wareneingang_entries (
    id integer NOT NULL,
    tenant_id integer DEFAULT 1 NOT NULL,
    market_id integer NOT NULL,
    type_id integer NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    day integer NOT NULL,
    criteria_values jsonb DEFAULT '{}'::jsonb,
    kuerzel character varying(20) NOT NULL,
    user_id integer,
    notizen text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.wareneingang_entries OWNER TO postgres;

--
-- Name: wareneingang_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wareneingang_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wareneingang_entries_id_seq OWNER TO postgres;

--
-- Name: wareneingang_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wareneingang_entries_id_seq OWNED BY public.wareneingang_entries.id;


--
-- Name: wareneingang_jahresarchiv; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wareneingang_jahresarchiv (
    id integer NOT NULL,
    market_id integer NOT NULL,
    type_id integer NOT NULL,
    year integer NOT NULL,
    archiv_json jsonb NOT NULL,
    erstellt_am timestamp without time zone DEFAULT now()
);


ALTER TABLE public.wareneingang_jahresarchiv OWNER TO postgres;

--
-- Name: wareneingang_jahresarchiv_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wareneingang_jahresarchiv_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wareneingang_jahresarchiv_id_seq OWNER TO postgres;

--
-- Name: wareneingang_jahresarchiv_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wareneingang_jahresarchiv_id_seq OWNED BY public.wareneingang_jahresarchiv.id;


--
-- Name: wareneingang_og; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wareneingang_og (
    id integer NOT NULL,
    tenant_id integer DEFAULT 1 NOT NULL,
    market_id integer NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    day integer NOT NULL,
    hygiene character varying(15),
    etikettierung character varying(15),
    qualitaet character varying(15),
    mhd character varying(15),
    kistenetikett character varying(15),
    qs_biosiegel character varying(15),
    qs_by character varying(15),
    qs_qs character varying(15),
    temp_celsius numeric(4,1),
    kuerzel character varying(20) NOT NULL,
    user_id integer,
    notizen text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.wareneingang_og OWNER TO postgres;

--
-- Name: wareneingang_og_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wareneingang_og_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wareneingang_og_id_seq OWNER TO postgres;

--
-- Name: wareneingang_og_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wareneingang_og_id_seq OWNED BY public.wareneingang_og.id;


--
-- Name: wareneingang_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wareneingang_types (
    id integer NOT NULL,
    tenant_id integer DEFAULT 1 NOT NULL,
    name character varying(100) NOT NULL,
    beschreibung text,
    ware_art character varying(20) DEFAULT 'ungekuehlt'::character varying,
    criteria_config jsonb DEFAULT '{}'::jsonb,
    sort_order integer DEFAULT 0,
    aktiv boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    market_id integer,
    liefertage jsonb DEFAULT '[]'::jsonb,
    liefertage_ausnahmen jsonb DEFAULT '{}'::jsonb,
    section character varying(30) DEFAULT 'wareneingaenge'::character varying NOT NULL
);


ALTER TABLE public.wareneingang_types OWNER TO postgres;

--
-- Name: wareneingang_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wareneingang_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wareneingang_types_id_seq OWNER TO postgres;

--
-- Name: wareneingang_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wareneingang_types_id_seq OWNED BY public.wareneingang_types.id;


--
-- Name: admin_invitations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_invitations ALTER COLUMN id SET DEFAULT nextval('public.admin_invitations_id_seq'::regclass);


--
-- Name: anti_vektor_zertifikate id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anti_vektor_zertifikate ALTER COLUMN id SET DEFAULT nextval('public.anti_vektor_zertifikate_id_seq'::regclass);


--
-- Name: anti_vektor_zugangsdaten id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anti_vektor_zugangsdaten ALTER COLUMN id SET DEFAULT nextval('public.anti_vektor_zugangsdaten_id_seq'::regclass);


--
-- Name: arzneimittel_sachkunde id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.arzneimittel_sachkunde ALTER COLUMN id SET DEFAULT nextval('public.arzneimittel_sachkunde_id_seq'::regclass);


--
-- Name: bescheinigungen id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bescheinigungen ALTER COLUMN id SET DEFAULT nextval('public.bescheinigungen_id_seq'::regclass);


--
-- Name: besprechung_teilnehmer id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.besprechung_teilnehmer ALTER COLUMN id SET DEFAULT nextval('public.besprechung_teilnehmer_id_seq'::regclass);


--
-- Name: besprechungsdokumente id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.besprechungsdokumente ALTER COLUMN id SET DEFAULT nextval('public.besprechungsdokumente_id_seq'::regclass);


--
-- Name: besprechungsprotokoll id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.besprechungsprotokoll ALTER COLUMN id SET DEFAULT nextval('public.besprechungsprotokoll_id_seq'::regclass);


--
-- Name: betriebsbegehung id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.betriebsbegehung ALTER COLUMN id SET DEFAULT nextval('public.betriebsbegehung_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: cleaning_plan_confirmations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cleaning_plan_confirmations ALTER COLUMN id SET DEFAULT nextval('public.cleaning_plan_confirmations_id_seq'::regclass);


--
-- Name: eingefrorenes_fleisch id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eingefrorenes_fleisch ALTER COLUMN id SET DEFAULT nextval('public.eingefrorenes_fleisch_id_seq'::regclass);


--
-- Name: email_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_settings ALTER COLUMN id SET DEFAULT nextval('public.email_settings_id_seq'::regclass);


--
-- Name: feedback id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback ALTER COLUMN id SET DEFAULT nextval('public.feedback_id_seq'::regclass);


--
-- Name: form_definitions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_definitions ALTER COLUMN id SET DEFAULT nextval('public.form_definitions_id_seq'::regclass);


--
-- Name: form_entries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_entries ALTER COLUMN id SET DEFAULT nextval('public.form_entries_id_seq'::regclass);


--
-- Name: form_instances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_instances ALTER COLUMN id SET DEFAULT nextval('public.form_instances_id_seq'::regclass);


--
-- Name: gesundheitszeugnisse id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gesundheitszeugnisse ALTER COLUMN id SET DEFAULT nextval('public.gesundheitszeugnisse_id_seq'::regclass);


--
-- Name: gq_begehung id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gq_begehung ALTER COLUMN id SET DEFAULT nextval('public.gq_begehung_id_seq'::regclass);


--
-- Name: hygienebelehrung_abt id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hygienebelehrung_abt ALTER COLUMN id SET DEFAULT nextval('public.hygienebelehrung_abt_id_seq'::regclass);


--
-- Name: kaesetheke_kontrolle id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kaesetheke_kontrolle ALTER COLUMN id SET DEFAULT nextval('public.kaesetheke_kontrolle_id_seq'::regclass);


--
-- Name: kontrollberichte id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kontrollberichte ALTER COLUMN id SET DEFAULT nextval('public.kontrollberichte_id_seq'::regclass);


--
-- Name: laden_bestellgebiete id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laden_bestellgebiete ALTER COLUMN id SET DEFAULT nextval('public.laden_bestellgebiete_id_seq'::regclass);


--
-- Name: laden_bestellungen id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laden_bestellungen ALTER COLUMN id SET DEFAULT nextval('public.laden_bestellungen_id_seq'::regclass);


--
-- Name: laden_lieferplaene id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laden_lieferplaene ALTER COLUMN id SET DEFAULT nextval('public.laden_lieferplaene_id_seq'::regclass);


--
-- Name: market_email_configs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.market_email_configs ALTER COLUMN id SET DEFAULT nextval('public.market_email_configs_id_seq'::regclass);


--
-- Name: market_info id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.market_info ALTER COLUMN id SET DEFAULT nextval('public.market_info_id_seq'::regclass);


--
-- Name: markets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.markets ALTER COLUMN id SET DEFAULT nextval('public.markets_id_seq'::regclass);


--
-- Name: metz_reinigung id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metz_reinigung ALTER COLUMN id SET DEFAULT nextval('public.metz_reinigung_id_seq'::regclass);


--
-- Name: mhd_kontrolle id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mhd_kontrolle ALTER COLUMN id SET DEFAULT nextval('public.mhd_kontrolle_id_seq'::regclass);


--
-- Name: monatsbericht_config id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monatsbericht_config ALTER COLUMN id SET DEFAULT nextval('public.monatsbericht_config_id_seq'::regclass);


--
-- Name: notification_channels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_channels ALTER COLUMN id SET DEFAULT nextval('public.notification_channels_id_seq'::regclass);


--
-- Name: notification_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_log ALTER COLUMN id SET DEFAULT nextval('public.notification_log_id_seq'::regclass);


--
-- Name: notification_rules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_rules ALTER COLUMN id SET DEFAULT nextval('public.notification_rules_id_seq'::regclass);


--
-- Name: oeffnung_salate id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oeffnung_salate ALTER COLUMN id SET DEFAULT nextval('public.oeffnung_salate_id_seq'::regclass);


--
-- Name: password_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_tokens_id_seq'::regclass);


--
-- Name: probeentnahme id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.probeentnahme ALTER COLUMN id SET DEFAULT nextval('public.probeentnahme_id_seq'::regclass);


--
-- Name: produktfehlermeldung id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produktfehlermeldung ALTER COLUMN id SET DEFAULT nextval('public.produktfehlermeldung_id_seq'::regclass);


--
-- Name: registered_devices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registered_devices ALTER COLUMN id SET DEFAULT nextval('public.registered_devices_id_seq'::regclass);


--
-- Name: reinigung_taeglich id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reinigung_taeglich ALTER COLUMN id SET DEFAULT nextval('public.reinigung_taeglich_id_seq'::regclass);


--
-- Name: responsibilities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.responsibilities ALTER COLUMN id SET DEFAULT nextval('public.responsibilities_id_seq'::regclass);


--
-- Name: rezeptur_kategorien id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rezeptur_kategorien ALTER COLUMN id SET DEFAULT nextval('public.rezeptur_kategorien_id_seq'::regclass);


--
-- Name: rezepturen id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rezepturen ALTER COLUMN id SET DEFAULT nextval('public.rezepturen_id_seq'::regclass);


--
-- Name: role_permission_defaults id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permission_defaults ALTER COLUMN id SET DEFAULT nextval('public.role_permission_defaults_id_seq'::regclass);


--
-- Name: schulungs_ausnahmen id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schulungs_ausnahmen ALTER COLUMN id SET DEFAULT nextval('public.schulungs_ausnahmen_id_seq'::regclass);


--
-- Name: schulungs_person_zuordnungen id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schulungs_person_zuordnungen ALTER COLUMN id SET DEFAULT nextval('public.schulungs_person_zuordnungen_id_seq'::regclass);


--
-- Name: schulungs_pflichten id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schulungs_pflichten ALTER COLUMN id SET DEFAULT nextval('public.schulungs_pflichten_id_seq'::regclass);


--
-- Name: schulungsnachweise id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schulungsnachweise ALTER COLUMN id SET DEFAULT nextval('public.schulungsnachweise_id_seq'::regclass);


--
-- Name: sections id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections ALTER COLUMN id SET DEFAULT nextval('public.sections_id_seq'::regclass);


--
-- Name: semmelliste id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.semmelliste ALTER COLUMN id SET DEFAULT nextval('public.semmelliste_id_seq'::regclass);


--
-- Name: shelf_markers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shelf_markers ALTER COLUMN id SET DEFAULT nextval('public.shelf_markers_id_seq'::regclass);


--
-- Name: strecken_bestellungen id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.strecken_bestellungen ALTER COLUMN id SET DEFAULT nextval('public.strecken_bestellungen_id_seq'::regclass);


--
-- Name: strecken_lieferanten id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.strecken_lieferanten ALTER COLUMN id SET DEFAULT nextval('public.strecken_lieferanten_id_seq'::regclass);


--
-- Name: tenants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants ALTER COLUMN id SET DEFAULT nextval('public.tenants_id_seq'::regclass);


--
-- Name: till_assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.till_assignments ALTER COLUMN id SET DEFAULT nextval('public.till_assignments_id_seq'::regclass);


--
-- Name: todo_adhoc_tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todo_adhoc_tasks ALTER COLUMN id SET DEFAULT nextval('public.todo_adhoc_tasks_id_seq'::regclass);


--
-- Name: todo_daily_completions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todo_daily_completions ALTER COLUMN id SET DEFAULT nextval('public.todo_daily_completions_id_seq'::regclass);


--
-- Name: todo_standard_tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todo_standard_tasks ALTER COLUMN id SET DEFAULT nextval('public.todo_standard_tasks_id_seq'::regclass);


--
-- Name: training_attendances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_attendances ALTER COLUMN id SET DEFAULT nextval('public.training_attendances_id_seq'::regclass);


--
-- Name: training_session_topics id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_session_topics ALTER COLUMN id SET DEFAULT nextval('public.training_session_topics_id_seq'::regclass);


--
-- Name: training_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_sessions ALTER COLUMN id SET DEFAULT nextval('public.training_sessions_id_seq'::regclass);


--
-- Name: training_topics id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_topics ALTER COLUMN id SET DEFAULT nextval('public.training_topics_id_seq'::regclass);


--
-- Name: tuev_jahresbericht id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tuev_jahresbericht ALTER COLUMN id SET DEFAULT nextval('public.tuev_jahresbericht_id_seq'::regclass);


--
-- Name: user_market_assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_market_assignments ALTER COLUMN id SET DEFAULT nextval('public.user_market_assignments_id_seq'::regclass);


--
-- Name: user_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions ALTER COLUMN id SET DEFAULT nextval('public.user_permissions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: ware_bestellungen id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ware_bestellungen ALTER COLUMN id SET DEFAULT nextval('public.ware_bestellungen_id_seq'::regclass);


--
-- Name: ware_einraeumservice id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ware_einraeumservice ALTER COLUMN id SET DEFAULT nextval('public.ware_einraeumservice_id_seq'::regclass);


--
-- Name: ware_mhd_bereiche id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ware_mhd_bereiche ALTER COLUMN id SET DEFAULT nextval('public.ware_mhd_bereiche_id_seq'::regclass);


--
-- Name: ware_mhd_kontrollen id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ware_mhd_kontrollen ALTER COLUMN id SET DEFAULT nextval('public.ware_mhd_kontrollen_id_seq'::regclass);


--
-- Name: ware_rayons id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ware_rayons ALTER COLUMN id SET DEFAULT nextval('public.ware_rayons_id_seq'::regclass);


--
-- Name: warencheck_og id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warencheck_og ALTER COLUMN id SET DEFAULT nextval('public.warencheck_og_id_seq'::regclass);


--
-- Name: wareneingang_entries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wareneingang_entries ALTER COLUMN id SET DEFAULT nextval('public.wareneingang_entries_id_seq'::regclass);


--
-- Name: wareneingang_jahresarchiv id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wareneingang_jahresarchiv ALTER COLUMN id SET DEFAULT nextval('public.wareneingang_jahresarchiv_id_seq'::regclass);


--
-- Name: wareneingang_og id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wareneingang_og ALTER COLUMN id SET DEFAULT nextval('public.wareneingang_og_id_seq'::regclass);


--
-- Name: wareneingang_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wareneingang_types ALTER COLUMN id SET DEFAULT nextval('public.wareneingang_types_id_seq'::regclass);


--
-- Data for Name: admin_invitations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_invitations (id, tenant_id, email, token, used, created_at, expires_at) FROM stdin;
1	1	kai.martin@test.de	5e607df4a872451a84d903d04827f23020ee37cca7df16772211679786aaaa1a	t	2026-03-17 13:29:44.07996	2026-03-24 13:29:44.078
\.


--
-- Data for Name: anti_vektor_zertifikate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.anti_vektor_zertifikate (id, tenant_id, pruefer_name, zertifikat_bezeichnung, gueltig_bis, foto_base64, notizen, created_at, market_id) FROM stdin;
\.


--
-- Data for Name: anti_vektor_zugangsdaten; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.anti_vektor_zugangsdaten (id, tenant_id, website_url, benutzername, passwort, rufnummer, notizen, updated_at, market_id) FROM stdin;
1	1	https://www.av-ods.de	Dallmann	50dallmann##	08191 / 947 18 16		2026-03-19 11:09:12.631	1
\.


--
-- Data for Name: arzneimittel_sachkunde; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.arzneimittel_sachkunde (id, tenant_id, mitarbeiter_name, zertifikat_bezeichnung, ausstellungs_datum, gueltig_bis, dokument_base64, notizen, created_at, market_id) FROM stdin;
\.


--
-- Data for Name: bescheinigungen; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bescheinigungen (id, tenant_id, kategorie, mitarbeiter_name, bezeichnung, ausstellungs_datum, gueltig_bis, dokument_base64, notizen, created_at, market_id) FROM stdin;
\.


--
-- Data for Name: besprechung_teilnehmer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.besprechung_teilnehmer (id, protokoll_id, name_manuel, user_id, bestaetigt_name, bestaetigt, bestaetigt_am, reihenfolge) FROM stdin;
1	1	\N	8	Kai Martin	t	2026-03-19 14:38:27.312	0
2	1	\N	7	Max Mustermann	t	2026-03-19 14:38:35.891	1
3	2	\N	8	Kai Martin	t	2026-03-23 15:57:43.504	0
4	3	\N	7	Max Mustermann	t	2026-03-23 17:09:27.848	0
\.


--
-- Data for Name: besprechungsdokumente; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.besprechungsdokumente (id, tenant_id, kategorie, datum, leiter, thema, teilnehmer_anzahl, naechste_besprechung, dokument_base64, notizen, created_at) FROM stdin;
\.


--
-- Data for Name: besprechungsprotokoll; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.besprechungsprotokoll (id, tenant_id, datum, leiter_name, unterschrift_leiter_digital, thema, created_at, updated_at, market_id) FROM stdin;
1	1	19.3.2026	Kai	data:image/png;base64,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	Augustiner 1328	2026-03-19 14:38:19.513391	2026-03-19 14:38:19.513391	1
2	1	23.3.2026		data:image/png;base64,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		2026-03-23 15:57:24.614041	2026-03-23 15:57:24.614041	1
3	1	23.3.2026			jfff	2026-03-23 17:09:12.230735	2026-03-23 17:09:12.230735	1
\.


--
-- Data for Name: betriebsbegehung; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.betriebsbegehung (id, tenant_id, quartal, year, durchgefuehrt_am, durchgefuehrt_von, section_data, aktionsplan, created_at, market_id) FROM stdin;
1	1	1	2026	2026-04-18	1328	{"1.1": {"status": "ok", "bemerkung": ""}, "1.2": {"status": "ok", "bemerkung": ""}, "1.3": {"status": "na", "bemerkung": ""}, "1.4": {"status": "ok", "bemerkung": ""}, "1.5": {"status": "ok", "bemerkung": ""}, "1.6": {"status": "ok", "bemerkung": ""}, "2.1": {"status": "", "bemerkung": ""}, "2.2": {"status": "mangel", "bemerkung": "djkajfkdlsöajk"}, "2.3": {"status": "ok", "bemerkung": ""}, "2.4": {"status": "ok", "bemerkung": ""}, "2.5": {"status": "ok", "bemerkung": ""}, "2.6": {"status": "ok", "bemerkung": ""}, "2.7": {"status": "ok", "bemerkung": ""}, "2.8": {"status": "ok", "bemerkung": ""}, "2.9": {"status": "ok", "bemerkung": ""}, "3.1": {"status": "ok", "bemerkung": ""}, "3.2": {"status": "ok", "bemerkung": ""}, "3.3": {"status": "ok", "bemerkung": ""}, "3.4": {"status": "ok", "bemerkung": ""}, "3.5": {"status": "ok", "bemerkung": ""}, "3.6": {"status": "ok", "bemerkung": ""}, "3.7": {"status": "na", "bemerkung": ""}, "3.8": {"status": "na", "bemerkung": ""}, "3.9": {"status": "na", "bemerkung": ""}, "4.1": {"status": "ok", "bemerkung": ""}, "4.2": {"status": "ok", "bemerkung": ""}, "4.3": {"status": "ok", "bemerkung": ""}, "4.4": {"status": "ok", "bemerkung": ""}, "4.5": {"status": "", "bemerkung": ""}, "4.6": {"status": "ok", "bemerkung": ""}, "4.7": {"status": "ok", "bemerkung": ""}, "4.8": {"status": "", "bemerkung": ""}, "4.9": {"status": "", "bemerkung": ""}, "5.1": {"status": "", "bemerkung": ""}, "5.2": {"status": "", "bemerkung": ""}, "5.3": {"status": "", "bemerkung": ""}, "5.4": {"status": "", "bemerkung": ""}, "5.5": {"status": "", "bemerkung": ""}, "5.6": {"status": "", "bemerkung": ""}, "5.7": {"status": "", "bemerkung": ""}, "6.1": {"status": "", "bemerkung": ""}, "6.2": {"status": "", "bemerkung": ""}, "6.3": {"status": "", "bemerkung": ""}, "6.4": {"status": "", "bemerkung": ""}, "6.5": {"status": "", "bemerkung": ""}, "6.6": {"status": "", "bemerkung": ""}, "6.7": {"status": "", "bemerkung": ""}, "6.8": {"status": "", "bemerkung": ""}, "7.1": {"status": "", "bemerkung": ""}, "7.2": {"status": "", "bemerkung": ""}, "7.3": {"status": "", "bemerkung": ""}, "7.4": {"status": "", "bemerkung": ""}, "7.5": {"status": "", "bemerkung": ""}, "7.6": {"status": "", "bemerkung": ""}, "7.7": {"status": "", "bemerkung": ""}, "7.8": {"status": "", "bemerkung": ""}, "7.9": {"status": "", "bemerkung": ""}, "8.1": {"status": "", "bemerkung": ""}, "8.2": {"status": "", "bemerkung": ""}, "8.3": {"status": "", "bemerkung": ""}, "8.4": {"status": "", "bemerkung": ""}, "8.5": {"status": "", "bemerkung": ""}, "8.6": {"status": "", "bemerkung": ""}, "8.7": {"status": "", "bemerkung": ""}, "8.8": {"status": "", "bemerkung": ""}, "8.9": {"status": "", "bemerkung": ""}, "9.1": {"status": "", "bemerkung": ""}, "9.2": {"status": "", "bemerkung": ""}, "9.3": {"status": "", "bemerkung": ""}, "10.1": {"status": "", "bemerkung": ""}, "10.2": {"status": "", "bemerkung": ""}, "10.3": {"status": "", "bemerkung": ""}, "10.4": {"status": "", "bemerkung": ""}, "10.5": {"status": "", "bemerkung": ""}, "10.6": {"status": "", "bemerkung": ""}, "10.7": {"status": "", "bemerkung": ""}, "11.1": {"status": "", "bemerkung": ""}, "11.2": {"status": "", "bemerkung": ""}, "11.3": {"status": "", "bemerkung": ""}, "11.4": {"status": "", "bemerkung": ""}, "11.5": {"status": "", "bemerkung": ""}, "12.1": {"status": "", "bemerkung": ""}, "12.2": {"status": "", "bemerkung": ""}, "12.3": {"status": "", "bemerkung": ""}, "12.4": {"status": "", "bemerkung": ""}, "12.5": {"status": "", "bemerkung": ""}, "12.6": {"status": "", "bemerkung": ""}, "12.7": {"status": "", "bemerkung": ""}, "13.1": {"status": "", "bemerkung": ""}, "13.2": {"status": "", "bemerkung": ""}, "13.3": {"status": "", "bemerkung": ""}, "13.4": {"status": "", "bemerkung": ""}, "13.5": {"status": "", "bemerkung": ""}, "13.6": {"status": "", "bemerkung": ""}, "13.7": {"status": "", "bemerkung": ""}, "2.10": {"status": "ok", "bemerkung": ""}, "2.11": {"status": "ok", "bemerkung": ""}, "3.10": {"status": "na", "bemerkung": ""}, "3.11": {"status": "ok", "bemerkung": ""}, "4.10": {"status": "ok", "bemerkung": ""}, "4.11": {"status": "", "bemerkung": ""}, "7.10": {"status": "", "bemerkung": ""}, "7.11": {"status": "", "bemerkung": ""}, "7.12": {"status": "", "bemerkung": ""}, "7.13": {"status": "", "bemerkung": ""}, "8.10": {"status": "", "bemerkung": ""}, "8.11": {"status": "", "bemerkung": ""}, "8.12": {"status": "", "bemerkung": ""}, "8.13": {"status": "", "bemerkung": ""}, "8.14": {"status": "", "bemerkung": ""}, "8.15": {"status": "", "bemerkung": ""}}		2026-03-18 13:21:48.513318	1
2	1	2	2026	2025-02-12	1111	{"1.1": {"status": "", "bemerkung": ""}, "1.2": {"status": "", "bemerkung": ""}, "1.3": {"status": "ok", "bemerkung": ""}, "1.4": {"status": "ok", "bemerkung": ""}, "1.5": {"status": "ok", "bemerkung": ""}, "1.6": {"status": "", "bemerkung": ""}, "2.1": {"status": "", "bemerkung": ""}, "2.2": {"status": "", "bemerkung": ""}, "2.3": {"status": "", "bemerkung": ""}, "2.4": {"status": "", "bemerkung": ""}, "2.5": {"status": "", "bemerkung": ""}, "2.6": {"status": "", "bemerkung": ""}, "2.7": {"status": "", "bemerkung": ""}, "2.8": {"status": "", "bemerkung": ""}, "2.9": {"status": "", "bemerkung": ""}, "3.1": {"status": "", "bemerkung": ""}, "3.2": {"status": "", "bemerkung": ""}, "3.3": {"status": "", "bemerkung": ""}, "3.4": {"status": "", "bemerkung": ""}, "3.5": {"status": "", "bemerkung": ""}, "3.6": {"status": "", "bemerkung": ""}, "3.7": {"status": "", "bemerkung": ""}, "3.8": {"status": "", "bemerkung": ""}, "3.9": {"status": "", "bemerkung": ""}, "4.1": {"status": "", "bemerkung": ""}, "4.2": {"status": "", "bemerkung": ""}, "4.3": {"status": "", "bemerkung": ""}, "4.4": {"status": "", "bemerkung": ""}, "4.5": {"status": "", "bemerkung": ""}, "4.6": {"status": "", "bemerkung": ""}, "4.7": {"status": "", "bemerkung": ""}, "4.8": {"status": "", "bemerkung": ""}, "4.9": {"status": "", "bemerkung": ""}, "5.1": {"status": "", "bemerkung": ""}, "5.2": {"status": "", "bemerkung": ""}, "5.3": {"status": "", "bemerkung": ""}, "5.4": {"status": "", "bemerkung": ""}, "5.5": {"status": "", "bemerkung": ""}, "5.6": {"status": "", "bemerkung": ""}, "5.7": {"status": "", "bemerkung": ""}, "6.1": {"status": "", "bemerkung": ""}, "6.2": {"status": "", "bemerkung": ""}, "6.3": {"status": "", "bemerkung": ""}, "6.4": {"status": "", "bemerkung": ""}, "6.5": {"status": "", "bemerkung": ""}, "6.6": {"status": "", "bemerkung": ""}, "6.7": {"status": "", "bemerkung": ""}, "6.8": {"status": "", "bemerkung": ""}, "7.1": {"status": "", "bemerkung": ""}, "7.2": {"status": "", "bemerkung": ""}, "7.3": {"status": "", "bemerkung": ""}, "7.4": {"status": "", "bemerkung": ""}, "7.5": {"status": "", "bemerkung": ""}, "7.6": {"status": "", "bemerkung": ""}, "7.7": {"status": "", "bemerkung": ""}, "7.8": {"status": "", "bemerkung": ""}, "7.9": {"status": "", "bemerkung": ""}, "8.1": {"status": "", "bemerkung": ""}, "8.2": {"status": "", "bemerkung": ""}, "8.3": {"status": "", "bemerkung": ""}, "8.4": {"status": "", "bemerkung": ""}, "8.5": {"status": "", "bemerkung": ""}, "8.6": {"status": "", "bemerkung": ""}, "8.7": {"status": "", "bemerkung": ""}, "8.8": {"status": "", "bemerkung": ""}, "8.9": {"status": "", "bemerkung": ""}, "9.1": {"status": "", "bemerkung": ""}, "9.2": {"status": "", "bemerkung": ""}, "9.3": {"status": "", "bemerkung": ""}, "10.1": {"status": "", "bemerkung": ""}, "10.2": {"status": "", "bemerkung": ""}, "10.3": {"status": "", "bemerkung": ""}, "10.4": {"status": "", "bemerkung": ""}, "10.5": {"status": "", "bemerkung": ""}, "10.6": {"status": "", "bemerkung": ""}, "10.7": {"status": "", "bemerkung": ""}, "11.1": {"status": "", "bemerkung": ""}, "11.2": {"status": "", "bemerkung": ""}, "11.3": {"status": "", "bemerkung": ""}, "11.4": {"status": "", "bemerkung": ""}, "11.5": {"status": "", "bemerkung": ""}, "12.1": {"status": "", "bemerkung": ""}, "12.2": {"status": "", "bemerkung": ""}, "12.3": {"status": "", "bemerkung": ""}, "12.4": {"status": "", "bemerkung": ""}, "12.5": {"status": "", "bemerkung": ""}, "12.6": {"status": "", "bemerkung": ""}, "12.7": {"status": "", "bemerkung": ""}, "13.1": {"status": "", "bemerkung": ""}, "13.2": {"status": "", "bemerkung": ""}, "13.3": {"status": "", "bemerkung": ""}, "13.4": {"status": "", "bemerkung": ""}, "13.5": {"status": "", "bemerkung": ""}, "13.6": {"status": "", "bemerkung": ""}, "13.7": {"status": "", "bemerkung": ""}, "2.10": {"status": "", "bemerkung": ""}, "2.11": {"status": "", "bemerkung": ""}, "3.10": {"status": "", "bemerkung": ""}, "3.11": {"status": "", "bemerkung": ""}, "4.10": {"status": "", "bemerkung": ""}, "4.11": {"status": "", "bemerkung": ""}, "7.10": {"status": "", "bemerkung": ""}, "7.11": {"status": "", "bemerkung": ""}, "7.12": {"status": "", "bemerkung": ""}, "7.13": {"status": "", "bemerkung": ""}, "8.10": {"status": "", "bemerkung": ""}, "8.11": {"status": "", "bemerkung": ""}, "8.12": {"status": "", "bemerkung": ""}, "8.13": {"status": "", "bemerkung": ""}, "8.14": {"status": "", "bemerkung": ""}, "8.15": {"status": "", "bemerkung": ""}}		2026-03-18 13:22:25.609194	1
3	1	1	2026	2026-03-02	Kai Martin	{"1.1": {"status": "ok", "bemerkung": ""}, "1.2": {"status": "ok", "bemerkung": ""}, "1.3": {"status": "", "bemerkung": ""}, "1.4": {"status": "", "bemerkung": ""}, "1.5": {"status": "", "bemerkung": ""}, "1.6": {"status": "", "bemerkung": ""}, "1.7": {"status": "", "bemerkung": ""}, "1.8": {"status": "", "bemerkung": ""}, "2.1": {"status": "", "bemerkung": ""}, "2.2": {"status": "", "bemerkung": ""}, "2.3": {"status": "ok", "bemerkung": ""}, "2.4": {"status": "ok", "bemerkung": ""}, "2.5": {"status": "", "bemerkung": ""}, "2.6": {"status": "", "bemerkung": ""}, "2.7": {"status": "", "bemerkung": ""}, "2.8": {"status": "na", "bemerkung": ""}, "2.9": {"status": "na", "bemerkung": ""}, "3.1": {"status": "", "bemerkung": ""}, "3.2": {"status": "", "bemerkung": ""}, "3.3": {"status": "", "bemerkung": ""}, "3.4": {"status": "", "bemerkung": ""}, "3.5": {"status": "", "bemerkung": ""}, "3.6": {"status": "", "bemerkung": ""}, "3.7": {"status": "", "bemerkung": ""}, "3.8": {"status": "", "bemerkung": ""}, "3.9": {"status": "", "bemerkung": ""}, "4.1": {"status": "", "bemerkung": ""}, "4.2": {"status": "", "bemerkung": ""}, "4.3": {"status": "", "bemerkung": ""}, "4.4": {"status": "", "bemerkung": ""}, "4.5": {"status": "", "bemerkung": ""}, "4.6": {"status": "", "bemerkung": ""}, "4.7": {"status": "", "bemerkung": ""}, "4.8": {"status": "", "bemerkung": ""}, "4.9": {"status": "", "bemerkung": ""}, "5.1": {"status": "", "bemerkung": ""}, "5.2": {"status": "", "bemerkung": ""}, "5.3": {"status": "", "bemerkung": ""}, "5.4": {"status": "", "bemerkung": ""}, "5.5": {"status": "", "bemerkung": ""}, "5.6": {"status": "", "bemerkung": ""}, "5.7": {"status": "", "bemerkung": ""}, "5.8": {"status": "", "bemerkung": ""}, "6.1": {"status": "", "bemerkung": ""}, "6.2": {"status": "", "bemerkung": ""}, "6.3": {"status": "", "bemerkung": ""}, "6.4": {"status": "", "bemerkung": ""}, "6.5": {"status": "", "bemerkung": ""}, "6.6": {"status": "", "bemerkung": ""}, "6.7": {"status": "", "bemerkung": ""}, "6.8": {"status": "", "bemerkung": ""}, "6.9": {"status": "", "bemerkung": ""}, "7.1": {"status": "", "bemerkung": ""}, "7.2": {"status": "", "bemerkung": ""}, "7.3": {"status": "", "bemerkung": ""}, "7.4": {"status": "", "bemerkung": ""}, "7.5": {"status": "", "bemerkung": ""}, "7.6": {"status": "", "bemerkung": ""}, "7.7": {"status": "", "bemerkung": ""}, "7.8": {"status": "", "bemerkung": ""}, "7.9": {"status": "", "bemerkung": ""}, "8.1": {"status": "", "bemerkung": ""}, "8.2": {"status": "", "bemerkung": ""}, "8.3": {"status": "", "bemerkung": ""}, "8.4": {"status": "", "bemerkung": ""}, "8.5": {"status": "", "bemerkung": ""}, "8.6": {"status": "", "bemerkung": ""}, "8.7": {"status": "", "bemerkung": ""}, "8.9": {"status": "", "bemerkung": ""}, "9.1": {"status": "", "bemerkung": ""}, "9.2": {"status": "", "bemerkung": ""}, "10.3": {"status": "", "bemerkung": ""}, "10.4": {"status": "", "bemerkung": ""}, "10.5": {"status": "", "bemerkung": ""}, "10.6": {"status": "", "bemerkung": ""}, "11.1": {"status": "", "bemerkung": ""}, "11.2": {"status": "", "bemerkung": ""}, "11.3": {"status": "", "bemerkung": ""}, "11.4": {"status": "", "bemerkung": ""}, "11.5": {"status": "", "bemerkung": ""}, "11.6": {"status": "", "bemerkung": ""}, "12.1": {"status": "", "bemerkung": ""}, "12.2": {"status": "", "bemerkung": ""}, "12.3": {"status": "", "bemerkung": ""}, "12.4": {"status": "", "bemerkung": ""}, "12.5": {"status": "", "bemerkung": ""}, "12.6": {"status": "", "bemerkung": ""}, "12.7": {"status": "", "bemerkung": ""}, "13.1": {"status": "", "bemerkung": ""}, "13.2": {"status": "", "bemerkung": ""}, "13.3": {"status": "", "bemerkung": ""}, "13.4": {"status": "", "bemerkung": ""}, "13.5": {"status": "", "bemerkung": ""}, "13.6": {"status": "", "bemerkung": ""}, "13.7": {"status": "", "bemerkung": ""}, "13.8": {"status": "", "bemerkung": ""}, "13.9": {"status": "", "bemerkung": ""}, "2.10": {"status": "mangel", "bemerkung": "dasf"}, "2.11": {"status": "", "bemerkung": ""}, "2.12": {"status": "", "bemerkung": ""}, "3.10": {"status": "", "bemerkung": ""}, "4.10": {"status": "", "bemerkung": ""}, "4.11": {"status": "", "bemerkung": ""}, "7.10": {"status": "", "bemerkung": ""}, "7.11": {"status": "", "bemerkung": ""}, "7.12": {"status": "", "bemerkung": ""}, "7.13": {"status": "", "bemerkung": ""}, "7.14": {"status": "", "bemerkung": ""}, "7.15": {"status": "", "bemerkung": ""}, "8.10": {"status": "", "bemerkung": ""}, "8.12": {"status": "", "bemerkung": ""}, "8.13": {"status": "", "bemerkung": ""}, "8.14": {"status": "", "bemerkung": ""}, "8.15": {"status": "", "bemerkung": ""}, "8.16": {"status": "", "bemerkung": ""}, "13.10": {"status": "", "bemerkung": ""}, "13.11": {"status": "", "bemerkung": ""}, "13.12": {"status": "", "bemerkung": ""}, "4.12a": {"status": "", "bemerkung": ""}, "4.12b": {"status": "", "bemerkung": ""}, "8.11a": {"status": "", "bemerkung": ""}, "8.11b": {"status": "", "bemerkung": ""}}		2026-03-27 09:52:31.376885	3
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, label, sort_order, created_at) FROM stdin;
1	allgemein	HACCP 1 - Allgemein	1	2026-03-17 12:22:22.116283
2	markt	HACCP 2 - Markt	2	2026-03-17 12:22:22.119691
3	metzgerei	HACCP 3 - Metzgerei	3	2026-03-17 12:22:22.123913
\.


--
-- Data for Name: cleaning_plan_confirmations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cleaning_plan_confirmations (id, tenant_id, item_key, year, month, initials, user_id, confirmed_at, market_id) FROM stdin;
4	1	vp_schraenke	2026	1	KM	8	2026-03-18 20:54:15.493328	1
5	1	vp_lueftungsgitter	2026	1	MM	7	2026-03-23 15:57:57.684004	1
6	1	vp_decken_lampen	2026	1	KM	8	2026-03-23 17:10:16.847242	1
7	1	vp_fettabscheider	2026	1	MM	7	2026-03-23 17:10:22.305268	1
9	1	th_verkaufstheke	2026	1	HSC	13	2026-03-25 10:52:36.188939	1
10	1	th_schraenke	2026	1	HSC	13	2026-03-25 11:22:35.316676	1
11	1	th_lueftungsgitter	2026	1	MM	7	2026-03-25 12:25:56.309765	1
12	1	th_decken_lampen	2026	1	KM	8	2026-03-25 14:33:03.969598	1
13	1	wbl_kuehleinrichtungen	2026	1	KM	8	2026-03-25 14:33:09.786857	1
14	1	wbl_tk_trocken	2026	1	KM	8	2026-03-25 14:33:14.482493	1
15	1	wbl_lueftungsgitter	2026	1	KM	8	2026-03-25 14:33:17.455771	1
16	1	wbl_tk_nass	2026	1	KM	8	2026-03-25 14:33:20.826793	1
17	1	wbl_decken_lampen	2026	1	KM	8	2026-03-25 14:33:25.24825	1
18	1	wbl_aussenrampe	2026	1	KM	8	2026-03-25 14:33:29.091937	1
19	1	th_lueftungsgitter	2026	4	KM	8	2026-03-25 14:33:35.276264	1
20	1	wbl_kuehleinrichtungen	2026	2	KM	8	2026-03-25 14:33:53.80074	1
21	1	wbl_kuehleinrichtungen	2026	3	KM	8	2026-03-25 14:33:56.784492	1
24	1	wbl_tk_trocken	2026	2	KM	8	2026-03-25 14:34:10.831784	1
25	1	wbl_tk_trocken	2026	3	KM	8	2026-03-25 14:34:14.156196	1
26	1	wbl_aussenrampe	2026	2	KM	8	2026-03-25 14:34:17.136638	1
27	1	wbl_aussenrampe	2026	3	KM	8	2026-03-25 14:34:21.030477	1
28	1	einkaufswagenbox	2026	1	KM	8	2026-03-25 14:41:48.007907	1
29	1	rampe_anlieferung	2026	1	HSC	13	2026-03-25 16:40:36.930126	1
30	1	boeden_abfluesse	2026	1	HSC	13	2026-03-25 16:40:40.983216	1
31	1	regalboeden_aufsteller	2026	1	HSC	13	2026-03-25 16:40:44.512767	1
32	1	umkleideschraenke	2026	1	HSC	13	2026-03-25 16:40:48.04089	1
33	1	einkaufswagenbox	2026	2	HSC	13	2026-03-25 16:40:51.762921	1
34	1	rampe_anlieferung	2026	2	HSC	13	2026-03-25 16:40:55.06883	1
35	1	boeden_abfluesse	2026	2	HSC	13	2026-03-25 16:40:58.164148	1
36	1	regalboeden_aufsteller	2026	2	HSC	13	2026-03-25 16:41:01.864744	1
37	1	umkleideschraenke	2026	2	HSC	13	2026-03-25 16:41:07.407542	1
38	1	fenster_waende	2026	1	HSC	13	2026-03-25 16:41:10.766828	1
39	1	fenster_waende	2026	2	HSC	13	2026-03-25 16:41:13.774088	1
40	1	tk_trocken	2026	1	HSC	13	2026-03-25 16:41:16.896126	1
41	1	tk_trocken	2026	2	HSC	13	2026-03-25 16:41:21.343193	1
42	1	kuehlraeume	2026	1	HSC	13	2026-03-25 16:41:24.834404	1
43	1	kuehlraeume	2026	2	HSC	13	2026-03-25 16:41:28.388105	1
44	1	kuehlmoebel_theke	2026	1	HSC	13	2026-03-25 16:41:36.50474	1
45	1	kuehlmoebel_theke	2026	2	HSC	13	2026-03-25 16:41:41.694474	1
46	1	einkaufswagenbox	2026	3	HSC	13	2026-03-25 16:42:12.033061	1
47	1	boeden_abfluesse	2026	3	KM	8	2026-03-26 10:41:24.205496	1
\.


--
-- Data for Name: eingefrorenes_fleisch; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.eingefrorenes_fleisch (id, tenant_id, market_id, year, artikel, vkp, menge_kg, eingefroren_am, eingefroren_durch, entnahme_1_kg, entnahme_2_kg, entnahme_3_kg, entnahme_4_kg, aufgebraucht_am, kuerzel, user_id, created_at) FROM stdin;
3	1	1	2026	Gulasch	\N	2,5	2026-03-25	Kai Martin	0,5	2,6	\N	\N	2026-03-25	KM	8	2026-03-25 07:09:00.877676+00
5	1	1	2026	Rindfleisch	\N	2,5	2026-03-26	Kai Martin	2,3	\N	\N	\N	\N	KM	8	2026-03-26 11:54:05.270104+00
\.


--
-- Data for Name: email_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_settings (id, smtp_host, smtp_port, smtp_user, smtp_pass, from_name, default_recipient, enabled, updated_at, telegram_bot_token) FROM stdin;
1	smtp.ionos.de	587	\N	\N	EDEKA Dallmann HACCP	qm.suedbayern@edeka.de	f	2026-03-31 08:08:57.155818	8606614908:AAHmS-occAqL-2eCiiyLMz7PCyJUqKDoSco
\.


--
-- Data for Name: feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.feedback (id, text, page_path, market_id, created_at, is_read) FROM stdin;
1	viel zu wenig farbe hier	/	1	2026-03-30 20:03:55.188375	t
2	Vieles!	/admin/system	1	2026-03-31 07:35:15.994473	t
3	Der Kai seine Art Schach zu spielen Kotzt mich an	/	1	2026-04-01 12:01:02.539852	f
\.


--
-- Data for Name: form_definitions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.form_definitions (id, section_id, field_name, field_type, label, required, validation_min, validation_max, warning_threshold, sort_order, created_at) FROM stdin;
1	23	temperatur	temperature	Temperatur (°C)	t	\N	\N	7	1	2026-03-17 12:22:22.142292
2	23	zustand	boolean	Zustand OK	t	\N	\N	\N	2	2026-03-17 12:22:22.142292
3	23	bemerkung	text	Bemerkung	f	\N	\N	\N	3	2026-03-17 12:22:22.142292
4	23	foto	photo	Foto	f	\N	\N	\N	4	2026-03-17 12:22:22.142292
5	23	kuerzel	signature	Handzeichen/Kürzel	t	\N	\N	\N	5	2026-03-17 12:22:22.142292
6	23	pin	pin	Mitarbeiter-PIN	t	\N	\N	\N	6	2026-03-17 12:22:22.142292
7	32	temperatur	temperature	Temperatur (°C)	t	\N	\N	2	1	2026-03-17 12:22:22.145299
8	32	zustand	boolean	Zustand OK	t	\N	\N	\N	2	2026-03-17 12:22:22.145299
9	32	bemerkung	text	Bemerkung	f	\N	\N	\N	3	2026-03-17 12:22:22.145299
10	32	foto	photo	Foto	f	\N	\N	\N	4	2026-03-17 12:22:22.145299
11	32	kuerzel	signature	Handzeichen/Kürzel	t	\N	\N	\N	5	2026-03-17 12:22:22.145299
12	32	pin	pin	Mitarbeiter-PIN	t	\N	\N	\N	6	2026-03-17 12:22:22.145299
\.


--
-- Data for Name: form_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.form_entries (id, form_instance_id, form_definition_id, value, signature, pin, photo_url, entry_date, created_at) FROM stdin;
\.


--
-- Data for Name: form_instances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.form_instances (id, market_id, section_id, year, month, status, created_at) FROM stdin;
1	1	9	2026	3	open	2026-03-17 20:02:52.894127
\.


--
-- Data for Name: gesundheitszeugnisse; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gesundheitszeugnisse (id, tenant_id, mitarbeiter_name, ausstellungs_datum, naechste_pruefung, dokument_base64, notizen, created_at, market_id) FROM stdin;
\.


--
-- Data for Name: gq_begehung; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gq_begehung (id, tenant_id, market_id, quartal, year, durchgefuehrt_am, durchgefuehrt_von, kuerzel, check_data, created_at) FROM stdin;
2	1	1	1	2026	2026-03-25	Kai Martin	KM	{"1": {"status": "io", "massnahme": ""}, "2": {"status": "nichtRelevant", "massnahme": ""}, "3": {"status": "io", "massnahme": ""}, "4": {"status": "io", "massnahme": ""}, "5": {"status": "io", "massnahme": ""}, "6": {"status": "nichtIo", "massnahme": ""}, "7": {"status": "io", "massnahme": ""}, "8": {"status": "io", "massnahme": ""}, "9": {"status": "", "massnahme": ""}, "10": {"status": "", "massnahme": ""}, "11": {"status": "", "massnahme": ""}, "12": {"status": "", "massnahme": ""}, "13": {"status": "", "massnahme": ""}, "14": {"status": "io", "massnahme": ""}, "15": {"status": "io", "massnahme": ""}, "16": {"status": "io", "massnahme": ""}, "R1": {"status": "nichtRelevant", "massnahme": ""}, "R2": {"status": "", "massnahme": ""}, "R3": {"status": "", "massnahme": ""}}	2026-03-25 08:41:52.559041
\.


--
-- Data for Name: hygienebelehrung_abt; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hygienebelehrung_abt (id, tenant_id, market_id, name, firma_abteilung, datum, unterschrift, eingetragen_von, kuerzel, created_at) FROM stdin;
1	1	1	Testmann	Testfirma	2026-02-18	Hubber	Kai Martin	KM	2026-03-25 08:56:53.798108
2	1	1	Huber		2026-03-25	Huber Hans	Hinter Schuber	HSC	2026-03-25 11:57:36.811196
3	1	1	Testmann	Testmetzger	2026-03-26	data:image/png;base64,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	Kai Martin	KM	2026-03-26 12:01:38.5314
\.


--
-- Data for Name: kaesetheke_kontrolle; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kaesetheke_kontrolle (id, tenant_id, market_id, year, month, day, kontrolle_art, produkt, temperatur, luftfeuchtigkeit, kern_temp_garen, temp_heisshalten, massnahme, kuerzel, user_id, created_at, defekt, aenderungsgrund, edited_at, edited_by) FROM stdin;
3	1	1	2026	3	24	heisse_theke	Hackbraten	\N	\N	72	65	\N	KM	8	2026-03-24 15:17:34.269939	f	\N	\N	\N
8	1	1	2026	3	25	heisse_theke	Leberkäse	\N	\N	78	68	\N	HSC	13	2026-03-25 11:49:46.411517	f	\N	\N	\N
14	1	1	2026	3	2	kaesekühlschrank	\N	2	\N	\N	\N	\N	KM	8	2026-03-26 09:35:44.300002	f	\N	\N	\N
15	1	1	2026	3	3	kaesekühlschrank	\N	2	\N	\N	\N	\N	KM	8	2026-03-26 09:35:51.305657	f	\N	\N	\N
16	1	1	2026	3	4	kaesekühlschrank	\N	3	\N	\N	\N	\N	KM	8	2026-03-26 09:35:58.461169	f	\N	\N	\N
17	1	1	2026	3	5	kaesekühlschrank	\N	3,1	90,3	\N	\N		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
18	1	1	2026	3	6	kaesekühlschrank	\N	5,7	92,5	\N	\N		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
19	1	1	2026	3	7	kaesekühlschrank	\N	3,3	88,8	\N	\N		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
20	1	1	2026	3	9	kaesekühlschrank	\N	2,6	92,0	\N	\N		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
21	1	1	2026	3	10	kaesekühlschrank	\N	3,7	92,1	\N	\N		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
22	1	1	2026	3	11	kaesekühlschrank	\N	5,4	90,8	\N	\N		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
23	1	1	2026	3	12	kaesekühlschrank	\N	5,2	92,4	\N	\N		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
24	1	1	2026	3	13	kaesekühlschrank	\N	3,6	89,9	\N	\N		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
25	1	1	2026	3	14	kaesekühlschrank	\N	3,4	93,1	\N	\N		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
26	1	1	2026	3	16	kaesekühlschrank	\N	4,1	89,3	\N	\N		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
27	1	1	2026	3	17	kaesekühlschrank	\N	4,9	88,4	\N	\N		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
28	1	1	2026	3	18	kaesekühlschrank	\N	2,4	90,5	\N	\N		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
29	1	1	2026	3	19	kaesekühlschrank	\N	4,5	93,9	\N	\N		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
30	1	1	2026	3	20	kaesekühlschrank	\N	2,8	94,8	\N	\N		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
31	1	1	2026	3	21	kaesekühlschrank	\N	4,6	94,0	\N	\N		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
51	1	1	2026	3	2	heisse_theke	Hähnchen	\N	\N	73,0	65,4		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
52	1	1	2026	3	3	heisse_theke	Würstchen	\N	\N	80,1	68,2		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
53	1	1	2026	3	4	heisse_theke	Schnitzel	\N	\N	75,4	65,3		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
54	1	1	2026	3	5	heisse_theke	Rollbraten	\N	\N	78,1	66,2		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
55	1	1	2026	3	6	heisse_theke	Hähnchen	\N	\N	73,2	65,3		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
56	1	1	2026	3	9	heisse_theke	Würstchen	\N	\N	80,0	68,0		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
57	1	1	2026	3	10	heisse_theke	Schnitzel	\N	\N	75,2	65,1		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
58	1	1	2026	3	11	heisse_theke	Rollbraten	\N	\N	78,3	66,2		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
59	1	1	2026	3	12	heisse_theke	Hähnchen	\N	\N	73,3	65,1		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
60	1	1	2026	3	13	heisse_theke	Würstchen	\N	\N	80,1	68,0		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
61	1	1	2026	3	16	heisse_theke	Schnitzel	\N	\N	75,2	65,2		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
62	1	1	2026	3	17	heisse_theke	Rollbraten	\N	\N	78,2	66,2		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
63	1	1	2026	3	18	heisse_theke	Hähnchen	\N	\N	73,1	65,1		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
64	1	1	2026	3	19	heisse_theke	Würstchen	\N	\N	80,0	68,0		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
65	1	1	2026	3	20	heisse_theke	Schnitzel	\N	\N	75,0	65,4		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
66	1	1	2026	3	23	heisse_theke	Rollbraten	\N	\N	78,1	66,3		KM	8	2026-03-26 09:42:05.191965	f	\N	\N	\N
68	1	1	2026	3	26	kaesekühlschrank	\N	\N	\N	\N	\N	Defekt / nicht in Betrieb	KM	8	2026-03-26 09:44:31.40486	t	\N	\N	\N
69	1	1	2026	3	7	heisse_theke	Hackbraten	\N	\N	75	61	\N	KM	8	2026-03-26 09:45:11.767396	f	\N	\N	\N
70	1	1	2026	3	7	heisse_theke	Leberkäse	\N	\N	75	61	\N	KM	8	2026-03-26 09:45:11.962942	f	\N	\N	\N
71	1	1	2026	3	14	heisse_theke	Hackbraten	\N	\N	85	65	\N	KM	8	2026-03-26 09:45:41.129802	f	\N	\N	\N
72	1	1	2026	3	21	heisse_theke	Fleischpflanzerl	\N	\N	75	65	\N	KM	8	2026-03-26 09:45:54.804174	f	\N	\N	\N
34	1	1	2026	3	3	reifeschrank	\N	1,8	78	\N	\N		ON	15	2026-03-26 09:42:05.191965	f	\N	\N	\N
33	1	1	2026	3	2	reifeschrank	\N	2,0	79	\N	\N		ON	15	2026-03-26 09:42:05.191965	f	\N	\N	\N
35	1	1	2026	3	4	reifeschrank	\N	2,1	80	\N	\N		ON	15	2026-03-26 09:42:05.191965	f	\N	\N	\N
36	1	1	2026	3	5	reifeschrank	\N	1,9	81	\N	\N		ON	15	2026-03-26 09:42:05.191965	f	\N	\N	\N
37	1	1	2026	3	6	reifeschrank	\N	2,2	79	\N	\N		ON	15	2026-03-26 09:42:05.191965	f	\N	\N	\N
38	1	1	2026	3	7	reifeschrank	\N	2,0	80	\N	\N		ON	15	2026-03-26 09:42:05.191965	f	\N	\N	\N
39	1	1	2026	3	9	reifeschrank	\N	1,7	82	\N	\N		ON	15	2026-03-26 09:42:05.191965	f	\N	\N	\N
40	1	1	2026	3	10	reifeschrank	\N	2,1	79	\N	\N		ON	15	2026-03-26 09:42:05.191965	f	\N	\N	\N
41	1	1	2026	3	11	reifeschrank	\N	2,3	81	\N	\N		ON	15	2026-03-26 09:42:05.191965	f	\N	\N	\N
42	1	1	2026	3	12	reifeschrank	\N	1,8	80	\N	\N		ON	15	2026-03-26 09:42:05.191965	f	\N	\N	\N
43	1	1	2026	3	13	reifeschrank	\N	2,0	78	\N	\N		ON	15	2026-03-26 09:42:05.191965	f	\N	\N	\N
44	1	1	2026	3	14	reifeschrank	\N	2,2	83	\N	\N		ON	15	2026-03-26 09:42:05.191965	f	\N	\N	\N
45	1	1	2026	3	16	reifeschrank	\N	1,9	80	\N	\N		ON	15	2026-03-26 09:42:05.191965	f	\N	\N	\N
46	1	1	2026	3	17	reifeschrank	\N	2,1	81	\N	\N		ON	15	2026-03-26 09:42:05.191965	f	\N	\N	\N
47	1	1	2026	3	18	reifeschrank	\N	2,0	79	\N	\N		ON	15	2026-03-26 09:42:05.191965	f	\N	\N	\N
48	1	1	2026	3	19	reifeschrank	\N	1,8	82	\N	\N		ON	15	2026-03-26 09:42:05.191965	f	\N	\N	\N
49	1	1	2026	3	20	reifeschrank	\N	2,2	80	\N	\N		ON	15	2026-03-26 09:42:05.191965	f	\N	\N	\N
50	1	1	2026	3	21	reifeschrank	\N	2,1	83	\N	\N		ON	15	2026-03-26 09:42:05.191965	f	\N	\N	\N
5	1	1	2026	3	23	reifeschrank	\N	2,0	81	\N	\N		ON	15	2026-03-25 11:42:48.762345	f	\N	\N	\N
1	1	1	2026	3	24	reifeschrank	\N	1,9	80	\N	\N		ON	15	2026-03-24 15:15:32.90237	f	\N	\N	\N
7	1	1	2026	3	25	heisse_theke	Leberkäse	\N	\N	72	63	\N	KM	8	2026-03-25 11:49:23.986712	f	test	2026-03-26 11:16:35.298509	KM
74	1	1	2026	3	26	reifeschrank	\N	2,0	82	\N	\N		ON	15	2026-03-26 10:13:36.335864	f	\N	\N	\N
32	1	1	2026	3	23	kaesekühlschrank	\N	2,4	\N	\N	\N	test	KM	8	2026-03-26 09:42:05.191965	f	Test	\N	\N
75	1	2	2026	3	2	reifeschrank	\N	2	80	\N	\N	\N	HSC	13	2026-03-26 10:30:05.602148	f	\N	\N	\N
2	1	1	2026	3	24	kaesekühlschrank	\N	5	\N	\N	\N	\N	KM	8	2026-03-24 15:15:54.428039	f	Test Änderung	\N	\N
76	1	2	2026	3	3	reifeschrank	\N	2	75	\N	\N	\N	HSC	13	2026-03-26 10:30:18.542118	f	\N	\N	\N
77	1	2	2026	3	4	reifeschrank	\N	2	80	\N	\N	\N	HSC	13	2026-03-26 10:30:34.676936	f	\N	\N	\N
78	1	2	2026	3	5	reifeschrank	\N	1	75	\N	\N	\N	HSC	13	2026-03-26 10:30:54.655515	f	\N	\N	\N
79	1	2	2026	3	6	reifeschrank	\N	2	80	\N	\N	\N	HSC	13	2026-03-26 10:31:10.461479	f	\N	\N	\N
80	1	2	2026	3	7	reifeschrank	\N	2	78	\N	\N	\N	HSC	13	2026-03-26 10:31:27.029246	f	\N	\N	\N
81	1	2	2026	3	9	reifeschrank	\N	3	80	\N	\N	\N	HSC	13	2026-03-26 10:31:49.960629	f	\N	\N	\N
82	1	2	2026	3	10	reifeschrank	\N	2	\N	\N	\N	\N	HSC	13	2026-03-26 10:32:14.56055	f	\N	\N	\N
83	1	2	2026	3	11	reifeschrank	\N	2	80	\N	\N	\N	HSC	13	2026-03-26 10:32:37.873796	f	\N	\N	\N
84	1	2	2026	3	12	reifeschrank	\N	2	80	\N	\N	\N	HSC	13	2026-03-26 10:32:48.443276	f	\N	\N	\N
85	1	2	2026	3	13	reifeschrank	\N	2	76	\N	\N	\N	HSC	13	2026-03-26 10:33:00.888935	f	\N	\N	\N
86	1	2	2026	3	14	reifeschrank	\N	2	80	\N	\N	\N	HSC	13	2026-03-26 10:33:14.639992	f	\N	\N	\N
87	1	2	2026	3	16	reifeschrank	\N	2	80	\N	\N	\N	HSC	13	2026-03-26 10:33:26.754662	f	\N	\N	\N
88	1	2	2026	3	17	reifeschrank	\N	2	80	\N	\N	\N	HSC	13	2026-03-26 10:33:38.538257	f	\N	\N	\N
89	1	2	2026	3	18	reifeschrank	\N	2	80	\N	\N	\N	KM	8	2026-03-26 10:33:51.154523	f	\N	\N	\N
90	1	1	2026	3	25	kaesekühlschrank	\N	2	\N	\N	\N	asdf	KM	8	2026-03-26 11:01:13.642849	f	\N	\N	\N
91	1	1	2026	3	25	reifeschrank	\N	2,1	80	\N	\N	\N	KM	8	2026-03-26 11:01:41.561806	f	Test Änderung	2026-03-26 11:15:57.428827	KM
\.


--
-- Data for Name: kontrollberichte; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kontrollberichte (id, tenant_id, kategorie, bezeichnung, kontrollstelle, kontroll_datum, gueltig_bis, ergebnis, dokument_base64, notizen, created_at, market_id) FROM stdin;
\.


--
-- Data for Name: laden_bestellgebiete; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.laden_bestellgebiete (id, market_id, tenant_id, name, farbe, x, y, w, h, sort_order, created_at, sortiment, zustaendig, kategorie) FROM stdin;
4	1	1	Tiefkühlung	#0891b2	10	185	380	155	4	2026-03-28 13:56:10.466373	TK	Greschuchna	tk
12	1	1	Getränke	#1a3a6b	810	535	380	155	12	2026-03-28 13:56:10.466373	Cola + Merk + Brunntaler + Hubauer + Kühlschrank + Getränke	Gröger	getraenke
7	1	1	Werbetalon + Strecke	#d97706	10	360	380	155	7	2026-03-28 13:56:10.466373	Werbetalon + Streckenlieferanten	Dörsam	werbeware
1	1	1	Süß- und Knabberwaren / Außenbereich	#1a3a6b	10	10	380	155	1	2026-03-28 13:56:10.466373	Süßwaren + Chips + Salzgebäck + Außenbereich + Eigenbedarf Markt	Landherr	trocken
2	1	1	Wein und Spirituosen	#7c3aed	410	10	380	155	2	2026-03-28 13:56:10.466373	Wein + Spirituosen + Glühwein	Ahmend	trocken
3	1	1	Kassenbereich	#374151	810	10	380	155	3	2026-03-28 13:56:10.466373	Zigaretten + Kasse + Treuepunkte + Rasierklingen	Zinner	trocken
5	1	1	Drogerie	#be185d	410	185	380	155	5	2026-03-28 13:56:10.466373	Doppelherz + Waschmittel + Anzünder + Tempo + Handschuhe + Putzmittel + OTC + Damenhygiene + Windeln + Toilettenpapier + Babynahrung + Drogerie + Nuk + Tabaluga + Feuchtes T.	Gickelhorn	trocken
6	1	1	Grundnahrung	#059669	810	185	380	155	6	2026-03-28 13:56:10.466373	Suppen + Fertiggerichte + Fonds + Nudeln DE + Reis + Essig/Öl, Salz etc. + Gries + Tomate + Nudelsaucen + Nudeln ital. + Senf + Ketchup + Grillaucen + Pfanni + Dittmann Oliven -u. Co., Fonds, AroyD Kokosmilch	Hübner	trocken
8	1	1	Grundnahrung Frühstück/MoPro	#065f46	410	360	380	155	8	2026-03-28 13:56:10.466373	Brot + H-Milch + Glühbirnen + Batterien + Kaffee + Tee + Riegel + Flocken + Aufstriche + Cornflakes + Müsli + Backmischung + Backen + Zucker + Mehl	Schuster	trocken
9	1	1	Grundnahrung Bio/Konserven	#92400e	810	360	380	155	9	2026-03-28 13:56:10.466373	Bio Nudeln + Schär + Vegan + Bio Edeka Kerne + Naturkind + Seeberger + Alnatura + Gepa + Wurst-, Sauer-, Fisch-, Obst- u. Gemüsekonserven	Stadler	trocken
10	1	1	Tiernahrung/Haushalt	#dc2626	10	535	380	155	10	2026-03-28 13:56:10.466373	Hund + Katze + weitere Kleintiere + Wischen + KüTü + Putztücher + Bürsten	Sarikaya	trocken
11	1	1	Non Food	#374151	410	535	380	155	11	2026-03-28 13:56:10.466373	Non Food Getränkemarktbereich	Stötter	trocken
\.


--
-- Data for Name: laden_bestellungen; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.laden_bestellungen (id, market_id, tenant_id, gebiet_id, datum, kuerzel, anmerkung, created_at) FROM stdin;
\.


--
-- Data for Name: laden_lieferplaene; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.laden_lieferplaene (id, market_id, tenant_id, name, kategorie, liefertag, bestelltag, bestellschluss_uhrzeit, notiz, sort_order, created_at) FROM stdin;
1	1	1	Trockensortiment Hauptlieferung	trocken	1	4	20:00	Hauptlieferung (exkl. TK) – Lücken werden aufgefüllt	1	2026-03-28 16:34:14.824129
2	1	1	Trockensortiment Lückenbestellung	trocken	4	2	20:00	Nur Lücken aufbestellen	2	2026-03-28 16:34:14.824129
3	1	1	TK Ware Hauptlieferung	tk	4	2	20:00	Hauptlieferung Tiefkühlware	3	2026-03-28 16:34:14.824129
4	1	1	Werbeware	werbeware	4	\N	\N	Wird unabhängig des wöchentlichen Bestelltages bestellt	4	2026-03-28 16:34:14.824129
5	1	1	Getränke	getraenke	2	6	\N	\N	5	2026-03-28 16:34:14.824129
6	1	1	Getränke	getraenke	6	3	\N	\N	6	2026-03-28 16:34:14.824129
\.


--
-- Data for Name: market_email_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.market_email_configs (id, market_id, smtp_user, smtp_pass, from_name, updated_at) FROM stdin;
2	2	markt-buching@edeka-dallmann.de	Buching2023!#	EDEKA Dallmann Buching	2026-03-31 07:13:00.338
3	3	markt-mod@edeka-dallmann.de	Oberstdorf2023!#	EDEKA Dallmann Marktoberdorf	2026-03-31 07:22:35.164
1	1	markt@edeka-dallmann.de	Dallmann1.2023!#	EDEKA Dallmann Leeder	2026-03-31 07:23:34.981
\.


--
-- Data for Name: market_info; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.market_info (id, market_id, market_number, street, plz_ort, year, created_at, updated_at) FROM stdin;
1	1	38107	Bahnhofstraße 28	86825 Leeder	2026	2026-03-17 12:33:46.207143	2026-03-24 07:50:58.75
11	2	38189	Mühlfeld 10	87642 Halblech	2025	2026-03-27 09:52:59.69343	2026-03-27 09:52:59.69343
12	2	38189	Mühlfeld 10	87642 Halblech	2026	2026-03-27 09:52:59.706466	2026-03-27 09:52:59.706466
9	3	34805	Ruderatshofenerstraße 81a	87616 Marktoberdorf	2025	2026-03-27 09:39:33.84468	2026-03-27 09:39:33.84468
10	3	34805	Ruderatshofenerstraße 81a	87616 Marktoberdorf	2026	2026-03-27 09:39:33.847551	2026-03-27 09:39:33.847551
4	1	38107	Bahnhofstraße 28	86825 Leeder	2027	2026-03-25 14:09:48.304299	2026-03-25 14:09:48.304299
5	1	38107	Bahnhofstraße 28	86825 Leeder	2025	2026-03-25 17:06:36.70911	2026-03-25 17:06:36.70911
6	1	38107	Bahnhofstraße 28	86825 Leeder	2028	2026-03-26 10:27:04.838513	2026-03-26 10:27:04.838513
7	1	38107	Bahnhofstraße 28	86825 Leeder	2024	2026-03-26 10:27:09.70216	2026-03-26 10:27:09.70216
\.


--
-- Data for Name: markets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.markets (id, tenant_id, name, code, created_at, address, lat, lng, geo_radius_km, plan_rotiert) FROM stdin;
1	1	Leeder	LEE	2026-03-17 12:22:22.112901	Bahnhofstraße 28, 86925 Fuchstal	47.9778	10.8047	10	f
2	1	Buching	BUC	2026-03-17 12:22:22.112901	Mühlfeld 10, 87642 Halblech	47.6917	10.7731	10	f
3	1	MOD	MOD	2026-03-17 12:22:22.112901	Ruderatshofenerstraße 81a, 87616 Marktoberdorf	47.7763	10.6203	10	f
\.


--
-- Data for Name: metz_reinigung; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.metz_reinigung (id, market_id, item_key, datum, kuerzel, user_id, created_at) FROM stdin;
1	1	vorb_fussboden	2026-03-22	MM	\N	2026-03-22 18:20:12.658421
2	1	j_grundrein_kuehl	2026-03-01	KM	8	2026-03-22 18:21:34.598041
3	1	j_grundrein_prod	2026-03-01	KM	8	2026-03-22 18:36:04.90506
4	1	vorb_fussboden	2026-03-16	MM	7	2026-03-22 18:45:37.311398
5	1	vorb_waende	2026-03-16	KM	8	2026-03-22 18:50:54.770666
6	1	vorb_tuergriffe	2026-03-16	KM	8	2026-03-22 18:54:37.592545
7	1	vorb_geraete	2026-03-16	KM	8	2026-03-22 18:54:37.606943
8	1	vorb_backofen	2026-03-16	KM	8	2026-03-22 18:54:37.60724
9	1	vorb_messer	2026-03-16	KM	8	2026-03-22 18:54:37.60756
10	1	vorb_arbeits	2026-03-16	KM	8	2026-03-22 18:54:37.607861
11	1	vorb_hygiene	2026-03-16	KM	8	2026-03-22 18:54:37.806366
12	1	vorb_abfall	2026-03-16	KM	8	2026-03-22 18:54:37.806808
13	1	vorb_fenster	2026-03-16	KM	8	2026-03-22 18:54:37.808153
14	1	waren_annahme	2026-03-16	KM	8	2026-03-22 18:54:37.808414
15	1	waren_transport	2026-03-16	KM	8	2026-03-22 18:54:37.809624
16	1	waren_kuehl_boden	2026-03-16	KM	8	2026-03-22 18:54:37.993587
17	1	waren_eismaschine	2026-03-16	KM	8	2026-03-22 18:54:37.99391
18	1	waren_kuehl_waende	2026-03-16	KM	8	2026-03-22 18:54:37.995837
19	1	waren_kuehl_regal	2026-03-16	KM	8	2026-03-22 18:54:37.996095
20	1	theke_fussboden	2026-03-16	KM	8	2026-03-22 18:54:38.005676
21	1	theke_tueren	2026-03-16	KM	8	2026-03-22 18:54:38.118314
22	1	theke_tuergriffe	2026-03-16	KM	8	2026-03-22 18:54:38.177266
23	1	theke_arbeits	2026-03-16	KM	8	2026-03-22 18:54:38.179309
24	1	theke_waren	2026-03-16	KM	8	2026-03-22 18:54:38.180668
25	1	theke_werkzeuge	2026-03-16	KM	8	2026-03-22 18:54:38.180931
26	1	theke_hackfleisch	2026-03-16	KM	8	2026-03-22 18:54:38.189154
27	1	theke_warmhalte	2026-03-16	KM	8	2026-03-22 18:54:38.305769
28	1	theke_waagen	2026-03-16	KM	8	2026-03-22 18:54:38.361877
29	1	theke_verkauf	2026-03-16	KM	8	2026-03-22 18:54:38.370646
30	1	theke_fisch	2026-03-16	KM	8	2026-03-22 18:54:38.371808
31	1	theke_hygiene	2026-03-16	KM	8	2026-03-22 18:54:38.373593
32	1	theke_preise	2026-03-16	KM	8	2026-03-22 18:54:38.373847
33	1	theke_abfall	2026-03-16	KM	8	2026-03-22 18:54:38.545368
34	1	theke_waende	2026-03-16	KM	8	2026-03-22 18:54:38.553855
35	1	theke_luefter	2026-03-16	KM	8	2026-03-22 18:54:38.555582
36	1	vorb_fenster	2026-03-17	KM	8	2026-03-22 18:54:53.260073
37	1	vorb_fussboden	2026-03-17	MM	7	2026-03-22 19:05:17.614232
38	1	vorb_arbeits	2026-03-17	MM	7	2026-03-22 19:05:17.628344
39	1	vorb_tuergriffe	2026-03-17	MM	7	2026-03-22 19:05:17.629029
40	1	vorb_messer	2026-03-17	MM	7	2026-03-22 19:05:17.630682
41	1	vorb_geraete	2026-03-17	MM	7	2026-03-22 19:05:17.63257
42	1	vorb_backofen	2026-03-17	MM	7	2026-03-22 19:05:17.81788
43	1	vorb_hygiene	2026-03-17	MM	7	2026-03-22 19:05:17.829047
44	1	vorb_abfall	2026-03-17	MM	7	2026-03-22 19:05:17.830401
45	1	waren_transport	2026-03-17	MM	7	2026-03-22 19:05:17.831496
46	1	waren_annahme	2026-03-17	MM	7	2026-03-22 19:05:17.831768
47	1	waren_kuehl_boden	2026-03-17	MM	7	2026-03-22 19:05:18.002192
48	1	theke_fussboden	2026-03-17	MM	7	2026-03-22 19:05:18.012349
49	1	theke_tueren	2026-03-17	MM	7	2026-03-22 19:05:18.029037
50	1	theke_tuergriffe	2026-03-17	MM	7	2026-03-22 19:05:18.030038
51	1	theke_arbeits	2026-03-17	MM	7	2026-03-22 19:05:18.031
52	1	theke_waren	2026-03-17	MM	7	2026-03-22 19:05:18.152299
53	1	theke_werkzeuge	2026-03-17	MM	7	2026-03-22 19:05:18.185344
54	1	theke_hackfleisch	2026-03-17	MM	7	2026-03-22 19:05:18.195594
55	1	theke_warmhalte	2026-03-17	MM	7	2026-03-22 19:05:18.212494
56	1	theke_waagen	2026-03-17	MM	7	2026-03-22 19:05:18.214881
57	1	theke_verkauf	2026-03-17	MM	7	2026-03-22 19:05:18.216123
58	1	theke_fisch	2026-03-17	MM	7	2026-03-22 19:05:18.336665
59	1	theke_hygiene	2026-03-17	MM	7	2026-03-22 19:05:18.377188
60	1	theke_preise	2026-03-17	MM	7	2026-03-22 19:05:18.378912
61	1	theke_abfall	2026-03-17	MM	7	2026-03-22 19:05:18.398623
62	1	vorb_fussboden	2026-03-18	MM	7	2026-03-22 19:05:23.162242
63	1	vorb_tuergriffe	2026-03-18	MM	7	2026-03-22 19:05:23.165714
64	1	vorb_arbeits	2026-03-18	MM	7	2026-03-22 19:05:23.16632
65	1	vorb_geraete	2026-03-18	MM	7	2026-03-22 19:05:23.16745
66	1	vorb_messer	2026-03-18	MM	7	2026-03-22 19:05:23.168132
67	1	vorb_backofen	2026-03-18	MM	7	2026-03-22 19:05:23.168392
68	1	vorb_hygiene	2026-03-18	MM	7	2026-03-22 19:05:23.346035
69	1	vorb_abfall	2026-03-18	MM	7	2026-03-22 19:05:23.349403
70	1	waren_transport	2026-03-18	MM	7	2026-03-22 19:05:23.352247
71	1	waren_annahme	2026-03-18	MM	7	2026-03-22 19:05:23.352785
72	1	waren_kuehl_boden	2026-03-18	MM	7	2026-03-22 19:05:23.353633
73	1	theke_fussboden	2026-03-18	MM	7	2026-03-22 19:05:23.362691
74	1	theke_tueren	2026-03-18	MM	7	2026-03-22 19:05:23.528203
75	1	theke_tuergriffe	2026-03-18	MM	7	2026-03-22 19:05:23.533401
76	1	theke_arbeits	2026-03-18	MM	7	2026-03-22 19:05:23.535342
77	1	theke_waren	2026-03-18	MM	7	2026-03-22 19:05:23.538051
78	1	theke_werkzeuge	2026-03-18	MM	7	2026-03-22 19:05:23.538492
79	1	theke_hackfleisch	2026-03-18	MM	7	2026-03-22 19:05:23.545199
80	1	theke_warmhalte	2026-03-18	MM	7	2026-03-22 19:05:23.712099
81	1	theke_waagen	2026-03-18	MM	7	2026-03-22 19:05:23.716454
82	1	theke_verkauf	2026-03-18	MM	7	2026-03-22 19:05:23.718274
83	1	theke_fisch	2026-03-18	MM	7	2026-03-22 19:05:23.720986
84	1	theke_hygiene	2026-03-18	MM	7	2026-03-22 19:05:23.723146
85	1	theke_preise	2026-03-18	MM	7	2026-03-22 19:05:23.727471
86	1	theke_abfall	2026-03-18	MM	7	2026-03-22 19:05:23.895357
87	1	vorb_fussboden	2026-03-19	MM	7	2026-03-22 19:05:29.56923
88	1	vorb_arbeits	2026-03-19	MM	7	2026-03-22 19:05:29.570772
89	1	vorb_tuergriffe	2026-03-19	MM	7	2026-03-22 19:05:29.571838
90	1	vorb_messer	2026-03-19	MM	7	2026-03-22 19:05:29.572145
91	1	vorb_geraete	2026-03-19	MM	7	2026-03-22 19:05:29.573638
92	1	vorb_backofen	2026-03-19	MM	7	2026-03-22 19:05:29.575166
93	1	vorb_hygiene	2026-03-19	MM	7	2026-03-22 19:05:29.753967
94	1	vorb_abfall	2026-03-19	MM	7	2026-03-22 19:05:29.754182
95	1	waren_annahme	2026-03-19	MM	7	2026-03-22 19:05:29.758399
96	1	waren_transport	2026-03-19	MM	7	2026-03-22 19:05:29.759627
97	1	theke_fussboden	2026-03-19	MM	7	2026-03-22 19:05:29.760188
98	1	waren_kuehl_boden	2026-03-19	MM	7	2026-03-22 19:05:29.76055
99	1	theke_tueren	2026-03-19	MM	7	2026-03-22 19:05:29.938099
100	1	theke_tuergriffe	2026-03-19	MM	7	2026-03-22 19:05:29.945268
101	1	theke_arbeits	2026-03-19	MM	7	2026-03-22 19:05:29.945706
102	1	theke_waren	2026-03-19	MM	7	2026-03-22 19:05:29.94765
103	1	theke_werkzeuge	2026-03-19	MM	7	2026-03-22 19:05:29.948779
104	1	theke_hackfleisch	2026-03-19	MM	7	2026-03-22 19:05:29.949716
105	1	theke_warmhalte	2026-03-19	MM	7	2026-03-22 19:05:30.121897
106	1	theke_waagen	2026-03-19	MM	7	2026-03-22 19:05:30.128753
107	1	theke_verkauf	2026-03-19	MM	7	2026-03-22 19:05:30.129821
108	1	theke_fisch	2026-03-19	MM	7	2026-03-22 19:05:30.133203
109	1	theke_hygiene	2026-03-19	MM	7	2026-03-22 19:05:30.13349
110	1	theke_preise	2026-03-19	MM	7	2026-03-22 19:05:30.135344
111	1	theke_abfall	2026-03-19	MM	7	2026-03-22 19:05:30.312146
112	1	vorb_fussboden	2026-03-20	KM	8	2026-03-22 19:05:39.324702
115	1	vorb_geraete	2026-03-20	KM	8	2026-03-22 19:05:39.330287
120	1	waren_transport	2026-03-20	KM	8	2026-03-22 19:05:39.514421
129	1	theke_hackfleisch	2026-03-20	KM	8	2026-03-22 19:05:39.702977
130	1	theke_warmhalte	2026-03-20	KM	8	2026-03-22 19:05:39.880204
132	1	theke_verkauf	2026-03-20	KM	8	2026-03-22 19:05:39.88542
113	1	vorb_arbeits	2026-03-20	KM	8	2026-03-22 19:05:39.326612
117	1	vorb_messer	2026-03-20	KM	8	2026-03-22 19:05:39.331937
119	1	vorb_abfall	2026-03-20	KM	8	2026-03-22 19:05:39.513185
127	1	theke_waren	2026-03-20	KM	8	2026-03-22 19:05:39.700517
133	1	theke_fisch	2026-03-20	KM	8	2026-03-22 19:05:39.886162
114	1	vorb_tuergriffe	2026-03-20	KM	8	2026-03-22 19:05:39.328924
121	1	waren_kuehl_boden	2026-03-20	KM	8	2026-03-22 19:05:39.515858
124	1	theke_tueren	2026-03-20	KM	8	2026-03-22 19:05:39.697223
128	1	theke_werkzeuge	2026-03-20	KM	8	2026-03-22 19:05:39.702186
131	1	theke_waagen	2026-03-20	KM	8	2026-03-22 19:05:39.883675
116	1	vorb_backofen	2026-03-20	KM	8	2026-03-22 19:05:39.330861
118	1	vorb_hygiene	2026-03-20	KM	8	2026-03-22 19:05:39.512877
123	1	theke_fussboden	2026-03-20	KM	8	2026-03-22 19:05:39.517492
125	1	theke_tuergriffe	2026-03-20	KM	8	2026-03-22 19:05:39.697457
134	1	theke_hygiene	2026-03-20	KM	8	2026-03-22 19:05:39.887045
136	1	theke_abfall	2026-03-20	KM	8	2026-03-22 19:05:40.064146
122	1	waren_annahme	2026-03-20	KM	8	2026-03-22 19:05:39.516506
126	1	theke_arbeits	2026-03-20	KM	8	2026-03-22 19:05:39.698885
135	1	theke_preise	2026-03-20	KM	8	2026-03-22 19:05:39.887568
137	1	vorb_fussboden	2026-03-21	KM	8	2026-03-22 19:22:20.210579
138	1	vorb_tuergriffe	2026-03-21	KM	8	2026-03-22 19:22:20.219821
139	1	vorb_arbeits	2026-03-21	KM	8	2026-03-22 19:22:20.223306
140	1	vorb_messer	2026-03-21	KM	8	2026-03-22 19:22:20.415191
141	1	vorb_geraete	2026-03-21	KM	8	2026-03-22 19:22:20.422412
142	1	vorb_backofen	2026-03-21	KM	8	2026-03-22 19:22:20.424128
143	1	vorb_hygiene	2026-03-21	KM	8	2026-03-22 19:22:20.599411
144	1	vorb_abfall	2026-03-21	KM	8	2026-03-22 19:22:20.604964
145	1	waren_transport	2026-03-21	KM	8	2026-03-22 19:22:20.607773
146	1	waren_annahme	2026-03-21	KM	8	2026-03-22 19:22:20.743857
147	1	theke_fussboden	2026-03-21	KM	8	2026-03-22 19:22:20.749702
149	1	theke_tueren	2026-03-21	KM	8	2026-03-22 19:22:20.790239
150	1	theke_tuergriffe	2026-03-21	KM	8	2026-03-22 19:22:20.790548
151	1	theke_arbeits	2026-03-21	KM	8	2026-03-22 19:22:20.791936
152	1	theke_waren	2026-03-21	KM	8	2026-03-22 19:22:20.927774
153	1	theke_werkzeuge	2026-03-21	KM	8	2026-03-22 19:22:20.931835
155	1	theke_warmhalte	2026-03-21	KM	8	2026-03-22 19:22:20.973457
156	1	theke_waagen	2026-03-21	KM	8	2026-03-22 19:22:20.976195
157	1	theke_verkauf	2026-03-21	KM	8	2026-03-22 19:22:20.977558
158	1	theke_fisch	2026-03-21	KM	8	2026-03-22 19:22:21.110424
159	1	theke_hygiene	2026-03-21	KM	8	2026-03-22 19:22:21.1147
160	1	theke_preise	2026-03-21	KM	8	2026-03-22 19:22:21.117939
161	1	theke_abfall	2026-03-21	KM	8	2026-03-22 19:22:21.156898
162	1	theke_hackfleisch	2026-03-21	MM	7	2026-03-22 19:27:50.767664
163	1	waren_kuehl_boden	2026-03-21	KM	8	2026-03-22 19:28:01.038488
164	1	j_grundrein_theke	2026-03-01	KM	8	2026-03-22 19:28:13.831334
165	1	j_schaedling	2026-01-01	KM	8	2026-03-22 19:28:20.48018
166	1	j_fettabscheider	2026-01-01	KM	8	2026-03-22 19:28:25.014238
167	1	j_maschinen_wartung	2026-01-01	KM	8	2026-03-22 19:28:33.531329
168	1	j_abluft	2026-01-01	KM	8	2026-03-22 19:28:45.636545
169	1	j_desinfmittel	2026-01-01	MM	7	2026-03-22 19:28:50.225597
170	1	j_desinfmittel	2026-02-01	MM	7	2026-03-22 19:28:55.366225
171	1	j_desinfmittel	2026-03-01	MM	7	2026-03-22 19:29:00.083533
172	1	vorb_fussboden	2026-03-23	KM	8	2026-03-23 10:14:42.281226
173	1	vorb_tuergriffe	2026-03-23	KM	8	2026-03-23 10:14:42.30278
174	1	vorb_arbeits	2026-03-23	KM	8	2026-03-23 10:14:42.302826
175	1	vorb_geraete	2026-03-23	KM	8	2026-03-23 10:14:42.30315
176	1	vorb_messer	2026-03-23	KM	8	2026-03-23 10:14:42.305232
177	1	vorb_backofen	2026-03-23	KM	8	2026-03-23 10:14:42.307136
178	1	vorb_hygiene	2026-03-23	KM	8	2026-03-23 10:14:42.502693
179	1	vorb_abfall	2026-03-23	KM	8	2026-03-23 10:14:42.503394
180	1	waren_transport	2026-03-23	MM	7	2026-03-23 10:14:54.929048
181	1	waren_annahme	2026-03-23	MM	7	2026-03-23 10:14:54.942014
182	1	waren_kuehl_boden	2026-03-23	MM	7	2026-03-23 10:14:54.943007
183	1	theke_fussboden	2026-03-23	KM	8	2026-03-23 10:15:04.192883
184	1	theke_tueren	2026-03-23	KM	8	2026-03-23 10:15:04.193272
185	1	theke_tuergriffe	2026-03-23	KM	8	2026-03-23 10:15:04.196135
186	1	theke_arbeits	2026-03-23	KM	8	2026-03-23 10:15:04.199428
187	1	theke_waren	2026-03-23	KM	8	2026-03-23 10:15:04.201731
188	1	theke_werkzeuge	2026-03-23	KM	8	2026-03-23 10:15:04.207319
189	1	theke_hackfleisch	2026-03-23	KM	8	2026-03-23 10:15:04.379496
190	1	theke_warmhalte	2026-03-23	KM	8	2026-03-23 10:15:04.379856
191	1	theke_waagen	2026-03-23	KM	8	2026-03-23 10:15:04.383708
192	1	theke_verkauf	2026-03-23	KM	8	2026-03-23 10:15:04.385604
193	1	theke_fisch	2026-03-23	KM	8	2026-03-23 10:15:04.389668
194	1	theke_hygiene	2026-03-23	KM	8	2026-03-23 10:15:04.390693
195	1	theke_preise	2026-03-23	KM	8	2026-03-23 10:15:04.563608
196	1	theke_abfall	2026-03-23	KM	8	2026-03-23 10:15:04.565194
197	1	vorb_fussboden	2026-03-24	HSC	13	2026-03-25 11:36:43.021922
198	1	vorb_tuergriffe	2026-03-24	HSC	13	2026-03-25 11:36:43.035939
199	1	vorb_geraete	2026-03-24	HSC	13	2026-03-25 11:36:43.038247
200	1	vorb_arbeits	2026-03-24	HSC	13	2026-03-25 11:36:43.03969
201	1	vorb_messer	2026-03-24	HSC	13	2026-03-25 11:36:43.039939
202	1	vorb_backofen	2026-03-24	HSC	13	2026-03-25 11:36:43.040181
203	1	vorb_hygiene	2026-03-24	HSC	13	2026-03-25 11:36:43.242344
204	1	vorb_abfall	2026-03-24	HSC	13	2026-03-25 11:36:43.242882
205	1	vorb_waende	2026-03-25	HSC	13	2026-03-25 11:36:48.703149
206	1	vorb_fussboden	2026-03-25	MM	7	2026-03-25 11:37:00.286732
207	1	vorb_arbeits	2026-03-25	MM	7	2026-03-25 11:37:00.292406
208	1	vorb_tuergriffe	2026-03-25	MM	7	2026-03-25 11:37:00.300059
209	1	vorb_messer	2026-03-25	MM	7	2026-03-25 11:37:00.300224
210	1	vorb_backofen	2026-03-25	MM	7	2026-03-25 11:37:00.300525
211	1	vorb_geraete	2026-03-25	MM	7	2026-03-25 11:37:00.300797
212	1	vorb_hygiene	2026-03-25	MM	7	2026-03-25 11:37:00.470723
213	1	vorb_abfall	2026-03-25	MM	7	2026-03-25 11:37:00.476166
214	1	waren_transport	2026-03-24	HSC	13	2026-03-26 10:36:39.813565
215	1	waren_annahme	2026-03-24	HSC	13	2026-03-26 10:36:39.822899
216	1	waren_kuehl_boden	2026-03-24	HSC	13	2026-03-26 10:36:39.824915
217	1	waren_transport	2026-03-25	HSC	13	2026-03-26 10:36:46.511114
218	1	waren_annahme	2026-03-25	HSC	13	2026-03-26 10:36:46.51291
219	1	waren_kuehl_boden	2026-03-25	HSC	13	2026-03-26 10:36:46.513201
220	1	waren_transport	2026-03-26	HSC	13	2026-03-26 10:36:52.4958
221	1	waren_annahme	2026-03-26	HSC	13	2026-03-26 10:36:52.496165
222	1	waren_kuehl_boden	2026-03-26	HSC	13	2026-03-26 10:36:52.497288
223	1	theke_fussboden	2026-03-24	HSC	13	2026-03-26 10:37:05.63549
224	1	theke_arbeits	2026-03-24	HSC	13	2026-03-26 10:37:05.64059
225	1	theke_werkzeuge	2026-03-24	HSC	13	2026-03-26 10:37:05.64828
226	1	theke_tuergriffe	2026-03-24	HSC	13	2026-03-26 10:37:05.648497
227	1	theke_tueren	2026-03-24	HSC	13	2026-03-26 10:37:05.64884
228	1	theke_waren	2026-03-24	HSC	13	2026-03-26 10:37:05.649894
229	1	theke_hackfleisch	2026-03-24	HSC	13	2026-03-26 10:37:05.81219
230	1	theke_warmhalte	2026-03-24	HSC	13	2026-03-26 10:37:05.814277
231	1	theke_waagen	2026-03-24	HSC	13	2026-03-26 10:37:05.82445
232	1	theke_verkauf	2026-03-24	HSC	13	2026-03-26 10:37:05.826794
233	1	theke_hygiene	2026-03-24	HSC	13	2026-03-26 10:37:05.828697
234	1	theke_fisch	2026-03-24	HSC	13	2026-03-26 10:37:05.829143
235	1	theke_preise	2026-03-24	HSC	13	2026-03-26 10:37:05.991483
236	1	theke_abfall	2026-03-24	HSC	13	2026-03-26 10:37:05.991685
237	1	theke_fussboden	2026-03-25	HSC	13	2026-03-26 10:37:11.953505
238	1	theke_tueren	2026-03-25	HSC	13	2026-03-26 10:37:11.953912
239	1	theke_tuergriffe	2026-03-25	HSC	13	2026-03-26 10:37:11.95543
240	1	theke_arbeits	2026-03-25	HSC	13	2026-03-26 10:37:11.956229
241	1	theke_waren	2026-03-25	HSC	13	2026-03-26 10:37:11.957212
242	1	theke_werkzeuge	2026-03-25	HSC	13	2026-03-26 10:37:11.968866
243	1	theke_hackfleisch	2026-03-25	HSC	13	2026-03-26 10:37:12.128945
244	1	theke_warmhalte	2026-03-25	HSC	13	2026-03-26 10:37:12.131904
245	1	theke_fisch	2026-03-25	HSC	13	2026-03-26 10:37:12.133364
254	1	theke_tuergriffe	2026-03-26	HSC	13	2026-03-26 10:37:19.108446
257	1	theke_hackfleisch	2026-03-26	HSC	13	2026-03-26 10:37:19.279648
259	1	theke_fisch	2026-03-26	HSC	13	2026-03-26 10:37:19.284164
246	1	theke_verkauf	2026-03-25	HSC	13	2026-03-26 10:37:12.134048
248	1	theke_hygiene	2026-03-25	HSC	13	2026-03-26 10:37:12.141078
249	1	theke_preise	2026-03-25	HSC	13	2026-03-26 10:37:12.303063
250	1	theke_abfall	2026-03-25	HSC	13	2026-03-26 10:37:12.30767
251	1	theke_fussboden	2026-03-26	HSC	13	2026-03-26 10:37:19.103573
253	1	theke_werkzeuge	2026-03-26	HSC	13	2026-03-26 10:37:19.107659
261	1	theke_waagen	2026-03-26	HSC	13	2026-03-26 10:37:19.284906
264	1	theke_abfall	2026-03-26	HSC	13	2026-03-26 10:37:19.460335
247	1	theke_waagen	2026-03-25	HSC	13	2026-03-26 10:37:12.134257
252	1	theke_tueren	2026-03-26	HSC	13	2026-03-26 10:37:19.103826
256	1	theke_arbeits	2026-03-26	HSC	13	2026-03-26 10:37:19.109518
260	1	theke_verkauf	2026-03-26	HSC	13	2026-03-26 10:37:19.284324
255	1	theke_waren	2026-03-26	HSC	13	2026-03-26 10:37:19.108669
258	1	theke_warmhalte	2026-03-26	HSC	13	2026-03-26 10:37:19.282975
265	1	vorb_fussboden_w	2026-03-26	HSC	13	2026-03-26 10:37:34.278616
267	1	waren_eismaschine	2026-03-26	HSC	13	2026-03-26 10:37:50.696424
268	1	waren_kuehl_waende	2026-03-26	HSC	13	2026-03-26 10:37:55.541984
269	1	waren_kuehl_regal	2026-03-26	HSC	13	2026-03-26 10:38:00.360678
274	1	theke_fussboden_w	2026-03-21	HSC	13	2026-03-26 10:38:53.159454
275	1	theke_verkauf_w	2026-03-21	HSC	13	2026-03-26 10:39:00.27544
277	1	vorb_fussboden	2026-03-26	KM	8	2026-03-26 10:50:32.563882
278	1	vorb_tuergriffe	2026-03-26	KM	8	2026-03-26 10:50:32.795557
279	1	vorb_arbeits	2026-03-26	KM	8	2026-03-26 10:50:33.009612
280	1	vorb_messer	2026-03-26	KM	8	2026-03-26 10:50:33.134419
281	1	vorb_geraete	2026-03-26	KM	8	2026-03-26 10:50:33.144399
282	1	vorb_backofen	2026-03-26	KM	8	2026-03-26 10:50:33.173862
283	1	vorb_abfall	2026-03-26	KM	8	2026-03-26 10:50:33.181606
262	1	theke_hygiene	2026-03-26	HSC	13	2026-03-26 10:37:19.285155
263	1	theke_preise	2026-03-26	HSC	13	2026-03-26 10:37:19.460049
266	1	vorb_fenster	2026-03-26	HSC	13	2026-03-26 10:37:41.894744
270	1	theke_fussboden_w	2026-03-26	HSC	13	2026-03-26 10:38:08.709069
271	1	theke_verkauf_w	2026-03-26	HSC	13	2026-03-26 10:38:15.277293
272	1	theke_waende	2026-03-26	HSC	13	2026-03-26 10:38:22.175528
273	1	theke_luefter	2026-03-26	HSC	13	2026-03-26 10:38:28.343678
276	1	vorb_fussboden_w	2026-03-21	HSC	13	2026-03-26 10:39:13.958932
284	1	vorb_hygiene	2026-03-26	KM	8	2026-03-26 10:50:33.189695
\.


--
-- Data for Name: mhd_kontrolle; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mhd_kontrolle (id, market_id, datum, bereich, artikel, mhd_datum, menge, aktion, bemerkung, kuerzel, created_at) FROM stdin;
\.


--
-- Data for Name: monatsbericht_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.monatsbericht_config (id, market_id, empfaenger_email, auto_send, send_day, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notification_channels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_channels (id, user_id, channel_type, telegram_chat_id, email_override, created_at) FROM stdin;
1	16	telegram	53676916	\N	2026-03-31 07:38:02.375029
3	17	telegram	8235061109	\N	2026-03-31 09:09:19.826066
\.


--
-- Data for Name: notification_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_log (id, rule_id, user_id, market_id, channel_type, message, status, sent_at) FROM stdin;
1	2	16	1	email	Seit 2 Tagen (29.3.2026) kein neuer Eintrag.	failed	2026-03-31 07:39:22.589645
2	2	16	2	email	Seit 27 Tagen (4.3.2026) kein neuer Eintrag.	failed	2026-03-31 07:39:22.601941
3	2	16	3	email	Seit 5 Tagen (26.3.2026) kein neuer Eintrag.	failed	2026-03-31 07:39:22.606302
4	2	16	1	email	Seit 2 Tagen (29.3.2026) kein neuer Eintrag.	failed	2026-03-31 07:48:54.782834
5	2	16	2	email	Seit 27 Tagen (4.3.2026) kein neuer Eintrag.	failed	2026-03-31 07:48:54.795092
6	2	16	3	email	Seit 5 Tagen (26.3.2026) kein neuer Eintrag.	failed	2026-03-31 07:48:54.799611
7	2	16	1	email	Seit 2 Tagen (29.3.2026) kein neuer Eintrag.	sent	2026-03-31 07:55:41.037789
8	2	16	2	email	Seit 27 Tagen (4.3.2026) kein neuer Eintrag.	sent	2026-03-31 07:55:43.062272
9	2	16	3	email	Seit 5 Tagen (26.3.2026) kein neuer Eintrag.	sent	2026-03-31 07:55:45.097886
10	3	16	1	telegram	Seit 1 Tagen (30.3.2026) kein neuer Eintrag.	sent	2026-03-31 08:51:34.856413
11	3	16	2	telegram	Seit 11 Tagen (20.3.2026) kein neuer Eintrag.	sent	2026-03-31 08:51:35.144578
12	4	16	1	telegram	Seit 2 Tagen (29.3.2026) kein neuer Eintrag.	sent	2026-03-31 09:01:28.081055
13	4	17	1	telegram	Seit 2 Tagen (29.3.2026) kein neuer Eintrag.	failed	2026-03-31 09:09:56.006497
14	4	17	1	telegram	Seit 2 Tagen (29.3.2026) kein neuer Eintrag.	failed	2026-03-31 09:13:19.910638
15	5	17	2	telegram	Noch nie ein Eintrag für diesen Bereich erfasst.	failed	2026-03-31 09:13:20.13222
16	5	17	1	telegram	Seit 6 Tagen (25.3.2026) kein neuer Eintrag.	failed	2026-03-31 09:13:20.338247
17	5	17	3	telegram	Noch nie ein Eintrag für diesen Bereich erfasst.	failed	2026-03-31 09:13:20.536999
18	4	17	1	telegram	Seit 2 Tagen (29.3.2026) kein neuer Eintrag.	failed	2026-03-31 09:14:13.049845
19	5	17	2	telegram	Noch nie ein Eintrag für diesen Bereich erfasst.	failed	2026-03-31 09:14:13.370673
20	5	17	1	telegram	Seit 6 Tagen (25.3.2026) kein neuer Eintrag.	failed	2026-03-31 09:14:13.580848
21	5	17	3	telegram	Noch nie ein Eintrag für diesen Bereich erfasst.	failed	2026-03-31 09:14:13.79455
22	4	17	1	telegram	Seit 2 Tagen (29.3.2026) kein neuer Eintrag.	failed	2026-03-31 09:18:56.063278
23	5	17	2	telegram	Noch nie ein Eintrag für diesen Bereich erfasst.	failed	2026-03-31 09:18:56.290993
24	5	17	1	telegram	Seit 6 Tagen (25.3.2026) kein neuer Eintrag.	failed	2026-03-31 09:18:56.491146
25	5	17	3	telegram	Noch nie ein Eintrag für diesen Bereich erfasst.	failed	2026-03-31 09:18:56.700796
26	4	17	1	telegram	Seit 2 Tagen (29.3.2026) kein neuer Eintrag.	sent	2026-03-31 09:42:37.448224
27	5	17	2	telegram	Noch nie ein Eintrag für diesen Bereich erfasst.	sent	2026-03-31 09:42:37.842521
28	5	17	1	telegram	Seit 6 Tagen (25.3.2026) kein neuer Eintrag.	sent	2026-03-31 09:42:38.034763
29	5	17	3	telegram	Noch nie ein Eintrag für diesen Bereich erfasst.	sent	2026-03-31 09:42:38.295541
30	2	16	1	telegram	Seit 4 Tagen (29.3.2026) kein neuer Eintrag.	sent	2026-04-02 05:00:00.992265
31	2	16	2	telegram	Seit 29 Tagen (4.3.2026) kein neuer Eintrag.	sent	2026-04-02 05:00:01.360999
32	2	16	3	telegram	Seit 7 Tagen (26.3.2026) kein neuer Eintrag.	sent	2026-04-02 05:00:01.637412
33	3	16	1	telegram	Seit 3 Tagen (30.3.2026) kein neuer Eintrag.	sent	2026-04-02 05:00:01.856092
34	3	16	2	telegram	Seit 13 Tagen (20.3.2026) kein neuer Eintrag.	sent	2026-04-02 05:00:02.059749
35	4	16	1	telegram	Seit 4 Tagen (29.3.2026) kein neuer Eintrag.	sent	2026-04-02 05:00:02.254943
36	4	17	1	telegram	Seit 4 Tagen (29.3.2026) kein neuer Eintrag.	sent	2026-04-02 05:00:02.448017
37	5	17	2	telegram	Noch nie ein Eintrag für diesen Bereich erfasst.	sent	2026-04-02 05:00:02.639278
38	5	17	1	telegram	Seit 2 Tagen (31.3.2026) kein neuer Eintrag.	sent	2026-04-02 05:00:02.834112
39	5	17	3	telegram	Noch nie ein Eintrag für diesen Bereich erfasst.	sent	2026-04-02 05:00:03.030741
\.


--
-- Data for Name: notification_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_rules (id, tenant_id, section_key, trigger_type, trigger_value, notify_user_ids, is_active, created_at, market_ids, check_rhythm) FROM stdin;
2	1	2.2	no_entry_days	1	{16}	t	2026-03-31 07:39:13.245474	{1,2,3}	daily
3	1	3.1	no_entry_days	1	{16}	t	2026-03-31 08:09:50.964074	{1,2}	daily
4	1	2.2	no_entry_days	1	{16,17}	t	2026-03-31 09:01:11.571172	{1}	daily
5	1	2.3	no_entry_days	1	{17}	t	2026-03-31 09:11:03.402852	{2,1,3}	daily
\.


--
-- Data for Name: oeffnung_salate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.oeffnung_salate (id, tenant_id, market_id, year, month, day, artikel_bezeichnung, verbrauchsdatum, eigenherstellung, kuerzel, user_id, created_at, aufgebraucht_am, aufgebraucht_kuerzel, aufgebraucht_user_id) FROM stdin;
1	1	1	2026	3	24	Fleischsalat	2026-04-20	f	MM	7	2026-03-24 14:23:17.869762	2026-03-25	\N	\N
3	1	1	2026	3	25	jhklgjlgh	2026-04-05	f	HSC	13	2026-03-25 11:38:34.419747	2026-03-25	\N	\N
2	1	1	2026	3	24	Grüner Zwiebelsalat	2026-04-10	t	KM	8	2026-03-24 14:23:52.15282	2026-03-25	\N	\N
4	1	1	2026	3	25	hjkhgjgh	2026-04-05	t	HSC	13	2026-03-25 11:39:57.493768	2026-03-25	\N	\N
5	1	1	2026	3	25	jkafoöjdkslf	2026-03-28	f	HSC	13	2026-03-25 12:29:09.221161	2026-03-25	\N	\N
6	1	1	2026	3	26	Salat Farmer	2026-03-28	t	KM	8	2026-03-26 08:48:49.513334	2026-03-26	KM	8
7	1	1	2026	3	18	Testsalat	2026-03-24	t	KM	8	2026-03-26 08:56:25.768922	2026-03-26	KM	8
8	1	1	2026	3	19	test	2026-03-24	f	KM	8	2026-03-26 09:14:02.265948	2026-03-26	KM	8
9	1	1	2026	3	20	salat	2026-03-25	t	KM	8	2026-03-26 10:51:45.84158	2026-03-26	KM	8
\.


--
-- Data for Name: password_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_tokens (id, user_id, token, type, expires_at, used_at, created_at) FROM stdin;
1	16	fec598493bf8bf5d8dc35da297ad7cff53a40cd39d40107baa5a9e774458bfac	invite	2026-04-02 09:45:05.749	2026-03-31 09:46:13.036061	2026-03-31 09:45:05.749324
2	17	22c0e1e4cf406453125ea3831e6fdb11da7f14be48f9d48b1f47a61a4b1adaff	invite	2026-04-02 09:50:25.442	\N	2026-03-31 09:50:25.443214
3	16	430434064de176f0c8a7e65afe47e0c14e820ca2dcd00fedae582582baf46127	invite	2026-04-02 09:55:59.255	\N	2026-03-31 09:55:59.25618
4	17	908ac927bceb63f5dc00c34f7a458553ee193043b47fe4d4da97f78f70c63ca5	invite	2026-04-02 09:56:56.196	2026-03-31 10:10:01.999563	2026-03-31 09:56:56.196442
5	17	e899807f25d98255b329f4206f6ccb63d37c364767ad4848f6d73c32e44a657a	reset	2026-04-02 10:12:37.644	2026-03-31 10:13:29.007489	2026-03-31 10:12:37.644824
6	17	72e230c6df1ed298009eabc0f8ef058685811c398fb144229ef355f0792889cd	reset	2026-04-02 10:14:43.58	2026-03-31 10:15:19.564314	2026-03-31 10:14:43.58034
\.


--
-- Data for Name: probeentnahme; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.probeentnahme (id, tenant_id, markt, ansprechpartner, behoerde_bezeichnung, grund_probenahme, untersuchungsziel, datum_entnahme, gegenprobe_art, gegenprobe_status, probentyp, ean, artikel_nr, verkehrsbezeichnung, mhd, losnummer, fuellmenge, hersteller, durchschrift_gefaxt_durch, durchschrift_gefaxt_am, abholer_name, abholer_firma_name, abholer_firma_strasse, abholer_firma_postfach, abholer_firma_plz_ort, amtliche_probennummer, siegeldatum, uebergabe_artikel, uebergabe_ort_datum, gegenprobe_abgeholt_am, gegenprobe_abgeholt_durch, unterschrift_abholer_digital, unterschrift_mitarbeiter_digital, amtliches_dokument_foto, created_at, updated_at, market_id) FROM stdin;
\.


--
-- Data for Name: produktfehlermeldung; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.produktfehlermeldung (id, tenant_id, markt, ansprechpartner, email, telefon, telefax, erkennung_durch, einwilligung_vorhanden, markenname, einzel_ean, mhd, losnummer, lieferantencode, belieferungsart, grosshandelsstandort, fehlerbeschreibung, menge_verbraucher, menge_markt, kaufdatum, kassenbon_vorhanden, kunde_entschaedigt, produkt_vorhanden, fremdkoerper_vorhanden, gleiches_mhd_im_markt, gleicher_fehler_im_bestand, ware_aus_regal_genommen, datum_unterschrift, unterschrift_marktleiter, verbraucher_name, verbraucher_adresse, verbraucher_telefon, verbraucher_email, einwilligung_unterschrift_ort, einwilligung_datum, created_at, updated_at, unterschrift_foto, unterschrift_personal_digital, unterschrift_kunde_digital, market_id) FROM stdin;
1	1	dasfdsa					verbraucher	t	fdsaf											\N	\N	\N	\N	\N	\N	\N	19.3.2026		fdasfda						2026-03-19 09:32:24.970339	2026-03-19 09:38:50.631	data:image/jpeg;base64,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	\N	\N	1
2	1	fuchaTAL	SS					\N						strecke						\N	\N	\N	\N	\N	\N	\N	24.3.2026								2026-03-24 10:50:08.807228	2026-03-24 10:50:08.807228		data:image/png;base64,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		1
3	1	Leeder		markt@edeka-dallmann.de	08243/9609041			\N												\N	\N	\N	\N	\N	\N	\N	26.3.2026								2026-03-26 06:23:28.840743	2026-03-26 06:23:28.840743				1
4	1	Leeder	Kai Martin	markt@edeka-dallmann.de	08243/9609041			\N												\N	\N	\N	\N	\N	\N	\N	26.3.2026								2026-03-26 10:43:25.597255	2026-03-26 10:43:25.597255		data:image/png;base64,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		1
\.


--
-- Data for Name: registered_devices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.registered_devices (id, tenant_id, name, token, is_active, created_at, revoked_at) FROM stdin;
1	1	LapTop Kai Daheim	55636533c191eec6bcb40ca0ba3809689dbd890b793a92da8f55b5967a850f18	t	2026-03-25 15:54:32.73502	\N
2	1	I Pad Michi	3025c34344fd930799ac917994ac17071a85d76d934155ed2efff61917fae62c	t	2026-03-25 16:14:35.848497	\N
3	1	Laptop Kai Daheim	120285966d0fe3fe71146aad734131446e29c92d6c22fa750e793b4b076476e3	t	2026-03-25 17:03:09.676843	\N
4	1	I Phone17 Michi	84922e1e200a5fdc8c1f32196a56f1d87c04467d37a79f783c4a704865303314	t	2026-03-25 19:10:24.111409	\N
5	1	Handy kai	a8f73b42cb8f4b9e6427f3aff403aadaa705cf79c80a10e6a39bccfff0115600	t	2026-03-26 04:08:02.793005	\N
6	1	Rechner Kai Arbeit	2029a20df5ec1e737b3e80d0b74e6e7a0b835e1a220b50eacdfa7cc4effe6db8	t	2026-03-26 05:52:16.570227	\N
7	1	Mac Book Michi	0fd23ae0c8e76535e35b58cf316cf3217898e18d2aa038201af5e79af8aaac18	t	2026-03-26 10:24:29.058048	\N
8	1	Mac Michi	a8919fd7b7384bea572ba1a477817bb3b212264a9b3331e5d3c02929951e283f	t	2026-03-27 16:46:09.072894	\N
9	1	I Pad Michi	9ceb18093b4ae372dabd6627990c5ad0a9eb022c769a853eaf74b01f56e7b9d8	t	2026-03-29 10:23:44.357556	\N
10	1	Test Gerät	225b9cfaf6ea2eb18615fc8269271312fe9186073da28c72e420ecf3fef8e5fd	t	2026-04-01 11:22:50.623306	\N
11	1	Test-Geraet-2	439257dd79a655f2d478fea61c0e649853b5392c8e7ca3c079b2d8c560b72476	t	2026-04-01 11:24:38.655535	\N
12	1	Proxy-Test-Geraet	aeccfe9a054d0766c297b8a43cb06db6e1372e2398e4b632066d82bb048245ea	t	2026-04-01 11:24:47.628154	\N
13	1	Live-Test	233d6994ce4d562f0607adde41df777dd96bb7c97e053d4cb44af7beeec32363	t	2026-04-01 11:40:53.991839	\N
\.


--
-- Data for Name: reinigung_taeglich; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reinigung_taeglich (id, tenant_id, market_id, year, month, day, area, kuerzel, user_id, created_at) FROM stdin;
2	1	1	2026	3	18	boeden	KM	8	2026-03-19 17:58:33.095743
3	1	1	2026	3	17	boeden	KM	8	2026-03-19 17:58:41.481501
4	1	1	2026	3	16	boeden	KM	8	2026-03-19 17:58:46.723792
5	1	1	2026	3	16	waende	MM	7	2026-03-19 17:58:54.291623
6	1	1	2026	3	16	decken	MM	7	2026-03-19 17:58:59.423284
7	1	1	2026	3	16	abfall	KM	8	2026-03-19 17:59:04.30812
8	1	1	2026	3	16	regal	KM	8	2026-03-19 17:59:09.323125
9	1	1	2026	3	16	leeraut	MM	7	2026-03-19 17:59:13.958903
10	1	1	2026	3	16	geraete	MM	7	2026-03-19 17:59:18.48829
11	1	1	2026	3	16	wasser	MM	7	2026-03-19 17:59:26.030794
12	1	1	2026	3	19	waende	KM	8	2026-03-19 18:02:38.222465
13	1	1	2026	3	19	regal	KM	8	2026-03-19 18:02:38.235811
14	1	1	2026	3	19	abfall	KM	8	2026-03-19 18:02:38.236194
15	1	1	2026	3	19	leeraut	KM	8	2026-03-19 18:02:38.43722
16	1	1	2026	3	19	geraete	KM	8	2026-03-19 18:02:38.437985
17	1	1	2026	3	19	wasser	KM	8	2026-03-19 18:02:38.43921
18	1	1	2026	3	19	umkleide	KM	8	2026-03-19 18:02:38.623875
19	1	1	2026	3	19	sanitaer	KM	8	2026-03-19 18:02:38.625597
20	1	1	2026	3	19	rampen	KM	8	2026-03-19 18:02:38.626968
21	1	1	2026	3	19	wagen	KM	8	2026-03-19 18:02:38.758371
22	1	1	2026	3	19	decken	KM	8	2026-03-19 18:02:38.758926
23	1	1	2026	3	18	waende	MM	7	2026-03-19 18:02:50.490623
24	1	1	2026	3	18	leeraut	MM	7	2026-03-19 18:02:50.516049
25	1	1	2026	3	18	geraete	MM	7	2026-03-19 18:02:50.516546
26	1	1	2026	3	18	decken	MM	7	2026-03-19 18:02:50.51704
27	1	1	2026	3	18	regal	MM	7	2026-03-19 18:02:50.51759
28	1	1	2026	3	18	abfall	MM	7	2026-03-19 18:02:50.522486
29	1	1	2026	3	18	wasser	MM	7	2026-03-19 18:02:50.708008
30	1	1	2026	3	18	sanitaer	MM	7	2026-03-19 18:02:50.710834
31	1	1	2026	3	18	umkleide	MM	7	2026-03-19 18:02:50.711384
32	1	1	2026	3	18	wagen	MM	7	2026-03-19 18:02:50.715029
33	1	1	2026	3	18	rampen	MM	7	2026-03-19 18:02:50.715379
34	1	1	2026	3	17	waende	KM	8	2026-03-19 18:02:56.536755
35	1	1	2026	3	17	abfall	KM	8	2026-03-19 18:02:56.537556
36	1	1	2026	3	17	decken	KM	8	2026-03-19 18:02:56.540581
37	1	1	2026	3	17	regal	KM	8	2026-03-19 18:02:56.540926
38	1	1	2026	3	17	leeraut	KM	8	2026-03-19 18:02:56.543012
39	1	1	2026	3	17	geraete	KM	8	2026-03-19 18:02:56.543383
40	1	1	2026	3	17	wasser	KM	8	2026-03-19 18:02:56.726019
41	1	1	2026	3	17	umkleide	KM	8	2026-03-19 18:02:56.726869
42	1	1	2026	3	17	sanitaer	KM	8	2026-03-19 18:02:56.729563
43	1	1	2026	3	17	rampen	KM	8	2026-03-19 18:02:56.73039
44	1	1	2026	3	17	wagen	KM	8	2026-03-19 18:02:56.731404
45	1	1	2026	3	16	umkleide	KM	8	2026-03-19 18:03:02.38112
46	1	1	2026	3	16	sanitaer	KM	8	2026-03-19 18:03:02.382601
47	1	1	2026	3	16	rampen	KM	8	2026-03-19 18:03:02.383831
48	1	1	2026	3	16	wagen	KM	8	2026-03-19 18:03:02.384254
49	1	1	2026	3	19	boeden	MM	7	2026-03-19 18:03:13.853622
50	1	1	2026	3	20	boeden	KM	8	2026-03-20 18:21:17.530534
51	1	1	2026	3	20	abfall	KM	8	2026-03-20 18:21:17.540862
52	1	1	2026	3	20	decken	KM	8	2026-03-20 18:21:17.54127
53	1	1	2026	3	20	regal	KM	8	2026-03-20 18:21:17.543705
54	1	1	2026	3	20	waende	KM	8	2026-03-20 18:21:17.546416
55	1	1	2026	3	20	leeraut	KM	8	2026-03-20 18:21:17.759145
56	1	1	2026	3	20	wasser	KM	8	2026-03-20 18:21:17.763509
57	1	1	2026	3	20	umkleide	KM	8	2026-03-20 18:21:17.765215
58	1	1	2026	3	20	sanitaer	KM	8	2026-03-20 18:21:17.766691
59	1	1	2026	3	20	rampen	KM	8	2026-03-20 18:21:17.776942
60	1	1	2026	3	20	wagen	KM	8	2026-03-20 18:21:17.993339
61	1	1	2026	3	20	geraete	MM	7	2026-03-20 18:21:26.8001
62	1	1	2026	3	23	waende	KM	8	2026-03-23 17:12:21.096313
63	1	1	2026	3	23	boeden	KM	8	2026-03-23 17:12:21.109269
64	1	1	2026	3	23	abfall	KM	8	2026-03-23 17:12:21.110949
65	1	1	2026	3	23	leeraut	KM	8	2026-03-23 17:12:21.11082
66	1	1	2026	3	23	regal	KM	8	2026-03-23 17:12:21.111536
67	1	1	2026	3	23	decken	KM	8	2026-03-23 17:12:21.11422
68	1	1	2026	3	23	wasser	KM	8	2026-03-23 17:12:21.331532
69	1	1	2026	3	23	umkleide	KM	8	2026-03-23 17:12:21.332013
70	1	1	2026	3	23	sanitaer	KM	8	2026-03-23 17:12:21.334089
71	1	1	2026	3	23	geraete	KM	8	2026-03-23 17:12:21.334379
72	1	1	2026	3	23	rampen	KM	8	2026-03-23 17:12:21.336737
73	1	1	2026	3	23	wagen	MM	7	2026-03-23 17:12:28.644769
74	1	1	2026	3	24	boeden	KM	8	2026-03-24 08:02:23.737382
75	1	1	2026	3	24	abfall	KM	8	2026-03-24 08:02:23.750658
76	1	1	2026	3	24	decken	KM	8	2026-03-24 08:02:23.752298
77	1	1	2026	3	24	leeraut	KM	8	2026-03-24 08:02:23.752828
78	1	1	2026	3	24	waende	KM	8	2026-03-24 08:02:23.753196
79	1	1	2026	3	24	regal	KM	8	2026-03-24 08:02:23.756154
80	1	1	2026	3	24	geraete	KM	8	2026-03-24 08:02:23.950085
81	1	1	2026	3	24	wasser	KM	8	2026-03-24 08:02:23.962536
82	1	1	2026	3	24	umkleide	KM	8	2026-03-24 08:02:23.964461
83	1	1	2026	3	24	sanitaer	KM	8	2026-03-24 08:02:23.964814
84	1	1	2026	3	24	rampen	KM	8	2026-03-24 08:02:23.966758
86	1	1	2026	3	21	boeden	KM	8	2026-03-24 10:51:52.342417
87	1	1	2026	3	21	waende	KM	8	2026-03-24 10:51:52.358301
88	1	1	2026	3	21	decken	KM	8	2026-03-24 10:51:52.368834
89	1	1	2026	3	21	abfall	KM	8	2026-03-24 10:51:52.369814
90	1	1	2026	3	21	regal	KM	8	2026-03-24 10:51:52.370465
91	1	1	2026	3	21	leeraut	KM	8	2026-03-24 10:51:52.373535
92	1	1	2026	3	21	geraete	KM	8	2026-03-24 10:51:53.297481
93	1	1	2026	3	21	wasser	KM	8	2026-03-24 10:51:53.401505
94	1	1	2026	3	21	umkleide	KM	8	2026-03-24 10:51:53.405935
95	1	1	2026	3	21	sanitaer	KM	8	2026-03-24 10:51:53.410611
96	1	1	2026	3	21	rampen	KM	8	2026-03-24 10:51:53.413869
97	1	1	2026	3	21	wagen	KM	8	2026-03-24 10:51:53.418494
98	1	1	2026	3	25	boeden	HSC	13	2026-03-25 11:05:58.251188
99	1	1	2026	3	25	waende	HSC	13	2026-03-25 11:05:58.263086
100	1	1	2026	3	25	decken	HSC	13	2026-03-25 11:05:58.26556
101	1	1	2026	3	25	abfall	HSC	13	2026-03-25 11:05:58.266233
102	1	1	2026	3	25	regal	HSC	13	2026-03-25 11:05:58.267878
103	1	1	2026	3	25	leeraut	HSC	13	2026-03-25 11:05:58.268154
104	1	1	2026	3	25	geraete	HSC	13	2026-03-25 11:05:58.464895
105	1	1	2026	3	25	wasser	HSC	13	2026-03-25 11:05:58.475331
106	1	1	2026	3	25	umkleide	HSC	13	2026-03-25 11:05:58.475603
107	1	1	2026	3	25	sanitaer	HSC	13	2026-03-25 11:05:58.47711
108	1	1	2026	3	25	rampen	HSC	13	2026-03-25 11:05:58.478611
110	1	1	2026	3	25	wagen	HSC	13	2026-03-25 11:23:01.031413
111	1	1	2026	3	24	wagen	KM	8	2026-03-25 12:27:06.353097
112	1	1	2026	3	31	boeden	DM	17	2026-03-31 11:17:00.582764
113	1	1	2026	3	31	waende	DM	17	2026-03-31 11:17:00.593578
114	1	1	2026	3	31	decken	DM	17	2026-03-31 11:17:00.595179
115	1	1	2026	3	31	leeraut	DM	17	2026-03-31 11:17:00.59666
116	1	1	2026	3	31	regal	DM	17	2026-03-31 11:17:00.597371
117	1	1	2026	3	31	abfall	DM	17	2026-03-31 11:17:00.597582
118	1	1	2026	3	31	geraete	DM	17	2026-03-31 11:17:00.958425
119	1	1	2026	3	31	wasser	DM	17	2026-03-31 11:17:00.962348
120	1	1	2026	3	31	sanitaer	DM	17	2026-03-31 11:17:00.964148
121	1	1	2026	3	31	umkleide	DM	17	2026-03-31 11:17:00.964665
122	1	1	2026	3	31	wagen	DM	17	2026-03-31 11:17:00.967368
123	1	1	2026	3	31	rampen	DM	17	2026-03-31 11:17:00.967368
124	1	1	2026	3	30	boeden	DM	17	2026-03-31 11:17:31.819141
125	1	1	2026	3	30	decken	DM	17	2026-03-31 11:17:31.832047
126	1	1	2026	3	30	waende	DM	17	2026-03-31 11:17:31.832921
127	1	1	2026	3	30	regal	DM	17	2026-03-31 11:17:31.834315
128	1	1	2026	3	30	leeraut	DM	17	2026-03-31 11:17:31.83515
129	1	1	2026	3	30	abfall	DM	17	2026-03-31 11:17:31.835823
130	1	1	2026	3	30	geraete	DM	17	2026-03-31 11:17:32.009832
131	1	1	2026	3	30	wasser	DM	17	2026-03-31 11:17:32.019324
132	1	1	2026	3	30	umkleide	DM	17	2026-03-31 11:17:32.021164
133	1	1	2026	3	30	sanitaer	DM	17	2026-03-31 11:17:32.02313
134	1	1	2026	3	30	rampen	DM	17	2026-03-31 11:17:32.025638
135	1	1	2026	3	30	wagen	DM	17	2026-03-31 11:17:32.025985
136	1	1	2026	3	26	boeden	DM	17	2026-03-31 11:17:37.663252
137	1	1	2026	3	26	waende	DM	17	2026-03-31 11:17:37.663509
138	1	1	2026	3	26	abfall	DM	17	2026-03-31 11:17:37.666888
139	1	1	2026	3	26	decken	DM	17	2026-03-31 11:17:37.668033
140	1	1	2026	3	26	regal	DM	17	2026-03-31 11:17:37.66906
141	1	1	2026	3	26	leeraut	DM	17	2026-03-31 11:17:37.66923
142	1	1	2026	3	26	geraete	DM	17	2026-03-31 11:17:37.850022
143	1	1	2026	3	26	wasser	DM	17	2026-03-31 11:17:37.851674
144	1	1	2026	3	26	umkleide	DM	17	2026-03-31 11:17:37.854528
145	1	1	2026	3	26	sanitaer	DM	17	2026-03-31 11:17:37.856631
146	1	1	2026	3	26	rampen	DM	17	2026-03-31 11:17:37.857077
147	1	1	2026	3	26	wagen	DM	17	2026-03-31 11:17:37.858317
148	1	1	2026	3	27	boeden	DM	17	2026-03-31 11:17:45.139354
149	1	1	2026	3	27	waende	DM	17	2026-03-31 11:17:45.140685
150	1	1	2026	3	27	abfall	DM	17	2026-03-31 11:17:45.143028
151	1	1	2026	3	27	decken	DM	17	2026-03-31 11:17:45.143268
152	1	1	2026	3	27	regal	DM	17	2026-03-31 11:17:45.144159
153	1	1	2026	3	27	leeraut	DM	17	2026-03-31 11:17:45.144845
154	1	1	2026	3	27	geraete	DM	17	2026-03-31 11:17:45.326338
155	1	1	2026	3	27	wasser	DM	17	2026-03-31 11:17:45.328177
156	1	1	2026	3	27	umkleide	DM	17	2026-03-31 11:17:45.33068
157	1	1	2026	3	27	sanitaer	DM	17	2026-03-31 11:17:45.332702
158	1	1	2026	3	27	rampen	DM	17	2026-03-31 11:17:45.33425
159	1	1	2026	3	27	wagen	DM	17	2026-03-31 11:17:45.335237
160	1	1	2026	3	28	boeden	DM	17	2026-03-31 11:17:51.503648
161	1	1	2026	3	28	leeraut	DM	17	2026-03-31 11:17:51.507006
162	1	1	2026	3	28	waende	DM	17	2026-03-31 11:17:51.509768
163	1	1	2026	3	28	decken	DM	17	2026-03-31 11:17:51.510252
164	1	1	2026	3	28	abfall	DM	17	2026-03-31 11:17:51.510762
165	1	1	2026	3	28	regal	DM	17	2026-03-31 11:17:51.510795
166	1	1	2026	3	28	geraete	DM	17	2026-03-31 11:17:51.694659
167	1	1	2026	3	28	umkleide	DM	17	2026-03-31 11:17:51.696193
168	1	1	2026	3	28	wasser	DM	17	2026-03-31 11:17:51.69722
169	1	1	2026	3	28	sanitaer	DM	17	2026-03-31 11:17:51.700081
170	1	1	2026	3	28	rampen	DM	17	2026-03-31 11:17:51.700997
171	1	1	2026	3	28	wagen	DM	17	2026-03-31 11:17:51.701871
\.


--
-- Data for Name: responsibilities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.responsibilities (id, market_id, department, responsible_name, responsible_phone, deputy_name, deputy_phone, sort_order, year, created_at, updated_at) FROM stdin;
91	1	Marktleitung / Betreiber	Frau Leyer	0176/61703866	Frau Landherr	0160/6392521	1	2026	2026-03-24 07:50:58.553869	2026-03-24 07:50:58.553869
92	1	HACCP- bzw. Hygiene-Beauftragter	Herr Huber	s.o.	Frau Landherr	s.o.	2	2026	2026-03-24 07:50:58.553869	2026-03-24 07:50:58.553869
93	1	Fleisch und Wurst	Herr Wurth	0176/83800179	Fr. Glossner	0173/6420766	3	2026	2026-03-24 07:50:58.553869	2026-03-24 07:50:58.553869
94	1	Molkereiprodukte und Feinkost	Fr. Schuster	0162/5445376	Fr. Sarilenya	0160/87030 33	4	2026	2026-03-24 07:50:58.553869	2026-03-24 07:50:58.553869
95	1	(MSC) Fisch	\N	\N	\N	\N	5	2026	2026-03-24 07:50:58.553869	2026-03-24 07:50:58.553869
96	1	Obst und Gemüse	Fr. Leyer	s.o.	Fr. Landherr	s.o.	6	2026	2026-03-24 07:50:58.553869	2026-03-24 07:50:58.553869
97	1	Backshop	\N	\N	\N	\N	7	2026	2026-03-24 07:50:58.553869	2026-03-24 07:50:58.553869
98	1	Kühl- und Tiefkühlware	Fr. Leyer	s.o.	Fr. Landherr	s.o.	8	2026	2026-03-24 07:50:58.553869	2026-03-24 07:50:58.553869
99	1	Trockensortiment	Fr. Leyer	s.o.	Fr. Landherr	s.o.	9	2026	2026-03-24 07:50:58.553869	2026-03-24 07:50:58.553869
100	1	Freiverkäufliche Arzneimittel	Fr. Leyer	s.o.	Fr. Landherr	s.o.	10	2026	2026-03-24 07:50:58.553869	2026-03-24 07:50:58.553869
\.


--
-- Data for Name: rezeptur_kategorien; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rezeptur_kategorien (id, tenant_id, name, sort_order, created_at) FROM stdin;
1	1	Bratwurst	10	2026-03-25 07:30:20.893267
2	1	Salate	20	2026-03-25 07:48:21.332323
\.


--
-- Data for Name: rezepturen; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rezepturen (id, tenant_id, kategorie_id, name, plu, naehrwerte, zutaten_text, zutatenverzeichnis, allergene, allergene_spuren, herstellungsablauf, bild_dateiname, rezeptur_datum, ersetzt_datum, sort_order, created_at) FROM stdin;
1	1	1	Knoblauchbratwurst	\N	Gesamtgewicht: 2,653 kg\nEnergie: 6.380 kcal (= 26.798 kJ)\nFett: 493 g\nKohlenhydrate: 35 g\nNetto-KH: 31 g\nEiweiss: 462 g\nBallaststoffe: 4 g\nZucker: 9,7 g\nSalz: 31,0 g	1500g Schweinehals\n1000g Schweinebauch\n70g Knoblauch frisch\n45g Kochsalz\n6g Pfeffer schwarz\n2g Muskat\n8g Paprika edelsuss\n10g Kutterhilfsmittel\n12g Knoblauchgranulat	\N	\N	\N	Schweinebauch und Schweineschulter wolfen\nDanach die Gewuerze und den klein geschnittenen Knoblauch untermengen und ca 10min kneten\nbis eine bindige Masse entsteht\nDanach die Masse in Schweinedaerme\nKaliber 28/30 oder 30/32 fuellen\nWenn man sie Bruehen will, 30min bei 78 Grad\nDanach in kaltem Wasser abkuehlen	Knoblauchbratwurst_1_1774423421638.jpg	\N	\N	10	2026-03-25 07:30:20.930572
2	1	1	Kokos-Paprika Bratwurst	\N	Gesamtgewicht: 3,106 kg\nEnergie: 6.738 kcal (= 28.299 kJ)\nFett: 516 g\nKohlenhydrate: 49 g\nNetto-KH: 13 g\nEiweiss: 485 g\nBallaststoffe: 35 g\nZucker: 41,9 g\nSalz: 33,4 g	1,5 kg Schweinenacken\n1,0 kg Schweinebauch\n50g Kochsalz\n6g Pfeffer schwarz\n10g Paprika edelsuss\n2g Muskat\n8g Knoblauchgranulat\n10g Kutterhilfsmittel\n120g Kokosraspeln\n400g Paprika frisch	\N	\N	\N	Schweinebauch und Schweinenacken wolfen\nGewuerze zum Fleisch geben und zu einer bindigen Masse kneten. Zum Schluss Paprika untermengen\nDanach die Masse in Schweinedaerme\nKaliber 28/30 oder 30/32 fuellen\nWenn man sie Bruehen will, 30min bei 78 Grad\nDanach in kaltem Wasser abkuehlen	KOKOS-PAPRIKA_Bratwurst_1_1774423421640.jpg	\N	\N	20	2026-03-25 07:30:20.930572
3	1	1	Kraeuterbratwurst	\N	Naehrwertangabe je 100g\nEnergie: 234,20 kcal / 960,22 kJ\nFett: 18,31 g\nEiweiss: 17,16 g\nKohlenhydrate: 0,59 g\ndavon Zucker: 0,48 g\nSalz: 1,23 g	1000g Schweinebauch\n1500g Schweinehals\n50g Kochsalz\n6g Pfeffer weiss\n8g Zwiebelpulver\n2g Muskat\n0,5g Kardamom\n2 x 55g (8 Gartenhauser TK)\n10g Salat Krauter getrocknet\n10g Kutterhilfsmittel	\N	\N	\N	Schweinebauch und Schweinehals wolfen\nDanach die Gewuerze unter das gewolfte Fleisch mengen und zu einer bindigen Masse kneten\nDanach die Masse in Schweinedaerme Kaliber 28/30 oder 30/32 fuellen	Kräuterbratwurst_1_1774423421642.jpg	\N	\N	30	2026-03-25 07:30:20.930572
4	1	1	Mango-Curry Bratwurst	\N	Gesamtgewicht: 2,800 kg\nEnergie: 6.438 kcal (= 27.038 kJ)\nFett: 495 g\nKohlenhydrate: 46 g\nNetto-KH: 38 g\nEiweiss: 460 g\nBallaststoffe: 8 g\nZucker: 39,8 g\nSalz: 33,8 g	1500g Schweinehals\n1000g Schweinebauch\n1 grosse Mango\n50g Kochsalz\n6g Pfeffer schwarz\n8g Knoblauchgranulat\n8g Paprika edelsuss\n2g Muskat\n16g Currypulver\n10g Kutterhilfsmittel	\N	\N	\N	Schweinebauch und Schweinenacken wolfen\nMango schaelen und in kleine Stuecke schneiden\nGewuerze mit dem Fleisch vermengen und zu einer bindigen Masse kneten\nDanach die klein geschnittene Mango unterruehren\nDanach die Masse in Schweinedaerme\nKaliber 30/32 fuellen\nWenn man sie Bruehen will, 30min bei 78 Grad\nDanach in kaltem Wasser abkuehlen	Mango-Curry_Bratwurst_1_1774423421642.jpg	\N	\N	40	2026-03-25 07:30:20.930572
5	1	1	Bratwurst Mohn-Marzipan	\N	Naehrwertangabe auf 100g\nEnergie: 296,52 kcal / 1186,1 kJ\nFett: 22,47 g\nEiweiss: 21,13 g\nKohlenhydrate: 3,08 g\ndavon Zucker: 2,94 g\nSalz: 1,09 g	1000g Schweinebauch\n1500g Schweinehals\n45g Kochsalz\n4g Pfeffer weiss\n4g Muskat\n4g Zucker\n3g Kummel gemahlen\n1g Nelken\n10g Kutterhilfsmittel\n200g Marzipan\n50g Mohn geroestet	\N	\N	\N	Schweinebauch und Schweinehals wolfen\nDanach die Gewuerze untermengen und zu einer bindigen Masse kneten\nZum Schluss das Marzipan und den geroesteten Mohn hinzugeben und untermengen\nDanach die Masse in Schweinedaerme\nKaliber 28/30 oder 30/32 fuellen	Marzipan_1_1774423421643.jpg	\N	\N	50	2026-03-25 07:30:20.930572
6	1	1	Merguez	\N	Gesamtgewicht: 2,128 kg\nEnergie: 3.197 kcal (= 13.427 kJ)\nFett: 135 g\nKohlenhydrate: 16 g\nNetto-KH: 11 g\nEiweiss: 478 g\nBallaststoffe: 5 g\nZucker: 10,5 g\nSalz: 46,8 g	1200g Lammkeule\n800g Rindfleisch\n35g Meersalz\n40ml Olivenoel\n5 Stueck Knoblauch Zehen\n10g Paprika rosenscharf\n6g Pfeffer schwarz geschrottet\n4g Pfeffer weiss\n4g Cumin (Kreuzkunmmel)\n4g Chiliflocken\n10g Kutterhilfsmittel	\N	\N	\N	Schweinebauch und Lammfleisch wolfen\nDanach die Gewuerze unter das gewolfte Fleisch mengen und zu einer bindigen Masse kneten\nDanach die Masse in Schafsaitlinge\nKaliber 20/22 fuellen\nWenn man sie Bruehen will, 30min bei 78 Grad\nDanach in kaltem Wasser abkuehlen	Merguez_1_1774423421644.jpg	\N	\N	60	2026-03-25 07:30:20.930572
7	1	1	Bratwurst Nuernberger Art	\N	Gesamtgewicht: 2,591 kg\nEnergie: 6.470 kcal (= 27.173 kJ)\nFett: 483 g\nKohlenhydrate: 15 g\nNetto-KH: 13 g\nEiweiss: 527 g\nBallaststoffe: 2 g\nZucker: 13,3 g\nSalz: 32,9 g	1500g Schweinehals\n1000g Schweinebauch\n50g Kochsalz\n10g Pfeffer schwarz\n5g Muskat\n5g Ingwer\n5g Majoran\n2,5g Piment\n2,5g Zwiebelpulver\n10g Kutterhilfsmittel	\N	\N	\N	Schweinehals und Schweinebauch wolfen\nDann die Gewuerze zum gewolften Fleisch geben und zu einer bindigen Masse kneten\nMasse in Schafsaitlinge fuellen\nDanach die rohen Wurste 30 min bei 78 Grad Bruehen\nDanach im kalten Wasser abkuehlen lassen	Nürnberger_1_1774423421645.jpg	\N	\N	70	2026-03-25 07:30:20.930572
8	1	1	Bratwurst Old Amsterdam	\N	Gesamtgewicht: 3,181 kg\nEnergie: 8.035 kcal (= 33.746 kJ)\nFett: 622 g\nKohlenhydrate: 15 g\nNetto-KH: 13 g\nEiweiss: 604 g\nBallaststoffe: 2 g\nZucker: 11,6 g\nSalz: 42,9 g	1,5 kg Schweinenacken\n600g Old Amsterdam\n1,0 Schweinebauch\nGewuerze auf 2,5kg Masse\n45g Kochsalz\n5 g Pfeffer weiss\n10g KHM\n5g Zucker\n4g Paprika edelsuss\n2g Muskat\n2g Senfmehl\n4g Knoblauchgranulat\n1,5g Koriander\n1,5g Kreuzkunmmel	\N	\N	\N	Schweinebauch und Schweinenacken wolfen\nDanach die Gewuerze untermengen und ca 10min kneten\nbis eine bindige Masse entsteht\nDanach den grob geriebenen Old Amsterdam unterruehren\nDanach die Masse in Schweinedaerme\nKaliber 28/30 oder 30/32 fuellen\nWenn man sie Bruehen will, 30min bei 78 Grad\nDanach in kaltem Wasser abkuehlen	Old_Amsterdam_1_1774423421645.jpg	\N	\N	80	2026-03-25 07:30:20.930572
9	1	1	Orangen-Pfeffer Bratwurst	\N	Gesamtgewicht: 2,587 kg\nEnergie: 5.200 kcal (= 21.841 kJ)\nFett: 358 g\nKohlenhydrate: 12 g\nNetto-KH: 12 g\nEiweiss: 488 g\nBallaststoffe: 1 g\nZucker: 11,3 g\nSalz: 21,2 g	1,5 kg Schweinenacken\n1,0 kg Schweinebauch\n45g Kochsalz\n5g Pfeffer weiss\n4g Muskat\n2g Ingwer\n1g Kardamom\n10g Pfefferkörner (bunt)\nOrangen Abrieb einer Bio Orange\nSaft einer Bio Orange	\N	\N	\N	Schweinebauch und Schweinenacken wolfen\nGewuerze zum Fleisch geben + Orangen Abrieb einer Orange + Saft und kneten, bis eine bindige Masse entsteht\nDanach die Masse in Schweinedaerme\nKaliber 28/30 oder 30/32 fuellen\nWenn man sie Bruehen will, 30min bei 78 Grad\nDanach in kaltem Wasser abkuehlen	Orangen-Pfeffer_Bratwurst_1_1774423421646.jpg	\N	\N	90	2026-03-25 07:30:20.930572
10	1	1	Pfifferlingsbratwurst	\N	Gesamtgewicht: 2,622 kg\nEnergie: 4.728 kcal (= 19.859 kJ)\nFett: 349 g\nKohlenhydrate: 18 g\nNetto-KH: -4 g\nEiweiss: 384 g\nBallaststoffe: 22 g\nZucker: 13,0 g\nSalz: 35,3 g	1,5 kg Schweinenacken\n1,0 kg Schweinebauch\n500g Pfifferlinge\n30g Schnittlauch\n50g Kochsalz\n8g Pfeffer schwarz\n8g Zwiebelpulver\n6g Paprika edelsuss\n2g Muskat\n1g Ingwer\n0,5g Kardamom\n6g Knoblauchgranulat\n10g Kutterhilfsmittel	\N	\N	\N	Schweinebauch und Schweinenacken wolfen\nGewuerze zum Fleisch geben und zu einer bindigen Masse kneten. Zum Schluss Pfifferlinge und Schnittlauch untermengen\nDanach die Masse in Schweinedaerme\nKaliber 28/30 oder 30/32 fuellen\nWenn man sie Bruehen will, 30min bei 78 Grad\nDanach in kaltem Wasser abkuehlen	Pfifferlingsbratwurst_1_1774423421646.jpg	\N	\N	100	2026-03-25 07:30:20.930572
11	1	1	Pizzabratwurst	\N	Gesamtgewicht: 3,329 kg\nEnergie: 8.012 kcal (= 33.652 kJ)\nFett: 621 g\nKohlenhydrate: 17 g\nNetto-KH: 9 g\nEiweiss: 601 g\nBallaststoffe: 7 g\nZucker: 14,5 g\nSalz: 45,4 g	1,5 kg Schweinenacken\n1,0 kg Schweinebauch\n200g Salami\n150g Champignons\n400g Kaese (Gouda)\n45g Kochsalz\n6g Pfeffer weiss\n8g Zwiebelpulver\n6g Paprika edelsuss\n1,5g Muskat\n1g Ingwer\n0,5g Kardamom\n10g Kutterhilfsmittel\n25g Pizzagewuerz\n20g Paprikaflocken rot\n20g Paprikaflocken gruen	\N	\N	\N	Schweinebauch und Schweinenacken wolfen\nDanach die Gewuerze untermengen und ca 10min kneten\nbis eine bindige Masse entsteht\nZum Schluss, Paprikaflocken rot und gruen, Salami, Kaese, Champignons untermengen\nDanach die Masse in Schweinedaerme\nKaliber 28/30 oder 30/32 fuellen\nWenn man sie Bruehen will, 30min bei 78 Grad\nDanach in kaltem Wasser abkuehlen	Pizzabratwurst_1_1774423421647.jpg	\N	\N	110	2026-03-25 07:30:20.930572
12	1	1	Rentier Bratwurst	\N	Gesamtgewicht: 2,576 kg\nEnergie: 3.906 kcal (= 16.404 kJ)\nFett: 212 g\nKohlenhydrate: 8 g\nNetto-KH: 5 g\nEiweiss: 494 g\nBallaststoffe: 3 g\nZucker: 7,4 g\nSalz: 32,5 g	2000g Rentier (Keule)\n500g Schweinebauch\n50g Kochsalz\n6g Pfeffer schwarz\n4g Thymian\n4g Majoran\n4g Zitrone-Pfeffer\n10g Kutterhilfsmittel	\N	\N	\N	Schweinebauch und Rentier Fleisch wolfen\nDanach die Gewuerze unter das gewolfte Fleisch mengen und zu einer bindigen Masse kneten\nDanach die Masse in Schweinedaerme\nKaliber 28/30 oder 30/32 fuellen\nWenn man sie Bruehen will, 30min bei 78 Grad\nDanach in kaltem Wasser abkuehlen	Rentier_Bratwurst_1_1774423421647.jpg	\N	\N	120	2026-03-25 07:30:20.930572
13	1	1	Rosenkohlbratwurst	\N	Gesamtgewicht: 3,287 kg\nEnergie: 6446 kcal (= 27072 kJ)\nFett: 494g\nKohlenhydrate: 26 g\nNetto-KH: 3g\nEiweiss: 483 g\nBallaststoffe: 28\nZucker: 19,3 g\nSalz: 57,6g	1500g Schweinehals\n1000g Schweinebauch\n3g Kummel gemahlen\n6g Knoblauchgranulat\n6g Majoran\n10g KHM\n2g Muskat\n2g Zwiebelpulver\n45g Kochsalz\n700g Rosenkohl	\N	\N	\N	Fleisch wolfen\nRosenkohl kochen und klein schneiden\nRosenkohl mit einer Prise Kreuzkunmmel, Majoran und Thymian wuerzen\nGewuerze zum Fleisch geben und richtig vermengen, bis eine bindige Masse entsteht\nZum Schluss den Rosenkohl unterheben\nAlles in Schweinedaerme Kaliber 30/32 fuellen	Rosenkohlbratwurst_1_1774423421648.jpg	\N	\N	130	2026-03-25 07:30:20.930572
14	1	1	Roestzwiebel-Kaese Bratwurst	\N	Gesamtgewicht: 3,079 kg\nEnergie: 8.115 kcal (= 34.081 kJ)\nFett: 606 g\nKohlenhydrate: 48 g\nNetto-KH: 8 g\nEiweiss: 625 g\nBallaststoffe: 39 g\nZucker: 36,5 g\nSalz: 38,7 g	1500g Schweinehals\n1000g Schweinebauch\n100g Roestzwiebeln\n400g Gouda\n45g Kochsalz\n10g Kutterhilfsmittel\n6g Pfeffer schwarz\n8g Knoblauchgranulat\n8g Paprika edelsuss\n2g Muskat	\N	\N	\N	Schweinebauch und Schweinenacken wolfen\nGewuerze mit dem Fleisch vermengen und zu einer bindigen Masse kneten\nZum Schluss Roestzwiebeln und Kaese untermengen\nDanach die Masse in Schweinedaerme\nKaliber 30/32 fuellen\nWenn man sie Bruehen will, 30min bei 78 Grad\nDanach in kaltem Wasser abkuehlen	Röstzwiebel-Käse_1_1774423421648.jpg	\N	\N	140	2026-03-25 07:30:20.930572
15	1	1	Rote Bete Feta Bratwurst	\N	Gesamtgewicht: 2,932 kg\nEnergie: 6.762 kcal (= 28.399 kJ)\nFett: 501 g\nKohlenhydrate: 26 g\nNetto-KH: 18 g\nEiweiss: 547 g\nBallaststoffe: 9 g\nZucker: 25,4 g\nSalz: 36,4 g	1,5 kg Schweinenacken\n1,0 kg Schweinebauch\n250g rote Bete\n100g Feta\n50g Kochsalz\n6g Pfefferkoerner schwarz\n3g Muskat\n10g Kutterhilfsmittel\n3g Ingwer\n6g Thymian\n4g Pfeffer schwarz	\N	\N	\N	Schweinebauch, Schweinenacken und rote Bete wolfen\nGewuerze zum Fleisch geben und zu einer bindigen Masse kneten\nZum Schluss den Feta Kaese untermengen\nDanach die Masse in Schweinedaerme\nKaliber 28/30 oder 30/32 fuellen\nWenn man sie Bruehen will, 30min bei 78 Grad\nDanach in kaltem Wasser abkuehlen	Rote_Bete_Feta_Bratwurst_1_1774423421648.jpg	\N	\N	150	2026-03-25 07:30:20.930572
16	1	1	Salsiccia	\N	Gesamtgewicht: 2,586 kg\nEnergie: 6.482 kcal (= 27.226 kJ)\nFett: 484 g\nKohlenhydrate: 14 g\nNetto-KH: 9 g\nEiweiss: 528 g\nBallaststoffe: 5 g\nZucker: 12,8 g\nSalz: 56,0 g	1500g Schweinehals\n1000g Schweinebauch\n44g Meersalz\n10g Fenchelsaat geschrottet\n10g Pfeffer schwarz\n2,5g Pfeffer weiss\n2,5g Koriander gemahlen\n2,5g Paprika rosenscharf\n2,5g Muskat\n10g Kutterhilfsmittel	\N	\N	\N	Schweinebauch und Schweinenacken wolfen\nGewuerze mit dem Fleisch vermengen und zu einer bindigen Masse kneten\nKaliber 30/32 fuellen\nWenn man sie Bruehen will, 30min bei 78 Grad\nDanach in kaltem Wasser abkuehlen	Salsiccia_1_1774423421649.jpg	\N	\N	160	2026-03-25 07:30:20.930572
17	1	1	Scharfe Chipolata	\N	Gesamtgewicht: 2,584 kg\nEnergie: 6.499 kcal (= 27.297 kJ)\nFett: 486 g\nKohlenhydrate: 15 g\nNetto-KH: 8 g\nEiweiss: 528 g\nBallaststoffe: 7 g\nZucker: 12,5 g\nSalz: 28,2 g	1500g Schweinehals\n1000g Schweinebauch\n38g Kochsalz\n7g Muskat\n8g Koriander\n10g Pfeffer schwarz\n4g Chiliflocken\n4g mexikanisches Chilipulver\n3g Habanero Pulver\n10g Kutterhilfsmittel	\N	\N	\N	Schweinebauch und Schweinenacken wolfen\nGewuerze mit dem Fleisch vermengen und zu einer bindigen Masse kneten\nDanach die Masse in Schafsaitlinge\nKaliber 20/22 fuellen\nCa: 6cm Laenge\nWenn man sie Bruehen will, 30min bei 78 Grad\nDanach in kaltem Wasser abkuehlen	Scharfe_Chipolata_1_1774423421649.jpg	\N	\N	170	2026-03-25 07:30:20.930572
18	1	1	Bratwurst Schnittlauch-Ei	\N	Gesamtgewicht: 3254 g\nEnergie: 7240 kcal\nFett: 559g\nKohlenhydrate: 28g\nZucker: 22g\nBallaststoffe: 16g\nSalz: 34g	1500g Schweinehals\n1000g Schweinebauch\n50g Kochsalz\n6g Pfeffer weiss\n4g Muskat\n6g Knoblauchgranulat\n8g Paprika edelsuss\n10g Kutterhilfsmittel\n10 Stueck abgekochte Eier\n50g Schnittlauch frisch\n30g getrocknete Zwiebeln	\N	\N	\N	Schweinehals und Schweinebauch wolfen\nDanach die Gewuerze und die Zwiebeln unter das gewolfte Fleisch mengen und zu einer bindigen Masse kneten\nEi mit dem Eierschneider schneiden in kleine Wuerfel\nZum Schluss das Ei und den Schnittlauch unter das Fleisch mengen\nDanach die Masse in Schweinedaerme Kaliber 30/32 fuellen	Schnittlauch-Ei_1_1774423421649.jpg	\N	\N	180	2026-03-25 07:30:20.930572
19	1	1	Seelachsbratwurst	\N	Gesamtgewicht: 1,215 kg\nEnergie: 1.698 kcal (= 7.132 kJ)\nFett: 145 g\nKohlenhydrate: 21 g\nNetto-KH: 18 g\nEiweiss: 80 g\nBallaststoffe: 3 g\nZucker: 19,8 g\nSalz: 76,7 g	700g Seelachsfilet\n300g Sahne\n18g Kochsalz\n3g Pfeffer schwarz\n1,5g Fenchelsamen\n10g Schnittlauch\n10g Dill\n10g Petersilie	\N	\N	\N	Seelachsfilet in kleine Stuecke schneiden\nSeelachsfilet und die Gewuerze in den Mixer geben und klein mixen\nDanach die Sahne (am besten kurz in den Frost stellen) hinzufuegen und unter mixen\nZum Schluss den Dill, Petersilie und Schnittlauch untermengen\nMasse in Schafsaitlinge fuellen\nDanach die rohen Wurste 30min bei 78 Grad Bruehen\nDanach im kalten Wasser abkuehlen lassen	Seelachsbratwurst_1_1774423421649.jpg	\N	\N	190	2026-03-25 07:30:20.930572
20	1	1	Sesam Bratwurst	\N	Gesamtgewicht: 2,641 kg\nEnergie: 6.860 kcal (= 28.813 kJ)\nFett: 521 g\nKohlenhydrate: 16 g\nNetto-KH: 9 g\nEiweiss: 539 g\nBallaststoffe: 8 g\nZucker: 8,2 g\nSalz: 30,9 g	1500g Schweinehals\n1000g Schweinebauch\n70g geroesteten Sesam\n45g Kochsalz\n4g Pfeffer weiss\n4g Muskat\n4g Zucker\n3g Kummel gemahlen\n1g Nelken\n10g Kutterhilfsmittel	\N	\N	\N	Schweinehals und Schweinebauch wolfen\nDann die Gewuerze und den geroesteten Sesam zugeben und zu einer bindigen Masse kneten\nMasse in Schafsaitlinge fuellen\nDanach die rohen Wurste 30min bei 78 Grad Bruehen\nDanach im kalten Wasser abkuehlen lassen	Sesam_Bratwurst_1_1774423421649.jpg	\N	\N	200	2026-03-25 07:30:20.930572
21	1	1	Spekulatius Bratwurst	\N	Gesamtgewicht: 2,784 kg\nEnergie: 7.245 kcal (= 30.427 kJ)\nFett: 544 g\nKohlenhydrate: 126 g\nNetto-KH: 117 g\nEiweiss: 473 g\nBallaststoffe: 9 g\nZucker: 57,0 g\nSalz: 33,2 g	1500g Schweinehals\n1000g Schweinebauch\n200g Spekulatius\n5g Spekulatius Gewuerz\n50g Kochsalz\n6g Pfeffer schwarz\n8g Knoblauchgranulat\n8g Paprika edelsuss\n2g Muskat\n10g Kutterhilfsmittel	\N	\N	\N	Schweinebauch und Schweinenacken wolfen\nDanach die Gewuerze unter das gewolfte Fleisch mengen und zu einer bindigen Masse kneten\nZum Schluss den klein gehackten Spekulatius untermischen\nDanach die Masse in Schweinedaerme\nKaliber 30/32 fuellen\nWenn man sie Bruehen will, 30min bei 78 Grad\nDanach in kaltem Wasser abkuehlen	Spekulatius_Bratwurst_1_1774423446749.jpg	\N	\N	210	2026-03-25 07:37:30.96937
22	1	1	Spinat-Halloumi Bratwurst	\N	Gesamtgewicht: 3,030 kg\nEnergie: 7.622 kcal (= 32.012 kJ)\nFett: 573 g\nKohlenhydrate: 12 g\nNetto-KH: 5 g\nEiweiss: 614 g\nBallaststoffe: 7 g\nZucker: 10,2 g\nSalz: 33,4 g	1500g Schweinehals\n1000g Schweinebauch\n150g Spinat\n300g Halloumi Kaese\n45 g Kochsalz\n10g Pfeffer schwarz grob\n4g Senfkoerner\n3g Muskat\n1,5g Ingwer\n3g Koriander\n3g Thymian\n10g Kutterhilfsmittel	\N	\N	\N	Schweinebauch und Schweinenacken wolfen\nSpinat und Halloumi klein schneiden\nGewuerze mit dem Fleisch vermengen und zu einer bindigen Masse kneten\nDanach den Spinat und Halloumi Kaese unterruehren\nDanach die Masse in Schweinedaerme\nKaliber 30/32 fuellen\nWenn man sie Bruehen will, 30min bei 78 Grad\nDanach in kaltem Wasser abkuehlen	Spinat-Halloumi_Bratwurst_1_1774423446749.jpg	\N	\N	220	2026-03-25 07:37:30.96937
23	1	1	Bratwurst mit Spitzkohl	\N	Gesamtgewicht: 3584g\nEnergie: 6640kcal\nFett: 511g\nKohlenhydrate: 47g\nZucker: 31g\nBallaststoffe: 21g\nSalz: 36g	1500g Schweinehals\n1000g Schweinebauch\n1000g Spitzkohl\n4g Pfeffer weiss\n4g Muskat\n4g Ingwer\n2g Kummel gemahlen\n1g Nelken gemahlen\n4g Zucker\n10g Kutterhilfsmittel\nBisschen Sojasosse	\N	\N	\N	Spitzkohl klein schneiden und in einer Pfanne mit einem Spritzer Sojasosse und einer Prise Pfeffer anduensten\nSchweinehals und Schweinebauch wolfen\nGewuerze zum Fleisch geben und zu einer bindigen Masse kneten\nZum Schluss Spitzkohl zugeben und unterheben\nDie Masse in Schweinedaerme Kaliber 30/32 fuellen	Spitzkohl_1_1774423446750.jpg	\N	\N	230	2026-03-25 07:37:30.96937
24	1	1	Bratwurst Thueringer Art	\N	Gesamtgewicht: 2,599 kg\nEnergie: 5.880 kcal (= 24.698 kJ)\nFett: 439 g\nKohlenhydrate: 20 g\nNetto-KH: 16 g\nEiweiss: 473 g\nBallaststoffe: 4 g\nZucker: 10,2 g\nSalz: 33,0	1,5 kg Schweinenacken\n1,0 kg Schweinebauch\nGewuerze auf 2,5kg Masse\n50 g Kochsalz\n10 g Pfeffer schwarz\n2,5 g Kummel gemahlen\n8g Kummel ganz\n8g Muskat\n2g Zwiebelpulver\n8g Knoblauchgranulat\n10g KHM	\N	\N	\N	Schweinebauch und Schweinenacken wolfen\nDanach die Gewuerze untermengen und ca 10min kneten\nbis eine bindige Masse entsteht\nDanach die Masse in Schweinedaerme\nKaliber 28/30 oder 30/32 fuellen\nWenn man sie Bruehen will, 30min bei 78 Grad\nDanach in kaltem Wasser abkuehlen	Thüringer_Bratwurst_1_1774423446750.jpg	\N	\N	240	2026-03-25 07:37:30.96937
25	1	1	Walnuss Bratwurst	\N	Naehrwertangaben auf 100g\nEnergie: 281,54 kcal / 1154,32 kJ\nFett: 23,35 g\nKohlenhydrate: 0,96 g\ndavon Zucker: 0,71 g\nEiweiss: 17,49 g\nSalz: 1,11 g	1000g Schweinebauch\n1500g Schweinehals\n45g Kochsalz\n8g Pfeffer weiss\n4g Muskat\n8g Knoblauchgranulat\n6g Kummel gemahlen\n20g Walnussoel\n200g Walnuesse\n10g Kutterhilfsmittel	\N	\N	\N	Schweinebauch und Schweinehals wolfen\nDanach Gewuerze untermengen und zu einer bindigen Masse kneten\nDanach die Masse in Schweinedaerme Kaliber 28/30 oder 30/32 fuellen	Walnuss_1_1774423446751.jpg	\N	\N	250	2026-03-25 07:37:30.96937
26	1	1	Welsbratwurst	\N	Gesamtgewicht: 1.023 kg\nEnergie: 1652 kcal (= 6938 kJ)\nFett: 113 g\nKohlenhydrate: 5 g\nNetto-KH: 4 g\nEiweiss: 155 g\nBallaststoffe: 1g\nZucker: 5,0 g\nSalz: 10,7 g	1,000kg Welsfilet\n10g Meersalz\n4g Pfeffer weiss\n1 TL Majoran\n2 TL Petersilie getrocknet\n1 TL Dill getrocknet\n1 TL Zitronensaft\nUnd Abrieb einer halben Zitrone	\N	\N	\N	Welsfilet wolfen\nGewuerze zugeben und ordentlich vermengen\nIn Schafsaitlinge fuellen	Welsbratwurst_1_1774423446751.jpg	\N	\N	260	2026-03-25 07:37:30.96937
27	1	1	Wildschweinbratwurst	\N	Gesamtgewicht: 2,595 kg\nEnergie: 3.898 kcal (= 16.371 kJ)\nFett: 215 g\nKohlenhydrate: 19 g\nNetto-KH: 15 g\nEiweiss: 474 g\nBallaststoffe: 4 g\nZucker: 12,5 g\nSalz: 31,6 g	2000g Wildschweinkeule\n500g Schweinebauch\n45g Kochsalz\n6g Thymian\n6g Rosmarin\n14g Knoblauchgranulat\n8g Pfeffer schwarz\n4g Paprika rosenscharf\n2g Nelke\n2g Muskat\n10g Kutterhilfsmittel	\N	\N	\N	Schweinebauch und Wildschwein Keule wolfen\nDanach die Gewuerze unter das gewolfte Fleisch mengen und zu einer bindigen Masse kneten\nDanach die Masse in Schafsaitlinge\nKaliber 20/22 fuellen\nWenn man sie Bruehen will, 30min bei 78 Grad\nDanach in kaltem Wasser abkuehlen	Wildschweinbratwurst_1_1774423446752.jpg	\N	\N	270	2026-03-25 07:37:30.96937
28	1	1	Zimtbratwurst	\N	Gesamtgewicht: 2,600 kg\nEnergie: 6.522 kcal (= 27.391 kJ)\nFett: 482 g\nKohlenhydrate: 27 g\nNetto-KH: 20 g\nEiweiss: 528 g\nBallaststoffe: 7 g\nZucker: 22,1 g\nSalz: 31,0 g	1500g Schweinehals\n1000g Schweinebauch\n45g Kochsalz\n6g Pfeffer schwarz\n8g Knoblauchgranulat\n8g Paprika edelsuss\n2g Muskat\n10g Kutterhilfsmittel\n15g Zimt\n6g Zucker	\N	\N	\N	Schweinebauch und Schweinenacken wolfen\nGewuerze mit dem Fleisch vermengen und zu einer bindigen Masse kneten\nDanach die Masse in Schweinedaerme\nKaliber 30/32 fuellen\nWenn man sie Bruehen will, 30min bei 78 Grad\nDanach in kaltem Wasser abkuehlen	Zimtbratwurst_1_1774423446753.jpg	\N	\N	280	2026-03-25 07:37:30.96937
29	1	1	Zwiebel-Pfeffer Bratwurst	\N	Gesamtgewicht: 2,687 kg\nEnergie: 6.457 kcal (= 27.119 kJ)\nFett: 493 g\nKohlenhydrate: 47 g\nNetto-KH: 9 g\nEiweiss: 467 g\nBallaststoffe: 37 g\nZucker: 38,8 g\nSalz: 31,2 g	1500g Schweinehals\n1000g Schweinebauch\n100g getrocknete Zwiebel\n20g gruene eingelegte Pfefferkoerner\n45g Kochsalz\n5g Pfeffer weiss\n2g Ingwer\n4g Muskat\n1g Kardamom\n10g Kutterhilfsmittel	\N	\N	\N	Schweinebauch und Schweinenacken wolfen\nGewuerze mit dem Fleisch vermengen und zu einer bindigen Masse kneten\nDanach die Masse in Schweinedaerme\nKaliber 30/32 fuellen\nWenn man sie Bruehen will, 30min bei 78 Grad\nDanach in kaltem Wasser abkuehlen	Zwiebel-Pfeffer_Bratwurst_1_1774423446756.jpg	\N	\N	290	2026-03-25 07:37:30.96937
30	1	1	Bratwurst Arizona Style	\N	\N	1500g Schweinehals\n1000g Schweinebauch\n40g Kochsalz\n10g Kutterhilfsmittel\n50g Arizona Gewürzmischung	\N	\N	\N	1. Arizona Gewürzmischung herstellen: 2TL Chilipulver, 2TL Knoblauchgranulat, 2TL Paprika rosenscharf, 2TL Meersalz fein, 1TL Koriander Blatt, 1TL Kreuzkümmel gemahlen, 1TL Pfeffer schwarz\n2. Schweinebauch und Schweinehals wolfen\n3. Danach mit den Gewürzen vermengen und zu einer bindigen Masse kneten\n4. Masse in Schafsaitlinge Kaliber 20/22 füllen	Arizona_1_1774425529830.jpg	\N	\N	30	2026-03-25 08:04:30.992024
31	1	1	Bratwurst Asia Style	\N	Gesamtgewicht: 2,955 kg | Energie: 7.038 kcal (29.558 kJ) | Fett: 488 g | Kohlenhydrate: 88 g | Netto-KH: 55 g | Eiweiß: 582 g | Ballaststoffe: 34 g | Zucker: 13,2 g | Salz: 31,6 g	1500g Schweinehals\n1000g Schweinebauch\n1 Glas Mongobohnenkeimlinge 175g ATG\n1 Glas feines Chinagemüse 175g ATG\n45g Kochsalz\n4g Pfeffer weiß\n4g Muskat\n3g Kümmel gemahlen\n1g Nelken\n22g Chinagewürz\n16g Sojasoße\n10g Kutterhilfsmittel	\N	\N	\N	1. Schweinebauch und Schweinenacken wolfen\n2. Gewürze und die Sojasoße mit dem Fleisch vermengen und zu einer bindigen Masse kneten\n3. Zum Schluss die Mongobohnenkeimlinge und das Chinagemüse untermengen\n4. Kaliber 30/32 füllen\n5. Wenn man sie brühen will: 30min bei 78 Grad, danach in kaltem Wasser abkühlen	Asia_Style_1_1774425529832.jpg	\N	\N	31	2026-03-25 08:04:30.992024
32	1	1	Bärlauch Bratwurst	\N	Gesamtgewicht: 2,683 kg | Energie: 6.490 kcal (27.258 kJ) | Fett: 482 g | Kohlenhydrate: 18 g | Netto-KH: 13 g | Eiweiß: 529 g | Ballaststoffe: 5 g | Zucker: 11,5 g | Salz: 31,0 g	1500g Schweinehals\n1000g Schweinebauch\n100g Bärlauch frisch\n45g Kochsalz\n6g Pfeffer schwarz\n12g Knoblauchgranulat\n8g Paprika edelsüss\n2g Muskat\n10g Kutterhilfsmittel	\N	\N	\N	1. Schweinebauch und Schweinenacken wolfen\n2. Bärlauch klein schneiden\n3. Gewürze mit dem Fleisch vermengen und zu einer bindigen Masse kneten\n4. Zum Schluss Bärlauch einengen\n5. Danach die Masse in Schweinedärme, Kaliber 30/32 füllen\n6. Wenn man sie brühen will: 30min bei 78 Grad, danach in kaltem Wasser abkühlen	Bärlauch_Bratwurst_1_1774425529833.jpg	\N	\N	32	2026-03-25 08:04:30.992024
33	1	1	Bayrische Bratwurst	\N	Gesamtgewicht: 3,074 kg | Energie: 7.091 kcal (29.782 kJ) | Fett: 565 g | Kohlenhydrate: 12 g | Netto-KH: 4 g | Eiweiß: 500 g | Ballaststoffe: 9 g | Zucker: 10,3 g | Salz: 32,2 g	1,5 kg Schweinenacken\n1,0 kg Schweinebauch\n250g Sauerkraut gegart\n250g Schweinebauch geräuchert\n40g Kochsalz\n4g Kümmel ganz\n10g Pfefferkörner schwarz\n2,5g Senfkörner\n2,5g Pfeffer weiß\n4g Majoran\n10g Kutterhilfsmittel	\N	\N	\N	1. Schweinebauch und Schweinenacken wolfen\n2. Das gewolfte Fleisch und die Gewürze zu einer bindigen Masse kneten\n3. Den geräucherten Schweinebauch in kleine Würfel schneiden\n4. Sauerkraut und geräucherte Schweinebauchwürfel unter die Masse rühren\n5. Danach die Masse in Schweinedärme, Kaliber 28/30 oder 30/32 füllen\n6. Wenn man sie brühen will: 30min bei 78 Grad, danach in kaltem Wasser abkühlen	Bayrische_Bratwurst_1_1774425529833.jpg	\N	\N	33	2026-03-25 08:04:30.992024
34	1	1	BBQ Bratwurst	\N	Gesamtgewicht: 2,811 kg | Energie: 6.953 kcal (29.201 kJ) | Fett: 542 g | Kohlenhydrate: 32 g | Netto-KH: 23 g | Eiweiß: 498 g | Ballaststoffe: 8 g | Zucker: 22,5 g | Salz: 32,0 g	1500g Schweinehals\n1000g Schweinebauch\n45g Kochsalz\n6g Pfeffer schwarz\n2g Muskat\n20g Paprika rosenscharf\n10g Kutterhilfsmittel\n8g Knoblauchgranulat\n20g Ankerkraut BBQ Gewürz	\N	\N	\N	1. Schweinebauch und Schweineschulter wolfen\n2. Danach die Gewürze untermengen und ca 10min kneten bis eine bindige Masse entsteht\n3. Danach die Masse in Schweinedärme, Kaliber 28/30 oder 30/32 füllen\n4. Wenn man sie brühen will: 30min bei 78 Grad, danach in kaltem Wasser abkühlen	BBQ_Bratwurst_1_1774425529833.jpg	\N	\N	34	2026-03-25 08:04:30.992024
35	1	1	Bratwurst Berliner Art	\N	Gesamtgewicht: 2,571 kg | Energie: 6.475 kcal (27.196 kJ) | Fett: 523 g | Kohlenhydrate: 10 g | Netto-KH: 9 g | Eiweiß: 445 g | Ballaststoffe: 1 g | Zucker: 8,1 g | Salz: 31,1 g	1500g Schweinebauch\n1000g Schweineschulter\n45g Kochsalz\n4g Pfeffer weiß\n4g Muskat\n4g Zucker\n3g Kümmel gemahlen\n1g Nelken\n10g Kutterhilfsmittel	\N	\N	\N	1. Schweinebauch und Schweineschulter wolfen\n2. Danach die Gewürze untermengen und ca 10min kneten bis eine bindige Masse entsteht\n3. Danach die Masse in Schweinedärme, Kaliber 28/30 oder 30/32 füllen\n4. Wenn man sie brühen will: 30min bei 78 Grad, danach in kaltem Wasser abkühlen	Bratwurst_BerlinerArt1_1774425529834.jpg	\N	\N	35	2026-03-25 08:04:30.992024
36	1	1	Bratwurst Cheddar Jalapeno	\N	Gesamtgewicht: 3,165 kg | Energie: 7.959 kcal (33.426 kJ) | Fett: 629 g | Kohlenhydrate: 24 g | Netto-KH: 15 g | Eiweiß: 561 g | Ballaststoffe: 10 g | Zucker: 15,2 g | Salz: 37,9 g	1500g Schweinehals\n1000g Schweinebauch\n400g Cheddar Käse\n150g Jalapeno\n50g Kochsalz\n8g Knoblauchgranulat\n2g Muskat\n8g Paprika rosenscharf\n4g Majoran\n10g Kutterhilfsmittel	\N	\N	\N	1. Schweinebauch und Schweinenacken wolfen\n2. Danach die Gewürze unter das gewolfte Fleisch mengen und zu einer bindigen Masse kneten\n3. Cheddar Käse und Jalapenos in kleine Würfel schneiden\n4. Cheddar und Jalapenos unter die Masse rühren\n5. Danach die Masse in Schweinedärme, Kaliber 30/32 füllen\n6. Wenn man sie brühen will: 30min bei 78 Grad, danach in kaltem Wasser abkühlen	Bratwurst_Cheddar_Jalapeno_1_1774425529835.jpg	\N	\N	36	2026-03-25 08:04:30.992024
37	1	1	Chili-Schoko Bratwurst	\N	Gesamtgewicht: 3,287 kg | Energie: 6.446 kcal (27.072 kJ) | Fett: 494 g | Kohlenhydrate: 26 g | Netto-KH: 3 g | Eiweiß: 483 g | Ballaststoffe: 28 g | Zucker: 19,3 g | Salz: 57,6 g	1500g Schweinehals\n1000g Schweinebauch\n45g Kochsalz\n4g Pfeffer weiß\n4g Muskat\n4g Zucker\n3g Kümmel gemahlen\n1g Nelken\n10g Kutterhilfsmittel\n200g Zartbitterschokolade\n30g Chiliflocken	\N	\N	\N	1. Fleisch wolfen\n2. Gewürze zum Fleisch geben und richtig vermengen, bis eine bindige Masse entsteht\n3. Zum Schluss die Schokolade und die Chiliflocken untermengen\n4. Alles in Schweinedärme Kaliber 30/32 füllen	Bratwurst_Chili-Schoko_1_1774425529835.jpg	\N	\N	37	2026-03-25 08:04:30.992024
38	1	1	Bratwurst Dukkah	\N	Gesamtgewicht: 2,680 kg | Energie: 7.068 kcal (29.684 kJ) | Fett: 538 g | Kohlenhydrate: 23 g | Netto-KH: 12 g | Eiweiß: 546 g | Ballaststoffe: 11 g | Zucker: 13,3 g | Salz: 29,0 g	1500g Schweinehals\n1000g Schweinebauch\n40g Kochsalz\n10g Kutterhilfsmittel\n70g Dukkah Gewürzmischung	\N	\N	\N	1. Dukkah Gewürzmischung herstellen: 15g Haselnüsse geröstet, 15g Walnüsse geröstet, 15g Pistazien geröstet, 15g Cashew, 30g Pinienkerne geröstet, 1TL Cumin, 1TL Meersalz, 2TL Koriander, 2EL Sesam, 1/2TL Schwarze Pfefferkörner, 1/2TL Thymian, 1/2TL Minze\n2. Schweinebauch und Schweinenacken wolfen\n3. Danach die Gewürze unter das gewolfte Fleisch mengen und zu einer bindigen Masse kneten\n4. Danach die Masse in Schafsaitlinge, Kaliber 20/22 füllen\n5. Wenn man sie brühen will: 30min bei 78 Grad, danach in kaltem Wasser abkühlen	Bratwurst_Dukkah_1_1774425529835.jpg	\N	\N	38	2026-03-25 08:04:30.992024
39	1	1	Bratwurst mit Zitrone	\N	Gesamtgewicht: 2,626 kg | Energie: 6.266 kcal (26.318 kJ) | Fett: 491 g | Kohlenhydrate: 15 g | Netto-KH: 13 g | Eiweiß: 456 g | Ballaststoffe: 2 g | Zucker: 14,9 g | Salz: 32,9 g	1500g Schweinehals\n1000g Schweinebauch\n1 Stück Bio Zitrone\n50g Kochsalz\n6g Pfeffer schwarz\n3g Ingwer\n5g Zucker\n2g Kardamom\n10g Kutterhilfsmittel	\N	\N	\N	1. Schweinebauch und Schweinenacken wolfen\n2. Danach die Gewürze unter das gewolfte Fleisch mengen und zu einer bindigen Masse kneten\n3. Zum Schluss den Zitronenabrieb der Zitrone und den Zitronensaft untermengen\n4. Danach die Masse in Schweinedärme, Kaliber 30/32 füllen\n5. Wenn man sie brühen will: 30min bei 78 Grad, danach in kaltem Wasser abkühlen	Bratwurst_mit_Zitrone_1_1774425529835.jpg	\N	\N	39	2026-03-25 08:04:30.992024
40	1	1	Bratwurst Parmesan-Spinat	\N	Gesamtgewicht: 2,972 kg | Energie: 7.592 kcal (31.885 kJ) | Fett: 598 g | Kohlenhydrate: 11 g | Netto-KH: 7 g | Eiweiß: 555 g | Ballaststoffe: 3 g | Zucker: 8,4 g | Salz: 39,7 g	1500g Schweinehals\n1000g Schweinebauch\n100g Blattspinat\n300g Parmesan\n45g Kochsalz\n5g Pfeffer weiß\n5g Muskat\n3g Zucker\n3g Kümmel gemahlen\n1g Nelken\n10g Kutterhilfsmittel	\N	\N	\N	1. Schweinebauch und Schweineschulter wolfen\n2. Danach die Gewürze untermengen und ca 10min kneten bis eine bindige Masse entsteht\n3. Danach den grob geriebenen Parmesan und den geschnittenen Blattspinat untermengen\n4. Danach die Masse in Schweinedärme, Kaliber 28/30 oder 30/32 füllen\n5. Wenn man sie brühen will: 30min bei 78 Grad, danach in kaltem Wasser abkühlen	Bratwurst_Parmesan-Spinat_1_1774425529836.jpg	\N	\N	40	2026-03-25 08:04:30.992024
41	1	1	Bratwurst pikant & würzig	\N	Gesamtgewicht: 2,648 kg | Energie: 6.486 kcal (27.241 kJ) | Fett: 500 g | Kohlenhydrate: 42 g | Netto-KH: 26 g | Eiweiß: 466 g | Ballaststoffe: 16 g | Zucker: 39,5 g | Salz: 31,1 g	1500g Schweinehals\n1000g Schweinebauch\n45g Kochsalz\n10g Zucker\n10g Pfeffer schwarz\n10g Knoblauchgranulat\n20g Paprika rosenscharf\n30g Paprika edelsüss\n8g Chiliflocken\n2,5g Kreuzkümmel\n2g Ingwer\n10g Majoran\n10g Kutterhilfsmittel	\N	\N	\N	1. Schweinebauch und Schweinenacken wolfen\n2. Danach die Gewürze unter das gewolfte Fleisch mengen und zu einer bindigen Masse kneten\n3. Danach die Masse in Schweinedärme, Kaliber 30/32 füllen\n4. Wenn man sie brühen will: 30min bei 78 Grad, danach in kaltem Wasser abkühlen	Bratwurst_pikant_und_würzig1_1774425529836.jpg	\N	\N	41	2026-03-25 08:04:30.992024
42	1	1	Bratwurst Tomate Mozzarella	\N	Gesamtgewicht: 3,029 kg | Energie: 7.005 kcal (29.419 kJ) | Fett: 541 g | Kohlenhydrate: 38 g | Netto-KH: 21 g | Eiweiß: 504 g | Ballaststoffe: 16 g | Zucker: 32,2 g | Salz: 32,2 g	1500g Schweinehals\n1000g Schweinebauch\n250g getrocknete Tomaten\n200g Mozzarella\n45g Kochsalz\n5g Pfeffer schwarz\n5g Oregano\n2g Muskat\n2g Basilikum\n8g Paprika edelsüss\n2g Nelken\n10g Kutterhilfsmittel	\N	\N	\N	1. Schweinebauch und Schweineschulter wolfen\n2. Danach die Gewürze untermengen und ca 10min kneten bis eine bindige Masse entsteht\n3. Danach die klein geschnittenen Tomaten und den klein geschnittenen Mozzarella untermengen\n4. Danach die Masse in Schweinedärme, Kaliber 28/30 oder 30/32 füllen\n5. Wenn man sie brühen will: 30min bei 78 Grad, danach in kaltem Wasser abkühlen	Bratwurst_Thomate_Mozzarella_1_1774425529836.jpg	\N	\N	42	2026-03-25 08:04:30.992024
43	1	1	Brokkolibratwurst	\N	Gesamtgewicht: 3,092 kg | Energie: 5.970 kcal (25.075 kJ) | Fett: 437 g | Kohlenhydrate: 30 g | Netto-KH: 10 g | Eiweiß: 488 g | Ballaststoffe: 19 g | Zucker: 24,3 g | Salz: 33,5 g	1,5 kg Schweinenacken\n1,0 kg Schweinebauch\n500g Brokkoli\n50g Kochsalz\n8g Pfeffer schwarz\n8g Zwiebelpulver\n6g Paprika edelsüss\n2g Muskat\n1g Ingwer\n0,5g Kardamom\n6g Knoblauchgranulat\n10g Kutterhilfsmittel	\N	\N	\N	1. Schweinebauch und Schweinenacken wolfen\n2. Gewürze zum Fleisch geben und zu einer bindigen Masse kneten, zum Schluss Brokkoli untermengen\n3. Danach die Masse in Schweinedärme, Kaliber 28/30 oder 30/32 füllen\n4. Wenn man sie brühen will: 30min bei 78 Grad, danach in kaltem Wasser abkühlen	Brokkolibratwurst_1_1774425529836.jpg	\N	\N	43	2026-03-25 08:04:30.992024
44	1	1	Feuerwurst	\N	Gesamtgewicht: 2,658 kg | Energie: 6.054 kcal (25.426 kJ) | Fett: 442 g | Kohlenhydrate: 48 g | Netto-KH: 32 g | Eiweiß: 480 g | Ballaststoffe: 16 g | Zucker: 39,9 g | Salz: 33,1 g	1,5 kg Schweinenacken\n1,0 kg Schweinebauch\n50g Kochsalz\n10g Pfeffer schwarz\n10g Zucker\n12g Knoblauchgranulat\n35g Paprika rosenscharf\n15g Paprika edelsüss\n10g Chiliflocken\n4g Kreuzkümmel ganz\n2g Habanero\n10g Kutterhilfsmittel	\N	\N	\N	1. Schweinebauch und Schweinenacken wolfen\n2. Danach die Gewürze untermengen und ca 10min kneten bis eine bindige Masse entsteht\n3. Danach die Masse in Schweinedärme, Kaliber 28/30 oder 30/32 füllen\n4. Wenn man sie brühen will: 30min bei 78 Grad, danach in kaltem Wasser abkühlen	Feuerwurst_1_1774425529837.jpg	\N	\N	44	2026-03-25 08:04:30.992024
45	1	1	Feurige Rindsbratwurst	\N	Gesamtgewicht: 2,615 kg | Energie: 5.258 kcal (22.082 kJ) | Fett: 350 g | Kohlenhydrate: 35 g | Netto-KH: 23 g | Eiweiß: 498 g | Ballaststoffe: 12 g | Zucker: 20,8 g | Salz: 30,8 g	2500g Rindfleisch (nicht zu mager)\n45g Kochsalz\n4g Pfeffer schwarz\n4g Muskat\n4g Zucker\n3g Kümmel gemahlen\n25g Chilipulver\n20g Chiliflocken\n10g Kutterhilfsmittel	\N	\N	\N	1. Rindfleisch wolfen\n2. Danach die Gewürze unter das gewolfte Fleisch mengen und zu einer bindigen Masse kneten\n3. Danach die Masse in Schweinedärme, Kaliber 30/32 füllen\n4. Wenn man sie brühen will: 30min bei 78 Grad, danach in kaltem Wasser abkühlen	Feurige_Rindsbratwurst_1_1774425529837.jpg	\N	\N	45	2026-03-25 08:04:30.992024
46	1	1	Bratwurst Fränkische Art	\N	Gesamtgewicht: 2,581 kg | Energie: 6.424 kcal (26.981 kJ) | Fett: 482 g | Kohlenhydrate: 7 g | Netto-KH: 6 g | Eiweiß: 525 g | Ballaststoffe: 2 g | Zucker: 6,4 g | Salz: 32,9 g	1500g Schweinehals\n1000g Schweinebauch\n50g Kochsalz\n5g Pfeffer schwarz\n3g Ingwer\n3g Muskat\n8g Majoran\n2g Piment\n10g Kutterhilfsmittel	\N	\N	\N	1. Schweinebauch und Schweinenacken wolfen\n2. Gewürze mit dem Fleisch vermengen und zu einer bindigen Masse kneten\n3. Masse in Schweinedärme, Kaliber 30/32 füllen\n4. Wenn man sie brühen will: 30min bei 78 Grad, danach in kaltem Wasser abkühlen	Fränkische_1_1774425529837.jpg	\N	\N	46	2026-03-25 08:04:30.992024
47	1	1	Griechische Bratwurst	\N	Gesamtgewicht: 3,087 kg | Energie: 7.195 kcal (30.218 kJ) | Fett: 574 g | Kohlenhydrate: 14 g | Netto-KH: 6 g | Eiweiß: 502 g | Ballaststoffe: 8 g | Zucker: 8,7 g | Salz: 54,3 g	1,5 kg Schweinenacken\n1,0 kg Schweinebauch\n250g Feta\n250g grüne Oliven\n50g Kochsalz\n12g Pfeffer schwarz\n10g Rosmarin (getrocknet)\n3g Muskat\n2g Pfeffer weiß\n10g Kutterhilfsmittel	\N	\N	\N	1. Schweinebauch und Schweinenacken wolfen\n2. Oliven in ganz kleine Stücke schneiden, Feta in kleine Stücke schneiden\n3. Fleisch und Gewürze gut vermengen bis eine bindige Masse entsteht\n4. Zum Schluss den Feta Käse und die Oliven untermengen\n5. Danach die Masse in Schweinedärme, Kaliber 28/30 oder 30/32 füllen\n6. Wenn man sie brühen will: 30min bei 78 Grad, danach in kaltem Wasser abkühlen	Griechische_Bratwurst_1_1774425529837.jpg	\N	\N	47	2026-03-25 08:04:30.992024
48	1	1	Hirschbratwurst	\N	Gesamtgewicht: 2,610 kg | Energie: 3.985 kcal (16.735 kJ) | Fett: 215 g | Kohlenhydrate: 17 g | Netto-KH: 12 g | Eiweiß: 497 g | Ballaststoffe: 6 g | Zucker: 11,7 g | Salz: 30,2 g	2000g Hirschkeule\n500g Schweinebauch\n44g Kochsalz\n10g Fenchelsamen\n4 Stück Knoblauch Zehen\n6g Pfeffer schwarz\n12g Paprika edelsüss\n4g Oregano\n4g Thymian\n10g Kutterhilfsmittel	\N	\N	\N	1. Schweinebauch und Hirschkeule wolfen\n2. Danach die Gewürze unter das gewolfte Fleisch mengen und zu einer bindigen Masse kneten\n3. Danach die Masse in Schafsaitlinge, Kaliber 20/22 füllen\n4. Wenn man sie brühen will: 30min bei 78 Grad, danach in kaltem Wasser abkühlen	Hirschbratwurst_1_1774425529837.jpg	\N	\N	48	2026-03-25 08:04:30.992024
49	1	1	Bratwurst Petersilie-Kapern	\N	Gesamtgewicht: 2.712 g | Energie: 6.278 kcal | Fett: 493 g | Kohlenhydrate: 12 g | Zucker: 6 g | Ballaststoffe: 5 g | Salz: 40 g	1500g Schweinehals\n1000g Schweinebauch\n100g Kapern\n40g Petersilie\n50g Kochsalz\n4g Pfeffer weiß\n4g Muskat\n3g Kümmel gemahlen\n1g Nelken gemahlen\n6g Knoblauchgranulat\n10g Kutterhilfsmittel	\N	\N	\N	1. Schweinehals und Schweinebauch wolfen\n2. Gewürze unter das gewolfte Fleisch geben und zu einer bindigen Masse kneten\n3. Zum Schluss Kapern und Petersilie gut untermengen\n4. Danach die Masse in Schweinedärme Kaliber 30/32 füllen	Kapern_1_1774425529838.jpg	\N	\N	49	2026-03-25 08:04:30.992024
57	1	2	Käsesalat	\N	Durchschnittliche Nährwertangabe je 100g\n  Energie: 278,29 kcal / 1163,26 kJ\n  Fett: 24,5 g\n  Kohlenhydrate: 24,5 g\n  davon Zucker: 0,4 g\n  Eiweiß: 13,25 g\n  Salz: 1,22 g	350g Butterkäse\n  350g Edamer\n  300g Emmentaler\n  5 Stück Eier\n  400g Gurkenschnitzel\n  500g Majonaise gewürzt\n  1 Stück Zwiebel\n\n  Zutaten: Käse (Butterkäse, Edamer, Emmentaler), Eier, Majonaise, Gewürzgurken, Gewürze, Rapsöl, Trinkwasser, Zucker, Branntweinessig, Stärke, Weizenstärke, Johannisbrotkernmehl, natürliche Aromen, Antioxidationsmittel E385, Süßungsmittel, Gewürzextrakte, Natrium-Saccharin	\N	\N	\N	Käse auf Schnittstärke 5 an der Aufschnittmaschine schneiden\n  Eier hart kochen und würfeln\n  Zwiebel fein würfeln\n  Gurkenschnitzel, Käse, Eier und Zwiebel vermengen\n  500g Majonaise gewürzt unterheben\n  Mit Salz und Pfeffer abschmecken	Kaesesalat.jpg	\N	\N	80	2026-03-25 08:14:38.178955
50	1	2	Kosaken Salat	\N	Nährwertangaben auf 100g\n  Energie: 137,12 kcal\n  Fett: 11,64 g\n  Kohlenhydrate: 3,63 g\n  davon Zucker: 1,9 g\n  Eiweiß: 4,43 g\n  Ballaststoffe: 4 g\n  Salz: 1,29 g	1 kg geschnittener Leberkäse\n  1 Dose (2 kg) Kosaken Salat von Develey\n\n  74% Grundsoße: Tomatenmark, Paprika (18%), Gurken, Glukosesirup, Silberzwiebeln, Branntweinessig, Mais, Zucker, Petersilie, Gewürze, Salz, Konservierungsstoff: Natriumbenzoat, Süßungsmittel: Natrium-Saccharin, natürliches Aroma – kann Spuren von Weizen, Ei, Milch, Sellerie enthalten\n  26% Lyoner: 70% Schweinefleisch, Speck, Trinkwasser, jodiertes Speisesalz, Stabilisatoren: Diphosphate, Gewürzextrakte, Antioxidationsmittel: Ascorbinsäure, Konservierungsstoff: Natriumnitrit	\N	\N	\N	1 kg geschnittener Leberkäse und 1 Dose (2 kg) Kosaken Salat von Develey in einer Schüssel gut verrühren\n  Den Kosaken Salat in mittlere Becher füllen\n  Beim Auszeichnen der Salate das Tara vom Becher beachten	Kosaken_Salat.jpg	\N	\N	10	2026-03-25 08:14:38.178955
51	1	2	Belegtes Sandwich	\N	Nährwertangaben auf 100g\n  Energie: 276 kcal\n  Fett: 18,6 g\n  Kohlenhydrate: 11,3 g\n  davon Zucker: 1,1 g\n  Eiweiß: 9,09 g\n  Salz: 1,2 g	Krusti (Brötchen)\n  30g gewürzte Majonaise\n  40g Salat\n  2 Scheiben Käse (Stärke 1,5)\n  5 Scheiben Salami (Stärke 1,5)\n  3 Scheiben Gurke (Stärke 2)\n  2 Scheiben Tomate (Stärke 2)\n\n  Brot: Weizenmehl, Roggenmehl, Roggennatursauerteig, Glutenhaltiges Getreide – kann Spuren von Soja, Sesam, Ei, Milch, Schalenfrüchte enthalten\n  Rapsöl, Branntweinessig, Zucker, Weizenstärke, Salz, Verdickungsmittel: Johannisbrotkernmehl, Guarkenmehl, Dextrose, Konservierungsstoff: Natriumbenzoat, natürliches Aroma, Antioxidationsmittel: Calcium-Dinatrium-EDTA, Ascorbinsäure, Säuerungsmittel: Citronensäure, Gewürze	\N	\N	\N	Krusti halbieren und mit 30g gewürzter Majonaise bestreichen\n  Mit Salat belegen (40g)\n  Danach 2 Scheiben Käse (Stärke 1,5 Aufschnittmaschine)\n  5 Scheiben Salami (Stärke 1,5 Aufschnittmaschine)\n  3 Scheiben Gurke (auf Stärke 2 Aufschnittmaschine)\n  2 Scheiben Tomate (auf Stärke 2 Aufschnittmaschine)	Belegtes_Sandwich.jpg	\N	\N	20	2026-03-25 08:14:38.178955
52	1	2	Eiersalat	\N	Durchschnittliche Nährwertangabe je 100g\n  Energie: 354,39 kcal / 1462,77 kJ\n  Fett: 34,73 g\n  Kohlenhydrate: 3,18 g\n  davon Zucker: 2,46 g\n  Eiweiß: 7,26 g\n  Salz: 1,38 g	30 Stück Eier\n  1 Stück Zwiebel\n  1 Pack Schnittlauch á 25g\n  1 kg gewürzte Majonaise\n  1 TL Currypulver\n  1½ TL Salz\n  1 TL Worcestersauce\n  ½ TL Tabasco\n\n  Frische Hühnereier mit Schnittlauch in würziger Salatcreme: 50% Eier, Rapsöl, Wasser, Weinbrandessig, Zucker, Eigelb, Salz, Senfsaat, modifizierte Stärke, Schnittlauch, Karamellzuckersirup, Verdickungsmittel: Xanthan, Gewürze, Schutzkulturen	\N	\N	\N	Eier schälen und mit dem Eierschneider 2 mal schneiden\n  Zwiebel in kleine Würfel schneiden und hinzugeben\n  Majonaise und restliche Gewürze hinzufügen und unterrühren\n  Eiersalat in mittlere Becher verpacken und auszeichnen\n  Tara für Becher nicht vergessen abzuziehen	Eiersalat.jpg	\N	\N	30	2026-03-25 08:14:38.178955
53	1	2	Fleischsalat	\N	Durchschnittliche Nährwertangabe je 100g\n  Energie: 303,33 kcal / 1269,67 kJ\n  Fett: 28,23 g\n  Kohlenhydrate: 0,2 g\n  davon Zucker: 0,18 g\n  Eiweiß: 12,96 g\n  Salz: 1,56 g	1500g Leberkäse fein\n  750g Gurkenschnitzel\n  1800g Majonaise gewürzt\n\n  Zutaten: Rapsöl, Gurken (27%), Wasser, Branntweinessig, Zucker, Eigelb, Stärke, Weizenstärke, Salz, Verdickungsmittel: Johannisbrotkernmehl, Guarkenmehl, Dextrose, Konservierungsstoff: Natriumbenzoat, natürliches Aroma, Antioxidationsmittel: Calcium-Dinatrium-EDTA, Ascorbinsäure, Säuerungsmittel: Citronensäure, Gewürze, Süßungsmittel: Natrium-Saccharin, Gewürzextrakte – kann Spuren von Milch enthalten\n  33% Lyoner: 70% Schweinefleisch, Speck, Trinkwasser, jodiertes Speisesalz, Gewürze, Stabilisatoren: Diphosphate, Gewürzextrakte, Antioxidationsmittel: Ascorbinsäure, Konservierungsstoff: Natriumnitrit	\N	\N	\N	1500g Leberkäse fein wolfen oder fein schneiden\n  750g Gurkenschnitzel dazugeben\n  1800g Majonaise gewürzt unterheben und alles gut vermengen	Fleischsalat.jpg	\N	\N	40	2026-03-25 08:14:38.178955
54	1	2	Majonaise gewürzt	\N	Durchschnittliche Nährwertangabe je 100g\n  Energie: 497 kcal / 2049 kJ\n  Fett: 50,9 g\n  Kohlenhydrate: 8,9 g\n  davon Zucker: 4 g\n  Eiweiß: 0,5 g\n  Salz: 1,43 g	Auf 19 kg Majonaise:\n  180g Senf mittelscharf\n  200g Zucker\n  200g Balsamico weiß\n  180g Essigessenz braun\n\n  Basis: Rapsöl 50%, Wasser, Guarkenmehl und Johannisbrotkernmehl, Branntweinessig, Zucker, Eigelb, Stärke, Weizenstärke, Salz, Verdickungsmittel, natürliches Aroma, Antioxidationsmittel E385	\N	\N	\N	Auf 19 kg Majonaise 180g Senf mittelscharf dazugeben\n  200g Zucker unterrühren\n  200g Balsamico weiß einrühren\n  180g Essigessenz braun einrühren\n  Alles gut vermengen	Majonaise_gewuerzt.jpg	\N	\N	50	2026-03-25 08:14:38.178955
55	1	2	Fleischsalat mit Joghurt	\N	Durchschnittliche Nährwertangabe je 100g\n  Energie: 247 kcal / 1024 kJ\n  Fett: 22,6 g\n  Kohlenhydrate: 5,1 g\n  davon Zucker: 3,1 g\n  Eiweiß: 5,4 g\n  Salz: 1,8 g	1500g Leberkäse geschnitten\n  750g Gurkenschnitzel\n  1200g Joghurt Majonaise\n  900g Majonaise gewürzt\n\n  Zutaten: 43% Schweinefleisch, Speck, Trinkwasser, Rapsöl, Essiggurken, Branntweinessig, Zucker, Eigelb, Stärke, Weizenstärke, Salz, Verdickungsmittel: Guarkenmehl, Johannisbrotkernmehl, natürliches Aroma, Calcium-dinatrium-EDTA, Ascorbinsäure, Süßstoff: Saccarin, Konservierungsstoff: Natriumbenzoat, Dextrose, Gewürze, Säuerungsmittel: Zitronensäure, jodiertes Speisesalz, Maltodextrin, Stabilisatoren: Diphosphate, Antioxidationsmittel: Ascorbinsäure, Konservierungsstoff: Natriumnitrit, Balsamico Essig, Zucker, Essigessenz	\N	\N	\N	1500g Leberkäse fein schneiden\n  750g Gurkenschnitzel dazugeben\n  1200g Joghurt Majonaise und 900g Majonaise gewürzt unterheben\n  Alles gut vermengen	Fleischsalat_mit_Joghurt.jpg	\N	\N	60	2026-03-25 08:14:38.178955
56	1	2	Schinken-Lauch Salat	\N	Nährwertangaben auf 100g\n  Energie: 147,67 kcal / 620 kJ\n  Fett: 10,3 g\n  Kohlenhydrate: 4,97 g\n  davon Zucker: 2,24 g\n  Eiweiß: 9 g\n  Salz: 1,04 g	700g Kochschinken\n  150g Lauchzwiebeln\n  2 Dosen Mandarinen á 312g Füllmenge\n  1 Dose Ananas á 432g Füllmenge\n  700g Majonaise gewürzt\n\n  67% Grundsoße: Joghurt, Ananas, Rapsöl, Mandarinen, Wasser, Lauch, Zucker, Branntweinessig, Eigelb, Salz, Gewürze, Stärke, Dextrose, Verdickungsmittel: Johannisbrotkernmehl, Guarkenmehl, Konservierungsstoff: Natriumbenzoat, Säuerungsmittel: Citronensäure, natürliches Aroma\n  33% Kochschinken: Schweinefleisch, jodiertes Speisesalz, Trockenglucosesirup, Stabilisatoren: Diphosphate, Triphosphate, Gewürzextrakte, Antioxidationsmittel: Natriumascorbat, Konservierungsstoff: Natriumnitrit, Buchenholzrauch	\N	\N	\N	700g Kochschinken in Würfel schneiden\n  150g Lauchzwiebeln in Ringe schneiden\n  2 Dosen Mandarinen á 312g und 1 Dose Ananas á 432g abtropfen lassen\n  700g Majonaise gewürzt dazugeben\n  Alles gut vermengen	Schinken_Lauch_Salat.jpg	\N	\N	70	2026-03-25 08:14:38.178955
58	1	2	Apfel-Käse Salat	\N	Durchschnittliche Nährwertangabe je 100g\n  Energie: 278,29 kcal / 1163,26 kJ\n  Fett: 24,5 g\n  Kohlenhydrate: 24,5 g\n  davon Zucker: 0,4 g\n  Eiweiß: 13,25 g\n  Salz: 1,22 g	350g Butterkäse\n  350g Edamer\n  300g Emmentaler\n  5 Stück Eier\n  500g Majonaise gewürzt\n  ½ Zwiebel\n  75ml Apfelsaft\n  4 Stück Äpfel (saure)\n\n  Zutaten: Käse (Butterkäse, Edamer, Emmentaler), Eier, Majonaise, Gewürzgurken, Gewürze, Rapsöl, Trinkwasser, Zucker, Branntweinessig, Stärke, Weizenstärke, Johannisbrotkernmehl, natürliche Aromen, Antioxidationsmittel E385, Süßungsmittel, Gewürzextrakte, Natrium-Saccharin	\N	\N	\N	Käse auf Schnittstärke 5 an der Aufschnittmaschine schneiden\n  Eier hart kochen und würfeln\n  Äpfel schälen und in kleine Würfel schneiden\n  Zwiebel fein würfeln\n  Alle Zutaten vermengen\n  500g Majonaise gewürzt und 75ml Apfelsaft unterheben	Apfel_Kaese_Salat.jpg	\N	\N	90	2026-03-25 08:14:38.178955
59	1	2	Kathi's Nudelsalat	\N	Nährwertangaben auf 100g\n  Energie: 201 kcal / 804 kJ\n  Fett: 14,7 g\n  Kohlenhydrate: 9,9 g\n  davon Zucker: 2,1 g\n  Eiweiß: 4,5 g\n  Salz: 1,5 g	500g Nudeln (Fusilli)\n  600g Majonaise ungewürzt\n  400g Fleischsalat (eigener)\n  1 Stück Apfel ohne Schale\n  2 Stück gekochte Eier\n  ½ Glas Gewürzgurken\n  1 Dose Mexico Mix\n  1 Stück Zwiebel\n  2 TL Salz\n  ½ TL Pfeffer schwarz\n  3 TL Paprika edelsüss\n  1 TL Paprika rosenscharf\n\n  Zutaten: Lyoner, Nudeln, Zwiebeln, Mais, Erbsen, rote Gemüsepaprika, Apfel, Eier, Gewürzgurken, Branntweinessig, Salz, Gewürzaroma, Süßungsmittel: Natrium-Saccharin, Stabilisatoren: Diphosphate, Gewürze, Antioxidationsmittel: Ascorbinsäure, Gewürzextrakte, Konservierungsstoff: Natriumnitrit, Rapsöl, Zucker, Eigelb, Stärke, Weizenstärke, Salz, Verdickungsmittel: Guarkenmehl, Johannisbrotkernmehl, natürliches Aroma, Magermilchjoghurt, Xanthan, Zitronensaftkonzentrat	\N	\N	\N	Nudeln (Fusilli) kochen und abkühlen lassen\n  Apfel schälen und würfeln\n  Eier würfeln, Gewürzgurken grob hacken, Zwiebel fein würfeln\n  Alle Zutaten mit Majonaise, Fleischsalat und Gewürzen vermengen\n  Mit Salz, Pfeffer, Paprika edelsüss und rosenscharf abschmecken	Kathis_Nudelsalat.jpg	\N	\N	100	2026-03-25 08:14:38.178955
60	1	2	Farmersalat	\N	Durchschnittliche Nährwertangabe je 100g\n  Energie: 278,29 kcal / 1163,26 kJ\n  Fett: 24,5 g\n  Kohlenhydrate: 24,5 g\n  davon Zucker: 0,4 g\n  Eiweiß: 13,25 g\n  Salz: 1,22 g	800g Möhren\n  600g Knollensellerie\n  400g Weißkohl\n  2 Stück Äpfel\n  200g Sahne\n  800g Majonaise\n  320g Joghurt 3,5% Fett\n  1 Stück Zitrone (nur der Saft)\n  Salz und Pfeffer	\N	\N	\N	Nur in der Bedientheke	Farmersalat.jpg	\N	\N	110	2026-03-25 08:14:38.178955
61	1	2	Rindfleischsalat	\N	Durchschnittliche Nährwertangabe je 100g\n  Energie: 67,54 kcal / 279,91 kJ\n  Fett: 1,44 g\n  Kohlenhydrate: 3,55 g\n  davon Zucker: 3,54 g\n  Eiweiß: 9,86 g\n  Salz: 0,4 g	400g Roastbeef (mariniert mit BBQ Marinade, geschnitten wie Rinderfetzen)\n  2 Stück rote Zwiebeln\n  1 Glas Letscho (680g)	\N	\N	\N	Roastbeef in 2 mm Scheiben schneiden, marinieren und kurz in der Pfanne anbraten\n  Danach die Roastbeef Scheiben in Streifen schneiden\n  Zwiebel in kleine Würfel schneiden\n  Den Paprika vom Letscho klein schneiden\n  Alle Zutaten in einer Schüssel gut vermengen	Rindfleischsalat.jpg	\N	\N	120	2026-03-25 08:14:38.178955
62	1	2	Tex-Mex Salat mit Cabanossi	\N	Durchschnittliche Nährwertangabe je 100g\n  Energie: 174,73 kcal / 716,39 kJ\n  Fett: 12,64 g\n  Kohlenhydrate: 7,88 g\n  davon Zucker: 2,77 g\n  Eiweiß: 6,73 g\n  Salz: 1,27 g	1 Dose Mais (330g)\n  1 Dose Kidney Bohnen (400g)\n  150g Paprika rot frisch\n  3 Stück Frühlingszwiebeln\n  10 Stück grüne Oliven\n  400g Cabanossi\n  2 Stück Knoblauchzehen\n  10 EL Ketchup\n  2 TL Paprika edelsüss\n  2 EL Essig\n  2 TL Dill\n  Prise Salz und Pfeffer	\N	\N	\N	Mais und Kidney Bohnen abtropfen lassen\n  Paprika und Cabanossi in Würfel schneiden\n  Frühlingszwiebeln in Ringe schneiden\n  Knoblauch fein hacken\n  Oliven halbieren\n  Alle Zutaten vermengen\n  Mit Ketchup, Essig, Paprika edelsüss und Dill würzen\n  Salz und Pfeffer nach Geschmack	TexMex_Salat_mit_Cabanossi.jpg	\N	\N	130	2026-03-25 08:14:38.178955
\.


--
-- Data for Name: role_permission_defaults; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permission_defaults (id, tenant_id, role, label, color, is_custom, permissions, sort_order, created_at) FROM stdin;
1	1	SUPERADMIN	Superadmin	purple	f	{users.view,users.manage,users.invite_admin,entries.create,entries.view_all,entries.edit,entries.delete,reports.view,reports.export,verwaltung.access,devices.manage,settings.manage}	1	2026-03-26 13:59:42.081789
3	1	BEREICHSLEITUNG	Bereichsleitung	indigo	f	{users.view,users.manage,entries.create,entries.view_all,entries.edit,reports.view,reports.export,verwaltung.access}	3	2026-03-26 13:59:42.081789
4	1	MARKTLEITER	Marktleiter	emerald	f	{users.view,entries.create,entries.view_all,entries.edit,reports.view,verwaltung.access}	4	2026-03-26 13:59:42.081789
5	1	USER	Mitarbeiter	gray	f	{entries.create}	5	2026-03-26 13:59:42.081789
2	1	ADMIN	Administrator	blue	f	{users.view,users.manage,users.invite_admin,entries.create,entries.view_all,entries.edit,entries.delete,reports.view,reports.export,verwaltung.access,settings.manage,devices.manage}	2	2026-03-26 13:59:42.081789
\.


--
-- Data for Name: schulungs_ausnahmen; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schulungs_ausnahmen (id, tenant_id, user_id, schulungs_pflicht_id, begruendung, created_at) FROM stdin;
1	1	16	3	Test	2026-03-31 07:27:33.06386
\.


--
-- Data for Name: schulungs_person_zuordnungen; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schulungs_person_zuordnungen (id, schulungs_pflicht_id, user_id, tenant_id) FROM stdin;
\.


--
-- Data for Name: schulungs_pflichten; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schulungs_pflichten (id, tenant_id, schulung_kategorie, bezeichnung, gueltige_gruppen, intervall_monate, is_active, created_at, person_spezifisch, subbereich, parent_pflicht_id, typ, zuordnung_modus, training_topic_id, pruef_modus) FROM stdin;
13	3	Metzgerei Spezial	Fleischhygieneunterweisung	{metzgerei}	6	t	2026-03-26 14:42:23.78837	f	\N	\N	schulung	gruppe	\N	zeitbasiert
16	2	Strohschwein	Strohschwein-Schulung (allgemein)	{}	12	t	2026-03-26 14:58:56.871633	t	\N	\N	schulung	auto	\N	zeitbasiert
17	2	Strohschwein	Strohschwein — Feuerwerk	{}	12	t	2026-03-26 14:58:56.871633	t	Feuerwerk	\N	schulung	auto	\N	zeitbasiert
18	3	Strohschwein	Strohschwein-Schulung (allgemein)	{}	12	t	2026-03-26 14:58:56.871633	t	\N	\N	schulung	auto	\N	zeitbasiert
19	3	Strohschwein	Strohschwein — Feuerwerk	{}	12	t	2026-03-26 14:58:56.871633	t	Feuerwerk	\N	schulung	auto	\N	zeitbasiert
4	1	HACCP Grundschulung	HACCP Grundschulung	{gesamter_markt,markt,metzgerei}	12	t	2026-03-26 14:42:23.78837	f	\N	\N	schulung	gruppe	\N	zeitbasiert
8	2	HACCP Grundschulung	HACCP Grundschulung	{gesamter_markt,markt,metzgerei}	12	t	2026-03-26 14:42:23.78837	f	\N	\N	schulung	gruppe	\N	zeitbasiert
12	3	HACCP Grundschulung	HACCP Grundschulung	{gesamter_markt,markt,metzgerei}	12	t	2026-03-26 14:42:23.78837	f	\N	\N	schulung	gruppe	\N	zeitbasiert
1	1	Ersthelfer	Ersthelfer-Ausbildung	{}	24	t	2026-03-26 14:42:23.78837	t	\N	\N	bescheinigung	auto	\N	zeitbasiert
2	1	Brandschutz	Brandschutzunterweisung	{}	12	t	2026-03-26 14:42:23.78837	t	\N	\N	bescheinigung	auto	\N	zeitbasiert
5	2	Ersthelfer	Ersthelfer-Ausbildung	{}	24	t	2026-03-26 14:42:23.78837	t	\N	\N	bescheinigung	auto	\N	zeitbasiert
6	2	Brandschutz	Brandschutzunterweisung	{}	12	t	2026-03-26 14:42:23.78837	t	\N	\N	bescheinigung	auto	\N	zeitbasiert
9	3	Ersthelfer	Ersthelfer-Ausbildung	{}	24	t	2026-03-26 14:42:23.78837	t	\N	\N	bescheinigung	auto	\N	zeitbasiert
10	3	Brandschutz	Brandschutzunterweisung	{}	12	t	2026-03-26 14:42:23.78837	t	\N	\N	bescheinigung	auto	\N	zeitbasiert
23	1	Taraschulung	Taraschulung	{metzgerei}	12	t	2026-03-27 06:51:19.706582	f	\N	\N	schulung	gruppe	\N	zeitbasiert
24	2	Taraschulung	Taraschulung	{metzgerei}	12	t	2026-03-27 06:51:19.706582	f	\N	\N	schulung	gruppe	\N	zeitbasiert
25	3	Taraschulung	Taraschulung	{metzgerei}	12	t	2026-03-27 06:51:19.706582	f	\N	\N	schulung	gruppe	\N	zeitbasiert
27	2	Lebensmittelleitkultur	Lebensmittelleitkultur-Schulung	{gesamter_markt,markt,metzgerei}	12	t	2026-03-27 06:51:19.706582	f	\N	\N	schulung	gruppe	\N	zeitbasiert
28	3	Lebensmittelleitkultur	Lebensmittelleitkultur-Schulung	{gesamter_markt,markt,metzgerei}	12	t	2026-03-27 06:51:19.706582	f	\N	\N	schulung	gruppe	\N	zeitbasiert
29	1	Gesundheitszeugnis	Gesundheitszeugnis	{}	12	t	2026-03-27 06:51:19.706582	f	\N	\N	bescheinigung	auto	\N	vorhanden
30	2	Gesundheitszeugnis	Gesundheitszeugnis	{}	12	t	2026-03-27 06:51:19.706582	f	\N	\N	bescheinigung	auto	\N	vorhanden
31	3	Gesundheitszeugnis	Gesundheitszeugnis	{}	12	t	2026-03-27 06:51:19.706582	f	\N	\N	bescheinigung	auto	\N	vorhanden
3	1	HACCP Grundschulung	Jährliche Hygieneschulung	{gesamter_markt,markt}	12	t	2026-03-26 14:42:23.78837	f	\N	\N	schulung	gruppe	2	zeitbasiert
26	1	HACCP Grundschulung	Lebensmittelleitkultur-Schulung	{gesamter_markt,markt,metzgerei}	12	t	2026-03-27 06:51:19.706582	f	\N	\N	schulung	gruppe	\N	zeitbasiert
7	2	HACCP Grundschulung	Jährliche Hygieneschulung	{gesamter_markt,markt}	12	t	2026-03-26 14:42:23.78837	f	\N	\N	schulung	gruppe	2	zeitbasiert
11	3	HACCP Grundschulung	Jährliche Hygieneschulung	{gesamter_markt,markt}	12	t	2026-03-26 14:42:23.78837	f	\N	\N	schulung	gruppe	2	zeitbasiert
21	2	HACCP Grundschulung	Jährl. Belehrung Infektionsschutzgesetz	{gesamter_markt,markt,metzgerei}	12	t	2026-03-27 06:51:19.706582	f	\N	\N	schulung	gruppe	1	zeitbasiert
22	3	HACCP Grundschulung	Jährl. Belehrung Infektionsschutzgesetz	{gesamter_markt,markt,metzgerei}	12	t	2026-03-27 06:51:19.706582	f	\N	\N	schulung	gruppe	1	zeitbasiert
20	1	HACCP Grundschulung	Jährl. Belehrung Infektionsschutzgesetz	{gesamter_markt,markt,metzgerei}	12	t	2026-03-27 06:51:19.706582	f	\N	\N	schulung	gruppe	1	zeitbasiert
\.


--
-- Data for Name: schulungsnachweise; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schulungsnachweise (id, tenant_id, kategorie, mitarbeiter_name, bezeichnung, schulungs_datum, naechste_schulung, anbieter, dokument_base64, notizen, created_at) FROM stdin;
\.


--
-- Data for Name: sections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sections (id, category_id, number, title, description, sort_order, created_at) FROM stdin;
1	1	1.1	Verantwortlichkeiten	\N	1	2026-03-17 12:22:22.128204
33	3	3.2	Reinigungspläne Metzgerei	\N	2	2026-03-17 12:22:22.136037
41	3	3.10	Etikettierung	\N	10	2026-03-17 12:22:22.136037
42	3	3.11	Thekenverkauf	\N	11	2026-03-17 12:22:22.136037
43	3	3.12	Personalschulung Metzgerei	\N	12	2026-03-17 12:22:22.136037
44	3	3.13	Gerätewartung	\N	13	2026-03-17 12:22:22.136037
45	3	3.14	Nematoden-Kontrolle	\N	14	2026-03-17 12:22:22.136037
46	3	3.15	Hackfleischherstellung	\N	15	2026-03-17 12:22:22.136037
47	3	3.16	Geflügelverarbeitung	\N	16	2026-03-17 12:22:22.136037
48	3	3.17	Wildverarbeitung	\N	17	2026-03-17 12:22:22.136037
49	3	3.18	Fischverarbeitung	\N	18	2026-03-17 12:22:22.136037
50	3	3.19	Marinaden & Gewürze	\N	19	2026-03-17 12:22:22.136037
51	3	3.20	Warmhaltung & Ausgabe	\N	20	2026-03-17 12:22:22.136037
52	3	3.21	Probenentnahme	\N	21	2026-03-17 12:22:22.136037
24	2	_2.6	Warenannahme Obst & Gemüse	\N	6	2026-03-17 12:22:22.132287
25	2	_2.7	Warenannahme TK-Ware	\N	7	2026-03-17 12:22:22.132287
26	2	_2.8	Warenannahme Trockensortiment	\N	8	2026-03-17 12:22:22.132287
27	2	_2.9	Warenannahme Getränke	\N	9	2026-03-17 12:22:22.132287
28	2	_2.10	Warenannahme Non-Food	\N	10	2026-03-17 12:22:22.132287
29	2	_2.11	Warenannahme Brot & Backwaren	\N	11	2026-03-17 12:22:22.132287
30	2	_2.12	Warenannahme Sonstiges	\N	12	2026-03-17 12:22:22.132287
32	3	3.1	Wareneingaenge Metzgerei	\N	1	2026-03-17 12:22:22.136037
3	1	1.4	Schulungsnachweise	\N	4	2026-03-17 12:22:22.128204
53	1	1.3	Info Dokumentation und Ablagefristen	\N	3	2026-03-17 19:57:21.430442
4	1	1.5	Reinigungsplan Jahr	\N	5	2026-03-17 12:22:22.128204
34	3	3.3	Öffnung Salate	\N	3	2026-03-17 12:22:22.136037
6	1	1.7	Hinweisschild gesperrte Ware	\N	7	2026-03-17 12:22:22.128204
35	3	3.4	Käsetheke und Reifeschrank	\N	4	2026-03-17 12:22:22.136037
5	1	1.6	Betriebsbegehung	Eigenkontroll-Prüfliste – einmal pro Quartal durchzuführen	6	2026-03-17 12:22:22.128204
7	1	1.8	Produktfehlermeldung	Formblatt 3.14 – Reklamationserfassung für Produktfehler und Verbraucherbeschwerden	8	2026-03-17 12:22:22.128204
8	1	1.9	Probeentnahme	\N	9	2026-03-17 12:22:22.128204
36	3	3.5	Semmelliste	\N	5	2026-03-17 12:22:22.136037
38	3	3.7	Eigenherstellung / Rezepturen	\N	7	2026-03-17 12:22:22.136037
39	3	3.8	GQ-Betriebsbegehung	\N	8	2026-03-17 12:22:22.136037
40	3	3.9	Abteilungsfremde Personen	\N	9	2026-03-17 12:22:22.136037
37	3	3.6	Eingefrorenes Fleisch	\N	6	2026-03-17 12:22:22.136037
2	1	1.2	Mitarbeiter & Kürzel	\N	2	2026-03-17 12:22:22.128204
10	1	1.10	Anti-Vektor Zugang	\N	10	2026-03-17 12:22:22.128204
11	1	1.11	Bescheinigungen & Nachweise	\N	11	2026-03-17 12:22:22.128204
12	1	1.12	Kontrollberichte	\N	12	2026-03-17 12:22:22.128204
9	1	1.4_bp	Besprechungsprotokoll	\N	999	2026-03-17 12:22:22.128204
18	1	hidden_1.19	Dokumentenlenkung	\N	919	2026-03-17 12:22:22.128204
17	1	hidden_1.18	CCP-Übersicht	\N	918	2026-03-17 12:22:22.128204
16	1	hidden_1.17	Gefahrenanalyse	\N	917	2026-03-17 12:22:22.128204
15	1	hidden_1.16	Allergenmanagement	\N	916	2026-03-17 12:22:22.128204
14	1	hidden_1.15	Glasbruch-/Fremdkörpermanagement	\N	915	2026-03-17 12:22:22.128204
13	1	hidden_1.14	Besucherregelung	\N	914	2026-03-17 12:22:22.128204
23	2	2.1	Wareneingaenge	\N	1	2026-03-17 12:22:22.132287
19	2	2.2	Warenzustand Obst & Gemüse	\N	2	2026-03-17 12:22:22.132287
20	2	2.3	Reinigungsdokumentation täglich	\N	3	2026-03-17 12:22:22.132287
21	2	2.4	Zugangsdaten Carrier-Portal	\N	4	2026-03-17 12:22:22.132287
\.


--
-- Data for Name: semmelliste; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.semmelliste (id, tenant_id, market_id, year, month, day, semmel, sandwich, kuerzel, user_id, created_at, items) FROM stdin;
1	1	1	2026	3	25	15	2	HSC	13	2026-03-25 11:51:23.405175+00	{}
2	1	1	2026	3	25	20	2	HSC	13	2026-03-25 12:30:42.307152+00	{}
3	1	1	2026	3	26	5	0	KM	8	2026-03-26 11:32:07.818705+00	{}
4	1	1	2026	3	26	5	1	KM	8	2026-03-26 11:32:19.813275+00	{}
5	1	1	2026	3	26	5	3	KM	8	2026-03-26 11:52:51.088103+00	{"Krusti": "3", "Semmel": "5"}
\.


--
-- Data for Name: semmelliste_kontingent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.semmelliste_kontingent (market_id, tenant_id, semmel_standard, freifeld_label, freifeld_standard, items) FROM stdin;
1	1	50	Krusti	1	[]
\.


--
-- Data for Name: shelf_markers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shelf_markers (id, market_id, label, x, y, sortiment, reduzierungs_regel, aktions_hinweis, kontroll_intervall, naechste_kontrolle, created_at, size, rotated, reduzierungs_datum, knick_datum, letzte_kontrolle_at, letzte_kontrolle_von, kontroll_rhythmus) FROM stdin;
23	1	a	66.095	75.878	\N	\N	\N	7	\N	2026-03-23 13:04:54.581983	xs	t	\N	\N	\N	\N	\N
30	1	a	70.220	65.509	\N	\N	\N	7	\N	2026-03-23 13:05:48.578619	xs	t	\N	\N	\N	\N	\N
28	1	a	70.180	62.117	\N	\N	\N	7	\N	2026-03-23 13:05:39.159521	xs	t	\N	\N	\N	\N	\N
47	1	a	71.291	72.474	\N	\N	\N	7	\N	2026-03-23 13:08:00.052816	xs	t	\N	\N	\N	\N	\N
29	1	a	71.319	69.035	\N	\N	\N	7	\N	2026-03-23 13:05:43.656815	xs	t	\N	\N	\N	\N	\N
22	1	a	66.358	71.729	\N	\N	\N	7	\N	2026-03-23 13:04:48.083871	xs	t	\N	\N	\N	\N	\N
42	1	a	71.329	65.571	\N	\N	\N	7	\N	2026-03-23 13:07:02.981392	xs	t	\N	\N	\N	\N	\N
8	1	a	65.019	69.054	\N	\N	\N	7	\N	2026-03-23 12:22:52.711589	xs	t	\N	\N	\N	\N	\N
9	1	a	64.965	65.655	\N	\N	\N	7	\N	2026-03-23 12:25:56.696973	xs	t	\N	\N	\N	\N	\N
10	1	a	65.067	62.318	\N	\N	\N	7	\N	2026-03-23 12:26:06.607173	xs	t	\N	\N	\N	\N	\N
11	1	a	64.997	59.603	\N	\N	\N	7	\N	2026-03-23 12:26:12.524635	xs	t	\N	\N	\N	\N	\N
12	1	a	64.863	56.007	Chips	\N	\N	7	\N	2026-03-23 12:26:24.063296	xs	t	\N	\N	\N	\N	\N
21	1	a	66.199	69.307	\N	\N	\N	7	\N	2026-03-23 13:04:42.397089	xs	t	\N	\N	\N	\N	\N
27	1	a	71.275	62.265	\N	\N	\N	7	\N	2026-03-23 13:05:22.831726	xs	t	\N	\N	\N	\N	\N
14	1	a	70.699	52.777	\N	\N	\N	7	\N	2026-03-23 12:35:09.425882	xs	f	\N	\N	\N	\N	\N
20	1	a	66.073	65.778	\N	\N	\N	7	\N	2026-03-23 13:04:33.400825	xs	t	\N	\N	\N	\N	\N
19	1	a	66.019	62.669	\N	\N	\N	7	\N	2026-03-23 13:04:28.232167	xs	t	\N	\N	\N	\N	\N
18	1	a	66.016	59.144	\N	\N	\N	7	\N	2026-03-23 13:04:20.24937	xs	t	\N	\N	\N	\N	\N
17	1	a	66.205	55.407	\N	\N	\N	7	\N	2026-03-23 13:04:14.023454	xs	t	\N	\N	\N	\N	\N
1	1	Kaffee	65.595	89.066	Kaffee	4 Wochen	4 Monate	30	2026-10-24	2026-03-23 11:37:21.351328	xs	f	2026-04-22	2026-07-25	2026-03-24 08:06:14.031	Kai Martin	3 Monate
13	1	a	65.710	52.663	\N	\N	\N	7	\N	2026-03-23 12:35:04.131509	xs	f	\N	\N	\N	\N	\N
37	1	Chips	70.768	89.158	Chips	1 Woche	2 Monate	7	2026-06-23	2026-03-23 13:06:25.650264	xs	f	2026-03-31	2026-05-24	2026-03-24 10:58:55.804	Max Mustermann	1 Monat
36	1	a	70.185	86.192	\N	\N	\N	7	\N	2026-03-23 13:06:19.403657	xs	t	\N	\N	\N	\N	\N
38	1	a	76.228	89.074	\N	\N	\N	7	\N	2026-03-23 13:06:30.191106	xs	f	\N	\N	\N	\N	\N
3	1	a	65.044	82.756	dasfkdsa	fdasf	\N	7	\N	2026-03-23 11:39:40.208034	xs	t	\N	\N	\N	\N	\N
58	1	a	75.664	86.020	\N	\N	\N	7	\N	2026-03-23 19:46:18.297446	xs	t	\N	\N	\N	\N	\N
57	1	a	75.619	82.603	\N	\N	\N	7	\N	2026-03-23 19:46:09.894573	xs	t	\N	\N	\N	\N	\N
56	1	a	75.587	79.255	\N	\N	\N	7	\N	2026-03-23 19:45:59.08256	xs	t	\N	\N	\N	\N	\N
55	1	a	75.630	75.947	\N	\N	\N	7	\N	2026-03-23 19:43:44.118857	xs	t	\N	\N	\N	\N	\N
54	1	a	75.584	72.492	\N	\N	\N	7	\N	2026-03-23 19:43:36.132288	xs	t	\N	\N	\N	\N	\N
53	1	a	75.591	69.126	\N	\N	\N	7	\N	2026-03-23 19:43:27.978941	xs	t	\N	\N	\N	\N	\N
52	1	a	75.612	65.680	\N	\N	\N	7	\N	2026-03-23 19:43:13.634389	xs	t	\N	\N	\N	\N	\N
50	1	a	75.597	62.286	\N	\N	\N	7	\N	2026-03-23 16:07:07.674887	xs	t	\N	\N	\N	\N	\N
49	1	a	75.596	58.806	\N	\N	\N	7	\N	2026-03-23 16:07:00.629992	xs	t	\N	\N	\N	\N	\N
48	1	a	75.526	55.422	\N	\N	\N	7	\N	2026-03-23 16:06:50.471986	xs	t	\N	\N	\N	\N	\N
59	1	a	76.718	55.387	\N	\N	\N	7	\N	2026-03-23 19:46:24.906923	xs	t	\N	\N	\N	\N	\N
15	1	a	76.213	52.686	\N	\N	\N	7	\N	2026-03-23 12:35:14.411831	xs	f	\N	\N	\N	\N	\N
39	1	a	81.711	88.964	\N	\N	\N	7	\N	2026-03-23 13:06:37.696156	xs	f	\N	\N	\N	\N	\N
16	1	a	81.505	52.871	\N	\N	\N	7	\N	2026-03-23 12:35:19.925245	xs	f	\N	\N	\N	\N	\N
35	1	a	70.102	82.718	\N	\N	\N	7	\N	2026-03-23 13:06:14.569045	xs	t	\N	\N	\N	\N	\N
5	1	a	65.065	86.144	\N	\N	\N	7	\N	2026-03-23 11:59:16.784747	xs	t	\N	\N	\N	\N	\N
7	1	a	65.032	79.325	\N	\N	\N	7	\N	2026-03-23 12:22:04.05235	xs	t	\N	\N	\N	\N	\N
34	1	a	70.166	79.351	\N	\N	\N	7	\N	2026-03-23 13:06:09.519259	xs	t	\N	\N	\N	\N	\N
6	1	a	65.023	75.896	\N	\N	\N	7	\N	2026-03-23 12:19:41.17571	xs	t	\N	\N	\N	\N	\N
33	1	a	70.141	75.901	\N	\N	\N	7	\N	2026-03-23 13:06:04.783504	xs	t	\N	\N	\N	\N	\N
4	1	a	64.987	72.509	\N	\N	\N	7	\N	2026-03-23 11:39:53.38884	xs	t	\N	\N	\N	\N	\N
40	1	a	87.090	52.695	\N	\N	\N	7	\N	2026-03-23 13:06:43.539448	xs	f	\N	\N	\N	\N	\N
43	1	a	71.276	86.128	\N	\N	\N	7	\N	2026-03-23 13:07:28.680996	xs	t	\N	\N	\N	\N	\N
26	1	a	66.116	86.156	\N	\N	\N	7	\N	2026-03-23 13:05:14.094352	xs	t	\N	\N	\N	\N	\N
25	1	a	66.098	82.716	\N	\N	\N	7	\N	2026-03-23 13:05:08.210147	xs	t	\N	\N	\N	\N	\N
44	1	a	71.297	82.832	\N	\N	\N	7	\N	2026-03-23 13:07:42.97922	xs	t	\N	\N	\N	\N	\N
24	1	a	66.091	79.334	\N	\N	\N	7	\N	2026-03-23 13:05:02.60603	xs	t	\N	\N	\N	\N	\N
45	1	a	71.324	79.296	\N	\N	\N	7	\N	2026-03-23 13:07:49.307549	xs	t	\N	\N	\N	\N	\N
51	1	a	92.429	52.934	\N	\N	\N	7	\N	2026-03-23 16:54:35.564529	xs	f	\N	\N	\N	\N	\N
46	1	a	71.334	76.002	\N	\N	\N	7	\N	2026-03-23 13:07:54.481775	xs	t	\N	\N	\N	\N	\N
32	1	a	70.201	72.501	\N	\N	\N	7	\N	2026-03-23 13:05:59.560365	xs	t	\N	\N	\N	\N	\N
31	1	a	70.222	69.104	\N	\N	\N	7	\N	2026-03-23 13:05:53.709294	xs	t	\N	\N	\N	\N	\N
41	1	a	86.737	89.411	\N	\N	\N	7	\N	2026-03-23 13:06:50.986607	xs	f	\N	\N	\N	\N	\N
\.


--
-- Data for Name: strecken_bestellungen; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.strecken_bestellungen (id, market_id, tenant_id, lieferant_id, bestellt_am, mitarbeiter_kuerzel, notiz, created_at) FROM stdin;
2	1	1	39	2025-03-12 08:00:00+00	Lenger	\N	2026-03-29 15:46:43.215159+00
3	1	1	39	2025-03-19 08:00:00+00	Stöber	\N	2026-03-29 15:46:43.215159+00
4	1	1	39	2025-03-26 08:00:00+00	Stölte	\N	2026-03-29 15:46:43.215159+00
5	1	1	39	2025-04-02 08:00:00+00	Stölte	\N	2026-03-29 15:46:43.215159+00
6	1	1	39	2025-04-09 08:00:00+00	Sarikaya	\N	2026-03-29 15:46:43.215159+00
7	1	1	39	2025-04-16 08:00:00+00	Can	\N	2026-03-29 15:46:43.215159+00
8	1	1	39	2025-04-23 08:00:00+00	Sarikaya	nicht bestellt	2026-03-29 15:46:43.215159+00
9	1	1	39	2025-05-07 08:00:00+00	Sarikaya	\N	2026-03-29 15:46:43.215159+00
10	1	1	39	2025-05-14 08:00:00+00	Candlu	\N	2026-03-29 15:46:43.215159+00
11	1	1	39	2025-05-21 08:00:00+00	Ahmet	\N	2026-03-29 15:46:43.215159+00
12	1	1	39	2025-05-30 08:00:00+00	Onur	\N	2026-03-29 15:46:43.215159+00
13	1	1	39	2025-06-11 08:00:00+00	Landra	\N	2026-03-29 15:46:43.215159+00
14	1	1	39	2025-06-18 08:00:00+00	Stölte	nicht bestellt	2026-03-29 15:46:43.215159+00
15	1	1	39	2025-06-26 08:00:00+00	Stölte	\N	2026-03-29 15:46:43.215159+00
16	1	1	39	2025-07-02 08:00:00+00	Ahmet	\N	2026-03-29 15:46:43.215159+00
17	1	1	39	2025-07-09 08:00:00+00	Landchen	\N	2026-03-29 15:46:43.215159+00
18	1	1	39	2025-07-15 08:00:00+00	Ahmet	\N	2026-03-29 15:46:43.215159+00
19	1	1	39	2025-07-24 08:00:00+00	Stölte	nicht bestellt	2026-03-29 15:46:43.215159+00
20	1	1	39	2025-08-12 08:00:00+00	Kienle	\N	2026-03-29 15:46:43.215159+00
21	1	1	39	2025-09-02 08:00:00+00	Landchen	\N	2026-03-29 15:46:43.215159+00
22	1	1	39	2025-09-23 08:00:00+00	N	\N	2026-03-29 15:46:43.215159+00
23	1	1	39	2025-10-07 08:00:00+00	P	\N	2026-03-29 15:46:43.215159+00
24	1	1	39	2025-10-22 08:00:00+00	Bad	\N	2026-03-29 15:46:43.215159+00
25	1	1	39	2025-11-12 08:00:00+00	Sayl	\N	2026-03-29 15:46:43.215159+00
26	1	1	39	2025-11-26 08:00:00+00	Koll	-4-	2026-03-29 15:46:43.215159+00
27	1	1	39	2025-12-10 08:00:00+00	Kibre	\N	2026-03-29 15:46:43.215159+00
28	1	1	39	2025-12-17 08:00:00+00	Kibre	\N	2026-03-29 15:46:43.215159+00
29	1	1	39	2026-01-07 08:00:00+00	Ahmet	\N	2026-03-29 15:46:43.215159+00
30	1	1	39	2026-01-21 08:00:00+00	Ahmet	\N	2026-03-29 15:46:43.215159+00
31	1	1	39	2026-02-04 08:00:00+00	Ahmet	\N	2026-03-29 15:46:43.215159+00
32	1	1	39	2026-02-18 08:00:00+00	Ahmet	\N	2026-03-29 15:46:43.215159+00
33	1	1	39	2026-02-25 08:00:00+00	Ahmet	\N	2026-03-29 15:46:43.215159+00
34	1	1	39	2026-03-25 08:00:00+00	Gel	\N	2026-03-29 15:46:43.215159+00
35	1	1	40	2025-05-21 08:00:00+00	Ahmet	\N	2026-03-29 16:00:01.750318+00
36	1	1	40	2025-05-30 08:00:00+00	Craden	nicht bestellt	2026-03-29 16:00:01.750318+00
37	1	1	40	2025-06-18 08:00:00+00	Stölte	\N	2026-03-29 16:00:01.750318+00
38	1	1	40	2025-06-25 08:00:00+00	–	nicht bestellt	2026-03-29 16:00:01.750318+00
39	1	1	40	2025-07-02 08:00:00+00	–	\N	2026-03-29 16:00:01.750318+00
40	1	1	40	2025-07-08 08:00:00+00	Landchen	nicht bestellt	2026-03-29 16:00:01.750318+00
41	1	1	40	2025-07-15 08:00:00+00	Ahmet	nicht bestellt	2026-03-29 16:00:01.750318+00
42	1	1	40	2025-07-24 08:00:00+00	Blöt	nicht bestellt	2026-03-29 16:00:01.750318+00
43	1	1	40	2025-08-12 08:00:00+00	Kienle	\N	2026-03-29 16:00:01.750318+00
44	1	1	40	2025-08-23 08:00:00+00	N	\N	2026-03-29 16:00:01.750318+00
45	1	1	40	2025-09-09 08:00:00+00	Blo	nicht bestellt	2026-03-29 16:00:01.750318+00
46	1	1	40	2025-09-12 08:00:00+00	Koll	\N	2026-03-29 16:00:01.750318+00
47	1	1	40	2025-11-26 08:00:00+00	Ker	-1-	2026-03-29 16:00:01.750318+00
48	1	1	40	2025-12-10 08:00:00+00	Utone	nicht bestellt	2026-03-29 16:00:01.750318+00
49	1	1	40	2025-12-17 08:00:00+00	Ahmet	\N	2026-03-29 16:00:01.750318+00
50	1	1	40	2026-01-07 08:00:00+00	Ahmet	\N	2026-03-29 16:00:01.750318+00
51	1	1	40	2026-02-04 08:00:00+00	Ahmet	\N	2026-03-29 16:00:01.750318+00
52	1	1	40	2026-02-18 08:00:00+00	Ahmet	\N	2026-03-29 16:00:01.750318+00
53	1	1	40	2026-02-25 08:00:00+00	Ahmet	\N	2026-03-29 16:00:01.750318+00
54	1	1	40	2026-03-10 08:00:00+00	Landchen	\N	2026-03-29 16:00:01.750318+00
55	1	1	40	2026-03-25 08:00:00+00	Kol	\N	2026-03-29 16:00:01.750318+00
\.


--
-- Data for Name: strecken_lieferanten; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.strecken_lieferanten (id, market_id, tenant_id, name, ansprechpartner, telefon, info, kuerzel, sort_order, created_at, updated_at, wird_bestellt, aussendienst_bestellt, mindestbestellwert) FROM stdin;
1	1	1	ABInBEv	Alfons Gollnick	0175/2612161	Löwenbräu, Becks, Corona, Franziskaner. Displays bei ihm bestellen. +Ersetzt uns MHD	KW	1	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
6	1	1	Hugendubel	Remigius Leimer	0151/25857206	Bücher, Groh Bücher. Aufsteller. Bestellt selbst. Retourniert selbst.	\N	6	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
7	1	1	Dittmann / (Reichhold Feinkost)	Simone Mösle	0173/6937806	Kommt alle 2 Wochen und bestellt selbst. Voller MHD-Ersatz.	ML	7	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
8	1	1	Dominique	Herr Sadler	0173/8812638 oder 08431/617204	Karten, Geschenkpapier,- Rollen. Auch Saisonal. Kommt selbst und füllt auf	KW	8	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
9	1	1	Feinfix	\N	09081/24672	Kommt selbst. Füllt gleich selbst auf.	\N	9	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
10	1	1	Frankonia Samen	\N	09371/94980	Bestellt selbst. Samen und Zwiebeln im Drehständer	\N	10	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
11	1	1	Gunz	\N	0664/8862359 oder 0043/66488623579	Kommt selbst vorbei. Mit ihm zusammen bestellen. Kein MHD-Ersatz.	\N	11	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
12	1	1	Hacker / Paulaner	Thomas Leirer	0176/14170032	Kommt für Display-Bestellungen + Ersetzt MHD.	ML	12	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
13	1	1	Hartkorn	Stefan Haugg	0151/42259352 oder 0261/98884080	Kommt ca. alle 4 Wochen. Füllt selbst auf.	KW	13	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
14	1	1	Hartmann Öle	Mario Menhard	0177/8234202 oder 0821/483144	Kommt ca. alle 4 Wochen. Füllt selbst auf.	\N	14	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
15	1	1	Heilemann	Claudia Müller	08232/995229	Kommt ca. alle 4 Wochen. Bestellt selbst. Voller MHD-Ersatz Regalware.	\N	15	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
16	1	1	Krini	Michael Grau	01522/8501504 oder 035205/71110	Kommt alle 4 Wochen vorbei. Bestellt selbst.	MK	16	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
17	1	1	Lindt	Christian Kunisch	0160/2810616 oder 0241/88810	Komplettservice - Bestellen, auffüllen. Achtung: Regalwarenbestand bitte niedrig	ML	17	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
18	1	1	Maggi	Herr Gaberdann	0151/12615618	Ersetzt uns MHD.	KW	18	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
19	1	1	MandelMo	Andreas Aigner	0178/4499107	Kommt ca. 1x die Woche / füllt selbst auf	\N	19	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
20	1	1	M&M	\N	06861/9392850	Gutscheine, Telefonkarten...	KW	20	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
21	1	1	Mapa NUK	Veronika Kremer	0173/6170888 oder 04281/730	Kommt selbst. Bestellt selbst.	ML	21	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
22	1	1	Maybeline / LÒREAL	Andrea Schlichtherle	0173/3480937	Bestellt selbst. Ware verräumen wir. Außer bei Umbauten (steht auf Karton)	\N	22	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
23	1	1	Meine Familie und ich...	Fr. Neff KSC	08191/9749555	Auslieferung mit TS alle 3 Monate. Dauerauftrag je 20 Stück MFUI, LAG, DS	\N	23	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
24	1	1	Niederegger	Jaroslava Bretschneider	015157154839	Bestellt selbst. jaroslava.bretschneider@hpm-vertrieb.com	ML	24	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
25	1	1	Nur Die	Karl-Heinz Bartl	0175/1636546	Socken- und Strumpfregal + Aufsteller. Bestellt selbst und räumt selbst ein	KW	25	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
26	1	1	Rila	Uwe Albrecht	0151/11230956 oder 05745/9450	Artikel im gesamten Sortiment verteilt. Kommt ca. alle 4 Wochen. Bestellt selbst.	\N	26	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
27	1	1	Slottke Backwarenvertrieb	Fritz Leidl	0171/3728584	Brot für Holzständer / Dauerauftrag eingerichtet, bei Bedarf anpassen	\N	27	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
28	1	1	Tafel Landsberg	Marlies Klocker	08191/942113 oder 0151/41341504	Anrufen, holen MHD Ware jederzeit ab. Ab 10 Kisten anrufen!	\N	28	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
29	1	1	Tchibo	Martin Fischer	08164/8184	Außendienst kommt Mo. bis 10 Uhr Preiswechsel. Ware kommt Di. Auffüllen Di. o. Mi.	\N	29	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
30	1	1	TEUTO (Fuchs / Ostmann)	Fr. Wolf	0151/41378548 oder 05421/3090	Kommt ca. alle 4 Wochen. Füllt selbst auf.	\N	30	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
32	1	1	TRUNK Zeitungen	Für Bestellungen	089/32471222	Bestellungen dort aufgeben. Kd.-Nr. 210271 angeben	\N	32	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
33	1	1	TRUNK Zeitungen (Außendienst)	Hr. Kitzinger	0171/3069630	Außendienst von Trunk. Rechtzeitig Zeitschriften aussortieren. Niedriger Bestand	\N	33	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
34	1	1	Verdel	Paul Verdel	0031(0)174-792022	Lieferung Di, Do. Lieferservice mit voller Retoure	\N	34	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
35	1	1	Wenco	Herr Mayer	0157/73648989	Kommt jeden 2. Freitag. Bestellt selbst.	\N	35	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
36	1	1	Weber Packaging	Wolfgang Riemer	0173/6927589	Obst-Beutel, Einmalhandschuhe Metzgerei, Becher Metzgerei	\N	36	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
37	1	1	Wenko Tabak	Herr Holaus	05231/309580	Jeden Donnerstag Lieferung (Vereinbarung: Keine Lagerware!!)	\N	37	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
38	1	1	Wilms	Zarko Pavicic	0160/92450061	Artikel im gesamten Sortiment verteilt. Kommt ca. alle 4 Wochen. Bestellt selbst.	\N	38	2026-03-29 13:03:37.090499	2026-03-29 13:03:37.090499	f	f	\N
2	1	1	Allgäuer Ölmühle	Jochen Bentele	0171/3800072	Kommt alle 4 Wochen, bestellt und ersetzt MHD. Info@jobent.de	KM	2	2026-03-29 13:03:37.090499	2026-03-29 13:37:04.469714	f	t	\N
4	1	1	Benker Textil	Marc Domay	0163/7992414	Wolle + Puma-Socken, bestellt selbst, bei Bedarf tel. früher bestellen	\N	4	2026-03-29 13:03:37.090499	2026-03-29 13:37:35.37228	f	f	\N
5	1	1	Bio Zentrale	Marcus Hermann	0172/8822835	Kommt ca. alle 4 Wochen. Bestellt selbst.	\N	5	2026-03-29 13:03:37.090499	2026-03-29 13:37:34.626093	f	f	\N
43	1	1	Diaz Garcia	Herr Diehl	08957868820 Hr. Diehl 015901499941\n	Fischkonserven ÖL bitte nicht vergessen!!!	\N	1	2026-03-29 17:24:55.027563	2026-03-30 15:07:03.59506	t	f	200.00
3	1	1	Bäckerei Manhart	Herr Gerum	0171/8205685	Inhaber Bäckerei Gerum	\N	2	2026-03-29 13:03:37.090499	2026-03-30 15:07:03.59506	t	f	\N
41	1	1	Gepa	\N	00498002615348	\N	\N	3	2026-03-29 17:07:01.041192	2026-03-30 15:07:03.59506	t	f	\N
40	1	1	Himmelbauer	\N	004991879070570	Überall verteilt\n- Tee\n- Salz\n- hinten vei Vegan Braunhirese + Erdmandeln + Flohsamen + Chiasamen + Johannisbrotkernmehl	\N	4	2026-03-29 14:49:32.192841	2026-03-30 15:07:03.59506	t	f	\N
42	1	1	Moser Dinkelnudeln	\N	004982412699\n	\N	\N	5	2026-03-29 17:18:21.278858	2026-03-30 15:07:03.59506	t	f	\N
39	1	1	Seitenbacher	\N	004962813066	Im ganzen Laden verteilt, bitte ordentich schauen. DANKE\n- Zucker\n- hinten bei Vegan: Weizenkeime\n- Kekse\n- Öl\n- Soßenpulver\n- Backzutaten\n- Müsli\n- Müsliriegel	\N	6	2026-03-29 14:37:21.747741	2026-03-30 15:07:03.59506	t	f	\N
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenants (id, name, created_at, master_password) FROM stdin;
1	EDEKA Mustermarkt	2026-03-17 12:22:22.107069	Dallmann2025!
\.


--
-- Data for Name: till_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.till_assignments (id, market_id, assignment_date, shift, till_number, user_id, user_name, notes, created_at, updated_at, uhrzeit) FROM stdin;
1	1	2026-04-01	allgemein	1	\N	\N	\N	2026-04-01 12:49:00.01399	2026-04-01 12:49:18.465919	\N
3	1	2026-04-01	frueh	1	\N	\N	\N	2026-04-01 12:49:12.16605	2026-04-01 12:49:24.768365	\N
\.


--
-- Data for Name: todo_adhoc_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.todo_adhoc_tasks (id, tenant_id, market_id, title, description, priority, deadline, photo_data, created_by_pin, created_by_name, created_at, updated_at, is_completed, completed_by_pin, completed_by_name, completed_at, notify_at) FROM stdin;
1	1	1	Glasscherben im Getränkemarkt	Bitte zusammenkehren und später mit Putzmaschine damit sich Geruch neutralisiert	hoch	2026-03-30 23:00:00	\N	1328	Kai Martin	2026-03-30 19:03:55.914432	2026-03-30 19:12:37.032506	t	1328	Kai Martin	2026-03-30 19:12:37.032506	2026-03-30 23:00:00
2	1	1	test	test	niedrig	2026-03-31 13:18:00	\N	2222	Hinter Schuber	2026-03-30 19:17:01.505683	2026-03-30 19:17:17.83046	t	1328	Kai Martin	2026-03-30 19:17:17.83046	2026-03-31 13:18:00
4	1	1	ddaD	\N	mittel	\N	\N	1328	Kai Martin	2026-03-30 19:21:48.813256	2026-04-01 14:52:09.010213	t	1328	Kai Martin	2026-04-01 14:52:09.010213	\N
3	1	1	Dsad	\N	mittel	\N	\N	2222	Hinter Schuber	2026-03-30 19:21:32.471357	2026-04-01 14:52:13.231761	t	1328	Kai Martin	2026-04-01 14:52:13.231761	\N
\.


--
-- Data for Name: todo_daily_completions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.todo_daily_completions (id, task_id, market_id, completed_date, completed_by_pin, completed_by_name, completed_at, photo_data) FROM stdin;
1	1	1	2026-03-30	2222	Hinter Schuber	2026-03-30 19:12:23.523717	\N
2	2	1	2026-03-30	2222	Hinter Schuber	2026-03-30 19:12:47.359924	\N
\.


--
-- Data for Name: todo_standard_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.todo_standard_tasks (id, tenant_id, market_id, title, description, weekday, priority, is_active, created_at, updated_at, photo_data) FROM stdin;
1	1	1	Einkaufswagen verteilen	\N	1	mittel	t	2026-03-30 16:47:43.98134	2026-03-30 16:47:43.98134	\N
2	1	1	Werbepreisschilder Kontrollieren	\N	1	mittel	t	2026-03-30 19:01:39.183958	2026-03-30 19:01:39.183958	\N
3	1	1	Bier halten	hebe das Bier sehr hoch in die luft	2	mittel	t	2026-03-31 08:28:41.110252	2026-03-31 08:28:41.110252	\N
\.


--
-- Data for Name: training_attendances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.training_attendances (id, session_id, user_id, initials, confirmed_at) FROM stdin;
2	3	11	MMU	2026-03-17 14:53:36.71655
3	3	5	AS	2026-03-17 14:54:00.047913
5	4	8	KM	2026-03-20 18:19:02.048617
6	4	7	MM	2026-03-20 18:19:47.127368
7	6	8	KM	2026-03-23 18:27:37.087578
8	6	7	MM	2026-03-23 18:27:53.704898
9	7	8	KM	2026-03-24 07:53:37.517031
10	8	8	KM	2026-03-24 10:47:39.085457
11	12	13	HSC	2026-03-25 10:45:13.683064
12	12	8	KM	2026-03-25 10:45:29.961972
13	13	8	KM	2026-03-25 10:46:21.074546
14	13	13	HSC	2026-03-25 10:46:29.61179
15	12	7	MM	2026-03-25 13:11:15.911252
16	13	7	MM	2026-03-25 14:00:28.182862
\.


--
-- Data for Name: training_session_topics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.training_session_topics (id, session_id, topic_id, custom_title, checked) FROM stdin;
54	12	8	\N	f
55	12	9	\N	t
56	12	10	\N	f
57	12	16	\N	t
58	12	17	\N	t
59	12	18	\N	f
60	12	19	\N	f
61	12	13	\N	f
25	3	1	\N	f
62	12	11	\N	f
63	12	12	\N	f
40	7	1	\N	t
1	1	1	\N	t
2	1	2	\N	f
3	1	3	\N	f
4	1	4	\N	f
5	1	5	\N	f
6	1	6	\N	f
7	1	7	\N	f
8	1	8	\N	f
9	1	9	\N	f
10	1	10	\N	f
11	1	11	\N	f
12	1	12	\N	f
13	1	13	\N	f
41	7	2	\N	t
42	7	4	\N	t
43	7	8	\N	t
44	7	12	\N	t
27	4	1	\N	t
26	4	2	\N	t
28	4	3	\N	t
29	4	4	\N	f
45	8	3	\N	t
46	8	15	test	t
30	5	1	\N	t
31	5	2	\N	t
32	5	3	\N	t
33	5	9	\N	t
34	5	10	\N	t
35	6	1	\N	t
36	6	2	\N	t
37	6	3	\N	t
38	6	7	\N	t
39	6	14	GT3 Drift Test	t
47	12	1	\N	t
48	12	2	\N	t
49	12	3	\N	t
50	12	4	\N	t
51	12	5	\N	t
52	12	6	\N	t
53	12	7	\N	t
\.


--
-- Data for Name: training_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.training_sessions (id, tenant_id, market_id, session_date, trainer_id, trainer_name, notes, created_at, updated_at, session_type) FROM stdin;
3	1	1	2026-03-17	9	System Admin	\N	2026-03-17 14:53:05.90139	2026-03-17 14:53:05.90139	schulungsprotokoll
1	1	1	2026-03-17	9	System Admin	\N	2026-03-17 14:16:28.706651	2026-03-20 17:34:02.821	schulungsprotokoll
4	1	1	2026-03-20	\N	\N	\N	2026-03-20 17:34:46.619321	2026-03-23 15:57:13.846	schulungsprotokoll
5	1	1	2026-03-20	10	Kai Martin	\N	2026-03-20 18:18:28.378064	2026-03-23 17:09:44.677	schulungsprotokoll
6	1	1	2026-03-23	\N	\N	\N	2026-03-23 18:27:22.085536	2026-03-23 18:27:49.057	schulungsprotokoll
7	1	1	2026-03-24	7	Max Mustermann	test	2026-03-24 07:53:04.053917	2026-03-24 07:53:21.67	schulungsprotokoll
8	1	1	2026-03-24	10	Kai Martin	\N	2026-03-24 10:47:06.473016	2026-03-24 10:47:27.962	schulungsprotokoll
12	1	1	2026-03-25	7	Max Mustermann	\N	2026-03-25 10:44:15.809016	2026-03-25 10:45:20.476	schulungsprotokoll
13	1	1	2026-03-25	\N	huber	\N	2026-03-25 10:46:08.74687	2026-03-25 10:46:08.74687	taraschulung
\.


--
-- Data for Name: training_topics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.training_topics (id, title, responsible, training_material, sort_order, is_default, created_at) FROM stdin;
1	Jährliche Belehrung und Belehrung beim Eintritt gem. § 43 Abs. 4 Infektionsschutzgesetz (IfSG)	Marktleitung oder Inhaber	Kapitel 4.2 oder EDEKA Wissensportal	1	t	2026-03-17 14:11:58.506281
2	Hygieneschulung (Personal-, Betriebshygiene, Reinigung/Desinfektion, Schädlingsmonitoring, HACCP etc.)	Marktleitung oder Inhaber	Kapitel 4.3 oder EDEKA Wissensportal unter "Das 1x1 der EDEKA-Qualitätssicherung"	2	t	2026-03-17 14:11:58.506281
3	Bio/Öko-Lebensmittel (insb. Warentrennung, Verhinderung Kontamination/Vermischung, Kennzeichnung, Massenbilanz)	Marktleitung oder Inhaber	Kapitel	3	t	2026-03-17 14:11:58.506281
4	Handel mit freiverkäuflichen Arzneimitteln (Belehrung zum Umgang mit freiverkäuflichen Arzneimitteln nach §50 Arzneimittelgesetz (AMG))	Marktleitung oder Inhaber	Kapitel 4.4 oder EDEKA Wissensportal	4	t	2026-03-17 14:11:58.506281
5	Herstellung von leicht verderblichen Lebensmitteln (Achtung: diese Schulung ersetzt nicht die Schulung "Hackfleischführerschein")	Marktleitung oder Inhaber	Kapitel 4.5	5	t	2026-03-17 14:11:58.506281
6	Verkauf von QS-Ware nach dem System "QS Qualität und Sicherheit GmbH"	Marktleitung oder Inhaber	Kapitel 4.4	6	t	2026-03-17 14:11:58.506281
7	Rindfleischetikettierung	Marktleitung oder Inhaber	Kapitel 9.5 oder EDEKA Wissensportal	7	t	2026-03-17 14:11:58.506281
8	Verkauf von unverpackter, loser GQ-Ware wie z.B. Rind-, Schweine-/GQ-Wurstwaren, Putenfleisch, Puten, Käse etc. nach dem System "Geprüfte Qualität – Bayern GQ" mit Auslobung über die Bedienungstheke. (Umsetzung, Ein-/ Ausgangsdokumentation, Verhalten bei einer Kontrolle etc.)	Marktleitung oder Inhaber	Kapitel 9.5 oder EDEKA Wissensportal	8	t	2026-03-17 14:11:58.506281
9	Verkauf von MSC-Fisch über die Bedienungstheke	F&W Fachberater	Kapitel 11.0 oder Schulungspräsentation	9	t	2026-03-17 14:11:58.506281
10	Verhalten bei Salmonellenbefall – Durchzuführende Maßnahmen	Marktleitung oder Inhaber	Kapitel 4.6	10	t	2026-03-17 14:11:58.506281
16	Warenrücknahme und Warenrückruf – REVOCO	Marktleiter oder Inhaber	EDEKA next	11	t	2026-03-25 09:28:54.163676
17	Unfallverhütung/Arbeitssicherheit	Marktleiter oder Inhaber	Unterlagen der BG	12	t	2026-03-25 09:28:54.163676
18	Feuerwerksverkauf	Marktleiter oder Inhaber	Intranet, EDEKA next	13	t	2026-03-25 09:28:54.163676
19	Verhalten bei Überfall	Marktleiter oder Inhaber	Intranet, EDEKA next	14	t	2026-03-25 09:28:54.163676
11	Unfallverhütungsvorschriften der Berufsgenossenschaft (berufsgenossenschaftliche Informationen, BG-Merkblätter etc.)	Marktleiter oder Inhaber	Unterlagen der Berufsgenossenschaft	91	t	2026-03-17 14:11:58.506281
12	Innerbetriebliche Arbeitssicherheit (Brandschutz, Gefährdungsbeurteilung, Gefahrstoffe, Maschineneinweisung etc.)	Marktleiter oder Inhaber	Unterlagen der Berufsgenossenschaft	92	t	2026-03-17 14:11:58.506281
13	Sonstiges			15	t	2026-03-17 14:11:58.506281
14	GT3 Drift Test	\N	\N	99	f	2026-03-23 18:27:22.100936
15	test	\N	\N	99	f	2026-03-24 10:47:06.509141
\.


--
-- Data for Name: tuev_jahresbericht; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tuev_jahresbericht (id, tenant_id, year, zertifikate_dokument, zertifikate_notizen, pruefungen_dokument, pruefungen_notizen, aktionsplan_foto, aktionsplan_massnahmen, created_at, updated_at, market_id) FROM stdin;
\.


--
-- Data for Name: user_market_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_market_assignments (id, user_id, market_id, created_at) FROM stdin;
1	7	1	2026-03-17 13:47:16.771434
\.


--
-- Data for Name: user_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_permissions (id, user_id, permission_type, resource_type, resource_id, granted, created_at) FROM stdin;
6	7	users.view	global	\N	t	2026-03-17 13:47:16.76693
7	7	entries.create	global	\N	t	2026-03-17 13:47:16.76693
8	7	entries.view_all	global	\N	t	2026-03-17 13:47:16.76693
9	7	entries.edit	global	\N	t	2026-03-17 13:47:16.76693
10	7	reports.view	global	\N	t	2026-03-17 13:47:16.76693
27	5	users.view	global	\N	t	2026-03-25 12:02:43.889617
28	5	users.manage	global	\N	t	2026-03-25 12:02:43.889617
29	5	users.invite_admin	global	\N	t	2026-03-25 12:02:43.889617
30	5	entries.create	global	\N	t	2026-03-25 12:02:43.889617
31	5	entries.view_all	global	\N	t	2026-03-25 12:02:43.889617
32	5	entries.edit	global	\N	t	2026-03-25 12:02:43.889617
33	5	entries.delete	global	\N	t	2026-03-25 12:02:43.889617
34	5	reports.view	global	\N	t	2026-03-25 12:02:43.889617
35	5	reports.export	global	\N	t	2026-03-25 12:02:43.889617
36	16	users.view	global	\N	t	2026-03-31 07:30:26.042987
37	16	users.manage	global	\N	t	2026-03-31 07:30:26.042987
38	16	entries.create	global	\N	t	2026-03-31 07:30:26.042987
39	16	entries.view_all	global	\N	t	2026-03-31 07:30:26.042987
40	16	entries.edit	global	\N	t	2026-03-31 07:30:26.042987
41	16	reports.view	global	\N	t	2026-03-31 07:30:26.042987
42	16	reports.export	global	\N	t	2026-03-31 07:30:26.042987
43	16	verwaltung.access	global	\N	t	2026-03-31 07:30:26.042987
44	17	users.view	global	\N	t	2026-03-31 09:04:51.116844
45	17	users.manage	global	\N	t	2026-03-31 09:04:51.116844
46	17	users.invite_admin	global	\N	t	2026-03-31 09:04:51.116844
47	17	entries.create	global	\N	t	2026-03-31 09:04:51.116844
48	17	entries.view_all	global	\N	t	2026-03-31 09:04:51.116844
49	17	entries.edit	global	\N	t	2026-03-31 09:04:51.116844
50	17	entries.delete	global	\N	t	2026-03-31 09:04:51.116844
51	17	reports.view	global	\N	t	2026-03-31 09:04:51.116844
52	17	reports.export	global	\N	t	2026-03-31 09:04:51.116844
53	17	verwaltung.access	global	\N	t	2026-03-31 09:04:51.116844
54	17	settings.manage	global	\N	t	2026-03-31 10:29:26.275995
55	17	devices.manage	global	\N	t	2026-03-31 10:29:26.275995
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, tenant_id, name, email, role, initials, pin, created_at, first_name, last_name, birth_date, is_registered, password, status, gruppe, assigned_market_ids) FROM stdin;
8	1	Kai Martin	\N	USER	KM	1328	2026-03-17 13:09:54.619504	Kai	Martin	1980-09-13	t	\N	aktiv	\N	\N
9	1	System Admin	admin@haccp.de	SUPERADMIN	\N	\N	2026-03-17 13:14:46.951647	System	Admin	\N	t	b4d47712d984a4a545421fe9d039e8e9:9df1494dfc2d8daa2087348cd960939d4ce7b9fe3d7aa820f3fb117aa372a8718164f2841b097d13878723212f0fbb8c4713b54640401bb95438589429fd8677	aktiv	\N	\N
10	1	Kai Martin	kai.martin@test.de	ADMIN	\N	\N	2026-03-17 13:30:03.97856	Kai	Martin	\N	t	ba03259695dea3e2dffc5c63be79e9e3:ea3986f1829a681e5ae70472ffcb3363889e71ebe8f918626e652758dd693d6f6dde362ec15912d5726dd1dba4a8cfb2b9be53c503dfc2ceca56407f0d1313c7	aktiv	\N	\N
7	1	Max Mustermann	\N	MARKTLEITER	MM	1111	2026-03-17 13:09:04.263058	Max	Mustermann	2020-01-01	t	\N	aktiv	\N	\N
11	1	Max Mustermann	\N	USER	MMU	1234	2026-03-17 14:50:08.642888	Max	Mustermann	1990-01-15	t	\N	aktiv	\N	\N
12	1	System Admin	\N	USER	SA	\N	2026-03-19 14:20:49.416955	System	Admin	1983-06-25	t	\N	aktiv	\N	\N
13	1	Hinter Schuber	\N	USER	HSC	2222	2026-03-25 10:41:45.546557	Hinter	Schuber	1979-03-14	t	\N	aktiv	\N	\N
5	1	Anna Schmidt	\N	ADMIN	AS	5678	2026-03-17 12:56:53.828016	Anna	Schmidt	1995-06-15	t	\N	aktiv	\N	\N
15	1	Onur	\N	USER	ON	\N	2026-03-26 10:09:58.100091	Onur		\N	t	\N	aktiv	\N	\N
16	1	Kai Martin	kai.martin@edeka-dallmann.de	BEREICHSLEITUNG	KMA	4429	2026-03-31 07:26:05.333152	Kai	Martin	1982-09-13	t	a4be3b89ad9afbea9b7065676f7452ed:c2cda7be2899caef3d832457e68ff5deb4c829689eb1c5e3f1cc60df40dcbd33a11028d64b39fc3923bc1e420ae2e1a09d8fa5ed6f7e0f40beac35171f26a6fe	aktiv	gesamter_markt	\N
17	1	Michael Dallmann	Michael.Dallmann@edeka-dallmann.de	ADMIN	DM	4747	2026-03-31 09:04:04.63336	Michael	Dallmann	1983-02-16	t	252ff03816a35adbb4d9bfc7662f1b73:de6d9fdb9c4bbd2095f21d31442c3677274c6375d6f63fc915431a1875c1dec71c5ce458ed3331eba36b728cb09949a147a54ec7a145c1a4bebb5893ef8e5027	aktiv	\N	\N
\.


--
-- Data for Name: ware_bestellungen; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ware_bestellungen (id, market_id, rayon_id, datum, kuerzel, anmerkung, created_at) FROM stdin;
\.


--
-- Data for Name: ware_einraeumservice; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ware_einraeumservice (id, market_id, datum, dienstleister, paletten, personal, beginn, ende, anmerkungen, kuerzel, created_at) FROM stdin;
1	1	2026-03-21	Team Leder	12	3	06:00:00	09:30:00	\N	MK	2026-03-21 19:11:58.91187+00
\.


--
-- Data for Name: ware_mhd_bereiche; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ware_mhd_bereiche (id, market_id, name, beschreibung, intervall_tage, reduzierung_tage, entnahme_tage, sort_order, aktiv, created_at, zone, farbe) FROM stdin;
86	1	R1 Meter 1	\N	3	7	2	1	f	2026-03-22 10:35:56.041632+00	Regal 1	#dc2626
87	1	R1 Meter 2	\N	3	7	2	2	f	2026-03-22 10:35:56.041632+00	Regal 1	#dc2626
88	1	R1 Meter 3	\N	3	7	2	3	f	2026-03-22 10:35:56.041632+00	Regal 1	#dc2626
89	1	R1 Meter 4	\N	3	7	2	4	f	2026-03-22 10:35:56.041632+00	Regal 1	#dc2626
90	1	R1 Meter 5	\N	3	7	2	5	f	2026-03-22 10:35:56.041632+00	Regal 1	#dc2626
91	1	R1 Meter 6	\N	3	7	2	6	f	2026-03-22 10:35:56.041632+00	Regal 1	#dc2626
92	1	R1 Meter 7	\N	3	7	2	7	f	2026-03-22 10:35:56.041632+00	Regal 1	#dc2626
93	1	R1 Meter 8	\N	3	7	2	8	f	2026-03-22 10:35:56.041632+00	Regal 1	#dc2626
94	1	R1 Meter 9	\N	3	7	2	9	f	2026-03-22 10:35:56.041632+00	Regal 1	#dc2626
95	1	R1 Meter 10	\N	3	7	2	10	f	2026-03-22 10:35:56.041632+00	Regal 1	#dc2626
96	1	R2 Meter 1	\N	1	3	1	11	f	2026-03-22 10:35:56.041632+00	Regal 2	#1d4ed8
97	1	R2 Meter 2	\N	1	3	1	12	f	2026-03-22 10:35:56.041632+00	Regal 2	#1d4ed8
98	1	R2 Meter 3	\N	1	3	1	13	f	2026-03-22 10:35:56.041632+00	Regal 2	#1d4ed8
99	1	R2 Meter 4	\N	1	3	1	14	f	2026-03-22 10:35:56.041632+00	Regal 2	#1d4ed8
100	1	R2 Meter 5	\N	1	3	1	15	f	2026-03-22 10:35:56.041632+00	Regal 2	#1d4ed8
101	1	R2 Meter 6	\N	1	3	1	16	f	2026-03-22 10:35:56.041632+00	Regal 2	#1d4ed8
102	1	R2 Meter 7	\N	1	3	1	17	f	2026-03-22 10:35:56.041632+00	Regal 2	#1d4ed8
103	1	R2 Meter 8	\N	1	3	1	18	f	2026-03-22 10:35:56.041632+00	Regal 2	#1d4ed8
104	1	KW Meter 1	\N	1	2	1	20	f	2026-03-22 10:35:56.041632+00	Kuehlwand	#0891b2
105	1	KW Meter 2	\N	1	2	1	21	f	2026-03-22 10:35:56.041632+00	Kuehlwand	#0891b2
106	1	KW Meter 3	\N	1	2	1	22	f	2026-03-22 10:35:56.041632+00	Kuehlwand	#0891b2
107	1	KW Meter 4	\N	1	2	1	23	f	2026-03-22 10:35:56.041632+00	Kuehlwand	#0891b2
108	1	KW Meter 5	\N	1	2	1	24	f	2026-03-22 10:35:56.041632+00	Kuehlwand	#0891b2
109	1	KR Getränke 1	\N	1	3	1	1	f	2026-03-22 11:04:38.776835+00	Getränkemarkt	#0891b2
110	1	KR Getränke 2	\N	1	3	1	2	f	2026-03-22 11:04:38.776835+00	Getränkemarkt	#0891b2
111	1	KR Getränke 3	\N	1	3	1	3	f	2026-03-22 11:04:38.776835+00	Getränkemarkt	#0891b2
317	1	KR Getränke 2	\N	1	3	1	2	f	2026-03-23 12:16:50.656595+00	Getränkemarkt	#0891b2
243	1	Regal 6	\N	1	3	1	47	f	2026-03-23 11:24:49.147763+00	Regale	#475569
244	1	Kühlregal 3	\N	1	3	1	48	f	2026-03-23 11:24:49.147763+00	Kühlregale rechts	#2563eb
254	1	Sonderregal A	\N	1	3	1	20	f	2026-03-23 11:45:24.042985+00	Sonderregale	#dc2626
159	1	KR Getränke 5	\N	1	3	1	5	f	2026-03-22 11:08:09.569267+00	Getränkemarkt	#0891b2
160	1	KR Getränke 6	\N	1	3	1	6	f	2026-03-22 11:08:09.569267+00	Getränkemarkt	#0891b2
161	1	Meges Kühlregal	\N	1	3	1	10	f	2026-03-22 11:08:09.569267+00	Meges	#2563eb
162	1	Sonderregal A	\N	1	3	1	20	f	2026-03-22 11:08:09.569267+00	Sonderregale	#dc2626
163	1	Sonderregal B	\N	1	3	1	21	f	2026-03-22 11:08:09.569267+00	Sonderregale	#dc2626
164	1	TK-Insel 1	\N	1	3	1	30	f	2026-03-22 11:08:09.569267+00	TK-Inseln	#7c3aed
165	1	TK-Insel 2	\N	1	3	1	31	f	2026-03-22 11:08:09.569267+00	TK-Inseln	#7c3aed
166	1	TK-Insel 3	\N	1	3	1	32	f	2026-03-22 11:08:09.569267+00	TK-Inseln	#7c3aed
167	1	Regal 1	\N	1	3	1	40	f	2026-03-22 11:08:09.569267+00	Regale	#475569
168	1	Regal 2	\N	1	3	1	41	f	2026-03-22 11:08:09.569267+00	Regale	#475569
169	1	Kühlregal 1	\N	1	3	1	42	f	2026-03-22 11:08:09.569267+00	Kühlregale rechts	#2563eb
170	1	Regal 3	\N	1	3	1	43	f	2026-03-22 11:08:09.569267+00	Regale	#475569
171	1	Regal 4	\N	1	3	1	44	f	2026-03-22 11:08:09.569267+00	Regale	#475569
172	1	Kühlregal 2	\N	1	3	1	45	f	2026-03-22 11:08:09.569267+00	Kühlregale rechts	#2563eb
173	1	Regal 5	\N	1	3	1	46	f	2026-03-22 11:08:09.569267+00	Regale	#475569
174	1	Regal 6	\N	1	3	1	47	f	2026-03-22 11:08:09.569267+00	Regale	#475569
175	1	Kühlregal 3	\N	1	3	1	48	f	2026-03-22 11:08:09.569267+00	Kühlregale rechts	#2563eb
176	1	BB Wurst Kühlregal	\N	1	3	1	50	f	2026-03-22 11:08:09.569267+00	Wurst/Käse/Fleisch	#b91c1c
177	1	Kühlregal Kasse	\N	1	3	1	60	f	2026-03-22 11:08:09.569267+00	Kasse	#0891b2
178	1	KR Getränke 1	\N	1	3	1	1	f	2026-03-22 11:08:11.743861+00	Getränkemarkt	#0891b2
179	1	KR Getränke 2	\N	1	3	1	2	f	2026-03-22 11:08:11.743861+00	Getränkemarkt	#0891b2
112	1	KR Getränke 4	\N	1	3	1	4	f	2026-03-22 11:04:38.776835+00	Getränkemarkt	#0891b2
113	1	KR Getränke 5	\N	1	3	1	5	f	2026-03-22 11:04:38.776835+00	Getränkemarkt	#0891b2
114	1	KR Getränke 6	\N	1	3	1	6	f	2026-03-22 11:04:38.776835+00	Getränkemarkt	#0891b2
115	1	Meges Kühlregal	\N	1	3	1	10	f	2026-03-22 11:04:38.776835+00	Meges	#2563eb
116	1	Sonderregal A	\N	1	3	1	20	f	2026-03-22 11:04:38.776835+00	Sonderregale	#dc2626
117	1	Sonderregal B	\N	1	3	1	21	f	2026-03-22 11:04:38.776835+00	Sonderregale	#dc2626
118	1	TK-Insel 1	\N	1	3	1	30	f	2026-03-22 11:04:38.776835+00	TK-Inseln	#7c3aed
119	1	TK-Insel 2	\N	1	3	1	31	f	2026-03-22 11:04:38.776835+00	TK-Inseln	#7c3aed
120	1	TK-Insel 3	\N	1	3	1	32	f	2026-03-22 11:04:38.776835+00	TK-Inseln	#7c3aed
121	1	Regal 1	\N	1	3	1	40	f	2026-03-22 11:04:38.776835+00	Regale	#475569
122	1	Regal 2	\N	1	3	1	41	f	2026-03-22 11:04:38.776835+00	Regale	#475569
123	1	Kühlregal 1	\N	1	3	1	42	f	2026-03-22 11:04:38.776835+00	Kühlregale rechts	#2563eb
124	1	Regal 3	\N	1	3	1	43	f	2026-03-22 11:04:38.776835+00	Regale	#475569
125	1	Regal 4	\N	1	3	1	44	f	2026-03-22 11:04:38.776835+00	Regale	#475569
126	1	Kühlregal 2	\N	1	3	1	45	f	2026-03-22 11:04:38.776835+00	Kühlregale rechts	#2563eb
127	1	Regal 5	\N	1	3	1	46	f	2026-03-22 11:04:38.776835+00	Regale	#475569
128	1	Regal 6	\N	1	3	1	47	f	2026-03-22 11:04:38.776835+00	Regale	#475569
129	1	Kühlregal 3	\N	1	3	1	48	f	2026-03-22 11:04:38.776835+00	Kühlregale rechts	#2563eb
130	1	BB Wurst Kühlregal	\N	1	3	1	50	f	2026-03-22 11:04:38.776835+00	Wurst/Käse/Fleisch	#b91c1c
131	1	Kühlregal Kasse	\N	1	3	1	60	f	2026-03-22 11:04:38.776835+00	Kasse	#0891b2
132	1	KR Getränke 1	\N	1	3	1	1	f	2026-03-22 11:04:42.600988+00	Getränkemarkt	#0891b2
133	1	KR Getränke 2	\N	1	3	1	2	f	2026-03-22 11:04:42.600988+00	Getränkemarkt	#0891b2
134	1	KR Getränke 3	\N	1	3	1	3	f	2026-03-22 11:04:42.600988+00	Getränkemarkt	#0891b2
135	1	KR Getränke 4	\N	1	3	1	4	f	2026-03-22 11:04:42.600988+00	Getränkemarkt	#0891b2
136	1	KR Getränke 5	\N	1	3	1	5	f	2026-03-22 11:04:42.600988+00	Getränkemarkt	#0891b2
137	1	KR Getränke 6	\N	1	3	1	6	f	2026-03-22 11:04:42.600988+00	Getränkemarkt	#0891b2
138	1	Meges Kühlregal	\N	1	3	1	10	f	2026-03-22 11:04:42.600988+00	Meges	#2563eb
139	1	Sonderregal A	\N	1	3	1	20	f	2026-03-22 11:04:42.600988+00	Sonderregale	#dc2626
140	1	Sonderregal B	\N	1	3	1	21	f	2026-03-22 11:04:42.600988+00	Sonderregale	#dc2626
180	1	KR Getränke 3	\N	1	3	1	3	f	2026-03-22 11:08:11.743861+00	Getränkemarkt	#0891b2
181	1	KR Getränke 4	\N	1	3	1	4	f	2026-03-22 11:08:11.743861+00	Getränkemarkt	#0891b2
182	1	KR Getränke 5	\N	1	3	1	5	f	2026-03-22 11:08:11.743861+00	Getränkemarkt	#0891b2
183	1	KR Getränke 6	\N	1	3	1	6	f	2026-03-22 11:08:11.743861+00	Getränkemarkt	#0891b2
184	1	Meges Kühlregal	\N	1	3	1	10	f	2026-03-22 11:08:11.743861+00	Meges	#2563eb
185	1	Sonderregal A	\N	1	3	1	20	f	2026-03-22 11:08:11.743861+00	Sonderregale	#dc2626
187	1	TK-Insel 1	\N	1	3	1	30	f	2026-03-22 11:08:11.743861+00	TK-Inseln	#7c3aed
194	1	Regal 4	\N	1	3	1	44	f	2026-03-22 11:08:11.743861+00	Regale	#475569
195	1	Kühlregal 2	\N	1	3	1	45	f	2026-03-22 11:08:11.743861+00	Kühlregale rechts	#2563eb
196	1	Regal 5	\N	1	3	1	46	f	2026-03-22 11:08:11.743861+00	Regale	#475569
285	1	Regal 3	\N	1	3	1	43	f	2026-03-23 11:54:19.385894+00	Regale	#475569
286	1	Regal 4	\N	1	3	1	44	f	2026-03-23 11:54:19.385894+00	Regale	#475569
287	1	Kühlregal 2	\N	1	3	1	45	f	2026-03-23 11:54:19.385894+00	Kühlregale rechts	#2563eb
288	1	Regal 5	\N	1	3	1	46	f	2026-03-23 11:54:19.385894+00	Regale	#475569
141	1	TK-Insel 1	\N	1	3	1	30	f	2026-03-22 11:04:42.600988+00	TK-Inseln	#7c3aed
142	1	TK-Insel 2	\N	1	3	1	31	f	2026-03-22 11:04:42.600988+00	TK-Inseln	#7c3aed
143	1	TK-Insel 3	\N	1	3	1	32	f	2026-03-22 11:04:42.600988+00	TK-Inseln	#7c3aed
144	1	Regal 1	\N	1	3	1	40	f	2026-03-22 11:04:42.600988+00	Regale	#475569
145	1	Regal 2	\N	1	3	1	41	f	2026-03-22 11:04:42.600988+00	Regale	#475569
146	1	Kühlregal 1	\N	1	3	1	42	f	2026-03-22 11:04:42.600988+00	Kühlregale rechts	#2563eb
147	1	Regal 3	\N	1	3	1	43	f	2026-03-22 11:04:42.600988+00	Regale	#475569
148	1	Regal 4	\N	1	3	1	44	f	2026-03-22 11:04:42.600988+00	Regale	#475569
149	1	Kühlregal 2	\N	1	3	1	45	f	2026-03-22 11:04:42.600988+00	Kühlregale rechts	#2563eb
150	1	Regal 5	\N	1	3	1	46	f	2026-03-22 11:04:42.600988+00	Regale	#475569
151	1	Regal 6	\N	1	3	1	47	f	2026-03-22 11:04:42.600988+00	Regale	#475569
152	1	Kühlregal 3	\N	1	3	1	48	f	2026-03-22 11:04:42.600988+00	Kühlregale rechts	#2563eb
153	1	BB Wurst Kühlregal	\N	1	3	1	50	f	2026-03-22 11:04:42.600988+00	Wurst/Käse/Fleisch	#b91c1c
245	1	BB Wurst Kühlregal	\N	1	3	1	50	f	2026-03-23 11:24:49.147763+00	Wurst/Käse/Fleisch	#b91c1c
246	1	Kühlregal Kasse	\N	1	3	1	60	f	2026-03-23 11:24:49.147763+00	Kasse	#0891b2
247	1	KR Getränke 1	\N	1	3	1	1	f	2026-03-23 11:45:24.042985+00	Getränkemarkt	#0891b2
249	1	KR Getränke 3	\N	1	3	1	3	f	2026-03-23 11:45:24.042985+00	Getränkemarkt	#0891b2
250	1	KR Getränke 4	\N	1	3	1	4	f	2026-03-23 11:45:24.042985+00	Getränkemarkt	#0891b2
251	1	KR Getränke 5	\N	1	3	1	5	f	2026-03-23 11:45:24.042985+00	Getränkemarkt	#0891b2
252	1	KR Getränke 6	\N	1	3	1	6	f	2026-03-23 11:45:24.042985+00	Getränkemarkt	#0891b2
253	1	Meges Kühlregal	\N	1	3	1	10	f	2026-03-23 11:45:24.042985+00	Meges	#2563eb
289	1	Regal 6	\N	1	3	1	47	f	2026-03-23 11:54:19.385894+00	Regale	#475569
290	1	Kühlregal 3	\N	1	3	1	48	f	2026-03-23 11:54:19.385894+00	Kühlregale rechts	#2563eb
291	1	BB Wurst Kühlregal	\N	1	3	1	50	f	2026-03-23 11:54:19.385894+00	Wurst/Käse/Fleisch	#b91c1c
292	1	Kühlregal Kasse	\N	1	3	1	60	f	2026-03-23 11:54:19.385894+00	Kasse	#0891b2
293	1	KR Getränke 1	\N	1	3	1	1	f	2026-03-23 11:57:48.513359+00	Getränkemarkt	#0891b2
294	1	KR Getränke 2	\N	1	3	1	2	f	2026-03-23 11:57:48.513359+00	Getränkemarkt	#0891b2
295	1	KR Getränke 3	\N	1	3	1	3	f	2026-03-23 11:57:48.513359+00	Getränkemarkt	#0891b2
296	1	KR Getränke 4	\N	1	3	1	4	f	2026-03-23 11:57:48.513359+00	Getränkemarkt	#0891b2
297	1	KR Getränke 5	\N	1	3	1	5	f	2026-03-23 11:57:48.513359+00	Getränkemarkt	#0891b2
298	1	KR Getränke 6	\N	1	3	1	6	f	2026-03-23 11:57:48.513359+00	Getränkemarkt	#0891b2
299	1	Meges Kühlregal	\N	1	3	1	10	f	2026-03-23 11:57:48.513359+00	Meges	#2563eb
300	1	Sonderregal A	\N	1	3	1	20	f	2026-03-23 11:57:48.513359+00	Sonderregale	#dc2626
301	1	Sonderregal B	\N	1	3	1	21	f	2026-03-23 11:57:48.513359+00	Sonderregale	#dc2626
302	1	TK-Insel 1	\N	1	3	1	30	f	2026-03-23 11:57:48.513359+00	TK-Inseln	#7c3aed
303	1	TK-Insel 2	\N	1	3	1	31	f	2026-03-23 11:57:48.513359+00	TK-Inseln	#7c3aed
304	1	TK-Insel 3	\N	1	3	1	32	f	2026-03-23 11:57:48.513359+00	TK-Inseln	#7c3aed
305	1	Regal 1	\N	1	3	1	40	f	2026-03-23 11:57:48.513359+00	Regale	#475569
306	1	Regal 2	\N	1	3	1	41	f	2026-03-23 11:57:48.513359+00	Regale	#475569
307	1	Kühlregal 1	\N	1	3	1	42	f	2026-03-23 11:57:48.513359+00	Kühlregale rechts	#2563eb
308	1	Regal 3	\N	1	3	1	43	f	2026-03-23 11:57:48.513359+00	Regale	#475569
309	1	Regal 4	\N	1	3	1	44	f	2026-03-23 11:57:48.513359+00	Regale	#475569
310	1	Kühlregal 2	\N	1	3	1	45	f	2026-03-23 11:57:48.513359+00	Kühlregale rechts	#2563eb
311	1	Regal 5	\N	1	3	1	46	f	2026-03-23 11:57:48.513359+00	Regale	#475569
312	1	Regal 6	\N	1	3	1	47	f	2026-03-23 11:57:48.513359+00	Regale	#475569
313	1	Kühlregal 3	\N	1	3	1	48	f	2026-03-23 11:57:48.513359+00	Kühlregale rechts	#2563eb
314	1	BB Wurst Kühlregal	\N	1	3	1	50	f	2026-03-23 11:57:48.513359+00	Wurst/Käse/Fleisch	#b91c1c
315	1	Kühlregal Kasse	\N	1	3	1	60	f	2026-03-23 11:57:48.513359+00	Kasse	#0891b2
316	1	KR Getränke 1	\N	1	3	1	1	f	2026-03-23 12:16:50.656595+00	Getränkemarkt	#0891b2
188	1	TK-Insel 2	\N	1	3	1	31	f	2026-03-22 11:08:11.743861+00	TK-Inseln	#7c3aed
189	1	TK-Insel 3	\N	1	3	1	32	f	2026-03-22 11:08:11.743861+00	TK-Inseln	#7c3aed
190	1	Regal 1	\N	1	3	1	40	f	2026-03-22 11:08:11.743861+00	Regale	#475569
191	1	Regal 2	\N	1	3	1	41	f	2026-03-22 11:08:11.743861+00	Regale	#475569
192	1	Kühlregal 1	\N	1	3	1	42	f	2026-03-22 11:08:11.743861+00	Kühlregale rechts	#2563eb
193	1	Regal 3	\N	1	3	1	43	f	2026-03-22 11:08:11.743861+00	Regale	#475569
214	1	Regal 2	\N	1	3	1	41	f	2026-03-23 11:15:04.36211+00	Regale	#475569
215	1	Kühlregal 1	\N	1	3	1	42	f	2026-03-23 11:15:04.36211+00	Kühlregale rechts	#2563eb
216	1	Regal 3	\N	1	3	1	43	f	2026-03-23 11:15:04.36211+00	Regale	#475569
217	1	Regal 4	\N	1	3	1	44	f	2026-03-23 11:15:04.36211+00	Regale	#475569
218	1	Kühlregal 2	\N	1	3	1	45	f	2026-03-23 11:15:04.36211+00	Kühlregale rechts	#2563eb
219	1	Regal 5	\N	1	3	1	46	f	2026-03-23 11:15:04.36211+00	Regale	#475569
220	1	Regal 6	\N	1	3	1	47	f	2026-03-23 11:15:04.36211+00	Regale	#475569
221	1	Kühlregal 3	\N	1	3	1	48	f	2026-03-23 11:15:04.36211+00	Kühlregale rechts	#2563eb
222	1	BB Wurst Kühlregal	\N	1	3	1	50	f	2026-03-23 11:15:04.36211+00	Wurst/Käse/Fleisch	#b91c1c
223	1	Kühlregal Kasse	\N	1	3	1	60	f	2026-03-23 11:15:04.36211+00	Kasse	#0891b2
224	1	KR Getränke 1	\N	1	3	1	1	f	2026-03-23 11:24:49.147763+00	Getränkemarkt	#0891b2
225	1	KR Getränke 2	\N	1	3	1	2	f	2026-03-23 11:24:49.147763+00	Getränkemarkt	#0891b2
226	1	KR Getränke 3	\N	1	3	1	3	f	2026-03-23 11:24:49.147763+00	Getränkemarkt	#0891b2
227	1	KR Getränke 4	\N	1	3	1	4	f	2026-03-23 11:24:49.147763+00	Getränkemarkt	#0891b2
228	1	KR Getränke 5	\N	1	3	1	5	f	2026-03-23 11:24:49.147763+00	Getränkemarkt	#0891b2
229	1	KR Getränke 6	\N	1	3	1	6	f	2026-03-23 11:24:49.147763+00	Getränkemarkt	#0891b2
230	1	Meges Kühlregal	\N	1	3	1	10	f	2026-03-23 11:24:49.147763+00	Meges	#2563eb
231	1	Sonderregal A	\N	1	3	1	20	f	2026-03-23 11:24:49.147763+00	Sonderregale	#dc2626
232	1	Sonderregal B	\N	1	3	1	21	f	2026-03-23 11:24:49.147763+00	Sonderregale	#dc2626
233	1	TK-Insel 1	\N	1	3	1	30	f	2026-03-23 11:24:49.147763+00	TK-Inseln	#7c3aed
234	1	TK-Insel 2	\N	1	3	1	31	f	2026-03-23 11:24:49.147763+00	TK-Inseln	#7c3aed
235	1	TK-Insel 3	\N	1	3	1	32	f	2026-03-23 11:24:49.147763+00	TK-Inseln	#7c3aed
236	1	Regal 1	\N	1	3	1	40	f	2026-03-23 11:24:49.147763+00	Regale	#475569
237	1	Regal 2	\N	1	3	1	41	f	2026-03-23 11:24:49.147763+00	Regale	#475569
238	1	Kühlregal 1	\N	1	3	1	42	f	2026-03-23 11:24:49.147763+00	Kühlregale rechts	#2563eb
239	1	Regal 3	\N	1	3	1	43	f	2026-03-23 11:24:49.147763+00	Regale	#475569
256	1	TK-Insel 1	\N	1	3	1	30	f	2026-03-23 11:45:24.042985+00	TK-Inseln	#7c3aed
257	1	TK-Insel 2	\N	1	3	1	31	f	2026-03-23 11:45:24.042985+00	TK-Inseln	#7c3aed
258	1	TK-Insel 3	\N	1	3	1	32	f	2026-03-23 11:45:24.042985+00	TK-Inseln	#7c3aed
242	1	Regal 5	\N	1	3	1	46	f	2026-03-23 11:24:49.147763+00	Regale	#475569
318	1	KR Getränke 3	\N	1	3	1	3	f	2026-03-23 12:16:50.656595+00	Getränkemarkt	#0891b2
319	1	KR Getränke 4	\N	1	3	1	4	f	2026-03-23 12:16:50.656595+00	Getränkemarkt	#0891b2
320	1	KR Getränke 5	\N	1	3	1	5	f	2026-03-23 12:16:50.656595+00	Getränkemarkt	#0891b2
321	1	KR Getränke 6	\N	1	3	1	6	f	2026-03-23 12:16:50.656595+00	Getränkemarkt	#0891b2
322	1	Meges Kühlregal	\N	1	3	1	10	f	2026-03-23 12:16:50.656595+00	Meges	#2563eb
323	1	Sonderregal A	\N	1	3	1	20	f	2026-03-23 12:16:50.656595+00	Sonderregale	#dc2626
324	1	Sonderregal B	\N	1	3	1	21	f	2026-03-23 12:16:50.656595+00	Sonderregale	#dc2626
325	1	TK-Insel 1	\N	1	3	1	30	f	2026-03-23 12:16:50.656595+00	TK-Inseln	#7c3aed
326	1	TK-Insel 2	\N	1	3	1	31	f	2026-03-23 12:16:50.656595+00	TK-Inseln	#7c3aed
327	1	TK-Insel 3	\N	1	3	1	32	f	2026-03-23 12:16:50.656595+00	TK-Inseln	#7c3aed
328	1	Regal 1	\N	1	3	1	40	f	2026-03-23 12:16:50.656595+00	Regale	#475569
329	1	Regal 2	\N	1	3	1	41	f	2026-03-23 12:16:50.656595+00	Regale	#475569
330	1	Kühlregal 1	\N	1	3	1	42	f	2026-03-23 12:16:50.656595+00	Kühlregale rechts	#2563eb
331	1	Regal 3	\N	1	3	1	43	f	2026-03-23 12:16:50.656595+00	Regale	#475569
332	1	Regal 4	\N	1	3	1	44	f	2026-03-23 12:16:50.656595+00	Regale	#475569
333	1	Kühlregal 2	\N	1	3	1	45	f	2026-03-23 12:16:50.656595+00	Kühlregale rechts	#2563eb
334	1	Regal 5	\N	1	3	1	46	f	2026-03-23 12:16:50.656595+00	Regale	#475569
335	1	Regal 6	\N	1	3	1	47	f	2026-03-23 12:16:50.656595+00	Regale	#475569
336	1	Kühlregal 3	\N	1	3	1	48	f	2026-03-23 12:16:50.656595+00	Kühlregale rechts	#2563eb
337	1	BB Wurst Kühlregal	\N	1	3	1	50	f	2026-03-23 12:16:50.656595+00	Wurst/Käse/Fleisch	#b91c1c
338	1	Kühlregal Kasse	\N	1	3	1	60	f	2026-03-23 12:16:50.656595+00	Kasse	#0891b2
362	1	KR Getränke 1	\N	1	3	1	1	f	2026-03-23 12:21:21.486056+00	Getränkemarkt	#0891b2
363	1	KR Getränke 2	\N	1	3	1	2	f	2026-03-23 12:21:21.486056+00	Getränkemarkt	#0891b2
364	1	KR Getränke 3	\N	1	3	1	3	f	2026-03-23 12:21:21.486056+00	Getränkemarkt	#0891b2
365	1	KR Getränke 4	\N	1	3	1	4	f	2026-03-23 12:21:21.486056+00	Getränkemarkt	#0891b2
366	1	KR Getränke 5	\N	1	3	1	5	f	2026-03-23 12:21:21.486056+00	Getränkemarkt	#0891b2
339	1	KR Getränke 1	\N	1	3	1	1	f	2026-03-23 12:17:48.620117+00	Getränkemarkt	#0891b2
340	1	KR Getränke 2	\N	1	3	1	2	f	2026-03-23 12:17:48.620117+00	Getränkemarkt	#0891b2
341	1	KR Getränke 3	\N	1	3	1	3	f	2026-03-23 12:17:48.620117+00	Getränkemarkt	#0891b2
342	1	KR Getränke 4	\N	1	3	1	4	f	2026-03-23 12:17:48.620117+00	Getränkemarkt	#0891b2
343	1	KR Getränke 5	\N	1	3	1	5	f	2026-03-23 12:17:48.620117+00	Getränkemarkt	#0891b2
255	1	Sonderregal B	\N	1	3	1	21	f	2026-03-23 11:45:24.042985+00	Sonderregale	#dc2626
197	1	Regal 6	\N	1	3	1	47	f	2026-03-22 11:08:11.743861+00	Regale	#475569
259	1	Regal 1	\N	1	3	1	40	f	2026-03-23 11:45:24.042985+00	Regale	#475569
260	1	Regal 2	\N	1	3	1	41	f	2026-03-23 11:45:24.042985+00	Regale	#475569
261	1	Kühlregal 1	\N	1	3	1	42	f	2026-03-23 11:45:24.042985+00	Kühlregale rechts	#2563eb
262	1	Regal 3	\N	1	3	1	43	f	2026-03-23 11:45:24.042985+00	Regale	#475569
263	1	Regal 4	\N	1	3	1	44	f	2026-03-23 11:45:24.042985+00	Regale	#475569
264	1	Kühlregal 2	\N	1	3	1	45	f	2026-03-23 11:45:24.042985+00	Kühlregale rechts	#2563eb
265	1	Regal 5	\N	1	3	1	46	f	2026-03-23 11:45:24.042985+00	Regale	#475569
266	1	Regal 6	\N	1	3	1	47	f	2026-03-23 11:45:24.042985+00	Regale	#475569
267	1	Kühlregal 3	\N	1	3	1	48	f	2026-03-23 11:45:24.042985+00	Kühlregale rechts	#2563eb
268	1	BB Wurst Kühlregal	\N	1	3	1	50	f	2026-03-23 11:45:24.042985+00	Wurst/Käse/Fleisch	#b91c1c
269	1	Kühlregal Kasse	\N	1	3	1	60	f	2026-03-23 11:45:24.042985+00	Kasse	#0891b2
154	1	Kühlregal Kasse	\N	1	3	1	60	f	2026-03-22 11:04:42.600988+00	Kasse	#0891b2
155	1	KR Getränke 1	\N	1	3	1	1	f	2026-03-22 11:08:09.569267+00	Getränkemarkt	#0891b2
156	1	KR Getränke 2	\N	1	3	1	2	f	2026-03-22 11:08:09.569267+00	Getränkemarkt	#0891b2
157	1	KR Getränke 3	\N	1	3	1	3	f	2026-03-22 11:08:09.569267+00	Getränkemarkt	#0891b2
158	1	KR Getränke 4	\N	1	3	1	4	f	2026-03-22 11:08:09.569267+00	Getränkemarkt	#0891b2
344	1	KR Getränke 6	\N	1	3	1	6	f	2026-03-23 12:17:48.620117+00	Getränkemarkt	#0891b2
345	1	Meges Kühlregal	\N	1	3	1	10	f	2026-03-23 12:17:48.620117+00	Meges	#2563eb
346	1	Sonderregal A	\N	1	3	1	20	f	2026-03-23 12:17:48.620117+00	Sonderregale	#dc2626
347	1	Sonderregal B	\N	1	3	1	21	f	2026-03-23 12:17:48.620117+00	Sonderregale	#dc2626
348	1	TK-Insel 1	\N	1	3	1	30	f	2026-03-23 12:17:48.620117+00	TK-Inseln	#7c3aed
349	1	TK-Insel 2	\N	1	3	1	31	f	2026-03-23 12:17:48.620117+00	TK-Inseln	#7c3aed
350	1	TK-Insel 3	\N	1	3	1	32	f	2026-03-23 12:17:48.620117+00	TK-Inseln	#7c3aed
351	1	Regal 1	\N	1	3	1	40	f	2026-03-23 12:17:48.620117+00	Regale	#475569
352	1	Regal 2	\N	1	3	1	41	f	2026-03-23 12:17:48.620117+00	Regale	#475569
353	1	Kühlregal 1	\N	1	3	1	42	f	2026-03-23 12:17:48.620117+00	Kühlregale rechts	#2563eb
354	1	Regal 3	\N	1	3	1	43	f	2026-03-23 12:17:48.620117+00	Regale	#475569
355	1	Regal 4	\N	1	3	1	44	f	2026-03-23 12:17:48.620117+00	Regale	#475569
356	1	Kühlregal 2	\N	1	3	1	45	f	2026-03-23 12:17:48.620117+00	Kühlregale rechts	#2563eb
357	1	Regal 5	\N	1	3	1	46	f	2026-03-23 12:17:48.620117+00	Regale	#475569
358	1	Regal 6	\N	1	3	1	47	f	2026-03-23 12:17:48.620117+00	Regale	#475569
359	1	Kühlregal 3	\N	1	3	1	48	f	2026-03-23 12:17:48.620117+00	Kühlregale rechts	#2563eb
360	1	BB Wurst Kühlregal	\N	1	3	1	50	f	2026-03-23 12:17:48.620117+00	Wurst/Käse/Fleisch	#b91c1c
361	1	Kühlregal Kasse	\N	1	3	1	60	f	2026-03-23 12:17:48.620117+00	Kasse	#0891b2
198	1	Kühlregal 3	\N	1	3	1	48	f	2026-03-22 11:08:11.743861+00	Kühlregale rechts	#2563eb
199	1	BB Wurst Kühlregal	\N	1	3	1	50	f	2026-03-22 11:08:11.743861+00	Wurst/Käse/Fleisch	#b91c1c
200	1	Kühlregal Kasse	\N	1	3	1	60	f	2026-03-22 11:08:11.743861+00	Kasse	#0891b2
201	1	KR Getränke 1	\N	1	3	1	1	f	2026-03-23 11:15:04.36211+00	Getränkemarkt	#0891b2
202	1	KR Getränke 2	\N	1	3	1	2	f	2026-03-23 11:15:04.36211+00	Getränkemarkt	#0891b2
203	1	KR Getränke 3	\N	1	3	1	3	f	2026-03-23 11:15:04.36211+00	Getränkemarkt	#0891b2
204	1	KR Getränke 4	\N	1	3	1	4	f	2026-03-23 11:15:04.36211+00	Getränkemarkt	#0891b2
205	1	KR Getränke 5	\N	1	3	1	5	f	2026-03-23 11:15:04.36211+00	Getränkemarkt	#0891b2
206	1	KR Getränke 6	\N	1	3	1	6	f	2026-03-23 11:15:04.36211+00	Getränkemarkt	#0891b2
207	1	Meges Kühlregal	\N	1	3	1	10	f	2026-03-23 11:15:04.36211+00	Meges	#2563eb
208	1	Sonderregal A	\N	1	3	1	20	f	2026-03-23 11:15:04.36211+00	Sonderregale	#dc2626
209	1	Sonderregal B	\N	1	3	1	21	f	2026-03-23 11:15:04.36211+00	Sonderregale	#dc2626
210	1	TK-Insel 1	\N	1	3	1	30	f	2026-03-23 11:15:04.36211+00	TK-Inseln	#7c3aed
211	1	TK-Insel 2	\N	1	3	1	31	f	2026-03-23 11:15:04.36211+00	TK-Inseln	#7c3aed
212	1	TK-Insel 3	\N	1	3	1	32	f	2026-03-23 11:15:04.36211+00	TK-Inseln	#7c3aed
213	1	Regal 1	\N	1	3	1	40	f	2026-03-23 11:15:04.36211+00	Regale	#475569
270	1	KR Getränke 1	\N	1	3	1	1	f	2026-03-23 11:54:19.385894+00	Getränkemarkt	#0891b2
271	1	KR Getränke 2	\N	1	3	1	2	f	2026-03-23 11:54:19.385894+00	Getränkemarkt	#0891b2
272	1	KR Getränke 3	\N	1	3	1	3	f	2026-03-23 11:54:19.385894+00	Getränkemarkt	#0891b2
273	1	KR Getränke 4	\N	1	3	1	4	f	2026-03-23 11:54:19.385894+00	Getränkemarkt	#0891b2
274	1	KR Getränke 5	\N	1	3	1	5	f	2026-03-23 11:54:19.385894+00	Getränkemarkt	#0891b2
275	1	KR Getränke 6	\N	1	3	1	6	f	2026-03-23 11:54:19.385894+00	Getränkemarkt	#0891b2
276	1	Meges Kühlregal	\N	1	3	1	10	f	2026-03-23 11:54:19.385894+00	Meges	#2563eb
248	1	KR Getränke 2	\N	1	3	1	2	f	2026-03-23 11:45:24.042985+00	Getränkemarkt	#0891b2
277	1	Sonderregal A	\N	1	3	1	20	f	2026-03-23 11:54:19.385894+00	Sonderregale	#dc2626
278	1	Sonderregal B	\N	1	3	1	21	f	2026-03-23 11:54:19.385894+00	Sonderregale	#dc2626
279	1	TK-Insel 1	\N	1	3	1	30	f	2026-03-23 11:54:19.385894+00	TK-Inseln	#7c3aed
280	1	TK-Insel 2	\N	1	3	1	31	f	2026-03-23 11:54:19.385894+00	TK-Inseln	#7c3aed
281	1	TK-Insel 3	\N	1	3	1	32	f	2026-03-23 11:54:19.385894+00	TK-Inseln	#7c3aed
282	1	Regal 1	\N	1	3	1	40	f	2026-03-23 11:54:19.385894+00	Regale	#475569
283	1	Regal 2	\N	1	3	1	41	f	2026-03-23 11:54:19.385894+00	Regale	#475569
186	1	Sonderregal B	\N	1	3	1	21	f	2026-03-22 11:08:11.743861+00	Sonderregale	#dc2626
284	1	Kühlregal 1	\N	1	3	1	42	f	2026-03-23 11:54:19.385894+00	Kühlregale rechts	#2563eb
240	1	Regal 4	\N	1	3	1	44	f	2026-03-23 11:24:49.147763+00	Regale	#475569
241	1	Kühlregal 2	\N	1	3	1	45	f	2026-03-23 11:24:49.147763+00	Kühlregale rechts	#2563eb
367	1	KR Getränke 6	\N	1	3	1	6	f	2026-03-23 12:21:21.486056+00	Getränkemarkt	#0891b2
368	1	Meges Kühlregal	\N	1	3	1	10	f	2026-03-23 12:21:21.486056+00	Meges	#2563eb
369	1	Sonderregal A	\N	1	3	1	20	f	2026-03-23 12:21:21.486056+00	Sonderregale	#dc2626
370	1	Sonderregal B	\N	1	3	1	21	f	2026-03-23 12:21:21.486056+00	Sonderregale	#dc2626
371	1	TK-Insel 1	\N	1	3	1	30	f	2026-03-23 12:21:21.486056+00	TK-Inseln	#7c3aed
372	1	TK-Insel 2	\N	1	3	1	31	f	2026-03-23 12:21:21.486056+00	TK-Inseln	#7c3aed
373	1	TK-Insel 3	\N	1	3	1	32	f	2026-03-23 12:21:21.486056+00	TK-Inseln	#7c3aed
374	1	Regal 1	\N	1	3	1	40	f	2026-03-23 12:21:21.486056+00	Regale	#475569
375	1	Regal 2	\N	1	3	1	41	f	2026-03-23 12:21:21.486056+00	Regale	#475569
376	1	Kühlregal 1	\N	1	3	1	42	f	2026-03-23 12:21:21.486056+00	Kühlregale rechts	#2563eb
377	1	Regal 3	\N	1	3	1	43	f	2026-03-23 12:21:21.486056+00	Regale	#475569
378	1	Regal 4	\N	1	3	1	44	f	2026-03-23 12:21:21.486056+00	Regale	#475569
379	1	Kühlregal 2	\N	1	3	1	45	f	2026-03-23 12:21:21.486056+00	Kühlregale rechts	#2563eb
380	1	Regal 5	\N	1	3	1	46	f	2026-03-23 12:21:21.486056+00	Regale	#475569
381	1	Regal 6	\N	1	3	1	47	f	2026-03-23 12:21:21.486056+00	Regale	#475569
382	1	Kühlregal 3	\N	1	3	1	48	f	2026-03-23 12:21:21.486056+00	Kühlregale rechts	#2563eb
383	1	BB Wurst Kühlregal	\N	1	3	1	50	f	2026-03-23 12:21:21.486056+00	Wurst/Käse/Fleisch	#b91c1c
384	1	Kühlregal Kasse	\N	1	3	1	60	f	2026-03-23 12:21:21.486056+00	Kasse	#0891b2
385	1	KR Getränke 1	\N	1	3	1	1	f	2026-03-23 12:28:45.549451+00	Getränkemarkt	#0891b2
386	1	KR Getränke 2	\N	1	3	1	2	f	2026-03-23 12:28:45.549451+00	Getränkemarkt	#0891b2
387	1	KR Getränke 3	\N	1	3	1	3	f	2026-03-23 12:28:45.549451+00	Getränkemarkt	#0891b2
388	1	KR Getränke 4	\N	1	3	1	4	f	2026-03-23 12:28:45.549451+00	Getränkemarkt	#0891b2
389	1	KR Getränke 5	\N	1	3	1	5	f	2026-03-23 12:28:45.549451+00	Getränkemarkt	#0891b2
390	1	KR Getränke 6	\N	1	3	1	6	f	2026-03-23 12:28:45.549451+00	Getränkemarkt	#0891b2
391	1	Meges Kühlregal	\N	1	3	1	10	f	2026-03-23 12:28:45.549451+00	Meges	#2563eb
392	1	Sonderregal A	\N	1	3	1	20	f	2026-03-23 12:28:45.549451+00	Sonderregale	#dc2626
393	1	Sonderregal B	\N	1	3	1	21	f	2026-03-23 12:28:45.549451+00	Sonderregale	#dc2626
394	1	TK-Insel 1	\N	1	3	1	30	f	2026-03-23 12:28:45.549451+00	TK-Inseln	#7c3aed
395	1	TK-Insel 2	\N	1	3	1	31	f	2026-03-23 12:28:45.549451+00	TK-Inseln	#7c3aed
396	1	TK-Insel 3	\N	1	3	1	32	f	2026-03-23 12:28:45.549451+00	TK-Inseln	#7c3aed
397	1	Regal 1	\N	1	3	1	40	f	2026-03-23 12:28:45.549451+00	Regale	#475569
398	1	Regal 2	\N	1	3	1	41	f	2026-03-23 12:28:45.549451+00	Regale	#475569
399	1	Kühlregal 1	\N	1	3	1	42	f	2026-03-23 12:28:45.549451+00	Kühlregale rechts	#2563eb
400	1	Regal 3	\N	1	3	1	43	f	2026-03-23 12:28:45.549451+00	Regale	#475569
401	1	Regal 4	\N	1	3	1	44	f	2026-03-23 12:28:45.549451+00	Regale	#475569
402	1	Kühlregal 2	\N	1	3	1	45	f	2026-03-23 12:28:45.549451+00	Kühlregale rechts	#2563eb
403	1	Regal 5	\N	1	3	1	46	f	2026-03-23 12:28:45.549451+00	Regale	#475569
404	1	Regal 6	\N	1	3	1	47	f	2026-03-23 12:28:45.549451+00	Regale	#475569
405	1	Kühlregal 3	\N	1	3	1	48	f	2026-03-23 12:28:45.549451+00	Kühlregale rechts	#2563eb
406	1	BB Wurst Kühlregal	\N	1	3	1	50	f	2026-03-23 12:28:45.549451+00	Wurst/Käse/Fleisch	#b91c1c
407	1	Kühlregal Kasse	\N	1	3	1	60	f	2026-03-23 12:28:45.549451+00	Kasse	#0891b2
408	1	KR Getränke 1	\N	1	3	1	1	t	2026-03-23 12:30:57.519606+00	Getränkemarkt	#0891b2
409	1	KR Getränke 2	\N	1	3	1	2	t	2026-03-23 12:30:57.519606+00	Getränkemarkt	#0891b2
410	1	KR Getränke 3	\N	1	3	1	3	t	2026-03-23 12:30:57.519606+00	Getränkemarkt	#0891b2
411	1	KR Getränke 4	\N	1	3	1	4	t	2026-03-23 12:30:57.519606+00	Getränkemarkt	#0891b2
412	1	KR Getränke 5	\N	1	3	1	5	t	2026-03-23 12:30:57.519606+00	Getränkemarkt	#0891b2
413	1	KR Getränke 6	\N	1	3	1	6	t	2026-03-23 12:30:57.519606+00	Getränkemarkt	#0891b2
414	1	Meges Kühlregal	\N	1	3	1	10	t	2026-03-23 12:30:57.519606+00	Meges	#2563eb
415	1	Sonderregal A	\N	1	3	1	20	t	2026-03-23 12:30:57.519606+00	Sonderregale	#dc2626
416	1	Sonderregal B	\N	1	3	1	21	t	2026-03-23 12:30:57.519606+00	Sonderregale	#dc2626
417	1	TK-Insel 1	\N	1	3	1	30	t	2026-03-23 12:30:57.519606+00	TK-Inseln	#7c3aed
418	1	TK-Insel 2	\N	1	3	1	31	t	2026-03-23 12:30:57.519606+00	TK-Inseln	#7c3aed
419	1	TK-Insel 3	\N	1	3	1	32	t	2026-03-23 12:30:57.519606+00	TK-Inseln	#7c3aed
420	1	Regal 1	\N	1	3	1	40	t	2026-03-23 12:30:57.519606+00	Regale	#475569
421	1	Regal 2	\N	1	3	1	41	t	2026-03-23 12:30:57.519606+00	Regale	#475569
422	1	Kühlregal 1	\N	1	3	1	42	t	2026-03-23 12:30:57.519606+00	Kühlregale rechts	#2563eb
423	1	Regal 3	\N	1	3	1	43	t	2026-03-23 12:30:57.519606+00	Regale	#475569
424	1	Regal 4	\N	1	3	1	44	t	2026-03-23 12:30:57.519606+00	Regale	#475569
425	1	Kühlregal 2	\N	1	3	1	45	t	2026-03-23 12:30:57.519606+00	Kühlregale rechts	#2563eb
426	1	Regal 5	\N	1	3	1	46	t	2026-03-23 12:30:57.519606+00	Regale	#475569
427	1	Regal 6	\N	1	3	1	47	t	2026-03-23 12:30:57.519606+00	Regale	#475569
428	1	Kühlregal 3	\N	1	3	1	48	t	2026-03-23 12:30:57.519606+00	Kühlregale rechts	#2563eb
429	1	BB Wurst Kühlregal	\N	1	3	1	50	t	2026-03-23 12:30:57.519606+00	Wurst/Käse/Fleisch	#b91c1c
430	1	Kühlregal Kasse	\N	1	3	1	60	t	2026-03-23 12:30:57.519606+00	Kasse	#0891b2
\.


--
-- Data for Name: ware_mhd_kontrollen; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ware_mhd_kontrollen (id, market_id, bereich_id, datum, kuerzel, bemerkung, created_at) FROM stdin;
1	1	108	2026-03-22	KM	\N	2026-03-22 10:41:54.053035+00
\.


--
-- Data for Name: ware_rayons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ware_rayons (id, market_id, name, beschreibung, farbe, sort_order, aktiv, created_at) FROM stdin;
1	\N	Obst & Gemuese	Frischware und saisonale Produkte	#059669	1	t	2026-03-21 19:10:03.088724+00
2	\N	Molkerei	Milch, Kase, Butter, Joghurt	#0891b2	2	t	2026-03-21 19:10:03.088724+00
3	\N	Fleisch & Wurst	Bedienung und SB-Bereich	#dc2626	3	t	2026-03-21 19:10:03.088724+00
4	\N	Backwaren	Brot, Brotchen, Backwaren	#d97706	4	t	2026-03-21 19:10:03.088724+00
5	\N	Feinkost	Salate, Antipasti, Spezialitaten	#7c3aed	5	t	2026-03-21 19:10:03.088724+00
6	\N	Tiefkuhl	TK-Sortiment gesamt	#1a3a6b	6	t	2026-03-21 19:10:03.088724+00
7	\N	Getraenke	Wasser, Saft, alkohol. Getraenke	#be185d	7	t	2026-03-21 19:10:03.088724+00
8	\N	Haushalt & Drogerie	Reinigungsmittel, Hygieneartikel	#374151	8	t	2026-03-21 19:10:03.088724+00
\.


--
-- Data for Name: warencheck_og; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.warencheck_og (id, tenant_id, market_id, year, month, day, slot, kuerzel, user_id, created_at) FROM stdin;
2	1	1	2026	3	19	s1	KM	8	2026-03-19 16:55:09.43299
3	1	1	2026	3	19	s2	KM	8	2026-03-19 17:13:07.635195
4	1	1	2026	3	19	s3	KM	8	2026-03-19 17:13:14.946726
6	1	1	2026	3	18	s1	KM	8	2026-03-19 17:13:48.712168
7	1	1	2026	3	18	s2	KM	8	2026-03-19 17:14:00.444133
8	1	1	2026	3	18	s3	KM	8	2026-03-19 17:14:07.942915
10	1	1	2026	3	18	s4	KM	8	2026-03-19 17:14:31.104715
11	1	1	2026	3	18	s5	KM	8	2026-03-19 17:14:46.10513
12	1	1	2026	3	17	s1	KM	8	2026-03-19 17:14:51.262409
13	1	1	2026	3	17	s2	KM	8	2026-03-19 17:14:55.818717
14	1	1	2026	3	17	s3	MM	7	2026-03-19 17:14:59.81341
15	1	1	2026	3	17	s4	MM	7	2026-03-19 17:15:04.388615
16	1	1	2026	3	17	s5	MM	7	2026-03-19 17:15:08.645045
17	1	1	2026	3	16	s1	MM	7	2026-03-19 17:15:13.178162
18	1	1	2026	3	16	s2	MM	7	2026-03-19 17:15:17.717681
19	1	1	2026	3	16	s3	KM	8	2026-03-19 17:15:21.727662
20	1	1	2026	3	16	s4	KM	8	2026-03-19 17:15:26.154713
21	1	1	2026	3	16	s5	KM	8	2026-03-19 17:15:30.760674
24	1	1	2026	3	19	s4	KM	8	2026-03-19 17:20:26.469003
25	1	1	2026	3	19	s5	MM	7	2026-03-19 17:20:32.696318
27	1	1	2026	3	20	s1	KM	8	2026-03-20 09:46:20.609637
28	1	1	2026	3	20	s2	KM	8	2026-03-20 09:46:37.536527
29	1	1	2026	3	20	s3	MM	7	2026-03-20 18:20:14.502807
30	1	1	2026	3	20	s4	MM	7	2026-03-20 18:20:24.091965
32	1	2	2026	3	4	s2	KM	8	2026-03-22 12:53:30.903781
33	1	1	2026	3	23	s1	KM	8	2026-03-23 15:58:34.218066
34	1	1	2026	3	23	s2	MM	7	2026-03-23 15:58:42.634445
35	1	1	2026	3	23	s3	MM	7	2026-03-23 15:58:49.534317
38	1	1	2026	3	23	s4	KM	8	2026-03-24 08:00:57.467953
39	1	1	2026	3	23	s5	KM	8	2026-03-24 08:01:03.531737
41	1	1	2026	3	24	s1	KM	8	2026-03-24 10:44:47.699843
42	1	1	2026	3	24	s2	MM	7	2026-03-24 13:42:50.173674
44	1	1	2026	3	24	s3	MM	7	2026-03-24 13:45:45.916664
45	1	1	2026	3	24	s4	MM	7	2026-03-24 14:12:58.555165
46	1	1	2026	3	24	s5	KM	8	2026-03-24 18:28:23.447528
47	1	1	2026	3	25	s1	HSC	13	2026-03-25 11:02:48.114497
48	1	1	2026	3	25	s2	MM	7	2026-03-25 11:02:55.169796
50	1	1	2026	3	25	s3	HSC	13	2026-03-25 11:03:43.507745
51	1	1	2026	3	25	s4	MM	7	2026-03-25 16:50:03.213987
52	1	1	2026	3	20	s5	KM	8	2026-03-25 19:04:41.246779
53	1	1	2026	3	13	s3	KM	8	2026-03-25 19:13:40.704271
55	1	1	2026	3	25	s5	KM	8	2026-03-26 07:02:48.277705
56	1	1	2026	3	26	s1	KM	8	2026-03-26 07:03:28.176287
58	1	3	2026	3	26	s2	KM	8	2026-03-26 08:32:16.486316
59	1	1	2026	3	26	s2	KM	8	2026-03-26 10:48:15.974165
60	1	1	2026	3	27	s3	KM	8	2026-03-27 12:25:43.849881
61	1	1	2026	3	28	s3	MM	7	2026-03-28 11:43:55.957035
62	1	1	2026	3	26	s3	MM	7	2026-03-28 11:44:03.635827
63	1	1	2026	3	27	s1	MM	7	2026-03-28 11:44:08.010204
64	1	1	2026	3	27	s2	MM	7	2026-03-28 11:44:12.34638
65	1	1	2026	3	26	s4	HSC	13	2026-03-28 11:44:16.519184
66	1	1	2026	3	26	s5	HSC	13	2026-03-28 11:44:20.590921
67	1	1	2026	3	29	s3	HSC	13	2026-03-29 10:25:56.083646
\.


--
-- Data for Name: wareneingang_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wareneingang_entries (id, tenant_id, market_id, type_id, year, month, day, criteria_values, kuerzel, user_id, notizen, created_at) FROM stdin;
1	1	2	1	2026	3	2	{"mhd": "abweichung", "qs_by": "io", "qs_qs": "entfaellt", "hygiene": "io", "qualitaet": "entfaellt", "qs_biosiegel": "entfaellt", "etikettierung": "io", "kistenetikett": "io", "temp_kuehl_og": "2.0"}	KM	8		2026-03-20 10:22:15.526574
2	1	2	17	2026	3	20	{"qs_by": "io", "qs_qs": "io", "qualitaet": "abweichung", "qs_biosiegel": "abweichung", "etikettierung": "io", "kistenetikett": "io", "temp_kuehl_og": "2.5"}	KM	8		2026-03-20 10:40:20.074101
3	1	2	17	2026	3	13	{"mhd": "io", "qs_by": "io", "qs_qs": "io", "hygiene": "io", "qualitaet": "io", "qs_biosiegel": "io", "etikettierung": "abweichung", "kistenetikett": "io", "temp_kuehl_og": "3.8"}	KM	8		2026-03-20 10:41:15.41279
4	1	1	9	2026	3	20	{"mhd": "io", "qs_by": "io", "qs_qs": "io", "hygiene": "io", "qualitaet": "io", "qs_biosiegel": "io", "etikettierung": "io", "kistenetikett": "io", "temp_kuehl_og": "2.5"}	KM	8		2026-03-20 11:08:52.072385
5	1	1	10	2026	3	20	{"mhd": "io", "hygiene": "io", "bio_kennz": "io", "qualitaet": "io", "bio_geliefert": "io", "etikettierung": "io", "bio_zertifikat": "io", "bio_vermischung": "io", "bio_kennz_stimmt": "io", "bio_warenbegleit": "io", "temp_kuehl_molkerei": "2.5"}	KM	8		2026-03-20 11:29:04.666974
6	1	1	9	2026	3	2	{"_ausgefallen": "ja"}	KM	8		2026-03-20 12:00:58.500966
7	1	1	9	2026	3	3	{"mhd": "io", "qs_by": "io", "qs_qs": "io", "hygiene": "io", "qualitaet": "io", "qs_biosiegel": "io", "etikettierung": "io", "kistenetikett": "io", "temp_kuehl_og": "5"}	MM	7		2026-03-20 17:17:57.154101
8	1	1	11	2026	3	23	{"_ausgefallen": "ja"}	KM	8		2026-03-23 10:40:42.259046
9	1	1	10	2026	3	23	{"mhd": "io", "hygiene": "io", "bio_kennz": "io", "qualitaet": "io", "bio_geliefert": "io", "etikettierung": "io", "bio_zertifikat": "io", "bio_vermischung": "io", "bio_kennz_stimmt": "io", "bio_warenbegleit": "io", "temp_kuehl_molkerei": "3.5"}	KM	8		2026-03-23 15:59:49.349274
11	1	1	9	2026	3	23	{"mhd": "io", "qs_by": "io", "qs_qs": "io", "hygiene": "io", "qualitaet": "io", "qs_biosiegel": "io", "etikettierung": "io", "kistenetikett": "io", "temp_kuehl_og": "4.5"}	MM	7		2026-03-23 18:32:43.983911
12	1	1	10	2026	3	24	{"mhd": "io", "hygiene": "io", "bio_kennz": "io", "qualitaet": "io", "bio_geliefert": "io", "etikettierung": "io", "bio_zertifikat": "io", "bio_vermischung": "io", "bio_kennz_stimmt": "io", "bio_warenbegleit": "io", "temp_kuehl_molkerei": "3.5"}	KM	8		2026-03-24 08:03:37.714744
13	1	1	9	2026	3	24	{"mhd": "io", "qs_by": "io", "qs_qs": "io", "hygiene": "io", "qualitaet": "io", "qs_biosiegel": "io", "etikettierung": "io", "kistenetikett": "io", "temp_kuehl_og": "4"}	KM	8		2026-03-24 10:53:25.034919
14	1	1	54	2026	3	24	{"mhd": "io", "hygiene": "io", "qualitaet": "io", "etikettierung": "io"}	KM	8		2026-03-24 10:54:00.238553
15	1	1	34	2026	3	24	{"mhd": "io", "fisch_haut": "io", "nemat_json": "[{\\"art\\":\\"Lachsfilet\\",\\"custom\\":\\"\\"},{\\"art\\":\\"Steinbuttfilet\\",\\"custom\\":\\"\\"}]", "fisch_augen": "io", "fisch_geruch": "io", "fisch_kiemen": "io", "etikettierung": "io", "fisch_msc_coc": "io", "fisch_herkunft": "io", "fisch_msc_kennz": "io", "fisch_arten_json": "[{\\"art\\":\\"Seelachs\\",\\"mhd\\":\\"2026-03-29\\"},{\\"art\\":\\"\\",\\"mhd\\":\\"\\"}]", "fisch_konsistenz": "io", "temp_frischfisch": "1.2", "fisch_msc_geliefert": "io", "fisch_msc_zertifikat": "io"}	KM	8		2026-03-24 14:48:49.365882
17	1	1	10	2026	3	25	{"mhd": "io", "hygiene": "io", "bio_kennz": "io", "qualitaet": "io", "bio_geliefert": "io", "etikettierung": "io", "bio_zertifikat": "io", "bio_vermischung": "io", "bio_kennz_stimmt": "io", "bio_warenbegleit": "io", "temp_kuehl_molkerei": "4"}	HSC	13		2026-03-25 11:20:25.819213
18	1	1	54	2026	3	25	{"mhd": "io", "hygiene": "io", "qualitaet": "io", "etikettierung": "io"}	HSC	13		2026-03-25 11:22:11.160673
19	1	1	33	2026	3	25	{"mhd": "io", "qs_qs": "io", "hygiene": "io", "qualitaet": "io", "rindfleisch": "io", "etikettierung": "io"}	HSC	13		2026-03-25 11:59:32.416639
20	1	1	34	2026	3	25	{"mhd": "io", "fisch_haut": "io", "fisch_augen": "io", "fisch_geruch": "io", "fisch_kiemen": "io", "etikettierung": "io", "fisch_msc_coc": "io", "fisch_herkunft": "io", "fisch_msc_kennz": "io", "fisch_konsistenz": "io", "fisch_msc_geliefert": "io", "fisch_msc_zertifikat": "io"}	HSC	13		2026-03-25 11:59:53.134993
21	1	1	11	2026	3	25	{"mhd": "io", "hygiene": "io", "qualitaet": "io", "etikettierung": "io"}	HSC	13		2026-03-25 12:00:10.631951
22	1	1	9	2026	3	19	{"mhd": "io", "qs_by": "io", "qs_qs": "io", "hygiene": "io", "qualitaet": "io", "qs_biosiegel": "io", "etikettierung": "io", "kistenetikett": "io", "temp_kuehl_og": "6.5"}	HSC	13		2026-03-25 12:28:32.57412
23	1	1	9	2026	3	25	{"mhd": "io", "qs_by": "io", "qs_qs": "io", "hygiene": "io", "qualitaet": "io", "qs_biosiegel": "io", "etikettierung": "io", "kistenetikett": "io", "temp_kuehl_og": "4"}	KM	8		2026-03-25 13:57:01.925159
24	1	1	9	2026	3	26	{"mhd": "io", "qs_by": "io", "qs_qs": "io", "hygiene": "io", "qualitaet": "io", "qs_biosiegel": "io", "etikettierung": "io", "kistenetikett": "io", "temp_kuehl_og": "8"}	KM	8		2026-03-26 07:17:23.37727
25	1	1	33	2026	3	26	{"mhd": "io", "qs_qs": "io", "hygiene": "io", "qualitaet": "io", "rindfleisch": "io", "temp_fleisch": "5", "etikettierung": "io"}	KM	8		2026-03-26 10:29:10.981334
26	1	1	34	2026	3	26	{"mhd": "io", "fisch_haut": "io", "fisch_augen": "io", "fisch_geruch": "io", "fisch_kiemen": "io", "etikettierung": "io", "fisch_msc_coc": "io", "fisch_herkunft": "io", "fisch_msc_kennz": "io", "fisch_konsistenz": "io", "temp_frischfisch": "1.5", "fisch_msc_geliefert": "io", "fisch_msc_zertifikat": "io"}	KM	8		2026-03-26 10:31:16.589359
27	1	1	34	2026	3	19	{"_ausgefallen": "ja"}	KM	8		2026-03-26 10:32:00.570491
28	1	1	9	2026	3	27	{"mhd": "io", "qs_by": "io", "qs_qs": "io", "hygiene": "io", "qualitaet": "io", "qs_biosiegel": "io", "etikettierung": "io", "kistenetikett": "io", "temp_kuehl_og": "4"}	KM	8		2026-03-27 12:23:38.856453
29	1	1	10	2026	3	29	{"mhd": "io", "hygiene": "io", "bio_kennz": "io", "qualitaet": "io", "bio_geliefert": "io", "etikettierung": "io", "bio_zertifikat": "io", "bio_vermischung": "io", "bio_kennz_stimmt": "io", "bio_warenbegleit": "io", "temp_kuehl_molkerei": "5"}	KM	8		2026-03-29 10:27:21.200709
30	1	1	9	2026	3	30	{"_ausgefallen": "ja"}	HSC	13		2026-03-30 08:09:08.577351
31	1	1	10	2026	3	30	{"mhd": "io", "hygiene": "io", "bio_kennz": "io", "qualitaet": "io", "bio_geliefert": "io", "etikettierung": "io", "bio_zertifikat": "io", "bio_vermischung": "io", "bio_kennz_stimmt": "io", "bio_warenbegleit": "io", "temp_kuehl_molkerei": "5"}	KM	8		2026-03-30 12:21:28.343474
\.


--
-- Data for Name: wareneingang_jahresarchiv; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wareneingang_jahresarchiv (id, market_id, type_id, year, archiv_json, erstellt_am) FROM stdin;
\.


--
-- Data for Name: wareneingang_og; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wareneingang_og (id, tenant_id, market_id, year, month, day, hygiene, etikettierung, qualitaet, mhd, kistenetikett, qs_biosiegel, qs_by, qs_qs, temp_celsius, kuerzel, user_id, notizen, created_at) FROM stdin;
1	1	1	2026	3	2	io	io	io	io	io	io	io	io	5.0	KM	8		2026-03-19 18:49:57.385373
2	1	2	2026	3	3	io	io	io	io	io	abweichung	entfaellt	io	2.9	KM	8	Test	2026-03-20 09:58:15.253435
\.


--
-- Data for Name: wareneingang_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wareneingang_types (id, tenant_id, name, beschreibung, ware_art, criteria_config, sort_order, aktiv, created_at, market_id, liefertage, liefertage_ausnahmen, section) FROM stdin;
1	1	Obst und Gemuese	\N	kuehl	{"mhd": true, "qs_by": true, "qs_qs": true, "hygiene": true, "qualitaet": true, "qs_biosiegel": true, "etikettierung": true, "kistenetikett": true, "temp_kuehl_og": true}	1	f	2026-03-20 10:10:29.878196	\N	[]	{}	wareneingaenge
2	1	MoPro	\N	kuehl	{"mhd": true, "hygiene": true, "bio_kennz": true, "qualitaet": true, "bio_geliefert": true, "etikettierung": true, "bio_zertifikat": true, "bio_vermischung": true, "bio_kennz_stimmt": true, "bio_warenbegleit": true, "temp_kuehl_molkerei": true}	2	f	2026-03-20 10:10:29.878196	\N	[]	{}	wareneingaenge
3	1	TK Edeka	\N	tk	{"mhd": true, "hygiene": true, "temp_tk": true, "qualitaet": true, "etikettierung": true}	3	f	2026-03-20 10:10:29.878196	\N	[]	{}	wareneingaenge
4	1	Oelz	\N	kuehl	{"mhd": true, "hygiene": true, "qualitaet": true, "etikettierung": true, "temp_kuehl_molkerei": true}	4	f	2026-03-20 10:10:29.878196	\N	[]	{}	wareneingaenge
5	1	Ursberg	\N	kuehl	{"mhd": true, "hygiene": true, "bio_kennz": true, "qualitaet": true, "bio_geliefert": true, "etikettierung": true, "bio_zertifikat": true, "bio_vermischung": true, "bio_kennz_stimmt": true, "bio_warenbegleit": true, "temp_kuehl_molkerei": true}	5	f	2026-03-20 10:10:29.878196	\N	[]	{}	wareneingaenge
6	1	Unser Land	\N	kuehl	{"mhd": true, "hygiene": true, "bio_kennz": true, "qualitaet": true, "qs_biosiegel": true, "bio_geliefert": true, "etikettierung": true, "temp_kuehl_og": true, "bio_zertifikat": true, "bio_vermischung": true, "bio_kennz_stimmt": true, "bio_warenbegleit": true}	6	f	2026-03-20 10:10:29.878196	\N	[]	{}	wareneingaenge
7	1	Settele	\N	kuehl	{"mhd": true, "hygiene": true, "qualitaet": true, "etikettierung": true, "temp_kuehl_molkerei": true}	7	f	2026-03-20 10:10:29.878196	\N	[]	{}	wareneingaenge
8	1	Grossmann	\N	ungekuehlt	{"mhd": true, "hygiene": true, "qualitaet": true, "etikettierung": true}	8	f	2026-03-20 10:10:29.878196	\N	[]	{}	wareneingaenge
13	1	Ursberg	\N	kuehl	{"mhd": true, "hygiene": true, "bio_kennz": true, "qualitaet": true, "bio_geliefert": true, "etikettierung": true, "bio_zertifikat": true, "bio_vermischung": true, "bio_kennz_stimmt": true, "bio_warenbegleit": true, "temp_kuehl_molkerei": true}	5	t	2026-03-20 10:32:37.511324	1	[]	{}	wareneingaenge
14	1	Unser Land	\N	kuehl	{"mhd": true, "hygiene": true, "bio_kennz": true, "qualitaet": true, "qs_biosiegel": true, "bio_geliefert": true, "etikettierung": true, "temp_kuehl_og": true, "bio_zertifikat": true, "bio_vermischung": true, "bio_kennz_stimmt": true, "bio_warenbegleit": true}	6	t	2026-03-20 10:32:37.511324	1	[]	{}	wareneingaenge
15	1	Settele	\N	kuehl	{"mhd": true, "hygiene": true, "qualitaet": true, "etikettierung": true, "temp_kuehl_molkerei": true}	7	t	2026-03-20 10:32:37.511324	1	[]	{}	wareneingaenge
17	1	Obst und Gemuese	\N	kuehl	{"mhd": true, "qs_by": true, "qs_qs": true, "hygiene": true, "qualitaet": true, "qs_biosiegel": true, "etikettierung": true, "kistenetikett": true, "temp_kuehl_og": true}	1	t	2026-03-20 10:32:37.511324	2	[]	{}	wareneingaenge
18	1	MoPro	\N	kuehl	{"mhd": true, "hygiene": true, "bio_kennz": true, "qualitaet": true, "bio_geliefert": true, "etikettierung": true, "bio_zertifikat": true, "bio_vermischung": true, "bio_kennz_stimmt": true, "bio_warenbegleit": true, "temp_kuehl_molkerei": true}	2	t	2026-03-20 10:32:37.511324	2	[]	{}	wareneingaenge
19	1	TK Edeka	\N	tk	{"mhd": true, "hygiene": true, "temp_tk": true, "qualitaet": true, "etikettierung": true}	3	t	2026-03-20 10:32:37.511324	2	[]	{}	wareneingaenge
20	1	Oelz	\N	kuehl	{"mhd": true, "hygiene": true, "qualitaet": true, "etikettierung": true, "temp_kuehl_molkerei": true}	4	t	2026-03-20 10:32:37.511324	2	[]	{}	wareneingaenge
21	1	Ursberg	\N	kuehl	{"mhd": true, "hygiene": true, "bio_kennz": true, "qualitaet": true, "bio_geliefert": true, "etikettierung": true, "bio_zertifikat": true, "bio_vermischung": true, "bio_kennz_stimmt": true, "bio_warenbegleit": true, "temp_kuehl_molkerei": true}	5	t	2026-03-20 10:32:37.511324	2	[]	{}	wareneingaenge
22	1	Unser Land	\N	kuehl	{"mhd": true, "hygiene": true, "bio_kennz": true, "qualitaet": true, "qs_biosiegel": true, "bio_geliefert": true, "etikettierung": true, "temp_kuehl_og": true, "bio_zertifikat": true, "bio_vermischung": true, "bio_kennz_stimmt": true, "bio_warenbegleit": true}	6	t	2026-03-20 10:32:37.511324	2	[]	{}	wareneingaenge
23	1	Settele	\N	kuehl	{"mhd": true, "hygiene": true, "qualitaet": true, "etikettierung": true, "temp_kuehl_molkerei": true}	7	t	2026-03-20 10:32:37.511324	2	[]	{}	wareneingaenge
25	1	MoPro	\N	kuehl	{"mhd": true, "hygiene": true, "bio_kennz": true, "qualitaet": true, "bio_geliefert": true, "etikettierung": true, "bio_zertifikat": true, "bio_vermischung": true, "bio_kennz_stimmt": true, "bio_warenbegleit": true, "temp_kuehl_molkerei": true}	2	t	2026-03-20 10:32:37.511324	3	[]	{}	wareneingaenge
26	1	TK Edeka	\N	tk	{"mhd": true, "hygiene": true, "temp_tk": true, "qualitaet": true, "etikettierung": true}	3	t	2026-03-20 10:32:37.511324	3	[]	{}	wareneingaenge
16	1	Grossmann	\N	ungekuehlt	{"mhd": true, "hygiene": true, "qualitaet": true, "etikettierung": true}	8	f	2026-03-20 10:32:37.511324	1	[]	{}	wareneingaenge
12	1	Oelz	\N	kuehl	{"mhd": true, "hygiene": true, "qualitaet": true, "etikettierung": true, "temp_kuehl_molkerei": true}	4	t	2026-03-20 10:32:37.511324	1	[5]	{}	wareneingaenge
11	1	TK Edeka	\N	tk	{"mhd": true, "hygiene": true, "temp_tk": true, "qualitaet": true, "etikettierung": true}	3	t	2026-03-20 10:32:37.511324	1	[1, 3, 4]	{}	wareneingaenge
24	1	Obst und Gemuese	\N	kuehl	{"mhd": true, "qs_by": true, "qs_qs": true, "hygiene": true, "qualitaet": true, "qs_biosiegel": true, "etikettierung": true, "kistenetikett": true, "temp_kuehl_og": true}	1	t	2026-03-20 10:32:37.511324	3	[1, 2, 3, 4, 5, 6]	{}	wareneingaenge
9	1	Obst und Gemuese	\N	kuehl	{"mhd": true, "qs_by": true, "qs_qs": true, "hygiene": true, "qualitaet": true, "qs_biosiegel": true, "etikettierung": true, "kistenetikett": true, "temp_kuehl_og": true}	1	t	2026-03-20 10:32:37.511324	1	[1, 2, 3, 4, 5]	{}	wareneingaenge
10	1	MoPro	\N	kuehl	{"mhd": true, "hygiene": true, "bio_kennz": true, "qualitaet": true, "bio_geliefert": true, "etikettierung": true, "bio_zertifikat": true, "bio_vermischung": true, "bio_kennz_stimmt": true, "bio_warenbegleit": true, "temp_kuehl_molkerei": true}	2	t	2026-03-20 10:32:37.511324	1	[1, 2, 3, 4, 5, 6]	{}	wareneingaenge
27	1	Oelz	\N	kuehl	{"mhd": true, "hygiene": true, "qualitaet": true, "etikettierung": true, "temp_kuehl_molkerei": true}	4	t	2026-03-20 10:32:37.511324	3	[]	{}	wareneingaenge
28	1	Ursberg	\N	kuehl	{"mhd": true, "hygiene": true, "bio_kennz": true, "qualitaet": true, "bio_geliefert": true, "etikettierung": true, "bio_zertifikat": true, "bio_vermischung": true, "bio_kennz_stimmt": true, "bio_warenbegleit": true, "temp_kuehl_molkerei": true}	5	t	2026-03-20 10:32:37.511324	3	[]	{}	wareneingaenge
29	1	Unser Land	\N	kuehl	{"mhd": true, "hygiene": true, "bio_kennz": true, "qualitaet": true, "qs_biosiegel": true, "bio_geliefert": true, "etikettierung": true, "temp_kuehl_og": true, "bio_zertifikat": true, "bio_vermischung": true, "bio_kennz_stimmt": true, "bio_warenbegleit": true}	6	t	2026-03-20 10:32:37.511324	3	[]	{}	wareneingaenge
30	1	Settele	\N	kuehl	{"mhd": true, "hygiene": true, "qualitaet": true, "etikettierung": true, "temp_kuehl_molkerei": true}	7	t	2026-03-20 10:32:37.511324	3	[]	{}	wareneingaenge
31	1	Grossmann	\N	ungekuehlt	{"mhd": true, "hygiene": true, "qualitaet": true, "etikettierung": true}	8	t	2026-03-20 10:32:37.511324	3	[]	{}	wareneingaenge
32	1	Test Lieferant TK	\N	tk	{"mhd": true, "hygiene": true, "qualitaet": true, "etikettierung": true}	99	t	2026-03-20 10:42:39.04399	2	[]	{}	wareneingaenge
35	1	Grimmer		kuehl	{"mhd": true, "qs_qs": true, "hygiene": true, "qualitaet": true, "rindfleisch": true, "temp_fleisch": true, "etikettierung": true}	3	t	2026-03-20 12:36:39.604491	1	[]	{}	metzgerei
36	1	Haller		kuehl	{"mhd": true, "qs_qs": true, "hygiene": true, "qualitaet": true, "rindfleisch": true, "temp_fleisch": true, "etikettierung": true}	4	t	2026-03-20 12:36:39.604491	1	[]	{}	metzgerei
39	1	Slottke		kuehl	{"mhd": true, "qs_qs": true, "hygiene": true, "qualitaet": true, "rindfleisch": true, "temp_fleisch": true, "etikettierung": true}	7	t	2026-03-20 12:36:39.604491	1	[]	{}	metzgerei
40	1	SBF		kuehl	{"mhd": true, "qs_qs": true, "hygiene": true, "qualitaet": true, "rindfleisch": true, "temp_fleisch": true, "etikettierung": true}	1	t	2026-03-20 12:36:39.604491	2	[]	{}	metzgerei
42	1	Grimmer		kuehl	{"mhd": true, "qs_qs": true, "hygiene": true, "qualitaet": true, "rindfleisch": true, "temp_fleisch": true, "etikettierung": true}	3	t	2026-03-20 12:36:39.604491	2	[]	{}	metzgerei
43	1	Haller		kuehl	{"mhd": true, "qs_qs": true, "hygiene": true, "qualitaet": true, "rindfleisch": true, "temp_fleisch": true, "etikettierung": true}	4	t	2026-03-20 12:36:39.604491	2	[]	{}	metzgerei
46	1	Slottke		kuehl	{"mhd": true, "qs_qs": true, "hygiene": true, "qualitaet": true, "rindfleisch": true, "temp_fleisch": true, "etikettierung": true}	7	t	2026-03-20 12:36:39.604491	2	[]	{}	metzgerei
47	1	SBF		kuehl	{"mhd": true, "qs_qs": true, "hygiene": true, "qualitaet": true, "rindfleisch": true, "temp_fleisch": true, "etikettierung": true}	1	t	2026-03-20 12:36:39.604491	3	[]	{}	metzgerei
49	1	Grimmer		kuehl	{"mhd": true, "qs_qs": true, "hygiene": true, "qualitaet": true, "rindfleisch": true, "temp_fleisch": true, "etikettierung": true}	3	t	2026-03-20 12:36:39.604491	3	[]	{}	metzgerei
50	1	Haller		kuehl	{"mhd": true, "qs_qs": true, "hygiene": true, "qualitaet": true, "rindfleisch": true, "temp_fleisch": true, "etikettierung": true}	4	t	2026-03-20 12:36:39.604491	3	[]	{}	metzgerei
53	1	Slottke		kuehl	{"mhd": true, "qs_qs": true, "hygiene": true, "qualitaet": true, "rindfleisch": true, "temp_fleisch": true, "etikettierung": true}	7	t	2026-03-20 12:36:39.604491	3	[]	{}	metzgerei
37	1	Schönegger		kuehl	{"mhd": true, "hygiene": true, "qualitaet": true, "etikettierung": true}	5	t	2026-03-20 12:36:39.604491	1	[]	{}	metzgerei
44	1	Schönegger		kuehl	{"mhd": true, "hygiene": true, "qualitaet": true, "etikettierung": true}	5	t	2026-03-20 12:36:39.604491	2	[]	{}	metzgerei
51	1	Schönegger		kuehl	{"mhd": true, "hygiene": true, "qualitaet": true, "etikettierung": true}	5	t	2026-03-20 12:36:39.604491	3	[]	{}	metzgerei
38	1	Friedi's Käse		kuehl	{"mhd": true, "hygiene": true, "qualitaet": true, "etikettierung": true}	6	t	2026-03-20 12:36:39.604491	1	[]	{}	metzgerei
45	1	Friedi's Käse		kuehl	{"mhd": true, "hygiene": true, "qualitaet": true, "etikettierung": true}	6	t	2026-03-20 12:36:39.604491	2	[]	{}	metzgerei
52	1	Friedi's Käse		kuehl	{"mhd": true, "hygiene": true, "qualitaet": true, "etikettierung": true}	6	t	2026-03-20 12:36:39.604491	3	[]	{}	metzgerei
54	1	Coka Cola	\N	ungekuehlt	{"mhd": true, "hygiene": true, "qualitaet": true, "etikettierung": true}	99	t	2026-03-23 10:39:55.863356	1	[2]	{}	wareneingaenge
56	1	Krake	\N	fisch	{"mhd": true, "fisch_haut": true, "fisch_augen": true, "fisch_geruch": true, "fisch_kiemen": true, "etikettierung": true, "fisch_herkunft": true, "fisch_konsistenz": true, "temp_frischfisch": true}	99	t	2026-03-26 10:49:21.206681	1	[]	{}	metzgerei
41	1	Deutsche See		msc_fisch	{"mhd": true, "fisch_haut": true, "nemat_json": true, "fisch_augen": true, "fisch_geruch": true, "fisch_kiemen": true, "etikettierung": true, "fisch_msc_coc": true, "fisch_herkunft": true, "fisch_msc_kennz": true, "fisch_arten_json": true, "fisch_konsistenz": true, "temp_frischfisch": true, "fisch_msc_geliefert": true, "fisch_msc_zertifikat": true}	2	t	2026-03-20 12:36:39.604491	2	[]	{}	metzgerei
48	1	Deutsche See		msc_fisch	{"mhd": true, "fisch_haut": true, "nemat_json": true, "fisch_augen": true, "fisch_geruch": true, "fisch_kiemen": true, "etikettierung": true, "fisch_msc_coc": true, "fisch_herkunft": true, "fisch_msc_kennz": true, "fisch_arten_json": true, "fisch_konsistenz": true, "temp_frischfisch": true, "fisch_msc_geliefert": true, "fisch_msc_zertifikat": true}	2	t	2026-03-20 12:36:39.604491	3	[]	{}	metzgerei
55	1	testi	\N	kuehl	{"mhd": true, "hygiene": true, "qualitaet": true, "etikettierung": true}	99	t	2026-03-25 11:17:50.58186	1	[]	{}	wareneingaenge
33	1	SBF		kuehl	{"mhd": true, "qs_qs": true, "hygiene": true, "qualitaet": true, "rindfleisch": true, "temp_fleisch": true, "etikettierung": true}	1	t	2026-03-20 12:36:39.604491	1	[3, 4]	{}	metzgerei
34	1	Deutsche See		msc_fisch	{"mhd": true, "fisch_haut": true, "nemat_json": true, "fisch_augen": true, "fisch_geruch": true, "fisch_kiemen": true, "etikettierung": true, "fisch_msc_coc": true, "fisch_herkunft": true, "fisch_msc_kennz": true, "fisch_arten_json": true, "fisch_konsistenz": true, "temp_frischfisch": true, "fisch_msc_geliefert": true, "fisch_msc_zertifikat": true}	2	t	2026-03-20 12:36:39.604491	1	[2, 4]	{}	metzgerei
\.


--
-- Name: admin_invitations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_invitations_id_seq', 1, true);


--
-- Name: anti_vektor_zertifikate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.anti_vektor_zertifikate_id_seq', 1, false);


--
-- Name: anti_vektor_zugangsdaten_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.anti_vektor_zugangsdaten_id_seq', 1, true);


--
-- Name: arzneimittel_sachkunde_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.arzneimittel_sachkunde_id_seq', 1, false);


--
-- Name: bescheinigungen_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bescheinigungen_id_seq', 1, false);


--
-- Name: besprechung_teilnehmer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.besprechung_teilnehmer_id_seq', 4, true);


--
-- Name: besprechungsdokumente_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.besprechungsdokumente_id_seq', 1, false);


--
-- Name: besprechungsprotokoll_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.besprechungsprotokoll_id_seq', 3, true);


--
-- Name: betriebsbegehung_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.betriebsbegehung_id_seq', 3, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 3, true);


--
-- Name: cleaning_plan_confirmations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cleaning_plan_confirmations_id_seq', 47, true);


--
-- Name: eingefrorenes_fleisch_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.eingefrorenes_fleisch_id_seq', 5, true);


--
-- Name: email_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.email_settings_id_seq', 1, true);


--
-- Name: feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.feedback_id_seq', 3, true);


--
-- Name: form_definitions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.form_definitions_id_seq', 12, true);


--
-- Name: form_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.form_entries_id_seq', 1, false);


--
-- Name: form_instances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.form_instances_id_seq', 1, true);


--
-- Name: gesundheitszeugnisse_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.gesundheitszeugnisse_id_seq', 1, false);


--
-- Name: gq_begehung_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.gq_begehung_id_seq', 4, true);


--
-- Name: hygienebelehrung_abt_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hygienebelehrung_abt_id_seq', 3, true);


--
-- Name: kaesetheke_kontrolle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.kaesetheke_kontrolle_id_seq', 91, true);


--
-- Name: kontrollberichte_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.kontrollberichte_id_seq', 1, false);


--
-- Name: laden_bestellgebiete_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.laden_bestellgebiete_id_seq', 12, true);


--
-- Name: laden_bestellungen_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.laden_bestellungen_id_seq', 2, true);


--
-- Name: laden_lieferplaene_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.laden_lieferplaene_id_seq', 6, true);


--
-- Name: market_email_configs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.market_email_configs_id_seq', 3, true);


--
-- Name: market_info_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.market_info_id_seq', 12, true);


--
-- Name: markets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.markets_id_seq', 3, true);


--
-- Name: metz_reinigung_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.metz_reinigung_id_seq', 284, true);


--
-- Name: mhd_kontrolle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mhd_kontrolle_id_seq', 1, false);


--
-- Name: monatsbericht_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.monatsbericht_config_id_seq', 1, false);


--
-- Name: notification_channels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notification_channels_id_seq', 4, true);


--
-- Name: notification_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notification_log_id_seq', 39, true);


--
-- Name: notification_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notification_rules_id_seq', 5, true);


--
-- Name: oeffnung_salate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.oeffnung_salate_id_seq', 9, true);


--
-- Name: password_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.password_tokens_id_seq', 6, true);


--
-- Name: probeentnahme_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.probeentnahme_id_seq', 1, false);


--
-- Name: produktfehlermeldung_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.produktfehlermeldung_id_seq', 4, true);


--
-- Name: registered_devices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.registered_devices_id_seq', 13, true);


--
-- Name: reinigung_taeglich_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reinigung_taeglich_id_seq', 171, true);


--
-- Name: responsibilities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.responsibilities_id_seq', 100, true);


--
-- Name: rezeptur_kategorien_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rezeptur_kategorien_id_seq', 2, true);


--
-- Name: rezepturen_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rezepturen_id_seq', 62, true);


--
-- Name: role_permission_defaults_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.role_permission_defaults_id_seq', 5, true);


--
-- Name: schulungs_ausnahmen_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.schulungs_ausnahmen_id_seq', 1, true);


--
-- Name: schulungs_person_zuordnungen_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.schulungs_person_zuordnungen_id_seq', 1, false);


--
-- Name: schulungs_pflichten_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.schulungs_pflichten_id_seq', 32, true);


--
-- Name: schulungsnachweise_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.schulungsnachweise_id_seq', 1, false);


--
-- Name: sections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sections_id_seq', 54, true);


--
-- Name: semmelliste_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.semmelliste_id_seq', 5, true);


--
-- Name: shelf_markers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shelf_markers_id_seq', 60, true);


--
-- Name: strecken_bestellungen_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.strecken_bestellungen_id_seq', 55, true);


--
-- Name: strecken_lieferanten_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.strecken_lieferanten_id_seq', 43, true);


--
-- Name: tenants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tenants_id_seq', 1, true);


--
-- Name: till_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.till_assignments_id_seq', 5, true);


--
-- Name: todo_adhoc_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.todo_adhoc_tasks_id_seq', 4, true);


--
-- Name: todo_daily_completions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.todo_daily_completions_id_seq', 2, true);


--
-- Name: todo_standard_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.todo_standard_tasks_id_seq', 3, true);


--
-- Name: training_attendances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.training_attendances_id_seq', 16, true);


--
-- Name: training_session_topics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.training_session_topics_id_seq', 63, true);


--
-- Name: training_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.training_sessions_id_seq', 13, true);


--
-- Name: training_topics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.training_topics_id_seq', 19, true);


--
-- Name: tuev_jahresbericht_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tuev_jahresbericht_id_seq', 1, false);


--
-- Name: user_market_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_market_assignments_id_seq', 1, true);


--
-- Name: user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_permissions_id_seq', 55, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 17, true);


--
-- Name: ware_bestellungen_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ware_bestellungen_id_seq', 1, false);


--
-- Name: ware_einraeumservice_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ware_einraeumservice_id_seq', 1, true);


--
-- Name: ware_mhd_bereiche_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ware_mhd_bereiche_id_seq', 430, true);


--
-- Name: ware_mhd_kontrollen_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ware_mhd_kontrollen_id_seq', 1, true);


--
-- Name: ware_rayons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ware_rayons_id_seq', 8, true);


--
-- Name: warencheck_og_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.warencheck_og_id_seq', 67, true);


--
-- Name: wareneingang_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.wareneingang_entries_id_seq', 31, true);


--
-- Name: wareneingang_jahresarchiv_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.wareneingang_jahresarchiv_id_seq', 1, false);


--
-- Name: wareneingang_og_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.wareneingang_og_id_seq', 2, true);


--
-- Name: wareneingang_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.wareneingang_types_id_seq', 56, true);


--
-- Name: admin_invitations admin_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_invitations
    ADD CONSTRAINT admin_invitations_pkey PRIMARY KEY (id);


--
-- Name: admin_invitations admin_invitations_token_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_invitations
    ADD CONSTRAINT admin_invitations_token_unique UNIQUE (token);


--
-- Name: anti_vektor_zertifikate anti_vektor_zertifikate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anti_vektor_zertifikate
    ADD CONSTRAINT anti_vektor_zertifikate_pkey PRIMARY KEY (id);


--
-- Name: anti_vektor_zugangsdaten anti_vektor_zugangsdaten_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anti_vektor_zugangsdaten
    ADD CONSTRAINT anti_vektor_zugangsdaten_pkey PRIMARY KEY (id);


--
-- Name: anti_vektor_zugangsdaten anti_vektor_zugangsdaten_tenant_market_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anti_vektor_zugangsdaten
    ADD CONSTRAINT anti_vektor_zugangsdaten_tenant_market_unique UNIQUE (tenant_id, market_id);


--
-- Name: arzneimittel_sachkunde arzneimittel_sachkunde_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.arzneimittel_sachkunde
    ADD CONSTRAINT arzneimittel_sachkunde_pkey PRIMARY KEY (id);


--
-- Name: bescheinigungen bescheinigungen_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bescheinigungen
    ADD CONSTRAINT bescheinigungen_pkey PRIMARY KEY (id);


--
-- Name: besprechung_teilnehmer besprechung_teilnehmer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.besprechung_teilnehmer
    ADD CONSTRAINT besprechung_teilnehmer_pkey PRIMARY KEY (id);


--
-- Name: besprechungsdokumente besprechungsdokumente_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.besprechungsdokumente
    ADD CONSTRAINT besprechungsdokumente_pkey PRIMARY KEY (id);


--
-- Name: besprechungsprotokoll besprechungsprotokoll_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.besprechungsprotokoll
    ADD CONSTRAINT besprechungsprotokoll_pkey PRIMARY KEY (id);


--
-- Name: betriebsbegehung betriebsbegehung_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.betriebsbegehung
    ADD CONSTRAINT betriebsbegehung_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: cleaning_plan_confirmations cleaning_plan_confirmations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cleaning_plan_confirmations
    ADD CONSTRAINT cleaning_plan_confirmations_pkey PRIMARY KEY (id);


--
-- Name: cleaning_plan_confirmations cleaning_plan_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cleaning_plan_confirmations
    ADD CONSTRAINT cleaning_plan_unique UNIQUE (tenant_id, market_id, item_key, year, month);


--
-- Name: eingefrorenes_fleisch eingefrorenes_fleisch_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eingefrorenes_fleisch
    ADD CONSTRAINT eingefrorenes_fleisch_pkey PRIMARY KEY (id);


--
-- Name: email_settings email_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_settings
    ADD CONSTRAINT email_settings_pkey PRIMARY KEY (id);


--
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- Name: form_definitions form_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_definitions
    ADD CONSTRAINT form_definitions_pkey PRIMARY KEY (id);


--
-- Name: form_entries form_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_entries
    ADD CONSTRAINT form_entries_pkey PRIMARY KEY (id);


--
-- Name: form_instances form_instances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_instances
    ADD CONSTRAINT form_instances_pkey PRIMARY KEY (id);


--
-- Name: gesundheitszeugnisse gesundheitszeugnisse_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gesundheitszeugnisse
    ADD CONSTRAINT gesundheitszeugnisse_pkey PRIMARY KEY (id);


--
-- Name: gq_begehung gq_begehung_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gq_begehung
    ADD CONSTRAINT gq_begehung_pkey PRIMARY KEY (id);


--
-- Name: hygienebelehrung_abt hygienebelehrung_abt_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hygienebelehrung_abt
    ADD CONSTRAINT hygienebelehrung_abt_pkey PRIMARY KEY (id);


--
-- Name: kaesetheke_kontrolle kaesetheke_kontrolle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kaesetheke_kontrolle
    ADD CONSTRAINT kaesetheke_kontrolle_pkey PRIMARY KEY (id);


--
-- Name: kontrollberichte kontrollberichte_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kontrollberichte
    ADD CONSTRAINT kontrollberichte_pkey PRIMARY KEY (id);


--
-- Name: laden_bestellgebiete laden_bestellgebiete_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laden_bestellgebiete
    ADD CONSTRAINT laden_bestellgebiete_pkey PRIMARY KEY (id);


--
-- Name: laden_bestellungen laden_bestellungen_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laden_bestellungen
    ADD CONSTRAINT laden_bestellungen_pkey PRIMARY KEY (id);


--
-- Name: laden_lieferplaene laden_lieferplaene_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laden_lieferplaene
    ADD CONSTRAINT laden_lieferplaene_pkey PRIMARY KEY (id);


--
-- Name: market_email_configs market_email_configs_market_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.market_email_configs
    ADD CONSTRAINT market_email_configs_market_id_key UNIQUE (market_id);


--
-- Name: market_email_configs market_email_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.market_email_configs
    ADD CONSTRAINT market_email_configs_pkey PRIMARY KEY (id);


--
-- Name: market_info market_info_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.market_info
    ADD CONSTRAINT market_info_pkey PRIMARY KEY (id);


--
-- Name: markets markets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.markets
    ADD CONSTRAINT markets_pkey PRIMARY KEY (id);


--
-- Name: metz_reinigung metz_reinigung_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metz_reinigung
    ADD CONSTRAINT metz_reinigung_pkey PRIMARY KEY (id);


--
-- Name: mhd_kontrolle mhd_kontrolle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mhd_kontrolle
    ADD CONSTRAINT mhd_kontrolle_pkey PRIMARY KEY (id);


--
-- Name: monatsbericht_config monatsbericht_config_market_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monatsbericht_config
    ADD CONSTRAINT monatsbericht_config_market_id_key UNIQUE (market_id);


--
-- Name: monatsbericht_config monatsbericht_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monatsbericht_config
    ADD CONSTRAINT monatsbericht_config_pkey PRIMARY KEY (id);


--
-- Name: notification_channels notification_channels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_channels
    ADD CONSTRAINT notification_channels_pkey PRIMARY KEY (id);


--
-- Name: notification_channels notification_channels_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_channels
    ADD CONSTRAINT notification_channels_user_id_key UNIQUE (user_id);


--
-- Name: notification_log notification_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_log
    ADD CONSTRAINT notification_log_pkey PRIMARY KEY (id);


--
-- Name: notification_rules notification_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_rules
    ADD CONSTRAINT notification_rules_pkey PRIMARY KEY (id);


--
-- Name: oeffnung_salate oeffnung_salate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oeffnung_salate
    ADD CONSTRAINT oeffnung_salate_pkey PRIMARY KEY (id);


--
-- Name: password_tokens password_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_tokens
    ADD CONSTRAINT password_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_tokens password_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_tokens
    ADD CONSTRAINT password_tokens_token_key UNIQUE (token);


--
-- Name: probeentnahme probeentnahme_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.probeentnahme
    ADD CONSTRAINT probeentnahme_pkey PRIMARY KEY (id);


--
-- Name: produktfehlermeldung produktfehlermeldung_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produktfehlermeldung
    ADD CONSTRAINT produktfehlermeldung_pkey PRIMARY KEY (id);


--
-- Name: registered_devices registered_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registered_devices
    ADD CONSTRAINT registered_devices_pkey PRIMARY KEY (id);


--
-- Name: registered_devices registered_devices_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registered_devices
    ADD CONSTRAINT registered_devices_token_key UNIQUE (token);


--
-- Name: reinigung_taeglich reinigung_taeglich_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reinigung_taeglich
    ADD CONSTRAINT reinigung_taeglich_pkey PRIMARY KEY (id);


--
-- Name: responsibilities responsibilities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.responsibilities
    ADD CONSTRAINT responsibilities_pkey PRIMARY KEY (id);


--
-- Name: rezeptur_kategorien rezeptur_kategorien_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rezeptur_kategorien
    ADD CONSTRAINT rezeptur_kategorien_pkey PRIMARY KEY (id);


--
-- Name: rezepturen rezepturen_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rezepturen
    ADD CONSTRAINT rezepturen_pkey PRIMARY KEY (id);


--
-- Name: role_permission_defaults role_permission_defaults_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permission_defaults
    ADD CONSTRAINT role_permission_defaults_pkey PRIMARY KEY (id);


--
-- Name: role_permission_defaults role_permission_defaults_tenant_id_role_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permission_defaults
    ADD CONSTRAINT role_permission_defaults_tenant_id_role_key UNIQUE (tenant_id, role);


--
-- Name: schulungs_ausnahmen schulungs_ausnahmen_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schulungs_ausnahmen
    ADD CONSTRAINT schulungs_ausnahmen_pkey PRIMARY KEY (id);


--
-- Name: schulungs_ausnahmen schulungs_ausnahmen_user_id_schulungs_pflicht_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schulungs_ausnahmen
    ADD CONSTRAINT schulungs_ausnahmen_user_id_schulungs_pflicht_id_key UNIQUE (user_id, schulungs_pflicht_id);


--
-- Name: schulungs_person_zuordnungen schulungs_person_zuordnungen_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schulungs_person_zuordnungen
    ADD CONSTRAINT schulungs_person_zuordnungen_pkey PRIMARY KEY (id);


--
-- Name: schulungs_person_zuordnungen schulungs_person_zuordnungen_schulungs_pflicht_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schulungs_person_zuordnungen
    ADD CONSTRAINT schulungs_person_zuordnungen_schulungs_pflicht_id_user_id_key UNIQUE (schulungs_pflicht_id, user_id);


--
-- Name: schulungs_pflichten schulungs_pflichten_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schulungs_pflichten
    ADD CONSTRAINT schulungs_pflichten_pkey PRIMARY KEY (id);


--
-- Name: schulungsnachweise schulungsnachweise_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schulungsnachweise
    ADD CONSTRAINT schulungsnachweise_pkey PRIMARY KEY (id);


--
-- Name: sections sections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_pkey PRIMARY KEY (id);


--
-- Name: semmelliste_kontingent semmelliste_kontingent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.semmelliste_kontingent
    ADD CONSTRAINT semmelliste_kontingent_pkey PRIMARY KEY (market_id);


--
-- Name: semmelliste semmelliste_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.semmelliste
    ADD CONSTRAINT semmelliste_pkey PRIMARY KEY (id);


--
-- Name: shelf_markers shelf_markers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shelf_markers
    ADD CONSTRAINT shelf_markers_pkey PRIMARY KEY (id);


--
-- Name: strecken_bestellungen strecken_bestellungen_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.strecken_bestellungen
    ADD CONSTRAINT strecken_bestellungen_pkey PRIMARY KEY (id);


--
-- Name: strecken_lieferanten strecken_lieferanten_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.strecken_lieferanten
    ADD CONSTRAINT strecken_lieferanten_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: till_assignments till_assignments_market_id_assignment_date_shift_till_numbe_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.till_assignments
    ADD CONSTRAINT till_assignments_market_id_assignment_date_shift_till_numbe_key UNIQUE (market_id, assignment_date, shift, till_number);


--
-- Name: till_assignments till_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.till_assignments
    ADD CONSTRAINT till_assignments_pkey PRIMARY KEY (id);


--
-- Name: todo_adhoc_tasks todo_adhoc_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todo_adhoc_tasks
    ADD CONSTRAINT todo_adhoc_tasks_pkey PRIMARY KEY (id);


--
-- Name: todo_daily_completions todo_daily_completions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todo_daily_completions
    ADD CONSTRAINT todo_daily_completions_pkey PRIMARY KEY (id);


--
-- Name: todo_daily_completions todo_daily_completions_task_id_completed_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todo_daily_completions
    ADD CONSTRAINT todo_daily_completions_task_id_completed_date_key UNIQUE (task_id, completed_date);


--
-- Name: todo_standard_tasks todo_standard_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todo_standard_tasks
    ADD CONSTRAINT todo_standard_tasks_pkey PRIMARY KEY (id);


--
-- Name: training_attendances training_attendance_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_attendances
    ADD CONSTRAINT training_attendance_unique UNIQUE (session_id, user_id);


--
-- Name: training_attendances training_attendances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_attendances
    ADD CONSTRAINT training_attendances_pkey PRIMARY KEY (id);


--
-- Name: training_session_topics training_session_topics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_session_topics
    ADD CONSTRAINT training_session_topics_pkey PRIMARY KEY (id);


--
-- Name: training_sessions training_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_sessions
    ADD CONSTRAINT training_sessions_pkey PRIMARY KEY (id);


--
-- Name: training_topics training_topics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_topics
    ADD CONSTRAINT training_topics_pkey PRIMARY KEY (id);


--
-- Name: tuev_jahresbericht tuev_jahresbericht_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tuev_jahresbericht
    ADD CONSTRAINT tuev_jahresbericht_pkey PRIMARY KEY (id);


--
-- Name: user_market_assignments user_market_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_market_assignments
    ADD CONSTRAINT user_market_assignments_pkey PRIMARY KEY (id);


--
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ware_bestellungen ware_bestellungen_market_id_rayon_id_datum_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ware_bestellungen
    ADD CONSTRAINT ware_bestellungen_market_id_rayon_id_datum_key UNIQUE (market_id, rayon_id, datum);


--
-- Name: ware_bestellungen ware_bestellungen_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ware_bestellungen
    ADD CONSTRAINT ware_bestellungen_pkey PRIMARY KEY (id);


--
-- Name: ware_einraeumservice ware_einraeumservice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ware_einraeumservice
    ADD CONSTRAINT ware_einraeumservice_pkey PRIMARY KEY (id);


--
-- Name: ware_mhd_bereiche ware_mhd_bereiche_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ware_mhd_bereiche
    ADD CONSTRAINT ware_mhd_bereiche_pkey PRIMARY KEY (id);


--
-- Name: ware_mhd_kontrollen ware_mhd_kontrollen_market_id_bereich_id_datum_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ware_mhd_kontrollen
    ADD CONSTRAINT ware_mhd_kontrollen_market_id_bereich_id_datum_key UNIQUE (market_id, bereich_id, datum);


--
-- Name: ware_mhd_kontrollen ware_mhd_kontrollen_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ware_mhd_kontrollen
    ADD CONSTRAINT ware_mhd_kontrollen_pkey PRIMARY KEY (id);


--
-- Name: ware_rayons ware_rayons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ware_rayons
    ADD CONSTRAINT ware_rayons_pkey PRIMARY KEY (id);


--
-- Name: warencheck_og warencheck_og_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warencheck_og
    ADD CONSTRAINT warencheck_og_pkey PRIMARY KEY (id);


--
-- Name: wareneingang_entries wareneingang_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wareneingang_entries
    ADD CONSTRAINT wareneingang_entries_pkey PRIMARY KEY (id);


--
-- Name: wareneingang_jahresarchiv wareneingang_jahresarchiv_market_id_type_id_year_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wareneingang_jahresarchiv
    ADD CONSTRAINT wareneingang_jahresarchiv_market_id_type_id_year_key UNIQUE (market_id, type_id, year);


--
-- Name: wareneingang_jahresarchiv wareneingang_jahresarchiv_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wareneingang_jahresarchiv
    ADD CONSTRAINT wareneingang_jahresarchiv_pkey PRIMARY KEY (id);


--
-- Name: wareneingang_og wareneingang_og_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wareneingang_og
    ADD CONSTRAINT wareneingang_og_pkey PRIMARY KEY (id);


--
-- Name: wareneingang_types wareneingang_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wareneingang_types
    ADD CONSTRAINT wareneingang_types_pkey PRIMARY KEY (id);


--
-- Name: idx_metz_rein_market_datum; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_metz_rein_market_datum ON public.metz_reinigung USING btree (market_id, datum);


--
-- Name: idx_strecken_bestellungen_lieferant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_strecken_bestellungen_lieferant ON public.strecken_bestellungen USING btree (lieferant_id, bestellt_am DESC);


--
-- Name: idx_strecken_bestellungen_market; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_strecken_bestellungen_market ON public.strecken_bestellungen USING btree (market_id, tenant_id);


--
-- Name: users_tenant_pin_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_tenant_pin_unique ON public.users USING btree (tenant_id, pin);


--
-- Name: admin_invitations admin_invitations_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_invitations
    ADD CONSTRAINT admin_invitations_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: cleaning_plan_confirmations cleaning_plan_confirmations_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cleaning_plan_confirmations
    ADD CONSTRAINT cleaning_plan_confirmations_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: form_definitions form_definitions_section_id_sections_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_definitions
    ADD CONSTRAINT form_definitions_section_id_sections_id_fk FOREIGN KEY (section_id) REFERENCES public.sections(id);


--
-- Name: form_entries form_entries_form_definition_id_form_definitions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_entries
    ADD CONSTRAINT form_entries_form_definition_id_form_definitions_id_fk FOREIGN KEY (form_definition_id) REFERENCES public.form_definitions(id);


--
-- Name: form_entries form_entries_form_instance_id_form_instances_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_entries
    ADD CONSTRAINT form_entries_form_instance_id_form_instances_id_fk FOREIGN KEY (form_instance_id) REFERENCES public.form_instances(id);


--
-- Name: form_instances form_instances_market_id_markets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_instances
    ADD CONSTRAINT form_instances_market_id_markets_id_fk FOREIGN KEY (market_id) REFERENCES public.markets(id);


--
-- Name: form_instances form_instances_section_id_sections_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_instances
    ADD CONSTRAINT form_instances_section_id_sections_id_fk FOREIGN KEY (section_id) REFERENCES public.sections(id);


--
-- Name: market_info market_info_market_id_markets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.market_info
    ADD CONSTRAINT market_info_market_id_markets_id_fk FOREIGN KEY (market_id) REFERENCES public.markets(id);


--
-- Name: markets markets_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.markets
    ADD CONSTRAINT markets_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: monatsbericht_config monatsbericht_config_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monatsbericht_config
    ADD CONSTRAINT monatsbericht_config_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id);


--
-- Name: password_tokens password_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_tokens
    ADD CONSTRAINT password_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: registered_devices registered_devices_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registered_devices
    ADD CONSTRAINT registered_devices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: responsibilities responsibilities_market_id_markets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.responsibilities
    ADD CONSTRAINT responsibilities_market_id_markets_id_fk FOREIGN KEY (market_id) REFERENCES public.markets(id);


--
-- Name: rezepturen rezepturen_kategorie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rezepturen
    ADD CONSTRAINT rezepturen_kategorie_id_fkey FOREIGN KEY (kategorie_id) REFERENCES public.rezeptur_kategorien(id);


--
-- Name: schulungs_ausnahmen schulungs_ausnahmen_schulungs_pflicht_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schulungs_ausnahmen
    ADD CONSTRAINT schulungs_ausnahmen_schulungs_pflicht_id_fkey FOREIGN KEY (schulungs_pflicht_id) REFERENCES public.schulungs_pflichten(id) ON DELETE CASCADE;


--
-- Name: schulungs_person_zuordnungen schulungs_person_zuordnungen_schulungs_pflicht_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schulungs_person_zuordnungen
    ADD CONSTRAINT schulungs_person_zuordnungen_schulungs_pflicht_id_fkey FOREIGN KEY (schulungs_pflicht_id) REFERENCES public.schulungs_pflichten(id) ON DELETE CASCADE;


--
-- Name: schulungs_person_zuordnungen schulungs_person_zuordnungen_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schulungs_person_zuordnungen
    ADD CONSTRAINT schulungs_person_zuordnungen_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: schulungs_pflichten schulungs_pflichten_parent_pflicht_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schulungs_pflichten
    ADD CONSTRAINT schulungs_pflichten_parent_pflicht_id_fkey FOREIGN KEY (parent_pflicht_id) REFERENCES public.schulungs_pflichten(id) ON DELETE CASCADE;


--
-- Name: schulungs_pflichten schulungs_pflichten_training_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schulungs_pflichten
    ADD CONSTRAINT schulungs_pflichten_training_topic_id_fkey FOREIGN KEY (training_topic_id) REFERENCES public.training_topics(id) ON DELETE SET NULL;


--
-- Name: sections sections_category_id_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: strecken_bestellungen strecken_bestellungen_lieferant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.strecken_bestellungen
    ADD CONSTRAINT strecken_bestellungen_lieferant_id_fkey FOREIGN KEY (lieferant_id) REFERENCES public.strecken_lieferanten(id) ON DELETE CASCADE;


--
-- Name: till_assignments till_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.till_assignments
    ADD CONSTRAINT till_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: todo_daily_completions todo_daily_completions_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.todo_daily_completions
    ADD CONSTRAINT todo_daily_completions_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.todo_standard_tasks(id) ON DELETE CASCADE;


--
-- Name: training_attendances training_attendances_session_id_training_sessions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_attendances
    ADD CONSTRAINT training_attendances_session_id_training_sessions_id_fk FOREIGN KEY (session_id) REFERENCES public.training_sessions(id) ON DELETE CASCADE;


--
-- Name: training_attendances training_attendances_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_attendances
    ADD CONSTRAINT training_attendances_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: training_session_topics training_session_topics_session_id_training_sessions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_session_topics
    ADD CONSTRAINT training_session_topics_session_id_training_sessions_id_fk FOREIGN KEY (session_id) REFERENCES public.training_sessions(id) ON DELETE CASCADE;


--
-- Name: training_session_topics training_session_topics_topic_id_training_topics_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_session_topics
    ADD CONSTRAINT training_session_topics_topic_id_training_topics_id_fk FOREIGN KEY (topic_id) REFERENCES public.training_topics(id);


--
-- Name: training_sessions training_sessions_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_sessions
    ADD CONSTRAINT training_sessions_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: training_sessions training_sessions_trainer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_sessions
    ADD CONSTRAINT training_sessions_trainer_id_users_id_fk FOREIGN KEY (trainer_id) REFERENCES public.users(id);


--
-- Name: user_market_assignments user_market_assignments_market_id_markets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_market_assignments
    ADD CONSTRAINT user_market_assignments_market_id_markets_id_fk FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;


--
-- Name: user_market_assignments user_market_assignments_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_market_assignments
    ADD CONSTRAINT user_market_assignments_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_permissions user_permissions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: ware_bestellungen ware_bestellungen_rayon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ware_bestellungen
    ADD CONSTRAINT ware_bestellungen_rayon_id_fkey FOREIGN KEY (rayon_id) REFERENCES public.ware_rayons(id) ON DELETE CASCADE;


--
-- Name: ware_mhd_kontrollen ware_mhd_kontrollen_bereich_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ware_mhd_kontrollen
    ADD CONSTRAINT ware_mhd_kontrollen_bereich_id_fkey FOREIGN KEY (bereich_id) REFERENCES public.ware_mhd_bereiche(id) ON DELETE CASCADE;


--
-- Name: wareneingang_entries wareneingang_entries_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wareneingang_entries
    ADD CONSTRAINT wareneingang_entries_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.wareneingang_types(id);


--
-- PostgreSQL database dump complete
--

\unrestrict K4NQ5CqQhYIaYtSlccd6KXTIHVDve9gAvj0eRwUqwdRebjj2AeTZ0KBLXwuzjOf


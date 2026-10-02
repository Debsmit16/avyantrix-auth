import os
import sys
from fpdf import FPDF
from fpdf.enums import XPos, YPos

class AvyantrixProposalPDF(FPDF):
    def __init__(self):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.set_auto_page_break(auto=True, margin=15)
        # Brand Color Palette
        self.c_dark = (15, 23, 42)       # Slate 900
        self.c_navy = (30, 41, 59)       # Slate 800
        self.c_blue = (14, 116, 144)     # Cyan 700
        self.c_cyan = (6, 182, 212)      # Cyan 500
        self.c_teal = (16, 185, 129)     # Emerald 500
        self.c_purple = (124, 58, 237)   # Purple 600
        self.c_gray_bg = (248, 250, 252) # Slate 50
        self.c_card_border = (226, 232, 240) # Slate 200
        self.c_text_main = (30, 41, 59)
        self.c_text_muted = (100, 116, 139)

    def header(self):
        if self.page_no() > 1:
            self.set_font("Helvetica", "B", 8)
            self.set_text_color(*self.c_text_muted)
            self.cell(100, 7, "AVYANTRIX ECOSYSTEM PROPOSAL & ARCHITECTURAL BLUEPRINT", new_x=XPos.RIGHT, new_y=YPos.TOP)
            self.set_font("Helvetica", "", 8)
            self.cell(80, 7, "Avyantrix ID | Builds | Challenges", align="R", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            self.set_draw_color(*self.c_card_border)
            self.set_line_width(0.3)
            self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
            self.ln(3)

    def footer(self):
        self.set_y(-12)
        self.set_draw_color(*self.c_card_border)
        self.set_line_width(0.3)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(1.5)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*self.c_text_muted)
        self.cell(0, 5, f"https://www.avyantrix.com  *  https://id.avyantrix.com  *  Page {self.page_no()} of 5", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def chapter_title(self, title, tag=""):
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(*self.c_dark)
        self.cell(0, 7, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        if tag:
            self.set_font("Helvetica", "I", 8.5)
            self.set_text_color(*self.c_blue)
            self.cell(0, 4.5, tag, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(2.5)

    def section_heading(self, heading):
        self.set_font("Helvetica", "B", 10.5)
        self.set_text_color(*self.c_navy)
        self.cell(0, 5.5, heading, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(1)

    def draw_card(self, x, y, w, h, title, content_lines, accent_color=(14, 116, 144)):
        self.set_fill_color(*self.c_gray_bg)
        self.set_draw_color(*self.c_card_border)
        self.rect(x, y, w, h, "DF")
        self.set_fill_color(*accent_color)
        self.rect(x, y, 2.5, h, "F")
        self.set_xy(x + 5, y + 2.5)
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*self.c_dark)
        self.cell(w - 7, 4.5, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_font("Helvetica", "", 7.8)
        self.set_text_color(*self.c_text_main)
        for line in content_lines:
            self.set_x(x + 5)
            self.cell(w - 7, 3.8, line, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def print_key_value(self, key, value, key_w=46, key_color=None):
        if key_color is None:
            key_color = self.c_blue
        start_y = self.get_y()
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(*key_color)
        self.cell(key_w, 4.8, key, new_x=XPos.RIGHT, new_y=YPos.TOP)
        
        self.set_font("Helvetica", "", 7.8)
        self.set_text_color(*self.c_text_main)
        rem_w = self.w - self.r_margin - self.get_x()
        self.multi_cell(rem_w, 4.4, value, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(0.8)


def build_pdf(output_path):
    pdf = AvyantrixProposalPDF()

    # =========================================================================
    # PAGE 1: EXECUTIVE SUMMARY & ECOSYSTEM VISION
    # =========================================================================
    pdf.add_page()

    # Cover Header Banner
    pdf.set_fill_color(15, 23, 42) # Slate 900
    pdf.rect(0, 0, 210, 38, "F")
    
    # Accent top border
    pdf.set_fill_color(6, 182, 212) # Cyan accent
    pdf.rect(0, 0, 210, 2.5, "F")

    pdf.set_xy(15, 8)
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 7, "AVYANTRIX ECOSYSTEM PROPOSAL", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_font("Helvetica", "", 9.5)
    pdf.set_text_color(148, 163, 184) # Slate 400
    pdf.cell(0, 5, "Architectural Blueprint for Unified Identity, DeepTech Capability & Hackathon Ecosystems", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "I", 8.5)
    pdf.cell(0, 4.5, "Official Portals: https://www.avyantrix.com  |  https://id.avyantrix.com", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_y(44)

    # Executive Overview
    pdf.chapter_title("1. Executive Summary & Problem Statement", "THE FRAGMENTATION IN MODERN DEVELOPER & HACKATHON ECOSYSTEMS")
    
    pdf.set_font("Helvetica", "", 8.5)
    pdf.set_text_color(*pdf.c_text_main)
    intro_p1 = (
        "In the contemporary technology landscape, developer ecosystems suffer from massive fragmentation. "
        "Engineers, student innovators, and universities face repetitive 20-field registration forms for every hackathon, "
        "lack portable cryptographic proof of their DeepTech capabilities, and find no unified bridge between collegiate "
        "hackathon victories and continuous enterprise bounty execution. Conversely, enterprises and hackathon organizers "
        "struggle with unverified skill claims, high drop-off rates during registration, and zero continuity post-event."
    )
    pdf.multi_cell(0, 4.2, intro_p1, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(2.5)

    intro_p2 = (
        "Avyantrix introduces an interconnected tripartite platform designed to unify the developer lifecycle: "
        "Avyantrix ID provides cryptographic single sign-on (SSO) and the Cyber ID Hackathon Passport; Avyantrix Builds "
        "serves as the continuous DeepTech capability and bounty engine; and Avyantrix Challenges delivers high-velocity "
        "hackathon and tournament orchestration with 1-Click Fast Pass applications."
    )
    pdf.multi_cell(0, 4.2, intro_p2, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(3.5)

    # 3 Pillar Summary Cards
    pdf.section_heading("The Three Interlocking Pillars of the Avyantrix Platform")

    card_y = pdf.get_y()
    card_w = 58
    card_h = 52

    # Pillar 1 Card
    pdf.draw_card(
        15, card_y, card_w, card_h,
        "1. Avyantrix ID",
        [
            "- Unified Auth & SSO Core",
            "- Cyber ID Hackathon Passport",
            "- Dynamic Clearances & Badges",
            "- OIDC & OAuth 2.0 PKCE",
            "- Self-Service Developer Console",
            "- URL: https://id.avyantrix.com"
        ],
        accent_color=(6, 182, 212)
    )

    # Pillar 2 Card
    pdf.draw_card(
        76, card_y, card_w, card_h,
        "2. Avyantrix Builds",
        [
            "- DeepTech Capability Hub",
            "- Enterprise Problem Bounties",
            "- Milestone-Gated Payouts",
            "- Mentor Guidance & Review",
            "- Hardware & AI Sandboxes",
            "- URL: https://builds.avyantrix.com"
        ],
        accent_color=(124, 58, 237)
    )

    # Pillar 3 Card
    pdf.draw_card(
        137, card_y, card_w, card_h,
        "3. Avyantrix Challenges",
        [
            "- Collegiate & Enterprise Events",
            "- 1-Click Fast Pass Apply",
            "- Multi-Skill Team Matchmaker",
            "- Real-Time Scoring Engine",
            "- Anti-Plagiarism & Sponsor Hub",
            "- URL: https://challenges.avyantrix.com"
        ],
        accent_color=(16, 185, 129)
    )

    pdf.set_y(card_y + card_h + 5)

    # High-Level Value Proposition Table
    pdf.section_heading("Stakeholder Value Matrix")
    
    # Table Header
    pdf.set_fill_color(30, 41, 59)
    pdf.set_font("Helvetica", "B", 7.8)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(38, 5.5, " Stakeholder", fill=True, new_x=XPos.RIGHT, new_y=YPos.TOP)
    pdf.cell(70, 5.5, " Key Pain Point Addressed", fill=True, new_x=XPos.RIGHT, new_y=YPos.TOP)
    pdf.cell(72, 5.5, " Avyantrix Solution & Outcome", fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    # Table Rows
    rows = [
        ("Developers & Students", "Redundant 20-field applications; unverified skills", "1-Click Cyber ID Passport with verified skills & badges"),
        ("Hackathon Organizers", "Registration friction & manual verification delays", "Instant 1-Click Fast Pass, auto-team builder & live scoring"),
        ("DeepTech Enterprises", "Difficulty finding validated talent for AI / Hardware", "Bounty engine with pre-cleared builders & verifiable proofs"),
        ("Universities & Clubs", "No centralized record of student tech achievements", "Verifiable institutional credentials & collegiate leadership"),
    ]

    pdf.set_font("Helvetica", "", 7.5)
    for i, (col1, col2, col3) in enumerate(rows):
        bg = (248, 250, 252) if i % 2 == 0 else (255, 255, 255)
        pdf.set_fill_color(*bg)
        pdf.set_text_color(*pdf.c_text_main)
        pdf.cell(38, 5.2, f" {col1}", border=1, fill=True, new_x=XPos.RIGHT, new_y=YPos.TOP)
        pdf.cell(70, 5.2, f" {col2}", border=1, fill=True, new_x=XPos.RIGHT, new_y=YPos.TOP)
        pdf.cell(72, 5.2, f" {col3}", border=1, fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    # =========================================================================
    # PAGE 2: PILLAR 1 — AVYANTRIX ID (AUTH & CYBER ID PASSPORT)
    # =========================================================================
    pdf.add_page()
    pdf.chapter_title("2. Pillar I: Avyantrix ID (Unified Auth & Cyber ID)", "CRYPTOGRAPHIC SINGLE SIGN-ON & PORTABLE HACKATHON DOSSIER")

    pdf.set_font("Helvetica", "", 8.5)
    pdf.set_text_color(*pdf.c_text_main)
    p2_desc = (
        "Avyantrix ID (https://id.avyantrix.com) functions as the foundational identity provider and cryptographic "
        "security layer for the entire ecosystem. Built on modern OpenID Connect (OIDC) and OAuth 2.0 PKCE specifications, "
        "it delivers enterprise-grade authentication, role-based access control, session governance, and a revolutionary "
        "Cyber ID Hackathon Passport that eliminates friction across all downstream applications."
    )
    pdf.multi_cell(0, 4.2, p2_desc, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(2.5)

    # Core Features of Avyantrix ID
    pdf.section_heading("Core Technical Architecture & Security Protocols")

    feat_y = pdf.get_y()
    feat_w = 88
    feat_h = 36

    pdf.draw_card(
        15, feat_y, feat_w, feat_h,
        "Enterprise Cryptography & Standards",
        [
            "- Argon2id Memory-Hard Hashing (RFC 9106)",
            "- OAuth 2.0 PKCE S256 (Plain verifiers forbidden)",
            "- Refresh Token Family Rotation & Replay Revocation",
            "- RFC 6238 TOTP 2FA + Hashed Recovery Codes",
            "- OpenID Discovery Endpoint (/.well-known/openid-config)"
        ],
        accent_color=(14, 116, 144)
    )

    pdf.draw_card(
        107, feat_y, feat_w, feat_h,
        "Self-Service Developer Console (/developers)",
        [
            "- Self-service OAuth app creation without admin rights",
            "- One-time raw secret reveal (avy_sec_...) with Argon2id hash",
            "- In-place cryptographic client secret rotation",
            "- Interactive .env.local generator for NextAuth.js / Node",
            "- Strict owner tenant isolation (ownerUserId scoping)"
        ],
        accent_color=(6, 182, 212)
    )

    pdf.set_y(feat_y + feat_h + 4.5)

    # The Cyber ID Hackathon Passport Deep Dive
    pdf.section_heading("The Cyber ID Hackathon Passport (/passport & /api/v1/oauth/passport)")
    passport_desc = (
        "The Cyber ID Passport is a dynamic, holographic digital credential that consolidates a developer's real-world "
        "achievements, verified academic credentials, categorized skills, and ecosystem clearances into a standardized JSON payload. "
        "When an applicant applies to hackathons or bounties, downstream platforms fetch the passport with a single API call:"
    )
    pdf.multi_cell(0, 4.2, passport_desc, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(2)

    # Code / Payload Box
    code_box_y = pdf.get_y()
    pdf.set_fill_color(15, 23, 42)
    pdf.rect(15, code_box_y, 180, 42, "F")
    pdf.set_xy(18, code_box_y + 2)
    pdf.set_font("Courier", "", 7.2)
    pdf.set_text_color(147, 197, 253) # Light Blue

    sample_json = [
        "// GET /api/v1/oauth/passport -> 1-Click Fast Pass Dossier",
        "{",
        '  "passport_id": "AVY-PASS-8F93A1C4", "version": "2026.1",',
        '  "user": { "username": "alexbuilder", "name": "Alex Vance", "email": "alex@avy.com", "verified": true },',
        '  "education": { "institution": "Stanford University", "grad_year": 2026, "is_verified": true },',
        '  "skills": [{ "name": "Rust", "category": "Systems", "proficiency": "EXPERT" }, ...],',
        '  "clearances": { "is_builder_verified": true, "is_challenge_organizer": true, "roles": ["BUILDER"] },',
        '  "ecosystem_pass": { "challenges_fast_pass": true, "builds_bounty_eligible": true }',
        "}"
    ]
    for line in sample_json:
        pdf.set_x(18)
        pdf.cell(0, 3.8, line, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_y(code_box_y + 46)

    # Dynamic Clearances Matrix
    pdf.section_heading("Dynamic Verification Tracks & Badges")
    clearance_items = [
        ("[ CAPABILITY_BUILDER ]", "Verified via GitHub repositories, live deployments, and deep-tech code reviews."),
        ("[ ECOSYSTEM_MENTOR ]", "Verified industry engineers & faculty with 5+ years experience offering office hours."),
        ("[ PROBLEM_OWNER ]", "Enterprises and deep-tech startups submitting commercial problem statements & bounties."),
        ("[ CHALLENGE_ORGANIZER ]", "Collegiate clubs and hackathon directors authorized to host sanctioned tournaments."),
        ("[ VERIFIED_EDUCATION ]", "Students verified via institutional credentials for academic tracks and student bounties.")
    ]
    for tag, desc in clearance_items:
        pdf.print_key_value(tag, desc, key_w=48, key_color=pdf.c_blue)

    # =========================================================================
    # PAGE 3: PILLAR 2 — AVYANTRIX BUILDS (DEEPTECH CAPABILITY ENGINE)
    # =========================================================================
    pdf.add_page()
    pdf.chapter_title("3. Pillar II: Avyantrix Builds (Capability Engine)", "DEEPTECH PROJECT INCUBATION, ENTERPRISE BOUNTIES & MENTORSHIP")

    pdf.set_font("Helvetica", "", 8.5)
    pdf.set_text_color(*pdf.c_text_main)
    p3_desc = (
        "Avyantrix Builds (https://builds.avyantrix.com) is the execution and bounty platform where validated developers "
        "tackle high-impact engineering challenges. Unlike conventional generic freelance platforms, Avyantrix Builds is "
        "engineered specifically for DeepTech domains -- including Embedded Systems, Robotics, Edge AI, Cryptography, and "
        "Distributed Computing -- backed by verified problem owners and expert technical mentorship."
    )
    pdf.multi_cell(0, 4.2, p3_desc, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(2.5)

    # Builds Core Modules
    pdf.section_heading("Core Operating Modules of Avyantrix Builds")

    b_y = pdf.get_y()
    b_w = 88
    b_h = 38

    pdf.draw_card(
        15, b_y, b_w, b_h,
        "Enterprise Problem Statements & Bounties",
        [
            "- Curated industry problem statements from enterprises",
            "- Milestone-gated bounty disbursements",
            "- Rigorous technical specs & acceptance test criteria",
            "- IP protection, NDA workflows & agreement templates",
            "- Continuous integration testing against sandboxes"
        ],
        accent_color=(124, 58, 237)
    )

    pdf.draw_card(
        107, b_y, b_w, b_h,
        "DeepTech Capability Verification",
        [
            "- Multi-stage capability audits for niche skills",
            "- Automatic clearance elevation to CAPABILITY_BUILDER",
            "- Peer-review network by verified domain mentors",
            "- Direct integration with GitHub, GitLab & schematics",
            "- Permanent verifiable portfolio creation for developers"
        ],
        accent_color=(6, 182, 212)
    )

    pdf.set_y(b_y + b_h + 5)

    # Mentor Office Hours & Sandbox
    pdf.draw_card(
        15, pdf.get_y(), 180, 32,
        "Ecosystem Mentor Office Hours & Sandbox Infrastructure",
        [
            "- Verified mentors conduct 1-on-1 architectural consultations, code reviews, and hardware debugging.",
            "- Builders access cloud-hosted FPGA simulators, edge device clusters, and high-performance GPU instances.",
            "- All mentorship milestones and approvals are cryptographically logged directly to the builder's Avyantrix ID."
        ],
        accent_color=(16, 185, 129)
    )

    pdf.set_y(pdf.get_y() + 37)

    # Workflow Diagram / Lifecycle
    pdf.section_heading("The Builder Progression Lifecycle")
    
    progression = [
        ("Phase 1: Clearance Check", "Developer signs in with Avyantrix ID. System validates CAPABILITY_BUILDER clearance or initiates proof-of-work review."),
        ("Phase 2: Bounty Discovery", "Developer browses enterprise problem statements matching their verified skills (e.g., Rust, TinyML, FPGA design)."),
        ("Phase 3: Sandbox & Build", "Builder submits architectural plan, receives mentor sign-off, and builds in isolation with CI milestone checks."),
        ("Phase 4: Milestone Audit", "Problem Owner reviews deliverables against automated test suites and signs off on bounty payout."),
        ("Phase 5: Badge Minting", "Avyantrix ID automatically updates builder's Hackathon Passport with verified enterprise accomplishment badges.")
    ]

    for step_title, step_desc in progression:
        pdf.print_key_value(step_title, step_desc, key_w=46, key_color=pdf.c_navy)

    # =========================================================================
    # PAGE 4: PILLAR 3 — AVYANTRIX CHALLENGES (HACKATHON ORCHESTRATION)
    # =========================================================================
    pdf.add_page()
    pdf.chapter_title("4. Pillar III: Avyantrix Challenges (Hackathons)", "HIGH-VELOCITY HACKATHONS, 1-CLICK FAST PASS & TOURNAMENT ENGINE")

    pdf.set_font("Helvetica", "", 8.5)
    pdf.set_text_color(*pdf.c_text_main)
    p4_desc = (
        "Avyantrix Challenges (https://challenges.avyantrix.com) is the competitive tournament platform empowering "
        "universities, tech communities, and corporate sponsors to launch high-engagement hackathons with zero operational overhead. "
        "Powered by Avyantrix ID's 1-Click Fast Pass, participants register in seconds without filling repetitive questionnaires, "
        "while organizers gain instant access to verified participant demographics, skills, and eligibility."
    )
    pdf.multi_cell(0, 4.2, p4_desc, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(2.5)

    # Challenges Core Capabilities
    pdf.section_heading("Core Features of Avyantrix Challenges")

    c_y = pdf.get_y()
    c_w = 88
    c_h = 38

    pdf.draw_card(
        15, c_y, c_w, c_h,
        "1-Click Fast Pass Registration",
        [
            "- Zero manual form filling: 1-click import from Avyantrix ID",
            "- Instant verification of collegiate status & grad year",
            "- Automatic validation of GitHub & portfolio links",
            "- 90% reduction in hackathon application drop-offs",
            "- Seamless multi-event participation with single identity"
        ],
        accent_color=(16, 185, 129)
    )

    pdf.draw_card(
        107, c_y, c_w, c_h,
        "Intelligent Team Formation & Matching",
        [
            "- Automated multi-disciplinary team generation by skills",
            "- Matches hardware hackers with AI engineers & designers",
            "- In-platform team workspaces with collaboration tools",
            "- Role balancing (eliminates 4-frontend-developer teams)",
            "- Solo-hacker matchmaking lounge with skill match score"
        ],
        accent_color=(6, 182, 212)
    )

    pdf.set_y(c_y + c_h + 5)

    # Scoring & Organizer Tools
    pdf.draw_card(
        15, pdf.get_y(), 180, 32,
        "Real-Time Evaluation, Anti-Plagiarism & Sponsor Dashboards",
        [
            "- Multi-rubric judging engine with weighted scoring categories (Innovation, Technical Execution, Usability, Impact).",
            "- Automated repository commit cadence analysis and AI-assisted plagiarism detection to prevent recycled code.",
            "- Sponsors gain real-time analytics on API usage, track submissions, and 1-click recruitment access to top performers."
        ],
        accent_color=(124, 58, 237)
    )

    pdf.set_y(pdf.get_y() + 37)

    # Comparison: Traditional Hackathon Tools vs Avyantrix Challenges
    pdf.section_heading("Comparison: Traditional Platforms vs. Avyantrix Challenges")

    pdf.set_fill_color(30, 41, 59)
    pdf.set_font("Helvetica", "B", 7.5)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(45, 5.2, " Evaluation Dimension", fill=True, new_x=XPos.RIGHT, new_y=YPos.TOP)
    pdf.cell(65, 5.2, " Traditional Hackathon Platforms", fill=True, new_x=XPos.RIGHT, new_y=YPos.TOP)
    pdf.cell(70, 5.2, " Avyantrix Challenges Engine", fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    comp_rows = [
        ("Participant Onboarding", "Manual 20-field forms for every single event", "1-Click Fast Pass instant registration via Avyantrix ID"),
        ("Skill & Academic Proof", "Self-reported claims with zero verification", "Cryptographically verified university credentials & badges"),
        ("Post-Hackathon Continuity", "Projects abandoned; zero post-event tracking", "Winning projects graduate directly into Avyantrix Builds"),
        ("Enterprise Sponsor Access", "Static PDF resume dumps post-event", "Live interactive Cyber ID Passports with live code proofs"),
        ("Security & SSO", "Fragmented logins with ad-hoc passwords", "Unified OIDC/OAuth2 PKCE with mandatory 2FA security")
    ]

    pdf.set_font("Helvetica", "", 7.2)
    for i, (col1, col2, col3) in enumerate(comp_rows):
        bg = (248, 250, 252) if i % 2 == 0 else (255, 255, 255)
        pdf.set_fill_color(*bg)
        pdf.set_text_color(*pdf.c_text_main)
        pdf.cell(45, 5.2, f" {col1}", border=1, fill=True, new_x=XPos.RIGHT, new_y=YPos.TOP)
        pdf.cell(65, 5.2, f" {col2}", border=1, fill=True, new_x=XPos.RIGHT, new_y=YPos.TOP)
        pdf.cell(70, 5.2, f" {col3}", border=1, fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    # =========================================================================
    # PAGE 5: ECOSYSTEM INTEGRATION, ROADMAP & DEPLOYMENT
    # =========================================================================
    pdf.add_page()
    pdf.chapter_title("5. Ecosystem Synergy, Technical Integration & Roadmap", "CROSS-PLATFORM DATA FLOW, INTEGRATION BLUEPRINT & CONCLUSION")

    pdf.set_font("Helvetica", "", 8.5)
    pdf.set_text_color(*pdf.c_text_main)
    p5_desc = (
        "The true power of Avyantrix resides in the autonomous synergy between its three platforms. "
        "A student registers on Avyantrix ID, competes in an Avyantrix Challenge via 1-Click Fast Pass, "
        "earns a verified clearance badge, and seamlessly transitions into Avyantrix Builds to execute paid enterprise bounties."
    )
    pdf.multi_cell(0, 4.2, p5_desc, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(2.5)

    # Cross-Platform Integration Architecture
    pdf.section_heading("Cross-Platform Integration Architecture (OIDC & Fast Passport)")

    arch_box_y = pdf.get_y()
    pdf.set_fill_color(248, 250, 252)
    pdf.set_draw_color(226, 232, 240)
    pdf.rect(15, arch_box_y, 180, 44, "DF")
    pdf.set_xy(18, arch_box_y + 2)
    pdf.set_font("Helvetica", "B", 8.5)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 4.5, "Standardized SSO & Fast Pass Integration Workflow", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    steps = [
        "1. App Registration: Downstream apps (Challenges/Builds) register on https://id.avyantrix.com/developers.",
        "2. OAuth Handshake: User initiates login -> Redirects to /oauth/authorize with S256 PKCE challenge.",
        "3. Token Minting: Auth server issues signed Access & ID Tokens with 'avy:passport' scope claims.",
        "4. 1-Click Passport Query: Downstream backend calls GET /api/v1/oauth/passport with Bearer token.",
        "5. Clearance Gating: Challenges/Builds grants immediate access, autofills forms, and unlocks bounty tiers."
    ]
    pdf.set_font("Helvetica", "", 7.5)
    pdf.set_text_color(30, 41, 59)
    for s in steps:
        pdf.set_x(18)
        pdf.cell(0, 4.2, s, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_y(arch_box_y + 48)

    # Phased Rollout Roadmap
    pdf.section_heading("Strategic Implementation & Integration Roadmap")

    phases = [
        ("Phase I: Unified Auth Core", "Avyantrix ID production-ready with OIDC, PKCE S256, Cyber ID Passport, Developer Portal, and 39/39 passing audit tests."),
        ("Phase II: Challenges Engine", "Connect Avyantrix Challenges to Avyantrix ID via OIDC, roll out 1-Click Fast Pass, and launch inaugural collegiate hackathons."),
        ("Phase III: Builds & Bounties", "Launch enterprise problem statement submission, mentor office hour scheduler, and smart-contract bounty disbursements."),
        ("Phase IV: Global DeepTech", "Scale to 100+ universities, 50+ enterprise sponsors, and establish decentralized credential verification for hardware & AI.")
    ]

    for p_title, p_desc in phases:
        pdf.print_key_value(p_title, p_desc, key_w=46, key_color=pdf.c_blue)

    pdf.ln(1.5)

    # Official Links & Reference Directory
    pdf.section_heading("Official Web Portals & Technical Resource Links")

    links_box_y = pdf.get_y()
    pdf.set_fill_color(15, 23, 42) # Slate 900
    pdf.rect(15, links_box_y, 180, 34, "F")
    pdf.set_xy(18, links_box_y + 2.5)
    pdf.set_font("Helvetica", "B", 8.5)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 4.5, "Official Ecosystem Links & Endpoints", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    res_links = [
        ("Main Ecosystem Portal:", "https://www.avyantrix.com", "Central brand, product matrix & corporate information"),
        ("Avyantrix ID (Auth & Passport):", "https://id.avyantrix.com", "Unified single sign-on, Cyber ID Passport & verification hub"),
        ("Self-Service Developer Console:", "https://id.avyantrix.com/developers", "OAuth2 app registration, secret rotation & SDK docs"),
        ("OpenID Discovery Endpoint:", "https://id.avyantrix.com/.well-known/openid-configuration", "OIDC metadata, scopes & endpoints"),
        ("System Health & Status Probe:", "https://id.avyantrix.com/api/health", "Live uptime, latency & system telemetry")
    ]

    for label, url, note in res_links:
        pdf.set_x(18)
        pdf.set_font("Helvetica", "B", 7.2)
        pdf.set_text_color(6, 182, 212)
        pdf.cell(46, 3.8, label, new_x=XPos.RIGHT, new_y=YPos.TOP)
        pdf.set_font("Helvetica", "U", 7.2)
        pdf.set_text_color(147, 197, 253)
        pdf.cell(74, 3.8, url, new_x=XPos.RIGHT, new_y=YPos.TOP)
        pdf.set_font("Helvetica", "I", 7)
        pdf.set_text_color(148, 163, 184)
        pdf.cell(0, 3.8, f"({note})", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    # Save PDF
    pdf.output(output_path)
    print(f"Successfully generated proposal PDF at: {output_path}")

if __name__ == "__main__":
    output_dir = r"c:\Users\User\Desktop\Avyantrix"
    pdf_path = os.path.join(output_dir, "Avyantrix_Ecosystem_Proposal.pdf")
    build_pdf(pdf_path)

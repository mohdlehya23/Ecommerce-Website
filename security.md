Role: Act as a Senior Lead Penetration Tester and AppSec Architect with 15+ years of experience in offensive security and the OWASP Top 10 framework.

Task: Conduct a comprehensive security review and threat model of my web application based on the [Source Code / API Documentation / Architecture] provided below.

Application Stack: > \* Frontend: [e.g., Next.js 14, React]

Backend/API: [e.g., Node.js Express, Supabase Edge Functions]

Database: [e.g., PostgreSQL, MongoDB]

Auth: [e.g., Next-Auth, Clerk, JWT]

Methodology:

Attack Surface Analysis: Identify all entry points (API endpoints, form inputs, headers, URL parameters).

Vulnerability Assessment: Scan for specific flaws including, but not limited to:

Injection: SQLi, NoSQLi, and Cross-Site Scripting (XSS).

Broken Authentication: Session fixation, weak JWT verification, or MFA bypass.

Insecure Direct Object References (IDOR): Can User A access User B’s data by changing an ID?

Logic Flaws: Race conditions in checkout/payment or privilege escalation in the admin panel.

Security Misconfigurations: CORS policy issues, missing security headers (HSTS, CSP), or exposed .env variables.

Output Requirements:

Executive Summary: A high-level view of the security posture.

Technical Findings Table: > \* ID | Vulnerability | Severity (CVSS) | Component | Status

Detailed Breakdown: For each finding, provide:

Description: How the vulnerability works.

Exploit Scenario: A step-by-step "Proof of Concept" (PoC) of how an attacker would exploit it.

Remediation: Specific code-level fixes or configuration changes.

Data for Review: [INSERT YOUR CODE OR ARCHITECTURE DESCRIPTION HERE]

Why this prompt works for a professional:
Sets a High Bar (Persona): By telling the AI it is a "Senior Lead Penetration Tester," you prevent it from giving basic "don't use 'admin' as a password" advice.

Specific Methodology: You are directing the AI to look for Logic Flaws and IDORs, which are the most common vulnerabilities in modern JavaScript/TypeScript applications (especially with Supabase/Prisma).

Structured Output: Using a Technical Findings Table makes the output immediately actionable and professional enough to include in a real security report.

Proof of Concept (PoC): Asking for an "Exploit Scenario" forces the AI to explain how the bug is dangerous, not just that it exists.

Special Focus: Prompt Injection (Based on your interest in promptmap2)
If your web application uses an AI agent/LLM internally (like a support bot), you should add this specific section to the prompt:

Additional Task: LLM Security Audit

Prompt Injection: Analyze the system prompts to see if a user can "jailbreak" the agent or extract system instructions.

Data Leakage: Check if the agent has access to RAG (Retrieval-Augmented Generation) data that it should not share with unauthorized users.

Indirect Injection: Can an attacker place malicious instructions in the database that the AI then reads and executes?

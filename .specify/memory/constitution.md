<!--
Sync Impact Report:
Version change: NEW → 1.0.0
Created principles:
- MVP-First Development (non-negotiable)
- Security as Foundation (non-negotiable)  
- Real Data Only (non-negotiable)
- Lean Scope Discipline
- Speed Over Perfection
Added sections:
- Technology Stack Constraints (Firebase-centric)
- Development Workflow (12-week phases)
Modified principles: N/A (new constitution)
Removed sections: N/A (new constitution)
Templates requiring updates:
✅ plan-template.md (checked - constitution compliance aligned)
✅ spec-template.md (checked - user story prioritization aligned)
✅ tasks-template.md (checked - MVP phasing approach aligned)
Follow-up TODOs: None
-->

# HaMaaser MVP Constitution

## Core Principles

### I. MVP-First Development (NON-NEGOTIABLE)
We prioritize getting functional software in users' hands over perfect architecture. Every feature decision must answer: "Does this help us ship the MVP faster?" If no, defer to post-launch. The goal is validating the core hypothesis: "Will people use a social-media-style donation app?" Perfect code comes after proving product-market fit. This means ruthless scope cuts, smart shortcuts that don't require complete rewrites, and choosing working code over elegant abstractions during the 12-week MVP timeline.

**Rationale**: Startup mortality is high; learning from real users quickly is the only sustainable path to building the right product.

### II. Security as Foundation (NON-NEGOTIABLE)
Payment security cannot be compromised under any circumstances. All payment data must flow through Stripe Checkout or Stripe Elements—never custom payment forms that touch our servers. This provides automatic PCI compliance and battle-tested security with minimal code. Fee transparency is mandatory: show the 1-2% platform fee to donors before they donate. No hidden fees. Trust is our only asset in the donation space, and one security incident destroys credibility permanently.

**Rationale**: Financial trust, once broken, cannot be rebuilt; security shortcuts in payments are existential risks.

### III. Real Data Only (NON-NEGOTIABLE)
All user-facing content must represent real NGO stories and real beneficiaries. No fake, synthetic, or placeholder data visible to donors. Users need to see authentic impact for the platform to deliver value. Start with 3-5 verified partner NGOs providing real stories rather than building sophisticated content management. Authentic connection drives donations; fake content destroys the entire value proposition.

**Rationale**: Donation decisions are emotional and trust-based; synthetic content undermines the fundamental user experience.

### IV. Lean Scope Discipline
Features are either IN (essential for MVP validation) or OUT (deferred to v2.0). No "nice-to-have" features during MVP phase. Use this decision tree for any feature request: (1) Does this block users from donating? → Fix now. (2) Is this a security issue? → Fix now. (3) Are 3+ users complaining? → Fix now. (4) Otherwise → Add to post-launch backlog. Examples OUT: monthly recurring donations, gamification, advanced analytics, social sharing.

**Rationale**: Feature creep kills MVPs; focus enables speed and learning.

### V. Speed Over Perfection
Choose technologies and patterns that minimize development time over architectural purity. Firebase/Firestore over custom backend. Stripe Checkout over custom payment UI. React Native over native development. Zero DevOps over complex infrastructure. 30% test coverage over 80% during MVP. This creates technical debt intentionally—we'll address it after proving the product works.

**Rationale**: Perfect code for the wrong product is worthless; imperfect code for the right product can be improved.

## Technology Stack Constraints

### Mandated Technologies (Locked for MVP)
- **Frontend**: React Native (single codebase for iOS + Android)
- **Authentication**: Firebase Auth (Google/Email login)
- **Database**: Firebase Firestore (zero backend maintenance)
- **Payments**: Stripe Checkout (hosted, PCI-compliant)
- **Hosting**: Firebase Hosting + Vercel (one-click deploy)
- **State Management**: useState + Context API (no Redux complexity)

### Prohibited During MVP
- Custom backend development (use Firebase Cloud Functions if needed)
- Custom payment processing (Stripe handles everything)
- Complex state management libraries (Redux, Zustand)
- Multiple database systems (Firestore only)
- Custom DevOps/infrastructure (Firebase handles scaling)
- TypeScript strict mode (use loose mode, migrate later)

**Rationale**: This stack maximizes velocity while providing production-grade capabilities; migration paths exist for post-MVP scaling.

## Development Workflow

### 12-Week Phase Structure
Development follows strict phase gates with deliverable checkpoints:
- **Weeks 1-2**: Setup & Auth (Firebase integration)
- **Weeks 3-4**: Feed & Stories (real NGO content)
- **Weeks 5-6**: Payments (Stripe integration)
- **Weeks 7-9**: Admin Dashboard (NGO self-service)
- **Weeks 10-11**: Testing & Hardening (50+ beta users)
- **Week 12**: Soft Launch (public beta)

Each phase has concrete deliverables that must pass manual validation before proceeding. No parallel phase work; sequential execution ensures quality gates.

### Code Quality Standards
- Functions maximum 50 lines (break into smaller functions)
- No hardcoded API keys (use environment variables)
- Git branches required (never code on main)
- Code review: minimum one other person before merge
- Commit every 2-3 hours with meaningful messages
- Critical paths testing (30% coverage minimum)

### Success Metrics Checkpoints
- **Week 4**: Auth system functional, stories display without crashes
- **Week 8**: 5 real test donations completed, receipts working, NGO can manage content
- **Week 12**: 50+ beta testers, 15+ donations processed, <5% crash rate, 60%+ donation completion

## Governance

This constitution supersedes all other development practices during the MVP phase. All feature requests, architecture decisions, and scope changes must be evaluated against these principles. Violations require explicit justification documenting why the principle cannot be followed and what risk mitigation exists.

All pull requests must include a constitution compliance check confirming no principle violations or documenting approved exceptions. Technical complexity must be justified against the MVP-first principle.

Amendment requires (1) documented rationale for change, (2) impact assessment on MVP timeline, (3) migration plan for existing code, and (4) approval from technical lead.

**Version**: 1.0.0 | **Ratified**: 2025-11-04 | **Last Amended**: 2025-11-04

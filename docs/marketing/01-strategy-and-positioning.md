# Strategy & Positioning

## Core Positioning

Stagehand is **the unified platform for application intelligence**—breaking down silos between development, security, and product teams by providing a single source of truth for application metadata, security findings, and product inventory.

---

## The Philosophy: Collaboration Over Features

### The Problem

The market is saturated with tools that optimize for a single team, creating information silos:

**Backstage**
- ✅ 1000+ features for developers
- ❌ Zero security functionality
- ❌ Requires extensive YAML configuration
- ❌ Framework, not a product

**ASPM Tools (Apiiro, Cycode, ArmorCode)**
- ✅ Deep security analysis
- ❌ No developer catalog or context
- ❌ Security teams can use it, developers can't
- ❌ Doesn't solve the access problem

**CMDBs (ServiceNow, Device42)**
- ✅ Comprehensive IT inventory
- ❌ Operations-focused, not developer-friendly
- ❌ Heavyweight, complex implementations
- ❌ No security findings integration

### The Stagehand Approach

**Quality over Quantity**

Teams don't need MORE features—they need the RIGHT features that work for EVERYONE.

You don't need:
- 50 ways to track dependencies
- 100 plugins to configure
- Separate tools for each team

You need:
- ONE way that developers can maintain
- ONE source that security can trust
- ONE platform that everyone can use

**Shared Context, Not Silos**

When everyone works from the same data:
- Security stops begging for information
- Developers stop being interrupted
- Product gets the visibility they need
- Compliance gets audit-ready reports

---

## Target Audience

### Primary Personas

#### 1. Security Engineers / AppSec Teams (Primary Decision Makers)

**Profile:**
- Title: Security Engineer, AppSec Lead, CISO
- Team size: 2-20 people
- Reports to: CISO, VP Engineering

**Pain Points:**
- No visibility into what applications exist, what tech they use, who owns them
- Data scattered across Snyk, Veracode, spreadsheets, Confluence, Slack
- Treated as "second-class citizens" in the organization
- Constantly begging developers for basic information
- Can't answer simple questions: "Which apps use Log4j?" "Who owns this service?"
- Findings scattered across 5+ different security tools

**Goals:**
- Unified security posture view without begging developers for context
- Complete asset inventory they can trust
- Ability to track vulnerabilities across all applications
- Faster incident response

**Messaging:**
- "Finally, security teams get the access they deserve"
- "Stop being treated like second-class citizens"
- "Get the visibility you've always needed"

**Buying Triggers:**
- Major vulnerability announcement (Log4j, Spring4Shell)
- Failed audit due to incomplete inventory
- New compliance requirements (SOC 2, ISO 27001)
- Security team expansion

---

#### 2. Engineering Managers / Tech Leads (Primary Users)

**Profile:**
- Title: Engineering Manager, Tech Lead, Staff Engineer
- Team size: 5-50 developers
- Reports to: VP Engineering, CTO

**Pain Points:**
- Constantly interrupted with questions: "What version of X are you running?"
- Same information lives in Confluence, Jira, spreadsheets, and people's heads
- Maintaining documentation in multiple places is a burden
- Security and compliance teams always asking for information
- Onboarding new team members is painful (where is everything?)

**Goals:**
- Single place to document applications that serves multiple stakeholders
- Self-service for other teams (they can look it up themselves)
- Minimal maintenance overhead
- Team autonomy over their application data

**Messaging:**
- "Document once, serve everyone"
- "Self-service for stakeholders"
- "Actually developer-friendly"

**Buying Triggers:**
- Team growth (more people asking questions)
- New security requirements from leadership
- Audit or compliance initiative
- Developer productivity initiative

---

#### 3. Platform Engineering / DevOps (Secondary)

**Profile:**
- Title: Platform Engineer, DevOps Lead, SRE
- Team size: 3-15 people
- Reports to: VP Engineering, CTO

**Pain Points:**
- No central service catalog
- Tribal knowledge about system dependencies
- Tried Backstage but it's too complex
- Need to support multiple teams, but no visibility

**Goals:**
- Backstage-like catalog without the complexity
- Service dependency mapping
- Central source of truth for infrastructure

**Messaging:**
- "All the power, none of the YAML hell"
- "Service catalog that doesn't require a PhD to configure"

---

### Secondary Personas

#### 4. Product / Project Managers

**Pain Points:**
- No visibility into product portfolio
- Can't answer "What are all our customer-facing applications?"
- Don't know who owns what

**Goals:**
- Complete portfolio view
- Resource allocation insights
- Strategic planning data

---

#### 5. Compliance / GRC Teams

**Pain Points:**
- Audit preparation is chaos
- No single source of truth for systems inventory
- Constantly chasing teams for information

**Goals:**
- Audit-ready inventory
- Automated compliance reports
- Risk visibility

---

## Competitive Positioning

### Positioning Statement

**"Stagehand is the unified platform for application intelligence. Unlike Backstage (developer-only), ASPM tools (security-only), or CMDBs (operations-only), Stagehand provides a shared source of truth that serves your entire organization."**

### Competitive Landscape

| Category | Examples | What They Do Well | What They Miss |
|----------|----------|-------------------|----------------|
| **Developer Catalogs** | Backstage, Port, OpsLevel | Service catalog, tech docs, developer portal | No security findings, requires heavy YAML config, developer-only focus |
| **ASPM Tools** | Apiiro, Cycode, ArmorCode | Security analysis, finding aggregation | No developer catalog, no product context, security-only interface |
| **CMDBs** | ServiceNow, Device42 | IT asset inventory, configuration tracking | IT-focused, not developer-friendly, no security findings |
| **Vulnerability Scanners** | Snyk, Veracode, Checkmarx | Deep security scanning | Point solutions, no catalog context, scattered data |
| **Spreadsheets** | Google Sheets, Excel | Flexible, everyone knows them | Manual, error-prone, no integrations, quickly outdated |

### **Stagehand's Position**

**Unifies all three with minimal configuration**

- Application catalog (like Backstage, but simpler)
- Security findings hub (like ASPM, but accessible to all)
- Product inventory (like CMDB, but developer-friendly)

---

## Key Differentiators

### 1. Collaboration Over Features

**Not:** "We have more features than X"
**Instead:** "We have the right features that work for everyone"

Most tools try to be everything to one team. Stagehand provides what ALL teams need.

### 2. Built by Security, for Everyone

The product was born from a security engineer's frustration with being a second-class citizen. This perspective ensures:
- Security teams finally get the access they need
- But the interface is still developer-friendly
- And non-technical stakeholders can use it too

### 3. Shared Context, Not Silos

One source of truth means:
- Security sees what developers document
- Developers see what security finds
- Product sees the complete portfolio
- Everyone works from the same data

### 4. Quality Over Complexity

**Philosophy:** You don't need 50 ways to track dependencies. You need ONE way that works.

- No extensive configuration required
- No YAML hell
- No plugins to manage
- It just works

### 5. Zero YAML Configuration

Unlike Backstage (which is a framework requiring extensive setup), Stagehand is a product:
- Sensible defaults
- UI-driven configuration
- Works out of the box

---

## Messaging Hierarchy

### Core Value Proposition

"Stagehand is the unified platform for application intelligence—combining developer catalog, security findings, and product inventory in one place."

### Supporting Messages

**For Security Teams:**
- "Stop being treated like second-class citizens"
- "Get the visibility you've always needed"
- "All your findings, one dashboard"

**For Development Teams:**
- "Document once, serve everyone"
- "Self-service for stakeholders"
- "Actually developer-friendly"

**For Leadership:**
- "Complete portfolio visibility"
- "Break down organizational silos"
- "Better security through better collaboration"

### Proof Points

1. **Multi-tenant hierarchy** - Model your actual org structure
2. **Security tool integrations** - Connect Snyk, GitHub, DAST scanners
3. **RBAC & team management** - Role-based access control
4. **SBOM tracking** - Automated dependency inventory
5. **Custom fields** - Flexible metadata for your needs
6. **Real product** - Not a framework, not a config nightmare

---

## Brand Voice

### Voice Attributes

**Empathetic**
- We understand your pain because we've lived it
- Security engineers treated as second-class citizens
- Developers constantly interrupted
- Everyone working in silos

**Direct**
- No marketing fluff
- Real problems, real solutions
- Honest about what we do and don't do

**Technical but Accessible**
- Can speak to developers without alienating others
- Use technical terms when appropriate
- Explain concepts for broader audiences

**Confident but Humble**
- We solve real problems
- We don't claim to solve world peace
- We're focused on doing a few things really well

### What We Say / What We Don't Say

✅ **We say:**
- "Break down silos"
- "Collaboration over features"
- "Developer-friendly"
- "Security teams deserve better"
- "Document once, serve everyone"

❌ **We avoid:**
- "Best-in-class" (meaningless)
- "Revolutionary" (overused)
- "AI-powered" (unless actually relevant)
- "Enterprise-grade" (what does that mean?)
- "World's leading" (says who?)

---

## Positioning Scenarios

### How to Position Against Competitors

**vs. Backstage**
- "Backstage is powerful but complex. Stagehand gives you the catalog functionality without the YAML configuration hell."
- "Unlike Backstage, Stagehand includes security findings—so it serves your entire organization, not just developers."

**vs. ASPM Tools**
- "ASPM tools focus only on security. Stagehand combines security findings with a developer catalog, giving context to every vulnerability."
- "Security tools are built for security teams. Stagehand is built for everyone—security, development, and product."

**vs. ServiceNow / CMDBs**
- "CMDBs are IT-focused and heavyweight. Stagehand is developer-friendly and purpose-built for application teams."
- "ServiceNow costs $100K+ and takes 6 months to implement. Stagehand takes an afternoon."

**vs. Spreadsheets**
- "We've all tried managing this in spreadsheets. Stagehand gives you the flexibility of spreadsheets with the power of integrations and automation."

---

**Last Updated:** October 20, 2025


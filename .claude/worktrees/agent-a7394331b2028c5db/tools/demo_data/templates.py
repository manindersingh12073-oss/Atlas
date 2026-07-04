"""
Static templates: companies, roles, events, tags, notes.
Edit these to customise the generated data without touching generator logic.
"""
from typing import Dict, List

# ---------------------------------------------------------------------------
# Companies organised by community
# ---------------------------------------------------------------------------

COMMUNITY_COMPANIES: Dict[str, List[str]] = {
    "tech": [
        "Google", "Google DeepMind", "Microsoft", "Meta", "Apple", "Amazon",
        "NVIDIA", "Tesla", "IBM", "Intel", "Qualcomm", "Salesforce", "Oracle",
        "SAP", "Adobe", "Palantir Technologies", "Snowflake", "Databricks",
        "Stripe", "Shopify", "Zoom", "Atlassian", "ServiceNow", "Workday",
        "Spotify", "Netflix", "Uber", "Airbnb", "LinkedIn", "Twitter",
        "Twilio", "MongoDB", "HashiCorp", "Confluent", "Elastic", "Cloudflare",
        "Datadog", "PagerDuty", "Splunk", "CrowdStrike",
        # AI-focused
        "OpenAI", "Anthropic", "Cohere", "Mistral AI", "Stability AI",
        "Hugging Face", "Scale AI", "Inflection AI", "xAI", "Character AI",
        "Perplexity AI", "Runway ML", "DeepL", "Writer", "Adept",
        "Together AI", "Nous Research", "Imbue",
    ],
    "healthcare": [
        "NHS England", "NHS Digital", "King's College Hospital",
        "Imperial College Healthcare NHS Trust",
        "University College London Hospitals",
        "Barts Health NHS Trust",
        "Guy's and St Thomas' NHS Foundation Trust",
        "Royal Free London NHS Foundation Trust",
        "Cambridge University Hospitals",
        "Oxford University Hospitals",
        "Royal Marsden NHS Foundation Trust",
        "Moorfields Eye Hospital",
        "Great Ormond Street Hospital",
        "St Bartholomew's Hospital",
        "Leeds Teaching Hospitals",
        "Manchester University NHS Foundation Trust",
        "NHS Arden & GEM CSU",
        "NHS Transformation Directorate",
        # HealthTech
        "Babylon Health", "Huma Therapeutics", "Accurx", "Cera Care",
        "Kry", "Zava", "Skin+Me", "Pando Health", "Elvie", "Doctorlink",
        "Ada Health", "Kheiron Medical", "HealthHero", "Digital Diagnostics",
        "Imagen Technologies", "PathAI", "Tempus", "Flatiron Health",
        "Heartflow", "Current Health", "Featurespace",
        "Lindus Health", "Sano Genetics", "Congenica", "Genomics England",
        "Sensyne Health", "Cognitect Health",
    ],
    "academia": [
        "King's College London", "Imperial College London",
        "University College London", "University of Oxford",
        "University of Cambridge", "University of Edinburgh",
        "University of Manchester", "University of Bristol",
        "London School of Hygiene & Tropical Medicine",
        "Queen Mary University of London",
        "University of Warwick", "University of Sheffield",
        "Harvard Medical School", "MIT", "Stanford University",
        "Johns Hopkins University", "Yale School of Medicine",
        "Columbia University Irving Medical Center",
        "ETH Zurich", "Karolinska Institutet",
        "Charité – Universitätsmedizin Berlin",
        "Wellcome Sanger Institute",
        "Francis Crick Institute",
        "Alan Turing Institute",
        "The Babraham Institute",
    ],
    "biotech": [
        "GSK", "AstraZeneca", "Roche", "Novartis", "Pfizer",
        "Johnson & Johnson", "Merck KGaA", "Sanofi", "Eli Lilly",
        "Bristol Myers Squibb", "AbbVie", "Amgen", "Biogen",
        "Regeneron", "Moderna", "BioNTech", "Oxford Biomedica",
        "PureTech Health", "Bicycle Therapeutics", "Autolus Therapeutics",
        "Immunocore", "Oxford Nanopore Technologies", "Exscientia",
        "Recursion Pharmaceuticals", "Insilico Medicine", "Absci",
        # Medical devices
        "Medtronic", "Abbott Laboratories", "Stryker", "Zimmer Biomet",
        "Boston Scientific", "Edwards Lifesciences", "Smith+Nephew",
        "CMR Surgical", "Nanox", "Proximie",
        # Research institutes
        "Wellcome Trust", "Cancer Research UK", "British Heart Foundation",
        "Alzheimer's Research UK", "Medical Research Council",
        "National Institute for Health and Care Research",
    ],
    "founders": [
        # HealthTech startups
        "Healio", "Cadence Health", "Mimir Medical", "Sero Health",
        "Atlas Diagnostics", "ClearPath Health", "Vivo Biotech",
        "Meridian AI Health", "Luminary Health", "Prism Clinical",
        # AI/Tech startups
        "Synapse Labs", "Forge AI", "Axiom Intelligence",
        "Vertex Systems", "Beacon Analytics", "Cortex Build",
        "Nexus Machine Learning", "Catalyst Data", "Pioneer Tech",
        "Momentum AI",
        # General startups
        "Y Combinator", "Techstars", "Entrepreneur First",
        "Seedcamp", "Antler",
    ],
    "vc": [
        "Sequoia Capital", "Andreessen Horowitz", "Bessemer Venture Partners",
        "Lightspeed Venture Partners", "Balderton Capital", "Index Ventures",
        "Atomico", "LocalGlobe", "Octopus Ventures", "SV Angel",
        "General Catalyst", "DCVC", "Khosla Ventures", "GV (Google Ventures)",
        "M Ventures", "Novo Holdings", "Sofinnova Partners",
        "Longitude Capital", "OrbiMed", "RA Capital Management",
        "Lux Capital", "a16z Bio", "7wireVentures", "Deerfield Management",
        "Merck Global Health Innovation Fund",
    ],
    "consulting": [
        "McKinsey & Company", "Boston Consulting Group", "Bain & Company",
        "KPMG", "Deloitte", "EY", "PricewaterhouseCoopers", "Accenture",
        "Oliver Wyman", "Roland Berger", "LEK Consulting",
        "ZS Associates", "Huron Consulting", "Navigant",
        "The Health Management Academy",
    ],
}

# All companies flat list (for validation / README reference)
ALL_COMPANIES: List[str] = [
    c for companies in COMMUNITY_COMPANIES.values() for c in companies
]

# ---------------------------------------------------------------------------
# Roles per community
# ---------------------------------------------------------------------------

COMMUNITY_ROLES: Dict[str, List[str]] = {
    "tech": [
        "Software Engineer", "Senior Software Engineer", "Staff Engineer",
        "Principal Engineer", "Research Scientist", "Senior Research Scientist",
        "Product Manager", "Senior Product Manager", "Engineering Manager",
        "VP Engineering", "AI Engineer", "ML Engineer", "Data Scientist",
        "Senior Data Scientist", "CTO", "VP Product", "Tech Lead",
        "Solutions Architect", "Developer Advocate", "Platform Engineer",
    ],
    "healthcare": [
        "Consultant", "Registrar", "Junior Doctor", "GP",
        "Clinical Fellow", "Specialty Trainee", "Foundation Doctor",
        "Specialist Nurse", "Clinical Lead", "Medical Director",
        "Radiologist", "Cardiologist", "Oncologist", "Neurologist",
        "Emergency Medicine Consultant", "Anaesthetist",
        "Clinical Informatics Lead", "Chief Medical Officer",
        "Head of Digital Health",
    ],
    "academia": [
        "Professor", "Associate Professor", "Reader",
        "Research Fellow", "Senior Research Fellow",
        "Lecturer", "Senior Lecturer", "PhD Student",
        "Medical Student", "Postdoctoral Researcher",
        "Research Assistant", "Principal Investigator",
        "Head of Department", "Dean", "Research Director",
        "Honorary Consultant", "Clinical Academic Fellow",
    ],
    "biotech": [
        "Research Scientist", "Senior Scientist", "Principal Scientist",
        "R&D Manager", "VP Research", "Clinical Researcher",
        "Biostatistician", "Regulatory Affairs Manager",
        "Head of Discovery", "Scientific Director",
        "VP Clinical Development", "Chief Scientific Officer",
        "Medical Science Liaison", "Clinical Operations Manager",
        "Head of Translational Research",
    ],
    "founders": [
        "Founder", "Co-Founder", "CEO", "CTO", "COO",
        "Chief Medical Officer", "Head of Product", "Head of Engineering",
        "Chief Scientific Officer", "Founder & CEO", "Founder & CTO",
        "VP Business Development", "Head of Clinical Affairs",
    ],
    "vc": [
        "Partner", "General Partner", "Managing Partner",
        "Associate", "Principal", "Analyst",
        "Venture Partner", "Entrepreneur in Residence",
        "Investment Manager", "Head of Portfolio",
        "Vice President", "Operating Partner",
    ],
    "consulting": [
        "Analyst", "Associate", "Consultant", "Senior Consultant",
        "Manager", "Senior Manager", "Principal",
        "Director", "Partner", "Managing Director",
        "Senior Advisor", "Healthcare Strategy Lead",
    ],
}

# ---------------------------------------------------------------------------
# Community email domains (approximate)
# ---------------------------------------------------------------------------

COMPANY_EMAIL_DOMAINS: Dict[str, str] = {
    "Google": "google.com",
    "Google DeepMind": "deepmind.com",
    "Microsoft": "microsoft.com",
    "Meta": "meta.com",
    "Apple": "apple.com",
    "Amazon": "amazon.com",
    "NVIDIA": "nvidia.com",
    "OpenAI": "openai.com",
    "Anthropic": "anthropic.com",
    "NHS England": "nhs.net",
    "NHS Digital": "nhs.net",
    "King's College Hospital": "nhs.net",
    "Guy's and St Thomas' NHS Foundation Trust": "nhs.net",
    "King's College London": "kcl.ac.uk",
    "Imperial College London": "imperial.ac.uk",
    "University College London": "ucl.ac.uk",
    "University of Oxford": "ox.ac.uk",
    "University of Cambridge": "cam.ac.uk",
    "GSK": "gsk.com",
    "AstraZeneca": "astrazeneca.com",
    "Roche": "roche.com",
    "McKinsey & Company": "mckinsey.com",
    "Boston Consulting Group": "bcg.com",
    "Deloitte": "deloitte.com",
    "Sequoia Capital": "sequoiacap.com",
    "Balderton Capital": "balderton.com",
    "Index Ventures": "indexventures.com",
    "Meridian AI Health": "meridianaihealth.com",
}

DEFAULT_EMAIL_DOMAIN = "gmail.com"

# ---------------------------------------------------------------------------
# Event templates
# ---------------------------------------------------------------------------

EVENT_TEMPLATES = [
    # Healthcare & NHS
    {
        "name": "Healthcare AI Summit",
        "community": "healthcare",
        "location": "London",
        "description": "Annual summit bringing together NHS leaders, clinicians, and AI researchers to explore the future of healthcare technology.",
    },
    {
        "name": "Digital Health Rewired",
        "community": "healthcare",
        "location": "London ExCeL",
        "description": "Europe's leading health technology conference and exhibition connecting innovators with NHS decision-makers.",
    },
    {
        "name": "HLTH Europe",
        "community": "healthcare",
        "location": "Amsterdam RAI",
        "description": "International health innovation conference focused on digital transformation and patient outcomes.",
    },
    {
        "name": "MedTech World Summit",
        "community": "healthcare",
        "location": "London",
        "description": "Global gathering of medtech innovators, clinicians, and investors shaping the future of medical devices.",
    },
    {
        "name": "NHS Innovation Expo",
        "community": "healthcare",
        "location": "Manchester Central",
        "description": "Showcase of healthcare innovations and digital solutions transforming patient care across the NHS.",
    },
    {
        "name": "Future of Medicine Conference",
        "community": "healthcare",
        "location": "Royal College of Physicians, London",
        "description": "Exploring emerging technologies in diagnostics, therapeutics, and clinical decision support.",
    },
    {
        "name": "Health Data Research UK Annual Conference",
        "community": "healthcare",
        "location": "London",
        "description": "Bringing together data scientists, clinicians, and policymakers to advance health data science.",
    },
    {
        "name": "NHS Clinical Informatics Society Annual Conference",
        "community": "healthcare",
        "location": "Birmingham",
        "description": "The national conference for clinical informatics, digital health leadership, and NHS IT strategy.",
    },
    {
        "name": "Digital Pathology & AI in Healthcare",
        "community": "healthcare",
        "location": "London",
        "description": "Conference on AI applications in pathology, radiology, and clinical diagnostics.",
    },
    {
        "name": "London NHS Leadership Forum",
        "community": "healthcare",
        "location": "Canary Wharf, London",
        "description": "Leadership forum for NHS executives and senior clinicians navigating transformation.",
    },
    # AI & Technology
    {
        "name": "AI UK",
        "community": "tech",
        "location": "London",
        "description": "The Alan Turing Institute's national AI conference, showcasing cutting-edge research and practical applications.",
    },
    {
        "name": "CogX Festival of AI & Emerging Technology",
        "community": "tech",
        "location": "King's Cross, London",
        "description": "World's largest festival on AI and emerging technology, bridging research, policy, and industry.",
    },
    {
        "name": "NeurIPS",
        "community": "tech",
        "location": "Vancouver Convention Centre",
        "description": "Annual Conference on Neural Information Processing Systems — the premier venue for ML research.",
    },
    {
        "name": "ICML",
        "community": "tech",
        "location": "Vienna",
        "description": "International Conference on Machine Learning, featuring the latest advances in ML theory and applications.",
    },
    {
        "name": "London AI Meetup",
        "community": "tech",
        "location": "Shoreditch, London",
        "description": "Monthly gathering of AI practitioners, researchers, and founders in London.",
    },
    {
        "name": "TechCrunch Disrupt London",
        "community": "tech",
        "location": "London",
        "description": "Flagship tech startup conference featuring Startup Battlefield pitches and investor panels.",
    },
    {
        "name": "London Tech Week",
        "community": "tech",
        "location": "Various venues, London",
        "description": "Week-long festival of technology events across London, from roundtables to large-scale conferences.",
    },
    {
        "name": "Applied Machine Learning Days",
        "community": "tech",
        "location": "EPFL, Lausanne",
        "description": "Conference at the intersection of machine learning research and real-world applications.",
    },
    {
        "name": "AI Safety Summit",
        "community": "tech",
        "location": "Bletchley Park",
        "description": "Government-convened summit on frontier AI safety, attended by researchers, policymakers, and lab leaders.",
    },
    {
        "name": "Deep Learning Indaba",
        "community": "tech",
        "location": "Nairobi",
        "description": "Annual event strengthening machine learning and AI in Africa.",
    },
    # Academia
    {
        "name": "King's Enterprise Demo Day",
        "community": "academia",
        "location": "King's College London",
        "description": "Showcase of student and staff ventures emerging from King's College London.",
    },
    {
        "name": "Imperial Innovation Forum",
        "community": "academia",
        "location": "Imperial College London",
        "description": "Annual forum spotlighting research commercialisation and spinout activity at Imperial.",
    },
    {
        "name": "Oxford-Cambridge Annual Research Symposium",
        "community": "academia",
        "location": "University of Oxford",
        "description": "Joint symposium for postgraduate researchers from Oxford and Cambridge across all disciplines.",
    },
    {
        "name": "UCL Grand Challenges Annual Lecture",
        "community": "academia",
        "location": "UCL, London",
        "description": "Flagship lecture series addressing global challenges in health, sustainability, and society.",
    },
    {
        "name": "Medical Research Council Annual Review",
        "community": "academia",
        "location": "Wellcome Collection, London",
        "description": "Annual review of MRC-funded research programmes and strategic priorities.",
    },
    {
        "name": "King's College London Alumni Networking Evening",
        "community": "academia",
        "location": "Strand Campus, London",
        "description": "Informal networking evening for KCL alumni across medicine, science, and business.",
    },
    {
        "name": "Francis Crick Institute Symposium",
        "community": "academia",
        "location": "The Francis Crick Institute, London",
        "description": "Annual biomedical research symposium featuring talks from Crick researchers and international guests.",
    },
    {
        "name": "Alan Turing Institute Research Showcase",
        "community": "academia",
        "location": "British Library, London",
        "description": "Showcase of data science and AI research from the Alan Turing Institute's national network.",
    },
    # Founders & VC
    {
        "name": "Founders Forum",
        "community": "founders",
        "location": "Claridge's, London",
        "description": "Intimate gathering of the world's top tech entrepreneurs, investors, and policymakers.",
    },
    {
        "name": "Y Combinator Demo Day",
        "community": "founders",
        "location": "San Francisco",
        "description": "Biannual showcase where Y Combinator cohort companies pitch to hundreds of investors.",
    },
    {
        "name": "Entrepreneur First Demo Day",
        "community": "founders",
        "location": "King's Cross, London",
        "description": "Investor showcase for companies built through the Entrepreneur First programme.",
    },
    {
        "name": "Pitchfest Health Innovation",
        "community": "founders",
        "location": "Here East, London",
        "description": "Startup competition for digital health and medtech companies pitching to NHS and investor panels.",
    },
    {
        "name": "London Health Investors Breakfast",
        "community": "founders",
        "location": "Goldman Sachs HQ, London",
        "description": "Exclusive morning briefing for health investors and founders on deal flow and sector trends.",
    },
    {
        "name": "a16z Bio + Health Summit",
        "community": "founders",
        "location": "San Francisco",
        "description": "Annual summit for portfolio companies and strategic partners in bio, health, and clinical AI.",
    },
    {
        "name": "Balderton Portfolio Day",
        "community": "vc",
        "location": "London",
        "description": "Annual gathering of Balderton portfolio founders and key European technology investors.",
    },
    {
        "name": "HealthTech VC Roundtable",
        "community": "vc",
        "location": "Mayfair, London",
        "description": "Quarterly roundtable for active digital health investors and senior founders.",
    },
    # Consulting & Strategy
    {
        "name": "McKinsey Global Healthcare Forum",
        "community": "consulting",
        "location": "London",
        "description": "Invitation-only forum for senior healthcare executives on strategy, technology, and transformation.",
    },
    {
        "name": "Strategy& Health Leaders Summit",
        "community": "consulting",
        "location": "Davos",
        "description": "Executive summit for health system leaders on strategic transformation and policy.",
    },
    # Biotech & Pharma
    {
        "name": "BioTrinity",
        "community": "biotech",
        "location": "London",
        "description": "Europe's leading partnering conference for drug development, biotech investment, and licensing.",
    },
    {
        "name": "Genomics England Research Summit",
        "community": "biotech",
        "location": "Wellcome Genome Campus",
        "description": "Annual summit bringing together genomics researchers, clinicians, and industry partners.",
    },
    {
        "name": "BIO International Convention",
        "community": "biotech",
        "location": "San Diego",
        "description": "World's largest biotechnology conference, connecting innovators, investors, and policymakers.",
    },
    {
        "name": "CRUK Translational Cancer Research Conference",
        "community": "biotech",
        "location": "London",
        "description": "Translational research conference spanning basic science to clinical trials in oncology.",
    },
]

# Map event community to related communities (for cross-community attendance)
EVENT_COMMUNITY_CROSSOVER: Dict[str, List[str]] = {
    "tech": ["founders", "academia", "vc"],
    "healthcare": ["academia", "biotech", "founders"],
    "academia": ["tech", "healthcare", "biotech"],
    "biotech": ["healthcare", "academia", "vc"],
    "founders": ["tech", "vc", "healthcare"],
    "vc": ["founders", "tech", "biotech"],
    "consulting": ["healthcare", "tech", "founders"],
}

# ---------------------------------------------------------------------------
# Tags
# ---------------------------------------------------------------------------

TAG_TEMPLATES = [
    ("Founder", "#7C3AED"),
    ("Investor", "#059669"),
    ("Clinician", "#0284C7"),
    ("Researcher", "#0891B2"),
    ("AI", "#6D28D9"),
    ("NHS", "#1D4ED8"),
    ("Radiology", "#075985"),
    ("Cardiology", "#DC2626"),
    ("Oncology", "#7C2D12"),
    ("Neurology", "#4338CA"),
    ("Professor", "#92400E"),
    ("PhD Student", "#B45309"),
    ("Medical Student", "#A16207"),
    ("Recruiter", "#15803D"),
    ("Advisor", "#0F766E"),
    ("Speaker", "#9333EA"),
    ("Entrepreneur", "#C026D3"),
    ("Healthcare", "#0369A1"),
    ("Digital Health", "#0284C7"),
    ("Biotech", "#166534"),
    ("Machine Learning", "#5B21B6"),
    ("Data Science", "#1E40AF"),
    ("Product", "#0E7490"),
    ("Venture Capital", "#047857"),
    ("Strategy", "#B45309"),
    ("Consulting", "#78350F"),
    ("Policy", "#4B5563"),
    ("Government", "#374151"),
    ("Startup", "#D97706"),
    ("Angel Investor", "#F59E0B"),
    ("GP", "#16A34A"),
    ("Surgeon", "#DC2626"),
    ("Psychiatry", "#7C3AED"),
    ("Paediatrics", "#0EA5E9"),
    ("Emergency Medicine", "#EF4444"),
    ("Genomics", "#10B981"),
    ("Drug Discovery", "#6366F1"),
    ("Clinical Trials", "#F97316"),
    ("Regulatory Affairs", "#8B5CF6"),
    ("Medical Devices", "#06B6D4"),
    ("Ophthalmology", "#3B82F6"),
    ("Dermatology", "#A78BFA"),
    ("Pathology", "#F43F5E"),
    ("Public Health", "#14B8A6"),
    ("Ethics", "#6B7280"),
    ("Open Source", "#84CC16"),
    ("NLP", "#8B5CF6"),
    ("Computer Vision", "#EC4899"),
    ("Reinforcement Learning", "#F97316"),
    ("Bioinformatics", "#22D3EE"),
    ("Wearables", "#FB923C"),
    ("Remote Monitoring", "#34D399"),
    ("Mental Health", "#A855F7"),
    ("Robotics", "#64748B"),
    ("Medtech", "#0891B2"),
    ("Alumni", "#9CA3AF"),
    ("Conference", "#6B7280"),
    ("Mentor", "#4ADE80"),
    ("Collaboration", "#38BDF8"),
    ("Grant Funding", "#FBBF24"),
    ("Publication", "#F87171"),
    ("Patent", "#818CF8"),
    ("Board Member", "#FB7185"),
    ("Trustee", "#A78BFA"),
    ("Non-Exec Director", "#7DD3FC"),
    ("CTO", "#E879F9"),
    ("CMO", "#F472B6"),
    ("CPO", "#34D399"),
    ("Ophthalmology AI", "#60A5FA"),
    ("Renal", "#4ADE80"),
    ("Respiratory", "#93C5FD"),
    ("Diabetes", "#86EFAC"),
    ("Neurosurgery", "#FCA5A5"),
    ("Transplant", "#C4B5FD"),
    ("Intensive Care", "#FDA4AF"),
    ("Primary Care", "#6EE7B7"),
    ("Secondary Care", "#BAE6FD"),
    ("Tertiary Care", "#DDD6FE"),
    ("Healthspan", "#FDE68A"),
    ("Longevity", "#FEF3C7"),
    ("Precision Medicine", "#D1FAE5"),
]

# ---------------------------------------------------------------------------
# Note templates
# ---------------------------------------------------------------------------

PERSON_NOTE_TEMPLATES = [
    "Met at {event}. Working on {topic} at {company}.",
    "Introduced by {intro_person}. Keen to explore collaboration on {topic}.",
    "Strong background in {topic}. Reached out after seeing their talk at {event}.",
    "Previously at {company}. Now leading {topic} initiatives.",
    "Former colleague. Expert in {topic} and well-connected in the {community} space.",
    "Connected on LinkedIn after {event}. Interested in {topic}.",
    "Thoughtful perspective on {topic}. Suggested we reconnect at next {event}.",
    "Long-standing contact. Has been working on {topic} for several years.",
    "Warm intro from mutual contact. Works at the intersection of {topic} and {community}.",
    "Attended their talk on {topic} at {event}. Very impressive work.",
    "Collaborating on a grant application together around {topic}.",
    "NHS lead for {topic}. Important person to know for any {community} work.",
    "One of the best people working on {topic} in the UK.",
    "Building something interesting in {topic}. Worth keeping in touch.",
    "Mentor from {community} programme. Still check in regularly.",
]

ENCOUNTER_NOTE_TEMPLATES = [
    "Great conversation about {topic}. Agreed to follow up.",
    "Exchanged cards. They mentioned interest in {topic}.",
    "Very knowledgeable on {topic}. Potential collaboration.",
    "Brief chat. Follow up re: {topic} introductions.",
    "Sat together at the panel on {topic}.",
    "Long discussion about the challenges in {topic}.",
    "They gave a talk on {topic} — excellent.",
    "Introduced by {intro_person}. Discussed {topic}.",
    "Reconnected after meeting at a previous conference.",
    "First meeting. Good vibe. Follow up in a few weeks.",
    "Useful perspective on the {topic} market.",
    "Connected through the alumni network. Works on {topic}.",
]

FOLLOW_UP_NOTE_TEMPLATES = [
    "Follow up re: introduction to {company} team",
    "Send paper on {topic}",
    "Arrange coffee to discuss {topic} collaboration",
    "Investor intro for {topic} fundraise",
    "Share slides from {event}",
    "Discuss potential role at {company}",
    "Catch up after {event}",
    "Introduction to {contact} at {company}",
    "Review their paper on {topic} and give feedback",
    "Follow up on {topic} grant application",
    "Schedule call to discuss advisory role",
    "Send {topic} reading list",
    "Reconnect re: {topic} project status",
    "Discuss collaboration on {topic} clinical trial",
    "Follow up re: speaking slot at {event}",
    "Connect with their {community} network",
    "Review the {topic} demo they promised to share",
    "Catch up next month",
    "Arrange lunch",
    "Follow up on the intro they offered",
]

TOPICS = [
    "AI in diagnostics", "clinical decision support", "federated learning",
    "natural language processing", "computer vision in radiology",
    "NHS digitisation", "electronic health records", "wearable sensors",
    "genomics and personalised medicine", "drug discovery with ML",
    "mental health technology", "remote patient monitoring",
    "healthcare operations", "value-based care", "digital therapeutics",
    "real-world evidence", "clinical trial design", "precision oncology",
    "large language models in medicine", "AI safety in healthcare",
    "health equity", "patient engagement", "care coordination",
]

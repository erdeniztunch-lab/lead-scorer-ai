export type Lead = {
  id: number;
  rank: number;
  name: string;
  company: string;
  score: number;
  tier: "hot" | "warm" | "cold";
  reasons: string[];
  source: string;
  lastActivity: string;
  email: string;
  aiExplanation: string;
};

export const mockLeads: Lead[] = [
  { id: 1, rank: 1, name: "Sarah Chen", company: "Bloom & Co", score: 94, tier: "hot", reasons: ["High engagement", "Recent purchase intent"], source: "Website", lastActivity: "2 hours ago", email: "sarah@bloom.co", aiExplanation: "Sarah visited pricing 4 times this week, downloaded the ROI calculator, and opened 3 emails. Her company profile matches your ideal customer segment with 50–200 employees in DTC e-commerce." },
  { id: 2, rank: 2, name: "Marcus Johnson", company: "UrbanEdge", score: 89, tier: "hot", reasons: ["Demo requested", "Budget confirmed"], source: "Referral", lastActivity: "5 hours ago", email: "marcus@urbanedge.com", aiExplanation: "Marcus submitted a demo request form indicating a $10K–$25K budget. His company recently raised a Series A and is actively hiring for sales roles — strong buying signals." },
  { id: 3, rank: 3, name: "Aisha Patel", company: "GreenLeaf Goods", score: 82, tier: "hot", reasons: ["Multiple page views", "Email engaged"], source: "Google Ads", lastActivity: "1 day ago", email: "aisha@greenleaf.com", aiExplanation: "Aisha has visited 12 pages in the last week, focusing on integrations and case studies. She opened every email in the nurture sequence and clicked through to comparison pages." },
  { id: 4, rank: 4, name: "Tom Rivera", company: "Coastal Supply", score: 74, tier: "warm", reasons: ["Whitepaper download", "Repeat visitor"], source: "LinkedIn", lastActivity: "2 days ago", email: "tom@coastalsupply.com", aiExplanation: "Tom downloaded two whitepapers and has visited the site on 4 separate occasions. His engagement pattern matches converted leads from Q3, though he hasn't reached out directly yet." },
  { id: 5, rank: 5, name: "Emily Nakamura", company: "Pixel Perfect", score: 68, tier: "warm", reasons: ["Webinar attended", "Fits ICP"], source: "Webinar", lastActivity: "3 days ago", email: "emily@pixelperfect.io", aiExplanation: "Emily attended the full 45-minute webinar and asked two questions during Q&A. Her company size and industry match your ICP, and she follows your team on LinkedIn." },
  { id: 6, rank: 6, name: "David Kim", company: "NovaTrend", score: 61, tier: "warm", reasons: ["Email opened", "Company growth"], source: "Cold outbound", lastActivity: "4 days ago", email: "david@novatrend.com", aiExplanation: "David's company has grown 3x in the last year and recently posted a job for a Revenue Operations Manager. He opened 2 of 5 outreach emails but hasn't clicked through yet." },
  { id: 7, rank: 7, name: "Lisa Moreno", company: "BrightCart", score: 45, tier: "cold", reasons: ["Single visit", "Low engagement"], source: "Website", lastActivity: "1 week ago", email: "lisa@brightcart.com", aiExplanation: "Lisa visited the homepage once and bounced after 30 seconds. No email engagement. Company size is below typical conversion threshold." },
  { id: 8, rank: 8, name: "James O'Brien", company: "TradeFlow", score: 38, tier: "cold", reasons: ["Unqualified industry", "No engagement"], source: "Google Ads", lastActivity: "2 weeks ago", email: "james@tradeflow.net", aiExplanation: "James clicked a Google ad but his company operates in wholesale logistics, outside your target vertical. No follow-up engagement detected." },
];

export const kpiData = {
  totalLeads: 1248,
  timeToFirstContact: "2.4h",
  precisionAt10: "87%",
  lift: "3.2×",
};

export const DEMO_USERS = [
  { id: "1", username: "admin", password: "admin123", name: "Rajesh Kumar", role: "admin", avatar: "RK", branch: "HQ - Bangalore" },
  { id: "2", username: "manager", password: "manager123", name: "Priya Sharma", role: "manager", avatar: "PS", branch: "Mumbai Branch" },
  { id: "3", username: "dealer", password: "dealer123", name: "Arun Patel", role: "dealer", avatar: "AP", branch: "Delhi Branch" },
  { id: "4", username: "sales", password: "sales123", name: "Meena Nair", role: "sales", avatar: "MN", branch: "Chennai Branch" },
];

export const DEMO_LEADS = [
  { id: "L001", name: "Suresh Reddy", phone: "9876543210", email: "suresh.r@gmail.com", city: "Hyderabad", product: "Home Loan", status: "Hot", source: "Website", date: "22 Apr 2026", assignedTo: "Meena Nair", amount: "45,00,000" },
  { id: "L002", name: "Kavitha Iyer", phone: "9845021345", email: "kavitha.i@yahoo.com", city: "Bangalore", product: "Car Loan", status: "Warm", source: "Referral", date: "21 Apr 2026", assignedTo: "Arun Patel", amount: "8,50,000" },
  { id: "L003", name: "Mohit Verma", phone: "9712345678", email: "mohit.v@gmail.com", city: "Delhi", product: "Personal Loan", status: "Cold", source: "Walk-in", date: "20 Apr 2026", assignedTo: "Priya Sharma", amount: "3,00,000" },
  { id: "L004", name: "Anita Desai", phone: "9632145870", email: "anita.d@gmail.com", city: "Mumbai", product: "Business Loan", status: "Converted", source: "Campaign", date: "19 Apr 2026", assignedTo: "Meena Nair", amount: "25,00,000" },
  { id: "L005", name: "Ravi Shankar", phone: "9554123678", email: "ravi.s@gmail.com", city: "Chennai", product: "Home Loan", status: "Hot", source: "Website", date: "18 Apr 2026", assignedTo: "Arun Patel", amount: "60,00,000" },
  { id: "L006", name: "Deepa Nambiar", phone: "9445321890", email: "deepa.n@gmail.com", city: "Kochi", product: "Car Loan", status: "Warm", source: "Social Media", date: "17 Apr 2026", assignedTo: "Priya Sharma", amount: "12,00,000" },
  { id: "L007", name: "Arjun Singh", phone: "9812345670", email: "arjun.s@gmail.com", city: "Jaipur", product: "Personal Loan", status: "Dropped", source: "Referral", date: "16 Apr 2026", assignedTo: "Meena Nair", amount: "2,50,000" },
  { id: "L008", name: "Sunita Gupta", phone: "9765432100", email: "sunita.g@gmail.com", city: "Lucknow", product: "Business Loan", status: "Converted", source: "Campaign", date: "15 Apr 2026", assignedTo: "Arun Patel", amount: "18,00,000" },
  { id: "L009", name: "Prakash Rao", phone: "9900123456", email: "prakash.r@gmail.com", city: "Pune", product: "Home Loan", status: "Hot", source: "Website", date: "14 Apr 2026", assignedTo: "Priya Sharma", amount: "35,00,000" },
  { id: "L010", name: "Lalitha Menon", phone: "9388123450", email: "lalitha.m@gmail.com", city: "Trivandrum", product: "Car Loan", status: "Cold", source: "Walk-in", date: "13 Apr 2026", assignedTo: "Meena Nair", amount: "7,00,000" },
];

export const DEMO_ACTIVITIES = [
  { id: "A001", type: "Call", lead: "Suresh Reddy", note: "Discussed home loan terms, interested in 20yr plan", time: "Today, 10:30 AM", icon: "📞" },
  { id: "A002", type: "Meeting", lead: "Kavitha Iyer", note: "Scheduled site visit for next Monday", time: "Today, 09:15 AM", icon: "🤝" },
  { id: "A003", type: "Follow-up", lead: "Ravi Shankar", note: "Sent loan documents via WhatsApp", time: "Yesterday, 04:00 PM", icon: "📤" },
  { id: "A004", type: "Converted", lead: "Anita Desai", note: "Loan sanctioned ₹25L — Business Loan", time: "Yesterday, 02:30 PM", icon: "✅" },
  { id: "A005", type: "Call", lead: "Mohit Verma", note: "No answer, will retry tomorrow", time: "Yesterday, 11:00 AM", icon: "📞" },
  { id: "A006", type: "Note", lead: "Deepa Nambiar", note: "Customer requested lower EMI option", time: "2 days ago", icon: "📝" },
];

export const DEMO_STATS = {
  totalLeads: 248,
  hotLeads: 64,
  converted: 89,
  dropped: 31,
  thisMonth: 42,
  conversionRate: "35.9%",
};

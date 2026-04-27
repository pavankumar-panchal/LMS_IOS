export interface District {
  distcode: number;
  distname: string;
}

export interface State {
  statecode: number;
  statename: string;
  districts: District[];
}

export const STATES_DATA: State[] = [
  {
    statecode: 1, statename: "Karnataka",
    districts: [
      { distcode: 101, distname: "Bangalore" },
      { distcode: 102, distname: "Mysuru" },
      { distcode: 103, distname: "Hubli-Dharwad" },
      { distcode: 104, distname: "Belagavi" },
      { distcode: 105, distname: "Mangaluru" },
      { distcode: 106, distname: "Tumkur" },
      { distcode: 107, distname: "Shivamogga" },
      { distcode: 108, distname: "Vijayapura" },
      { distcode: 109, distname: "Davangere" },
      { distcode: 110, distname: "Kolar" },
    ],
  },
  {
    statecode: 2, statename: "Maharashtra",
    districts: [
      { distcode: 201, distname: "Mumbai" },
      { distcode: 202, distname: "Pune" },
      { distcode: 203, distname: "Nagpur" },
      { distcode: 204, distname: "Thane" },
      { distcode: 205, distname: "Nashik" },
      { distcode: 206, distname: "Aurangabad" },
      { distcode: 207, distname: "Solapur" },
      { distcode: 208, distname: "Kolhapur" },
    ],
  },
  {
    statecode: 3, statename: "Tamil Nadu",
    districts: [
      { distcode: 301, distname: "Chennai" },
      { distcode: 302, distname: "Coimbatore" },
      { distcode: 303, distname: "Madurai" },
      { distcode: 304, distname: "Salem" },
      { distcode: 305, distname: "Trichy" },
      { distcode: 306, distname: "Tirunelveli" },
      { distcode: 307, distname: "Vellore" },
      { distcode: 308, distname: "Erode" },
    ],
  },
  {
    statecode: 4, statename: "Andhra Pradesh",
    districts: [
      { distcode: 401, distname: "Visakhapatnam" },
      { distcode: 402, distname: "Vijayawada" },
      { distcode: 403, distname: "Tirupati" },
      { distcode: 404, distname: "Guntur" },
      { distcode: 405, distname: "Nellore" },
      { distcode: 406, distname: "Kurnool" },
    ],
  },
  {
    statecode: 5, statename: "Telangana",
    districts: [
      { distcode: 501, distname: "Hyderabad" },
      { distcode: 502, distname: "Warangal" },
      { distcode: 503, distname: "Nizamabad" },
      { distcode: 504, distname: "Karimnagar" },
      { distcode: 505, distname: "Khammam" },
    ],
  },
  {
    statecode: 6, statename: "Kerala",
    districts: [
      { distcode: 601, distname: "Thiruvananthapuram" },
      { distcode: 602, distname: "Ernakulam" },
      { distcode: 603, distname: "Kozhikode" },
      { distcode: 604, distname: "Thrissur" },
      { distcode: 605, distname: "Kollam" },
      { distcode: 606, distname: "Palakkad" },
    ],
  },
  {
    statecode: 7, statename: "Gujarat",
    districts: [
      { distcode: 701, distname: "Ahmedabad" },
      { distcode: 702, distname: "Surat" },
      { distcode: 703, distname: "Vadodara" },
      { distcode: 704, distname: "Rajkot" },
      { distcode: 705, distname: "Gandhinagar" },
    ],
  },
  {
    statecode: 8, statename: "Delhi",
    districts: [
      { distcode: 801, distname: "New Delhi" },
      { distcode: 802, distname: "North Delhi" },
      { distcode: 803, distname: "South Delhi" },
      { distcode: 804, distname: "East Delhi" },
      { distcode: 805, distname: "West Delhi" },
    ],
  },
  {
    statecode: 9, statename: "Rajasthan",
    districts: [
      { distcode: 901, distname: "Jaipur" },
      { distcode: 902, distname: "Jodhpur" },
      { distcode: 903, distname: "Udaipur" },
      { distcode: 904, distname: "Kota" },
      { distcode: 905, distname: "Ajmer" },
    ],
  },
  {
    statecode: 10, statename: "West Bengal",
    districts: [
      { distcode: 1001, distname: "Kolkata" },
      { distcode: 1002, distname: "Howrah" },
      { distcode: 1003, distname: "Durgapur" },
      { distcode: 1004, distname: "Siliguri" },
    ],
  },
  {
    statecode: 11, statename: "Uttar Pradesh",
    districts: [
      { distcode: 1101, distname: "Lucknow" },
      { distcode: 1102, distname: "Kanpur" },
      { distcode: 1103, distname: "Agra" },
      { distcode: 1104, distname: "Varanasi" },
      { distcode: 1105, distname: "Prayagraj" },
      { distcode: 1106, distname: "Noida" },
    ],
  },
  {
    statecode: 12, statename: "Madhya Pradesh",
    districts: [
      { distcode: 1201, distname: "Indore" },
      { distcode: 1202, distname: "Bhopal" },
      { distcode: 1203, distname: "Gwalior" },
      { distcode: 1204, distname: "Jabalpur" },
    ],
  },
  {
    statecode: 13, statename: "Puducherry",
    districts: [
      { distcode: 1301, distname: "Puducherry" },
      { distcode: 1302, distname: "Karaikal" },
    ],
  },
  {
    statecode: 14, statename: "Goa",
    districts: [
      { distcode: 1401, distname: "North Goa" },
      { distcode: 1402, distname: "South Goa" },
    ],
  },
  {
    statecode: 15, statename: "Punjab",
    districts: [
      { distcode: 1501, distname: "Amritsar" },
      { distcode: 1502, distname: "Ludhiana" },
      { distcode: 1503, distname: "Jalandhar" },
    ],
  },
  {
    statecode: 16, statename: "Haryana",
    districts: [
      { distcode: 1601, distname: "Gurugram" },
      { distcode: 1602, distname: "Faridabad" },
      { distcode: 1603, distname: "Ambala" },
      { distcode: 1604, distname: "Rohtak" },
    ],
  },
];

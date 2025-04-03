export async function POST(request) {
  // Same dummy data logic here
  const dummyData = {
    nodes: [
      { id: "1", label: "qubric.in", url: "https://qubric.in" },
      { id: "2", label: "/", url: "https://qubric.in/" },
      { id: "3", label: "/#pricing", url: "https://qubric.in/#pricing" },
      { id: "4", label: "/blog", url: "https://qubric.in/blog" },
      { id: "5", label: "/about", url: "https://qubric.in/about" },
      { id: "6", label: "/tos", url: "https://qubric.in/tos" },
      {
        id: "7",
        label: "/privacy-policy",
        url: "https://qubric.in/privacy-policy",
      },
      {
        id: "8",
        label: "/_next/...",
        url: "https://qubric.in/_next/static/chunks/fd9d1056-fa0a211286719c29.js",
      },
      { id: "9", label: "/dashboard", url: "https://qubric.in/dashboard" },
      {
        id: "10",
        label: "/blog/future-of-ai",
        url: "https://qubric.in/blog/future-of-ai-quiz-creation",
      },
      {
        id: "11",
        label: "/blog/category",
        url: "https://qubric.in/blog/category/feature",
      },
      {
        id: "12",
        label: "/blog/author",
        url: "https://qubric.in/blog/author/jayesh",
      },
      {
        id: "13",
        label: "/blog/maharashtra",
        url: "https://qubric.in/blog/maharashtra-ai-education-trends",
      },
      {
        id: "14",
        label: "/blog/edtech",
        url: "https://qubric.in/blog/category/edtech",
      },
      {
        id: "15",
        label: "/refund-policy",
        url: "https://qubric.in/refund-policy",
      },
      { id: "16", label: "/signin", url: "https://qubric.in/signin" },
    ],
    edges: [
      // Root connections
      { id: "e1-2", source: "1", target: "2" },
      { id: "e1-3", source: "1", target: "3" },
      { id: "e1-4", source: "1", target: "4" },
      { id: "e1-5", source: "1", target: "5" },
      { id: "e1-6", source: "1", target: "6" },
      { id: "e1-7", source: "1", target: "7" },
      { id: "e1-8", source: "1", target: "8" },

      // Blog connections
      { id: "e4-10", source: "4", target: "10" },
      { id: "e4-11", source: "4", target: "11" },
      { id: "e4-12", source: "4", target: "12" },
      { id: "e4-13", source: "4", target: "13" },
      { id: "e4-14", source: "4", target: "14" },

      // About connection
      { id: "e5-9", source: "5", target: "9" },

      // TOS connection
      { id: "e6-15", source: "6", target: "15" },

      // Blog author connections
      { id: "e12-16", source: "12", target: "16" },

      // Future of AI connection
      { id: "e10-16", source: "10", target: "16" },
    ],
  };
  return Response.json(dummyData);
}

export interface Person {
  id: string;
  fullName: string;
  title: string;
  avatarUrl: string | null;
  profileLink: string;
}

interface Opts {
  random?: boolean;
}

export const searchPeopleFn = async ({ query }: { query: string }) => {
  if (!query) return EXAMPLE_PEOPLE;
  return EXAMPLE_PEOPLE.filter((p) => p.fullName.toLowerCase().includes(query.toLowerCase()));
};

export function genPerson(): Person {
  const randomIndex = Math.floor(Math.random() * EXAMPLE_PEOPLE.length);
  return genPeople(randomIndex + 1)[randomIndex]!;
}

export function genPeople(count: number, opts?: Opts): Person[] {
  const people: Person[] = [];

  for (let i = 0; i < count; i++) {
    const index = i % EXAMPLE_PEOPLE.length;
    const person = EXAMPLE_PEOPLE[index];

    people.push(person!);
  }

  if (opts?.random) {
    people.sort(() => Math.random() - 0.5);
  }

  return people;
}

function genAvatar(id: string) {
  return `https://images.unsplash.com/${id}?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`;
}

const EXAMPLE_PEOPLE = [
  {
    id: "bob_williams",
    fullName: "Bob Williams",
    title: "Chief Operating Officer (COO)",
    avatarUrl: genAvatar("photo-1500648767791-00dcc994a43e"),
    profileLink: "#",
  },
  {
    id: "charlie_davis",
    fullName: "Martin Smith",
    title: "Chief Financial Officer (CFO)",
    avatarUrl: genAvatar("photo-1472099645785-5658abf4ff4e"),
    profileLink: "#",
  },
  {
    id: "david_brown",
    fullName: "David Brown",
    title: "Chief Technology Officer (CTO)",
    avatarUrl: genAvatar("photo-1491528323818-fdd1faba62cc"),
    profileLink: "#",
  },
  {
    id: "emily_davis",
    fullName: "Emily Davis",
    title: "Chief Marketing Officer (CMO)",
    avatarUrl: genAvatar("photo-1438761681033-6461ffad8d80"),
    profileLink: "#",
  },
  {
    id: "frank_miller",
    fullName: "Frank Miller",
    title: "VP of Product",
    avatarUrl: genAvatar("photo-1633332755192-727a05c4013d"),
    profileLink: "#",
  },
  {
    id: "grace_wilson",
    fullName: "Grace Wilson",
    title: "VP of Compliance",
    avatarUrl: genAvatar("photo-1494790108377-be9c29b29330"),
    profileLink: "#",
  },
  {
    id: "henry_taylor",
    fullName: "Henry Taylor",
    title: "VP of Engineering",
    avatarUrl: genAvatar("photo-1492562080023-ab3db95bfbce"),
    profileLink: "#",
  },
  {
    id: "ivy_anderson",
    fullName: "Ivy Anderson",
    title: "VP of Sales",
    avatarUrl: genAvatar("photo-1522075469751-3a6694fb2f61"),
    profileLink: "#",
  },
  {
    id: "jack_thomas",
    fullName: "Jack Thomas",
    title: "VP of Customer Success",
    avatarUrl: genAvatar("photo-1579038773867-044c48829161"),
    profileLink: "#",
  },
  {
    id: "karen_martinez",
    fullName: "Karen Martinez Huerta Torres",
    title: "VP of Human Resources",
    avatarUrl: genAvatar("photo-1534528741775-53994a69daeb"),
    profileLink: "#",
  },
  {
    id: "liam_harris",
    fullName: "Liam Harris",
    title: "VP of Design",
    avatarUrl: genAvatar("photo-1489980557514-251d61e3eeb6"),
    profileLink: "#",
  },
  {
    id: "mia_clark",
    fullName: "Mia Clark",
    title: "Director of Engineering",
    avatarUrl: genAvatar("photo-1541823709867-1b206113eafd"),
    profileLink: "#",
  },
  {
    id: "nathan_morris",
    fullName: "Noah Lewis",
    title: "Director of Sales",
    avatarUrl: genAvatar("photo-1568602471122-7832951cc4c5"),
    profileLink: "#",
  },
  {
    id: "olivia_hall",
    fullName: "Olivia Hall",
    title: "Product Manager",
    avatarUrl: genAvatar("photo-1531123897727-8f129e1688ce"),
    profileLink: "#",
  },
  {
    id: "paul_young",
    fullName: "Paul Young",
    title: "Director of Business Development",
    avatarUrl: genAvatar("photo-1600180758890-6b94519a8ba6"),
    profileLink: "#",
  },
  {
    id: "quinn_walker",
    fullName: "Quinn Walker",
    title: "Director of Operations",
    avatarUrl: genAvatar("photo-1584999734482-0361aecad844"),
    profileLink: "#",
  },
  {
    id: "rachel_king",
    fullName: "Rachel King",
    title: "Director of Marketing",
    avatarUrl: genAvatar("photo-1502031882019-24c0bccfffc6"),
    profileLink: "#",
  },
  {
    id: "tina_scott",
    fullName: "Tina Scott",
    title: "Customer Support Representative",
    avatarUrl: genAvatar("photo-1700248356502-ca48ae3bafd6"),
    profileLink: "#",
  },
  {
    id: "walter_baker",
    fullName: "Walter Baker",
    title: "Lead Software Engineer",
    avatarUrl: genAvatar("photo-1521341957697-b93449760f30"),
    profileLink: "#",
  },
];

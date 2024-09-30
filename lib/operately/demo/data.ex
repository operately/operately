defmodule Operately.Demo.Data do
  def data do
    %{
      people: [
        %{
          key: "alice-johnson",
          name: "Alice Johnson", 
          title: "Chief Executive Officer (CEO)", 
          avatar: "photo-1550525811-e5869dd03032",
        },
        %{
          key: "bob-williams",
          name: "Bob Williams", 
          title: "Chief Operating Officer (COO)", 
          avatar: "photo-1500648767791-00dcc994a43e"
        },
        %{
          key: "martin-smith",
          name: "Martin Smith",
          title: "Chief Financial Officer (CFO)", 
          avatar: "photo-1472099645785-5658abf4ff4e"
        },
        %{
          key: "david-brown",
          name: "David Brown",
          title: "Chief Technology Officer (CTO)",
          avatar: "photo-1491528323818-fdd1faba62cc"
        },
        %{
          key: "emily-davis",
          name: "Emily Davis",
          title: "Chief Marketing Officer (CMO)",
          avatar: "photo-1438761681033-6461ffad8d80"
        },
        %{
          key: "frank-miller",
          name: "Frank Miller",
          title: "Chief Product Officer (CPO)",
          avatar: "photo-1633332755192-727a05c4013d"
        },
        %{
          key: "grace-wilson",
          name: "Grace Wilson",
          title: "Chief Legal Officer (CLO)",
          avatar: "photo-1494790108377-be9c29b29330"
        },
        %{
          key: "henry-taylor",
          name: "Henry Taylor",
          title: "VP of Engineering",
          avatar: "photo-1492562080023-ab3db95bfbce"
        },
        %{
          key: "ivy-anderson",
          name: "Ivy Anderson",
          title: "VP of Sales",
          avatar: "photo-1522075469751-3a6694fb2f61"
        },
        %{
          key: "jack-thomas",
          name: "Jack Thomas",
          title: "VP of Customer Success",
          avatar: "photo-1579038773867-044c48829161"
        },
        %{
          key: "karen-martinez",
          name: "Karen Martinez",
          title: "VP of Human Resources",
          avatar: "photo-1534528741775-53994a69daeb"
        },
        %{
          key: "liam-harris",
          name: "Liam Harris",
          title: "VP of Design",
          avatar: "photo-1489980557514-251d61e3eeb6"
        },
        %{
          key: "mia-clark",
          name: "Mia Clark",
          title: "Director of Engineering",
          avatar: "photo-1541823709867-1b206113eafd"
        },
        %{
          key: "noah-lewis",
          name: "Noah Lewis",
          title: "Director of Sales",
          avatar: "photo-1568602471122-7832951cc4c5"
        },
        %{
          key: "olivia-hall",
          name: "Olivia Hall",
          title: "Director of Product Management",
          avatar: "photo-1531123897727-8f129e1688ce"
        },
        %{
          key: "paul-young",
          name: "Paul Young",
          title: "Director of Business Development",
          avatar: "photo-1600180758890-6b94519a8ba6"
        },
        %{
          key: "quinn-walker",
          name: "Quinn Walker",
          title: "Director of Operations",
          avatar: "photo-1584999734482-0361aecad844"
        },
        %{
          key: "rachel-king",
          name: "Rachel King",
          title: "Director of Marketing",
          avatar: "photo-1502031882019-24c0bccfffc6"
        },
        %{
          key: "samuel-wright",
          name: "Samuel Wright",
          title: "Director of Finance",
          avatar: "photo-1702449269565-8bbe32972f65"
        },
        %{
          key: "tina-scott",
          name: "Tina Scott",
          title: "Director of Customer Support",
          avatar: "photo-1700248356502-ca48ae3bafd6"
        },
        %{
          key: "walter-baker",
          name: "Walter Baker",
          title: "Lead Software Engineer",
          avatar: "photo-1521341957697-b93449760f30"
        },
      ],
      spaces: [
        %{
          key: "product-space",
          name: "Product", 
          description: "Build and ship high quality features to our customers", 
          icon: "IconBox", 
          color: "text-blue-500"
        },
        %{
          key: "people-space",
          name: "People",
          description: "Hiring, internal operations, and employee experience",
          icon: "IconFriends",
          color: "text-yellow-500"
        },
        %{
          key: "marketing-space",
          name: "Marketing",
          description: "Create product awareness and bring leads",
          icon: "IconSpeakerphone",
          color: "text-pink-500"
        },
        %{
          key: "legal-space",
          name: "Legal",
          description: "Taking care of the legal side of things. Clarity, compliance, and confidence",
          icon: "IconLifebuoy",
          color: "text-yellow-500"
        },
        %{
          key: "finance-space",
          name: "Finance",
          description: "Providing accurate and timely financial info and safeguarding company assets",
          icon: "IconReportMoney",
          color: "text-red-500"
        }
      ]
    }
  end
end

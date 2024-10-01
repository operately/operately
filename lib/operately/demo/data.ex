defmodule Operately.Demo.Data do
  @moduledoc """
  Data for creating a demo company.
  
  # Key Field

  Each entity has a 'key' field that is used to identify the entity while creating the demo company.
  You can use the key to reference the entity in other parts of the demo data. For example, you can
  reference a person by their key when adding contributions to the project:

  ```
  people: [
    %{
      key: :ceo      <--- Defined here
      name: "Alice Johnson", 
      title: "Chief Executive Officer (CEO)", 
      avatar: "photo-1550525811-e5869dd03032",
    }
  ],

  projects: %{
    key: :project_alpha,
    name: "Project Alpha",
    champion: :ceo   <--- Referenced here
  }
  ```

  Each key must be unique within the data set.

  The demo builder will inject the following keys:
    - :company
    - :company_space
    - :owner

  # Avatars

  The avatars are sourced from Unsplash. To add an avatar, go to unsplash.com,
  filter for faces, set that you want to see only free photos, and copy the
  photo ID from the URL.

  """
  def data do
    %{
      people: [
        %{
          key: :alice_johnson,
          name: "Alice Johnson", 
          title: "Chief Executive Officer (CEO)", 
          avatar: "photo-1550525811-e5869dd03032",
        },
        %{
          key: :bob_williams,
          name: "Bob Williams", 
          title: "Chief Operating Officer (COO)", 
          avatar: "photo-1500648767791-00dcc994a43e"
        },
        %{
          key: :charlie_davis,
          name: "Martin Smith",
          title: "Chief Financial Officer (CFO)", 
          avatar: "photo-1472099645785-5658abf4ff4e"
        },
        %{
          key: :david_brown,
          name: "David Brown",
          title: "Chief Technology Officer (CTO)",
          avatar: "photo-1491528323818-fdd1faba62cc"
        },
        %{
          key: :emily_davis,
          name: "Emily Davis",
          title: "Chief Marketing Officer (CMO)",
          avatar: "photo-1438761681033-6461ffad8d80"
        },
        %{
          key: :frank_miller,
          name: "Frank Miller",
          title: "Chief Product Officer (CPO)",
          avatar: "photo-1633332755192-727a05c4013d"
        },
        %{
          key: :grace_wilson,
          name: "Grace Wilson",
          title: "Chief Legal Officer (CLO)",
          avatar: "photo-1494790108377-be9c29b29330"
        },
        %{
          key: :henry_taylor,
          name: "Henry Taylor",
          title: "VP of Engineering",
          avatar: "photo-1492562080023-ab3db95bfbce"
        },
        %{
          key: :ivy_anderson,
          name: "Ivy Anderson",
          title: "VP of Sales",
          avatar: "photo-1522075469751-3a6694fb2f61"
        },
        %{
          key: :jack_thomas,
          name: "Jack Thomas",
          title: "VP of Customer Success",
          avatar: "photo-1579038773867-044c48829161"
        },
        %{
          key: :karen_martinez,
          name: "Karen Martinez",
          title: "VP of Human Resources",
          avatar: "photo-1534528741775-53994a69daeb"
        },
        %{
          key: :liam_harris,
          name: "Liam Harris",
          title: "VP of Design",
          avatar: "photo-1489980557514-251d61e3eeb6"
        },
        %{
          key: :mia_clark,
          name: "Mia Clark",
          title: "Director of Engineering",
          avatar: "photo-1541823709867-1b206113eafd"
        },
        %{
          key: :nathan_morris,
          name: "Noah Lewis",
          title: "Director of Sales",
          avatar: "photo-1568602471122-7832951cc4c5"
        },
        %{
          key: :olivia_hall,
          name: "Olivia Hall",
          title: "Director of Product Management",
          avatar: "photo-1531123897727-8f129e1688ce"
        },
        %{
          key: :paul_young,
          name: "Paul Young",
          title: "Director of Business Development",
          avatar: "photo-1600180758890-6b94519a8ba6"
        },
        %{
          key: :quinn_walker,
          name: "Quinn Walker",
          title: "Director of Operations",
          avatar: "photo-1584999734482-0361aecad844"
        },
        %{
          key: :rachel_king,
          name: "Rachel King",
          title: "Director of Marketing",
          avatar: "photo-1502031882019-24c0bccfffc6"
        },
        %{
          key: :samuel_wright,
          name: "Samuel Wright",
          title: "Director of Finance",
          avatar: "photo-1702449269565-8bbe32972f65"
        },
        %{
          key: :tina_scott,
          name: "Tina Scott",
          title: "Director of Customer Support",
          avatar: "photo-1700248356502-ca48ae3bafd6"
        },
        %{
          key: :walter_baker,
          name: "Walter Baker",
          title: "Lead Software Engineer",
          avatar: "photo-1521341957697-b93449760f30"
        },
      ],
      spaces: [
        %{
          key: :product_space,
          name: "Product", 
          description: "Build and ship high quality features to our customers", 
          icon: "IconBox", 
          color: "text-blue-500"
        },
        %{
          key: :people_space,
          name: "People",
          description: "Hiring, internal operations, and employee experience",
          icon: "IconFriends",
          color: "text-yellow-500"
        },
        %{
          key: :marketing_space,
          name: "Marketing",
          description: "Create product awareness and bring leads",
          icon: "IconSpeakerphone",
          color: "text-pink-500"
        },
        %{
          key: :legal_space,
          name: "Legal",
          description: "Taking care of the legal side of things. Clarity, compliance, and confidence",
          icon: "IconLifebuoy",
          color: "text-yellow-500"
        },
        %{
          key: :finance_space,
          name: "Finance",
          description: "Providing accurate and timely financial info and safeguarding company assets",
          icon: "IconReportMoney",
          color: "text-red-500"
        }
      ],
      goals: [
        %{
          key: :achieve_product_market_fit,
          name: "Achieve Product-Market Fit",
          space: :company_space,
          champion: :emily_davis,
          reviewer: :frank_miller,
          targets: [
            %{name: "All the core features are implemented", from: 1, to: 17, unit: "features"},
            %{name: "Eliminate all the known bugs and issues before release", from: 0, to: 60, unit: "bugs"},
            %{name: "Obtain feedback from at least 100 beta testers", from: 0, to: 100, unit: "testers"}
          ],
          update: %{
            content: "Everything is going as planned! Last week we had a new batch of beta testers and they loved the product! We are now fully focusing on eliminating the leftover bugs",
            target_values: [16, 50, 50]
          }
        },
        %{
          key: :release_v1_0_of_the_product,
          name: "Release v1.0 of the Product",
          space: :product_space,
          champion: :henry_taylor,
          reviewer: :emily_davis,
          parent: :achieve_product_market_fit,
          targets: [
            %{name: "All the core features are implemented", from: 1, to: 17, unit: "features"},
            %{name: "Eliminate all the known bugs and issues before release", from: 0, to: 60, unit: "bugs"},
            %{name: "Obtain feedback from at least 100 beta testers", from: 0, to: 100, unit: "testers"}
          ],
          update: %{
            content: "Everything is going as planned! Last week we had a new batch of beta testers and they loved the product! We are now fully focusing on eliminating the leftover bugs",
            target_values: [16, 50, 50]
          }
        },
        %{
          key: :launch_marketing_campaign,
          name: "Launch Marketing Campaign",
          space: :marketing_space,
          champion: :ivy_anderson,
          reviewer: :emily_davis,
          parent: :achieve_product_market_fit,
          targets: [
            %{name: "All the core features are implemented", from: 1, to: 17, unit: "features"},
            %{name: "Eliminate all the known bugs and issues before release", from: 0, to: 60, unit: "bugs"},
            %{name: "Obtain feedback from at least 100 beta testers", from: 0, to: 100, unit: "testers"}
          ],
          update: %{
            content: "Everything is going as planned! Last week we had a new batch of beta testers and they loved the product! We are now fully focusing on eliminating the leftover bugs",
            target_values: [16, 50, 50]
          }
        },
        %{
          key: :build_a_strong_team,
          name: "Build a Strong Team",
          space: :people_space,
          champion: :rachel_king,
          reviewer: :bob_williams,
          targets: [
            %{name: "All the core features are implemented", from: 1, to: 17, unit: "features"},
            %{name: "Eliminate all the known bugs and issues before release", from: 0, to: 60, unit: "bugs"},
            %{name: "Obtain feedback from at least 100 beta testers", from: 0, to: 100, unit: "testers"}
          ],
          update: %{
            content: "Everything is going as planned! Last week we had a new batch of beta testers and they loved the product! We are now fully focusing on eliminating the leftover bugs",
            target_values: [16, 50, 50]
          }
        },
        %{
          key: :recruit_key_talent,
          name: "Recruit Key Talent",
          space: :people_space,
          champion: :rachel_king,
          reviewer: :emily_davis,
          parent: :build_a_strong_team,
          targets: [
            %{name: "All the core features are implemented", from: 1, to: 17, unit: "features"},
            %{name: "Eliminate all the known bugs and issues before release", from: 0, to: 60, unit: "bugs"},
            %{name: "Obtain feedback from at least 100 beta testers", from: 0, to: 100, unit: "testers"}
          ],
          update: %{
            content: "Everything is going as planned! Last week we had a new batch of beta testers and they loved the product! We are now fully focusing on eliminating the leftover bugs",
            target_values: [16, 50, 50]
          }
        },
        %{
          key: :develop_a_strong_company_culture,
          name: "Develop a Strong Company Culture",
          space: :people_space,
          champion: :jack_thomas,
          reviewer: :emily_davis,
          parent: :build_a_strong_team,
          targets: [
            %{name: "All the core features are implemented", from: 1, to: 17, unit: "features"},
            %{name: "Eliminate all the known bugs and issues before release", from: 0, to: 60, unit: "bugs"},
            %{name: "Obtain feedback from at least 100 beta testers", from: 0, to: 100, unit: "testers"}
          ],
          update: %{
            content: "Everything is going as planned! Last week we had a new batch of beta testers and they loved the product! We are now fully focusing on eliminating the leftover bugs",
            target_values: [16, 50, 50]
          }
        }
      ],
      projects: [
        %{
          key: :onboarding_for_new_users,
          name: "Onboarding for new users",
          space: :product_space,
          champion: :frank_miller,
          reviewer: :emily_davis,
          contributors: [
            %{person: :alice_johnson, responsibility: "Software Engineer"},
            %{person: :bob_williams, responsibility: "Software Engineer"},
            %{person: :charlie_davis, responsibility: "Software Engineer"},
            %{person: :david_brown, responsibility: "Software Engineer"},
          ],
          goal: :release_v1_0_of_the_product,
          check_in: %{
            status: "on_track",
            content: "Everything is going as planned! Last week we had a new batch of beta testers and they loved the product! We are now fully focusing on eliminating the leftover bugs",
          },
          milestones: [
            %{title: "Milestone 1", status: :done},
            %{title: "Milestone 2", status: :done},
            %{title: "Milestone 3", status: :pending}
          ]
        },
        %{
          key: :thighten_the_api_security,
          name: "Thighten the API security",
          space: :product_space,
          champion: :olivia_hall,
          reviewer: :emily_davis,
          contributors: [
            %{person: :alice_johnson, responsibility: "Software Engineer"},
            %{person: :bob_williams, responsibility: "Software Engineer"},
            %{person: :charlie_davis, responsibility: "Software Engineer"},
            %{person: :david_brown, responsibility: "Software Engineer"},
          ],
          goal: :release_v1_0_of_the_product,
          check_in: %{
            status: "on_track",
            content: "Everything is going as planned! Last week we had a new batch of beta testers and they loved the product! We are now fully focusing on eliminating the leftover bugs",
          },
          milestones: [
            %{title: "Milestone 1", status: :done},
            %{title: "Milestone 2", status: :done},
            %{title: "Milestone 3", status: :pending}
          ]
        },
        %{
          key: :self_hosted_installation,
          name: "Self-hosted Installation",
          description: "We want to provide our users with the option to host Operately on their own servers. This will allow them to have full control over their data and infrastructure, and it will also help us reach customers who have strict data privacy requirements.",
          space: :product_space,
          champion: :owner,
          reviewer: :emily_davis,
          contributors: [
            %{person: :alice_johnson, responsibility: "Software Engineer"},
            %{person: :bob_williams, responsibility: "Software Engineer"},
            %{person: :charlie_davis, responsibility: "Software Engineer"},
            %{person: :david_brown, responsibility: "Software Engineer"},
          ],
          goal: :release_v1_0_of_the_product,
          check_in: nil,
          milestones: [
            %{title: "A self-hosted installation is available", status: :done},
            %{title: "The installation process is tested on different environments", status: :done},
            %{title: "Documentation is complete", status: :pending}
          ],
        },
        %{
          key: :build_and_launch_the_website,
          name: "Build and Launch the Website",
          champion: :alice_johnson,
          reviewer: :emily_davis,
          contributors: [
            %{person: :alice_johnson, responsibility: "Software Engineer"},
            %{person: :bob_williams, responsibility: "Software Engineer"},
            %{person: :charlie_davis, responsibility: "Software Engineer"},
            %{person: :david_brown, responsibility: "Software Engineer"},
          ],
          space: :marketing_space,
          goal: :launch_marketing_campaign,
          check_in: nil,
          milestones: [
            %{title: "Milestone 1", status: :done},
            %{title: "Milestone 2", status: :done},
            %{title: "Milestone 3", status: :pending}
          ]
        },
        %{
          key: :hire_software_engineer,
          name: "Hire a Software Engineer",
          space: :people_space,
          description: "We want to hire a software engineer to enhance Operately's core functionalities, ensuring our product is robust, scalable, and user-friendly. The engineer will play a crucial role in developing new features, optimizing performance, and maintaining the codebase. This addition to our team is essential to accelerate our development process and meet our growing user demands.",
          champion: :emily_davis,
          reviewer: :owner,
          contributors: [
            %{person: :alice_johnson, responsibility: "Software Engineer"},
            %{person: :bob_williams, responsibility: "Software Engineer"},
            %{person: :charlie_davis, responsibility: "Software Engineer"},
            %{person: :david_brown, responsibility: "Software Engineer"},
          ],
          goal: :recruit_key_talent,
          check_in: %{
            status: "on_track",
            content: "We have several good candidates in the final step of the selection process. If everything goes well, we will have a hired engineer by the end of this week.",
          },
          milestones: [
            %{title: "Candidates are selected for the second round", status: :done},
            %{title: "Engineer is hired", status: :pending}
          ]
        },
        %{
          key: :hire_support_specialist,
          name: "Hire a Support Specialist",
          space: :people_space,
          champion: :tina_scott,
          reviewer: :emily_davis,
          contributors: [
            %{person: :alice_johnson, responsibility: "Software Engineer"},
            %{person: :bob_williams, responsibility: "Software Engineer"},
            %{person: :charlie_davis, responsibility: "Software Engineer"},
            %{person: :david_brown, responsibility: "Software Engineer"},
          ],
          goal: :recruit_key_talent,
          check_in: nil,
          milestones: [
            %{title: "Milestone 1", status: :done},
            %{title: "Milestone 2", status: :done},
            %{title: "Milestone 3", status: :pending}
          ]
        },
        %{
          key: :employee_handbook,
          name: "Employee Handbook",
          space: :people_space,
          champion: :karen_martinez,
          reviewer: :bob_williams,
          contributors: [
            %{person: :alice_johnson, responsibility: "Software Engineer"},
            %{person: :bob_williams, responsibility: "Software Engineer"},
            %{person: :charlie_davis, responsibility: "Software Engineer"},
            %{person: :david_brown, responsibility: "Software Engineer"},
          ],
          goal: :develop_a_strong_company_culture,
          check_in: nil,
          milestones: [
            %{title: "Milestone 1", status: :done},
            %{title: "Milestone 2", status: :done},
            %{title: "Milestone 3", status: :pending}
          ]
        }
      ]
    }
  end
end

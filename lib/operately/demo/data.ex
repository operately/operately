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
          avatar: "photo-1500648767791-00dcc994a43e",
          reports_to: :alice_johnson
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
          key: :accelerate_user_growth,
          name: "Accelerate User Growth",
          space: :marketing_space,
          champion: :emily_davis,
          reviewer: :frank_miller,
          targets: [
            %{name: "TODO", from: 0, to: 1000, unit: "TODO"},
          ],
          update: %{
            content: "We're seeing positive traction in user acquisition, but our expansion into new markets is slower than anticipated. We may need to reassess our localization strategy.",
            target_values: [0] # TODO
          }
        },
        %{
          key: :increase_user_acquisition,
          name: "Increase User Acquisition",
          space: :marketing_space,
          champion: :henry_taylor,
          reviewer: :emily_davis,
          parent: :accelerate_user_growth,
          targets: [
            %{name: "Achieve 20% month-over-month growth in new user signups", from: 10, to: 15, unit: "%"},
          ],
          update: nil, # TODO
        },
        %{
          key: :optimize_roi_of_ads,
          name: "Optimize ROI of ads",
          space: :marketing_space,
          champion: :henry_taylor,
          reviewer: :emily_davis,
          parent: :increase_user_acquisition,
          targets: [
            %{name: "Increase conversion rate from ads to signups from 2% to 5%", from: 2, to: 5, unit: "%"}
          ],
          update: nil, # TODO
        },
        %{
          key: :get_more_users_through_word_of_mouth,
          name: "Get more users through word of mouth",
          space: :marketing_space,
          champion: :henry_taylor,
          reviewer: :emily_davis,
          parent: :increase_user_acquisition,
          targets: [
            %{name: "15% of new users acquired through referrals", from: 5, to: 8, unit: "%"}
          ],
          update: nil, # TODO
        },
        %{
          key: :expand_into_new_markets,
          name: "Expand into New Markets",
          space: :marketing_space,
          champion: :henry_taylor,
          reviewer: :emily_davis,
          parent: :accelerate_user_growth,
          targets: [
            %{name: "Achieve 1000+ active users in each of 2 new countries", from: 0, to: 1000, unit: "users"}
          ],
          update: nil, # TODO
        },
        %{
          key: :improve_product,
          name: "Improve Product",
          space: :product_space,
          champion: :henry_taylor,
          reviewer: :emily_davis,
          targets: [
            %{name: "TODO", from: 0, to: 1000, unit: "TODO"},
          ],
          update: %{
            content: "We're making steady progress on reducing churn rate. The new collaborative features are receiving positive feedback in beta testing.",
            target_values: [0] # TODO
          }
        },
        %{
          key: :eliminate_top_reasons_customers_cancel,
          name: "Eliminate top reasons customers cancel",
          space: :product_space,
          champion: :henry_taylor,
          reviewer: :emily_davis,
          parent: :improve_product,
          targets: [
            %{name: "Reduce monthly churn rate from 5% to 2%", from: 5, to: 3.8, unit: "%"},
            %{name: "Deliver top 5 most requested product enhancements", from: 0, to: 2, unit: "deliverables"},
          ],
          update: nil
        },
        %{
          key: :scale_up_company,
          name: "Scale up company",
          space: :company_space,
          champion: :henry_taylor,
          reviewer: :emily_davis,
          targets: [
            %{name: "TODO", from: 0, to: 1000, unit: "TODO"},
          ],
          update: %{
            content: "We're making good progress on documenting processes and expanding the team. However, we're slightly behind on our financial goals and may need to adjust our strategy.",
            target_values: [0] # TODO
          }
        },
        %{
          key: :document_core_business_processes,
          name: "Document core business processes in company playbook",
          space: :company_space,
          champion: :henry_taylor,
          reviewer: :emily_davis,
          parent: :scale_up_company,
          targets: [
            %{name: "80% of core processes documented", from: 40, to: 60, unit: "%"},
          ],
          update: nil
        },
        %{
          key: :expand_team_capabilities,
          name: "Expand team capabilities",
          space: :people_space,
          champion: :henry_taylor,
          reviewer: :emily_davis,
          parent: :scale_up_company,
          targets: [
            %{name: "Hire and onboard 5 key roles identified in growth plan", from: 1, to: 3, unit: "roles"},
            %{name: "90% of team members complete individual development plans", from: 60, to: 75, unit: "%"},
          ],
          update: nil
        },
        %{
          key: :ensure_financial_stability,
          name: "Ensure Financial Stability",
          space: :people_space,
          champion: :henry_taylor,
          reviewer: :emily_davis,
          parent: :scale_up_company,
          targets: [
            %{name: "Extend runway to 18 months at current burn rate", from: 3, to: 5, unit: "months"},
            %{name: "Increase monthly recurring revenue (MRR) by 50%", from: 10000, to: 12000, unit: "$"},
          ],
          update: nil
        }
      ],
      projects: [
        %{
          key: :refine_ad_targeting,
          name: "Refine ad targeting on social media platforms",
          space: :marketing_space,
          champion: :frank_miller,
          reviewer: :emily_davis,
          contributors: [
            %{person: :alice_johnson, responsibility: "Software Engineer"},
            %{person: :bob_williams, responsibility: "Software Engineer"},
            %{person: :charlie_davis, responsibility: "Software Engineer"},
            %{person: :david_brown, responsibility: "Software Engineer"},
          ],
          goal: :optimize_roi_of_ads,
          check_in: %{
            status: "on_track",
            content: "A/B testing is yielding promising results. We've identified key demographics that respond well to our ads. On track to meet our conversion rate goal."
          },
          milestones: [
            %{title: "Analyze user behavior of top 100 power users to create \"ideal customer\" profile", status: :pending},
            %{title: "Develop 5 distinct ad creatives featuring customer success stories", status: :pending},
            %{title: "Set up A/B tests for ad placement during \"productivity hours\" (10am-2pm) vs. \"downtime hours\" (8pm-11pm)", status: :pending},
            %{title: "Achieve 1000 click-throughs from developers active in Stack Overflow communities", status: :pending}
          ]
        },
        %{
          key: :implement_in_app_referral_program,
          name: "Implement in-app referral program with rewards",
          space: :marketing_space,
          champion: :frank_miller,
          reviewer: :emily_davis,
          contributors: [
            %{person: :alice_johnson, responsibility: "Software Engineer"},
            %{person: :bob_williams, responsibility: "Software Engineer"},
            %{person: :charlie_davis, responsibility: "Software Engineer"},
            %{person: :david_brown, responsibility: "Software Engineer"},
          ],
          goal: :get_more_users_through_word_of_mouth,
          check_in: %{
            status: "on_track",
            content: "Referral program UI is complete, but we're facing delays in implementing the reward system. May need an additional week to resolve technical issues."
          },
          milestones: [
            %{title: "Design \"Golden Ticket\" referral UI that appears after user's 10th login", status: :pending},
            %{title: "Implement blockchain-based reward system for tracking referrals", status: :pending},
            %{title: "Create tiered rewards including \"Productivity Guru\" badge and limited edition branded ergonomic mouse", status: :pending},
            %{title: "Soft launch program to top 50 users and gather feedback", status: :pending}
          ]
        },
        %{
          key: :conduct_market_research,
          name: "Conduct market research for expansion into Germany",
          space: :marketing_space,
          champion: :frank_miller,
          reviewer: :emily_davis,
          contributors: [
            %{person: :alice_johnson, responsibility: "Software Engineer"},
            %{person: :bob_williams, responsibility: "Software Engineer"},
            %{person: :charlie_davis, responsibility: "Software Engineer"},
            %{person: :david_brown, responsibility: "Software Engineer"},
          ],
          goal: :expand_into_new_markets,
          check_in: %{
            status: "on_track",
            content: "Referral program UI is complete, but we're facing delays in implementing the reward system. May need an additional week to resolve technical issues."
          },
          milestones: [
            %{title: "Hire a Berlin-based \"Culture Consultant\" for insights into German work habits", status: :pending},
            %{title: "Attend \"Bits & Pretzels\" startup conference in Munich to network with potential users", status: :pending},
            %{title: "Conduct 5 focus groups with German project managers, offering free Bavarian pretzels as incentive", status: :pending},
            %{title: "Analyze top 3 competing products' German-language marketing materials", status: :pending}
          ]
        },
        %{
          key: :develop_localization_strategy,
          name: "Develop localization strategy for Spanish-speaking markets",
          space: :marketing_space,
          champion: :frank_miller,
          reviewer: :emily_davis,
          contributors: [
            %{person: :alice_johnson, responsibility: "Software Engineer"},
            %{person: :bob_williams, responsibility: "Software Engineer"},
            %{person: :charlie_davis, responsibility: "Software Engineer"},
            %{person: :david_brown, responsibility: "Software Engineer"},
          ],
          goal: :expand_into_new_markets,
          check_in: %{
            status: "on_track",
            content: "Facing challenges in adapting our UI for cultural preferences. May need to bring in a local UX consultant to assist."
          },
          milestones: [
            %{title: "Create a \"Siesta-Friendly\" feature that optimizes task scheduling around traditional break times", status: :pending},
            %{title: "Hire a Mexican telenovela script writer to add flair to product copy translations", status: :pending},
            %{title: "Partner with 3 coworking spaces in Madrid for beta testing", status: :pending},
            %{title: "Develop a \"Fiesta Mode\" UI theme with vibrant colors and celebratory icons", status: :pending}
          ]
        },
        %{
          key: :develop_and_launch_new_collaborative_features,
          name: "Develop and launch new collaborative features",
          space: :product_space,
          champion: :frank_miller,
          reviewer: :emily_davis,
          contributors: [
            %{person: :alice_johnson, responsibility: "Software Engineer"},
            %{person: :bob_williams, responsibility: "Software Engineer"},
            %{person: :charlie_davis, responsibility: "Software Engineer"},
            %{person: :david_brown, responsibility: "Software Engineer"},
          ],
          goal: :eliminate_top_reasons_customers_cancel,
          check_in: %{
            status: "on_track",
            content: "Beta testing of the real-time document collaboration feature is going well. We're on track for the full release next month."
          },
          milestones: [
            %{title: "Conduct user surveys to identify top 3 requested collaborative features", status: :pending},
            %{title: "Create detailed wireframes and user flow diagrams for new features", status: :pending},
            %{title: "Develop MVP of real-time document collaboration feature", status: :pending},
            %{title: "Beta test new features with a group of 50 power users", status: :pending},
            %{title: "Iterate based on beta feedback and prepare for full release", status: :pending}
          ]
        },
        %{
          key: :create_templates_for_common_business_processes,
          name: "Create templates for common business processes",
          space: :product_space,
          champion: :frank_miller,
          reviewer: :emily_davis,
          contributors: [
            %{person: :alice_johnson, responsibility: "Software Engineer"},
            %{person: :bob_williams, responsibility: "Software Engineer"},
            %{person: :charlie_davis, responsibility: "Software Engineer"},
            %{person: :david_brown, responsibility: "Software Engineer"},
          ],
          goal: :scale_up_company,
          check_in: %{
            status: "on_track",
            content: "Template creation is on schedule. We've completed drafts for 3 out of 5 top processes and are gathering feedback.",
          },
          milestones: [
            %{title: "Identify top 10 most frequently used business processes", status: :pending},
            %{title: "Interview department heads to document current workflows", status: :pending},
            %{title: "Design standardized template format for process documentation", status: :pending},
            %{title: "Create first draft of templates for top 5 processes", status: :pending},
            %{title: "Review and refine templates with relevant team members", status: :pending}
          ]
        },
        %{
          key: :hire_senior_ux_designer,
          name: "Hire a Senior UX Designer",
          space: :company_space,
          champion: :frank_miller,
          reviewer: :emily_davis,
          contributors: [
            %{person: :alice_johnson, responsibility: "Software Engineer"},
            %{person: :bob_williams, responsibility: "Software Engineer"},
            %{person: :charlie_davis, responsibility: "Software Engineer"},
            %{person: :david_brown, responsibility: "Software Engineer"},
          ],
          goal: :expand_team_capabilities,
          check_in: %{
            status: "on_track",
            content: "We've narrowed down to 3 top candidates. Design challenge results are due this Friday. On track to make an offer next week.",
          },
          milestones: [
            %{title: "Define job requirements and create detailed job description", status: :pending},
            %{title: "Post job opening on relevant platforms (e.g., LinkedIn, Dribbble, AngelList)", status: :pending},
            %{title: "Review portfolios and conduct initial screening interviews", status: :pending},
            %{title: "Assign practical design challenge to top 5 candidates", status: :pending},
            %{title: "Conduct final round interviews and make job offer", status: :pending}
          ]
        },
        %{
          key: :hire_full_stack_software_engineer,
          name: "Hire a Full Stack Software Engineer",
          space: :company_space,
          champion: :frank_miller,
          reviewer: :emily_davis,
          contributors: [
            %{person: :alice_johnson, responsibility: "Software Engineer"},
            %{person: :bob_williams, responsibility: "Software Engineer"},
            %{person: :charlie_davis, responsibility: "Software Engineer"},
            %{person: :david_brown, responsibility: "Software Engineer"},
          ],
          goal: :expand_team_capabilities,
          check_in: %{
            status: "on_track",
            content: "Received a strong pool of applicants. Technical screenings are underway. Slightly ahead of schedule."
          },
          milestones: [
            %{title: "Define technical requirements and skills needed for the role", status: :pending},
            %{title: "Reach out to personal networks and post on job boards", status: :pending},
            %{title: "Conduct technical screening interviews with qualified candidates", status: :pending},
            %{title: "Administer coding challenge to top candidates", status: :pending},
            %{title: "Perform final round interviews with team leads and make decision", status: :pending}
          ]
        },
        %{
          key: :hire_customer_support_specialist,
          name: "Hire a Customer Support Specialist",
          space: :company_space,
          champion: :frank_miller,
          reviewer: :emily_davis,
          contributors: [
            %{person: :alice_johnson, responsibility: "Software Engineer"},
            %{person: :bob_williams, responsibility: "Software Engineer"},
            %{person: :charlie_davis, responsibility: "Software Engineer"},
            %{person: :david_brown, responsibility: "Software Engineer"},
          ],
          goal: :expand_team_capabilities,
          check_in: %{
            status: "on_track",
            content: "Struggling to find candidates with the right mix of technical knowledge and customer service skills. May need to expand our search or consider internal training options."
          },
          milestones: [
            %{title: "Create job description emphasizing required skills and experience", status: :pending},
            %{title: "Post job opening on customer service-specific job boards", status: :pending},
            %{title: "Conduct initial phone screenings with promising applicants", status: :pending},
            %{title: "Perform role-playing exercises with top candidates to assess skills", status: :pending},
            %{title: "Check references and make job offer to best candidate", status: :pending}
          ]
        },
        %{
          key: :prepare_pitch_deck,
          name: "Prepare pitch deck and financial projections for Series A funding",
          space: :finance_space,
          champion: :frank_miller,
          reviewer: :emily_davis,
          contributors: [
            %{person: :alice_johnson, responsibility: "Software Engineer"},
            %{person: :bob_williams, responsibility: "Software Engineer"},
            %{person: :charlie_davis, responsibility: "Software Engineer"},
            %{person: :david_brown, responsibility: "Software Engineer"},
          ],
          goal: :ensure_financial_stability,
          check_in: %{
            status: "on_track",
            content: "Financial model is taking longer than expected due to complexities in our expansion plans. May need an extra week to finalize projections."
          },
          milestones: [
            %{title: "Gather key metrics and growth data from all departments", status: :pending},
            %{title: "Develop detailed financial model with projections for next 3 years", status: :pending},
            %{title: "Create compelling narrative and design for pitch deck", status: :pending},
            %{title: "Rehearse pitch with mentors and advisors for feedback", status: :pending},
            %{title: "Schedule meetings with potential investors and VC firms", status: :pending}
          ]
        },
      ]
    }
  end
end

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
          key: :bob_williams,
          name: "Bob Williams",
          title: "Chief Operating Officer (COO)",
          avatar: "photo-1500648767791-00dcc994a43e",
          reports_to: :owner
        },
        %{
          key: :martin_smith,
          name: "Martin Smith",
          title: "Chief Financial Officer (CFO)",
          avatar: "photo-1472099645785-5658abf4ff4e",
          reports_to: :owner
        },
        %{
          key: :david_brown,
          name: "David Brown",
          title: "Chief Technology Officer (CTO)",
          avatar: "photo-1491528323818-fdd1faba62cc",
          reports_to: :owner
        },
        %{
          key: :emily_davis,
          name: "Emily Davis",
          title: "Chief Marketing Officer (CMO)",
          avatar: "photo-1438761681033-6461ffad8d80",
          reports_to: :owner
        },
        %{
          key: :frank_miller,
          name: "Frank Miller",
          title: "VP of Product",
          avatar: "photo-1633332755192-727a05c4013d",
          reports_to: :david_brown
        },
        %{
          key: :grace_wilson,
          name: "Grace Wilson",
          title: "VP of Compliance",
          avatar: "photo-1494790108377-be9c29b29330",
          reports_to: :bob_williams
        },
        %{
          key: :henry_taylor,
          name: "Henry Taylor",
          title: "VP of Engineering",
          avatar: "photo-1492562080023-ab3db95bfbce",
          reports_to: :david_brown
        },
        %{
          key: :ivy_anderson,
          name: "Ivy Anderson",
          title: "VP of Sales",
          avatar: "photo-1522075469751-3a6694fb2f61",
          reports_to: :emily_davis
        },
        %{
          key: :jack_thomas,
          name: "Jack Thomas",
          title: "VP of Customer Success",
          avatar: "photo-1579038773867-044c48829161",
          reports_to: :bob_williams
        },
        %{
          key: :karen_martinez,
          name: "Karen Martinez",
          title: "VP of Human Resources",
          avatar: "photo-1534528741775-53994a69daeb",
          reports_to: :bob_williams
        },
        %{
          key: :liam_harris,
          name: "Liam Harris",
          title: "VP of Design",
          avatar: "photo-1489980557514-251d61e3eeb6",
          reports_to: :david_brown
        },
        %{
          key: :mia_clark,
          name: "Mia Clark",
          title: "Director of Engineering",
          avatar: "photo-1541823709867-1b206113eafd",
          reports_to: :frank_miller
        },
        %{
          key: :noah_lewis,
          name: "Noah Lewis",
          title: "Director of Sales",
          avatar: "photo-1568602471122-7832951cc4c5",
          reports_to: :ivy_anderson
        },
        %{
          key: :olivia_hall,
          name: "Olivia Hall",
          title: "Product Manager",
          avatar: "photo-1531123897727-8f129e1688ce",
          reports_to: :frank_miller
        },
        %{
          key: :paul_young,
          name: "Paul Young",
          title: "Director of Business Development",
          avatar: "photo-1600180758890-6b94519a8ba6",
          reports_to: :ivy_anderson
        },
        %{
          key: :quinn_walker,
          name: "Quinn Walker",
          title: "Director of Operations",
          avatar: "photo-1584999734482-0361aecad844",
          reports_to: :bob_williams
        },
        %{
          key: :rachel_king,
          name: "Rachel King",
          title: "Director of Marketing",
          avatar: "photo-1502031882019-24c0bccfffc6",
          reports_to: :emily_davis
        },
        %{
          key: :tina_scott,
          name: "Tina Scott",
          title: "Customer Support Representative",
          avatar: "photo-1700248356502-ca48ae3bafd6",
          reports_to: :jack_thomas
        },
        %{
          key: :walter_baker,
          name: "Walter Baker",
          title: "Lead Software Engineer",
          avatar: "photo-1521341957697-b93449760f30",
          reports_to: :mia_clark
        },
      ],
      spaces: [
        %{
          key: :product_space,
          name: "Product",
          description: "Build and ship high quality features to our customers",
          members: [
            :walter_baker,
            :liam_harris,
            :frank_miller,
          ]
        },
        %{
          key: :people_space,
          name: "People",
          description: "Hiring, internal operations, and employee experience",
          members: [
            :karen_martinez,
          ],
          privacy: :invite_only
        },
        %{
          key: :marketing_space,
          name: "Marketing",
          description: "Create product awareness and bring leads",
          members: [
            :rachel_king,
            :olivia_hall,
            :emily_davis,
            :noah_lewis,
            :paul_young
          ]
        },
        %{
          key: :finance_space,
          name: "Finance",
          description: "Providing accurate and timely financial info and safeguarding company assets",
          members: [
            :martin_smith,
          ]
        }
      ],
      goals: [
        %{
          key: :accelerate_user_growth,
          name: "Accelerate User Growth",
          space: :marketing_space,
          champion: :emily_davis,
          reviewer: :frank_miller,
          timeframe: :current_year,
          targets: [
            %{name: "Increase total active users", from: 10000, to: 25000, unit: "users"},
            %{name: "Achieve presence in new markets", from: 0, to: 5, unit: "markets"}
          ],
          update: %{
            content: "We're seeing positive traction in user acquisition, but our expansion into new markets is slower than anticipated. We may need to reassess our localization strategy.",
            target_values: [14500, 1]
          }
        },
        %{
          key: :increase_user_acquisition,
          name: "Increase User Acquisition",
          space: :marketing_space,
          champion: :rachel_king,
          reviewer: :emily_davis,
          parent: :accelerate_user_growth,
          targets: [
            %{name: "Achieve month-over-month growth in new user signups", from: 10, to: 20, unit: "%"},
            %{name: "Increase percentage of new users acquired through referrals", from: 10, to: 30, unit: "%"}
          ],
          update: %{
            content: "Our user acquisition efforts are showing promising results with a 15% month-over-month growth in new signups. Our referral program is gaining traction, with 18% of new users now coming from referrals.",
            target_values: [15, 18]
          }
        },
        %{
          key: :optimize_roi_of_ads,
          name: "Optimize ROI of ads",
          space: :marketing_space,
          champion: :noah_lewis,
          reviewer: :rachel_king,
          parent: :increase_user_acquisition,
          targets: [
            %{name: "Increase conversion rate from ads to signups", from: 2, to: 5, unit: "%"}
          ],
          update: %{
            content: "AB testing is yielding promising results. We've identified key demographics that respond well to our ads. On track to meet our conversion rate goal.",
            target_values: [3.5]
          }
        },
        %{
          key: :get_more_users_through_word_of_mouth,
          name: "Get more users through word of mouth",
          space: :marketing_space,
          champion: :olivia_hall,
          reviewer: :rachel_king,
          parent: :increase_user_acquisition,
          targets: [
            %{name: "Percentage of new users acquired through referrals", from: 5, to: 15, unit: "%"}
          ],
          update: %{
            content: "Our new in-app referral program is showing early signs of success. We've seen an uptick in user-to-user invitations.",
            target_values: [8]
          }
        },
        %{
          key: :expand_into_new_markets,
          name: "Expand into New Markets",
          space: :marketing_space,
          champion: :paul_young,
          reviewer: :emily_davis,
          parent: :accelerate_user_growth,
          targets: [
            %{name: "Achieve 1000+ active users in new countries", from: 0, to: 1000, unit: "users"},
            %{name: "Expand to new countries", from: 0, to: 2, unit: "countries"}
          ],
          update: %{
            content: "Market research for Germany is progressing well, but we're facing challenges in adapting our product for Spanish-speaking markets. We may need to reassess our timeline.",
            target_values: [0, 0]
          }
        },
        %{
          key: :improve_product,
          name: "Improve Product",
          space: :product_space,
          champion: :frank_miller,
          reviewer: :owner,
          targets: [
            %{name: "Reduce monthly churn rate", from: 5, to: 2, unit: "%"},
            %{name: "Reduce average time to complete core task", from: 45, to: 30, unit: "seconds"}
          ],
          update: %{
            content: "We're making steady progress on reducing our churn rate and improving user efficiency. The new collaborative features are receiving positive feedback in beta testing.",
            target_values: [3.8, 38]
          }
        },
        %{
          key: :enhance_product_functionality,
          name: "Enhance product functionality",
          space: :product_space,
          champion: :liam_harris,
          reviewer: :frank_miller,
          parent: :improve_product,
          targets: [
            %{name: "Deliver top requested product enhancements", from: 0, to: 5, unit: "deliverables"}
          ],
          update: %{
            content: "We've successfully launched two major enhancements this quarter. The team is making good progress on the remaining features.",
            target_values: [2]
          }
        },
        %{
          key: :scale_up_company,
          name: "Scale up company",
          space: :company_space,
          champion: :bob_williams,
          reviewer: :owner,
          timeframe: :current_year,
          targets: [
            %{name: "Increase team size", from: 15, to: 25, unit: "employees"},
            %{name: "Achieve Annual Recurring Revenue (ARR)", from: 1.2, to: 2, unit: "M$"}
          ],
          update: %{
            content: "We're making good progress on documenting processes and expanding the team. However, we're slightly behind on our financial goals and may need to adjust our strategy.",
            target_values: [18, 1.44]
          }
        },
        %{
          key: :document_core_business_processes,
          name: "Document core business processes in company playbook",
          space: :company_space,
          champion: :bob_williams,
          reviewer: :owner,
          parent: :scale_up_company,
          targets: [
            %{name: "Percentage of core processes documented", from: 40, to: 80, unit: "%"}
          ],
          update: %{
            content: "We've made significant progress in documenting our core processes. The team has completed 60% of the documentation, and we're on track to meet our goal.",
            target_values: [60]
          }
        },
        %{
          key: :expand_team_capabilities,
          name: "Expand team capabilities",
          space: :people_space,
          champion: :karen_martinez,
          reviewer: :bob_williams,
          parent: :scale_up_company,
          targets: [
            %{name: "Hire and onboard key roles identified in growth plan", from: 1, to: 5, unit: "roles"},
            %{name: "Team members complete individual development plans", from: 60, to: 90, unit: "%"}
          ],
          update: %{
            content: "We've successfully hired 3 out of the 5 key roles. The individual development plan initiative is progressing well, with 75% of team members having completed their plans.",
            target_values: [3, 75]
          }
        },
        %{
          key: :ensure_financial_stability,
          name: "Ensure Financial Stability",
          space: :finance_space,
          champion: :martin_smith,
          reviewer: :owner,
          parent: :scale_up_company,
          targets: [
            %{name: "Extend runway at current burn rate", from: 3, to: 18, unit: "months"},
            %{name: "Increase monthly recurring revenue (MRR)", from: 100, to: 150, unit: "K$"}
          ],
          update: %{
            content: "We've successfully extended our runway to 5 months and increased our MRR to $120K. We're making progress, but we need to accelerate our efforts to meet our targets.",
            target_values: [5, 120]
          }
        }
      ],
      projects: [
        %{
          key: :refine_ad_targeting,
          name: "Refine ad targeting on social media platforms",
          space: :marketing_space,
          champion: :noah_lewis,
          reviewer: :emily_davis,
          contributors: [
            %{person: :noah_lewis, responsibility: "Growth Marketer"}
          ],
          goal: :optimize_roi_of_ads,
          description: "This project aims to improve our ad targeting strategies on major social media platforms. By analyzing user behavior and creating an ideal customer profile, we'll develop more effective ad creatives. The project includes A/B testing different ad placements and content to maximize our return on investment. Success will be measured by increased click-through rates and improved conversion from ads to signups.",
          check_in: %{
            status: "on_track",
            content: "A/B testing is yielding promising results. We've identified key demographics that respond well to our ads. On track to meet our conversion rate goal."
          },
          milestones: [
            %{title: "Ideal customer profile created", status: :done},
            %{title: "5 new ad creatives launched", status: :done},
            %{title: "A/B test results analyzed", status: :pending},
            %{title: "1000 click-throughs achieved from Stack Overflow", status: :pending}
          ]
        },
        %{
          key: :implement_in_app_referral_program,
          name: "Implement in-app referral program with rewards",
          space: :marketing_space,
          champion: :olivia_hall,
          reviewer: :emily_davis,
          contributors: [
            %{person: :olivia_hall, responsibility: "Product Manager"}
          ],
          goal: :get_more_users_through_word_of_mouth,
          description: "This project aims to improve our ad targeting strategies on major social media platforms. By analyzing user behavior and creating an ideal customer profile, we'll develop more effective ad creatives. The project includes A/B testing different ad placements and content to maximize our return on investment. Success will be measured by increased click-through rates and improved conversion from ads to signups.",
          check_in: %{
            status: "issue",
            content: "Referral program UI is complete, but we're facing delays in implementing the reward system. May need an additional week to resolve technical issues."
          },
          milestones: [
            %{title: "\"Golden Ticket\" referral UI implemented", status: :done},
            %{title: "Blockchain-based reward system deployed", status: :pending},
            %{title: "Tiered reward system launched", status: :pending},
            %{title: "Referral program soft-launched to top users", status: :pending}
          ]
        },
        %{
          key: :conduct_market_research_germany,
          name: "Conduct market research for expansion into Germany",
          space: :marketing_space,
          champion: :paul_young,
          reviewer: :emily_davis,
          contributors: [
            %{person: :paul_young, responsibility: "Market Research Analyst"}
          ],
          goal: :expand_into_new_markets,
          description: "This project is crucial for our expansion into the German market. We'll conduct comprehensive market research, including hiring a local consultant, attending relevant conferences, and conducting focus groups with potential users. The research will cover competitor analysis, local work habits, and cultural preferences. The insights gained will inform our product localization strategy and go-to-market approach for Germany.",
          check_in: %{
            status: "on_track",
            content: "Research is progressing well. We've identified key competitors and potential partners. On track to present findings next week."
          },
          milestones: [
            %{title: "Berlin-based consultant hired", status: :done},
            %{title: "\"Bits & Pretzels\" conference attended", status: :pending},
            %{title: "Focus groups conducted", status: :pending},
            %{title: "Competitor analysis completed", status: :pending}
          ]
        },
        %{
          key: :develop_spanish_localization,
          name: "Develop localization strategy for Spanish-speaking markets",
          space: :marketing_space,
          champion: :rachel_king,
          reviewer: :emily_davis,
          contributors: [
            %{person: :rachel_king, responsibility: "Localization Specialist"}
          ],
          goal: :expand_into_new_markets,
          description: "Let's focus on adapting our product for Spanish-speaking markets. We'll develop culturally relevant features like a 'Siesta-Friendly' scheduling option and a 'Fiesta Mode' UI theme. The project includes localizing product copy and establishing partnerships with local coworking spaces for beta testing. Success will be measured by user adoption and engagement rates in Spanish-speaking regions.",
          check_in: %{
            status: "caution",
            content: "Facing challenges in adapting our UI for cultural preferences. May need to bring in a local UX consultant to assist."
          },
          milestones: [
            %{title: "\"Siesta-Friendly\" feature conceptualized", status: :done},
            %{title: "Product copy localization completed", status: :done},
            %{title: "Madrid coworking space partnerships established", status: :done},
            %{title: "\"Fiesta Mode\" UI theme developed", status: :pending}
          ]
        },
        %{
          key: :develop_collaborative_features,
          name: "Develop and launch new collaborative features",
          space: :product_space,
          champion: :walter_baker,
          reviewer: :frank_miller,
          contributors: [
            %{person: :walter_baker, responsibility: "Senior Developer"}
          ],
          goal: :enhance_product_functionality,
          description: "This project aims to enhance our product's collaborative capabilities. We'll identify and develop the top requested collaborative features, with a focus on real-time document collaboration. The project includes creating detailed wireframes, developing an MVP, and conducting extensive beta testing with power users. Success will be measured by user adoption of new features and improvement in team productivity metrics.",
          check_in: %{
            status: "on_track",
            content: "Beta testing of the real-time document collaboration feature is going well. We're on track for the full release next month."
          },
          milestones: [
            %{title: "Top 3 requested features identified", status: :done},
            %{title: "Wireframes and user flows approved", status: :done},
            %{title: "MVP developed and internally tested", status: :done},
            %{title: "Beta testing completed with power users", status: :pending},
            %{title: "Final iteration completed", status: :pending}
          ]
        },
        %{
          key: :create_process_templates,
          name: "Create templates for common business processes",
          space: :company_space,
          champion: :quinn_walker,
          reviewer: :bob_williams,
          contributors: [
            %{person: :quinn_walker, responsibility: "Operations Manager"}
          ],
          goal: :document_core_business_processes,
          description: "This project focuses on standardizing and documenting core business processes to improve operational efficiency. We'll identify the top 10 most critical processes, create detailed workflow maps, and develop standardized templates. These templates will serve as a company-wide resource, ensuring consistency and facilitating onboarding of new team members. Success will be measured by the number of processes documented and the reduction in time spent on routine tasks.",
          check_in: %{
            status: "on_track",
            content: "Template creation is on schedule. We've completed drafts for 3 out of 5 top processes and are gathering feedback."
          },
          milestones: [
            %{title: "Top 10 critical processes identified", status: :done},
            %{title: "Current workflows for top 5 processes mapped", status: :done},
            %{title: "Template format approved", status: :pending},
            %{title: "First drafts of top 5 templates completed", status: :pending},
            %{title: "All 5 process templates finalized", status: :pending}
          ]
        },
        %{
          key: :hire_ux_designer,
          name: "Hire a Senior UX Designer",
          space: :people_space,
          champion: :karen_martinez,
          reviewer: :liam_harris,
          contributors: [
            %{person: :karen_martinez, responsibility: "HR Manager"}
          ],
          goal: :expand_team_capabilities,
          description: "This project aims to strengthen our product team by hiring a Senior UX Designer. We'll define comprehensive job requirements, conduct a thorough recruitment process, and assess candidates through portfolio reviews and practical design challenges. The new hire will play a crucial role in enhancing our product's user experience and driving user satisfaction. Success will be measured by the successful onboarding of a high-quality candidate who can make immediate contributions to our product development.",
          check_in: %{
            status: "on_track",
            content: "We've narrowed down to 3 top candidates. Design challenge results are due this Friday. On track to make an offer next week."
          },
          milestones: [
            %{title: "Job requirements defined", status: :done},
            %{title: "Job opening posted on key platforms", status: :done},
            %{title: "Initial screening interviews completed", status: :done},
            %{title: "Design challenge assigned to top candidates", status: :pending},
            %{title: "Final interviews conducted", status: :pending}
          ]
        },
        %{
          key: :hire_customer_support,
          name: "Hire a Customer Support Specialist",
          space: :people_space,
          champion: :karen_martinez,
          reviewer: :jack_thomas,
          contributors: [
            %{person: :karen_martinez, responsibility: "HR Manager"}
          ],
          goal: :expand_team_capabilities,
          description: "We need to expand our customer support team by hiring a specialist with both technical knowledge and strong customer service skills. We'll create a comprehensive job description, conduct targeted recruitment, and assess candidates through role-playing exercises. The new hire will play a crucial role in improving customer satisfaction and retention. Success will be measured by the successful onboarding of a candidate who can effectively address complex customer issues and contribute to product improvement based on customer feedback.",
          check_in: %{
            status: "caution",
            content: "Struggling to find candidates with the right mix of technical knowledge and customer service skills. May need to expand our search or consider internal training options."
          },
          milestones: [
            %{title: "Job description created", status: :done},
            %{title: "Posting on customer service job boards", status: :done},
            %{title: "Initial phone screenings conducted", status: :pending},
            %{title: "Role-playing exercises performed", status: :pending},
            %{title: "Top candidate selected and offer extended", status: :pending}
          ]
        },
        %{
          key: :prepare_series_a,
          name: "Prepare pitch deck and financial projections for Series A funding",
          space: :finance_space,
          champion: :martin_smith,
          reviewer: :owner,
          contributors: [
            %{person: :martin_smith, responsibility: "CFO"}
          ],
          goal: :ensure_financial_stability,
          description: "This project is critical for securing our Series A funding. We'll gather key metrics and growth data from all departments to develop a comprehensive financial model with 3-year projections. The project includes creating a compelling narrative and designing an impactful pitch deck. We'll also prepare for investor meetings by rehearsing with mentors and advisors. Success will be measured by securing the desired funding amount and establishing valuable relationships with investors.",
          check_in: %{
            status: "caution",
            content: "Financial model is taking longer than expected due to complexities in our expansion plans. May need an extra week to finalize projections."
          },
          milestones: [
            %{title: "Key metrics and growth data gathered", status: :done},
            %{title: "Financial model developed", status: :pending},
            %{title: "Pitch deck narrative and design created", status: :pending},
            %{title: "Pitch rehearsed with advisors", status: :pending},
            %{title: "Investor meetings scheduled", status: :pending}
          ]
        }
      ],
      discussions: [
        %{
          key: :welcome_tina_scott,
          space: :company_space,
          author: :karen_martinez,
          title: "🙌 Team Announcement: Welcoming Tina Scott!",
          content: """
          Hey everyone,

          I’m excited to share that we’re continuing to grow our team and have
          an amazing new addition! Please join me in welcoming Tina Scott, who
          will be joining us as our Customer Support Representative.

          Tina brings valuable experience in customer service, having worked in
          fast-paced environments where she’s known for her dedication to
          helping customers and resolving their issues efficiently. She will be
          a key part of our efforts to ensure that we continue to deliver
          top-notch support as we expand and onboard new users.

          Here’s a bit more about Tina:

          **Background**: Tina has previously worked at BrightTech Solutions and
          InnovateCo, where she specialized in building customer relationships
          and improving support processes.

          **Specialty**: Tina is skilled in handling complex customer inquiries
          and is passionate about ensuring customer satisfaction at every step.

          **Fun fact**: Outside of work, Tina enjoys hiking and photography and
          is always on the lookout for great outdoor spots to explore.

          We’re excited to have Tina onboard and confident she will make a
          great impact, especially as we continue to focus on scaling our
          support team and enhancing the user experience.

          Looking forward to seeing the great things we’ll accomplish together!

          Welcome aboard, Tina! 🎉
          """
        },
        %{
          key: :quarterly_company_update,
          space: :company_space,
          author: :bob_williams,
          title: "Quarterly Company Update & 2024 Strategic Focus",
          content: """
          As we wrap up another incredible quarter, I wanted to share some key
          updates and our strategic focus areas for 2024. We've made
          significant progress on our scale-up initiatives, growing from 15 to
          18 employees and increasing our ARR to $1.44M. Our process
          documentation project has reached 60% completion, setting us up for
          more efficient onboarding and operations.

          Looking ahead to 2024, we're focusing on three key areas:

          1. Accelerating our market expansion, particularly in European markets
          2. Strengthening our product capabilities through new collaborative features
          3. Building out our core teams, especially in Product and Customer Support

          Thanks to everyone for your continued dedication and hard work!
          """,
          comments: [
            %{
              author: :martin_smith,
              content: """
              Great update, Bob. The financial metrics are trending positively. Looking forward to discussing the Series A preparation in our next leadership meeting.
              """,
            },
            %{
              author: :karen_martinez,
              content: """
              The new documentation is already making a difference in our onboarding process. I've received positive feedback from our recent hires.
              """
            }
          ]
        }
      ]
    }
  end
end

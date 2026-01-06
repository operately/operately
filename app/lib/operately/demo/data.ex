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
          ],
          tasks: [
            %{
              name: "Review beta feedback themes",
              description: "Summarize the top issues from the real-time collaboration beta and propose next steps.",
              assignee: :walter_baker,
              status: :in_progress,
              due_in_days: 5,
              priority: "high",
              size: "medium",
              comments: [
                %{
                  author: :liam_harris,
                  content: "I've started tagging the feedback. Most of it is about the new notifications UI."
                },
                %{
                  author: :walter_baker,
                  content: "Great, let's sync on this tomorrow."
                }
              ]
            },
            %{
              name: "Finalize collaboration UI specs",
              description: "Lock the UI specs for presence indicators and inline comments.",
              assignee: :liam_harris,
              status: :pending,
              due_in_days: 12,
              priority: "medium",
              size: "small",
              comments: [
                %{
                  author: :frank_miller,
                  content: "Make sure to include the new accessibility requirements we discussed."
                },
                %{
                  author: :liam_harris,
                  content: "Will do. I'm adding a section for that now."
                }
              ]
            },
            %{
              name: "Draft Q2 roadmap narrative",
              description: "Prepare the storyline for the Q2 roadmap review with leadership.",
              assignee: :owner,
              status: :in_progress,
              due_in_days: -3,
              priority: "medium",
              size: "medium",
              comments: [
                %{
                  author: :martin_smith,
                  content: "Do we have the final budget numbers for Q2 yet? I need them for the narrative."
                },
                %{
                  author: :owner,
                  content: "Not yet, Martin is finalizing them this week. Use placeholders for now."
                }
              ]
            },
            %{
              name: "Instrument collaboration usage metrics",
              description: "Add tracking for adoption, engagement, and session duration across collaboration features.",
              assignee: :walter_baker,
              status: :in_progress,
              due_in_days: 6,
              priority: "high",
              size: "medium",
              comments: [
                %{
                  author: :david_brown,
                  content: "Are we tracking session duration per user?"
                },
                %{
                  author: :walter_baker,
                  content: "Yes, and also the number of concurrent editors."
                }
              ]
            },
            %{
              name: "QA pass for real-time sync edge cases",
              description: "Test offline recovery, simultaneous edits, and conflict resolution scenarios.",
              assignee: :walter_baker,
              status: :pending,
              due_in_days: 10,
              priority: "high",
              size: "large",
              comments: []
            },
            %{
              name: "Plan beta onboarding email flow",
              description: "Draft the onboarding sequence for beta invitees and coordinate with support.",
              assignee: :frank_miller,
              status: :pending,
              due_in_days: 8,
              priority: "medium",
              size: "small",
              comments: [
                %{
                  author: :rachel_king,
                  content: "I have some templates from the last launch we can reuse."
                }
              ]
            },
            %{
              name: "Review accessibility pass for new components",
              description: "Validate keyboard navigation, contrast ratios, and ARIA labels for collaboration UI.",
              assignee: :liam_harris,
              status: :pending,
              due_in_days: 14,
              priority: "low",
              size: "small",
              comments: [
                %{
                  author: :grace_wilson,
                  content: "Please ensure we meet WCAG 2.1 AA standards."
                }
              ]
            },
            %{
              name: "Scope permissions control phase 2",
              description: "Define requirements and acceptance criteria for advanced sharing controls.",
              assignee: :frank_miller,
              status: :canceled,
              due_in_days: -2,
              priority: "medium",
              size: "medium",
              comments: [
                %{
                  author: :frank_miller,
                  content: "Canceling this for now as we decided to push it to Q3."
                }
              ]
            },
            %{
              name: "Close out collaboration launch release notes",
              description: "Finalize release notes and coordinate launch messaging with marketing.",
              assignee: :frank_miller,
              status: :done,
              due_in_days: -1,
              priority: "low",
              size: "small",
              comments: [
                %{
                  author: :emily_davis,
                  content: "Looks good! Ready for publication."
                }
              ]
            }
          ]
        },
        %{
          key: :people_space,
          name: "People",
          description: "Hiring, internal operations, and employee experience",
          members: [
            :karen_martinez,
          ],
          tasks: [
            %{
              name: "Update onboarding checklist for new hires",
              description: "Revise the checklist to include security training and product walkthroughs.",
              assignee: :karen_martinez,
              status: :in_progress,
              due_in_days: 6,
              priority: "medium",
              size: "small",
              comments: [
                %{
                  author: :owner,
                  content: "Don't forget to add the new security training module."
                },
                %{
                  author: :karen_martinez,
                  content: "Added. I also updated the links to the handbook."
                }
              ]
            },
            %{
              name: "Schedule Q1 skill-sharing sessions",
              description: "Plan monthly sessions and confirm speakers across departments.",
              assignee: :karen_martinez,
              status: :pending,
              due_in_days: 12,
              priority: "medium",
              size: "small",
              comments: [
                %{
                  author: :walter_baker,
                  content: "I'd love to do a session on Elixir macro debugging."
                },
                %{
                  author: :karen_martinez,
                  content: "That sounds great, Walter! I'll put you down for February."
                }
              ]
            },
            %{
              name: "Prepare performance review guidelines",
              description: "Draft expectations and calibration steps for managers.",
              assignee: :owner,
              status: :in_progress,
              due_in_days: 18,
              priority: "high",
              size: "medium",
              comments: []
            },
            %{
              name: "Coordinate benefits renewal with broker",
              description: "Review plan options and gather feedback from leadership.",
              assignee: :karen_martinez,
              status: :pending,
              due_in_days: 14,
              priority: "high",
              size: "medium",
              comments: [
                %{
                  author: :martin_smith,
                  content: "Let's try to keep the premium increase under 5% this year."
                }
              ]
            },
            %{
              name: "Collect feedback on remote work policy",
              description: "Survey team members and summarize improvement suggestions.",
              assignee: :karen_martinez,
              status: :done,
              due_in_days: -5,
              priority: "low",
              size: "small",
              comments: [
                %{
                  author: :karen_martinez,
                  content: "Survey results are in. Overall sentiment is very positive."
                }
              ]
            },
            %{
              name: "Launch mentorship program pilot",
              description: "Match mentors and mentees and schedule kickoff sessions.",
              assignee: :karen_martinez,
              status: :pending,
              due_in_days: 22,
              priority: "medium",
              size: "large",
              comments: [
                %{
                  author: :frank_miller,
                  content: "Can I sign up as a mentor?"
                },
                %{
                  author: :karen_martinez,
                  content: "Absolutely! We need more senior leaders involved."
                }
              ]
            }
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
          ],
          tasks: [
            %{
              name: "Analyze referral program signups",
              description: "Compare referral signups vs paid channels and summarize insights.",
              assignee: :noah_lewis,
              status: :in_progress,
              due_in_days: 4,
              priority: "high",
              size: "medium",
              comments: [
                %{
                  author: :rachel_king,
                  content: "How are the numbers looking compared to last month?"
                },
                %{
                  author: :noah_lewis,
                  content: "Up by 15%. The new incentives are working."
                }
              ]
            },
            %{
              name: "Design swag for annual conference",
              description: "Create designs for t-shirts, stickers, and booths.",
              assignee: :olivia_hall,
              status: :pending,
              due_in_days: 14,
              priority: "medium",
              size: "small",
              comments: [
                %{
                  author: :emily_davis,
                  content: "Let's stick to the new color palette."
                }
              ]
            },
            %{
              name: "Publish Enterprise research summary",
              description: "Compile the Enterprise research findings into a shareable summary deck.",
              assignee: :paul_young,
              status: :pending,
              due_in_days: 9,
              priority: "medium",
              size: "large",
              comments: []
            },
            %{
              name: "Finalize Q1 campaign calendar",
              description: "Confirm key launch dates, channels, and owners for Q1 campaigns.",
              assignee: :rachel_king,
              status: :done,
              due_in_days: -2,
              priority: "medium",
              size: "small",
              comments: [
                %{
                  author: :noah_lewis,
                  content: "Are we aligning this with the product launch dates?"
                },
                %{
                  author: :rachel_king,
                  content: "Yes, blocked out the weeks of the launch for dedicated promotion."
                }
              ]
            },
            %{
              name: "Draft International market launch messaging",
              description: "Write messaging for landing pages, ads, and onboarding for International markets.",
              assignee: :rachel_king,
              status: :in_progress,
              due_in_days: 7,
              priority: "high",
              size: "medium",
              comments: [
                %{
                  author: :paul_young,
                  content: "Make sure to emphasize our local support availability."
                }
              ]
            },
            %{
              name: "Set up UTM tracking for Enterprise campaign",
              description: "Standardize campaign tags and validate tracking dashboards.",
              assignee: :paul_young,
              status: :in_progress,
              due_in_days: 3,
              priority: "high",
              size: "small",
              comments: [
                %{
                  author: :noah_lewis,
                  content: "Double-check the source parameters for LinkedIn ads."
                }
              ]
            },
            %{
              name: "Publish customer story for collaboration beta",
              description: "Interview a beta customer and publish a short case study.",
              assignee: :emily_davis,
              status: :done,
              due_in_days: -4,
              priority: "medium",
              size: "medium",
              comments: [
                %{
                  author: :olivia_hall,
                  content: "The photos from the on-site visit turned out great."
                }
              ]
            },
            %{
              name: "Refresh paid social creative briefs",
              description: "Update creative briefs for the next sprint of ad testing.",
              assignee: :noah_lewis,
              status: :pending,
              due_in_days: 6,
              priority: "medium",
              size: "small",
              comments: [
                %{
                  author: :olivia_hall,
                  content: "I need these by Friday to start design work."
                }
              ]
            },
            %{
              name: "Compile competitive ad spend estimates",
              description: "Estimate ad budgets for key competitors across channels.",
              assignee: :rachel_king,
              status: :canceled,
              due_in_days: -1,
              priority: "low",
              size: "small",
              comments: [
                %{
                  author: :martin_smith,
                  content: "This data will be useful for the board deck."
                }
              ]
            },
            %{
              name: "Create referral program FAQ page",
              description: "Write answers for reward eligibility, timing, and tiers.",
              assignee: :olivia_hall,
              status: :done,
              due_in_days: -2,
              priority: "low",
              size: "small",
              comments: [
                %{
                  author: :tina_scott,
                  content: "Can we add a section about reward expiration?"
                }
              ]
            },
            %{
              name: "Plan webinar calendar for Q2",
              description: "Select themes, speakers, and dates for the next webinar series.",
              assignee: :owner,
              status: :in_progress,
              due_in_days: 20,
              priority: "medium",
              size: "large",
              comments: []
            },
            %{
              name: "Book influencer partnerships for referral launch",
              description: "Identify partners and draft outreach for referral promotion.",
              assignee: :olivia_hall,
              status: :pending,
              due_in_days: 15,
              priority: "medium",
              size: "medium",
              comments: [
                %{
                  author: :rachel_king,
                  content: "Focus on influencers in the B2B SaaS space."
                }
              ]
            }
          ]
        },
        %{
          key: :finance_space,
          name: "Finance",
          description: "Providing accurate and timely financial info and safeguarding company assets",
          members: [
            :martin_smith,
          ],
          tasks: [
            %{
              name: "Close December month-end books",
              description: "Finalize reconciliations and post adjusting journal entries.",
              assignee: :martin_smith,
              status: :done,
              due_in_days: -3,
              priority: "high",
              size: "medium",
              comments: [
                %{
                  author: :owner,
                  content: "Let me know when the preliminary numbers are ready."
                },
                %{
                  author: :martin_smith,
                  content: "Should be done by EOD tomorrow."
                }
              ]
            },
            %{
              name: "Update cash runway model",
              description: "Refresh projections with latest burn and hiring plans.",
              assignee: :martin_smith,
              status: :in_progress,
              due_in_days: 5,
              priority: "high",
              size: "medium",
              comments: [
                %{
                  author: :david_brown,
                  content: "Does this include the new hires for engineering?"
                },
                %{
                  author: :martin_smith,
                  content: "Yes, factored in 3 new devs starting in Q2."
                }
              ]
            },
            %{
              name: "Review vendor contract renewals",
              description: "Audit renewal dates and flag contracts for renegotiation.",
              assignee: :martin_smith,
              status: :canceled,
              due_in_days: -4,
              priority: "medium",
              size: "small",
              comments: [
                %{
                  author: :grace_wilson,
                  content: "Please check the termination clauses on the software contracts."
                }
              ]
            },
            %{
              name: "Prepare board finance update",
              description: "Draft slides covering cash, ARR, and KPIs for the board pack.",
              assignee: :owner,
              status: :in_progress,
              due_in_days: 12,
              priority: "high",
              size: "medium",
              comments: []
            },
            %{
              name: "Reconcile ARR and churn report",
              description: "Align billing data with revenue recognition for the month.",
              assignee: :martin_smith,
              status: :pending,
              due_in_days: 7,
              priority: "high",
              size: "small",
              comments: [
                %{
                  author: :martin_smith,
                  content: "Found a discrepancy in the Enterprise tier churn calculations. Investigating."
                }
              ]
            },
            %{
              name: "Collect department budget inputs",
              description: "Gather headcount and spend requests for Q2 planning.",
              assignee: :martin_smith,
              status: :pending,
              due_in_days: 15,
              priority: "medium",
              size: "large",
              comments: [
                %{
                  author: :frank_miller,
                  content: "Product team budget submitted."
                },
                %{
                  author: :emily_davis,
                  content: "Marketing budget coming in shortly."
                }
              ]
            }
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
              content: "Market research for Enterprise market is progressing well, but we're facing challenges in adapting our product for International markets. We may need to reassess our timeline.",
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
            %{
              title: "Ideal customer profile created",
              status: :done,
              tasks: [
                %{
                  name: "Interview 5 high-LTV customers",
                  description: "Run qualitative interviews focused on acquisition channels and ad resonance.",
                  assignee: :noah_lewis,
                  status: :done,
                  due_offset_days: -12,
                  priority: "high",
                  size: "medium",
                  comments: [
                    %{
                      author: :noah_lewis,
                      content: "Scheduled 3 interviews so far."
                    }
                  ]
                },
                %{
                  name: "Synthesize ICP attributes",
                  description: "Summarize demographics, pains, and messaging triggers in the ICP doc.",
                  assignee: :emily_davis,
                  status: :done,
                  due_offset_days: -6,
                  priority: "medium",
                  size: "small",
                  comments: [
                    %{
                      author: :emily_davis,
                      content: "Look for commonalities in their tech stack."
                    }
                  ]
                },
                %{
                  name: "Publish ICP doc in resource hub",
                  description: "Upload the finalized ICP and share it with the marketing team.",
                  assignee: :rachel_king,
                  status: :done,
                  due_offset_days: -2,
                  priority: "low",
                  size: "small",
                  comments: []
                }
              ]
            },
            %{
              title: "5 new ad creatives launched",
              status: :done,
              tasks: [
                %{
                  name: "Write creative briefs for key segments",
                  description: "Draft briefs for developer, team lead, and operations personas.",
                  assignee: :rachel_king,
                  status: :done,
                  due_offset_days: -12,
                  priority: "high",
                  size: "medium",
                  comments: [
                    %{
                      author: :rachel_king,
                      content: "Just static images for now."
                    }
                  ]
                },
                %{
                  name: "Design and export ad creatives",
                  description: "Produce final assets and sizes for each channel.",
                  assignee: :olivia_hall,
                  status: :done,
                  due_offset_days: -6,
                  priority: "medium",
                  size: "small",
                  comments: [
                    %{
                      author: :noah_lewis,
                      content: "Please include a variation with the dark theme."
                    }
                  ]
                },
                %{
                  name: "QA campaign setup and tracking",
                  description: "Verify links, UTMs, and creative mapping before launch.",
                  assignee: :emily_davis,
                  status: :done,
                  due_offset_days: -2,
                  priority: "low",
                  size: "small",
                  comments: []
                }
              ]
            },
            %{
              title: "A/B test results analyzed",
              status: :pending,
              tasks: [
                %{
                  name: "Compile performance dashboard",
                  description: "Pull CTR, conversion, and CAC data across variants.",
                  assignee: :noah_lewis,
                  status: :in_progress,
                  due_offset_days: -10,
                  priority: "high",
                  size: "medium",
                  comments: [
                    %{
                      author: :martin_smith,
                      content: "Ensure we're tracking CAC payback period."
                    }
                  ]
                },
                %{
                  name: "Analyze winner and loser creatives",
                  description: "Identify patterns in high-performing visuals and copy.",
                  assignee: :rachel_king,
                  status: :pending,
                  due_offset_days: -5,
                  priority: "medium",
                  size: "small",
                  comments: [
                    %{
                      author: :rachel_king,
                      content: "The 'Team Collaboration' angle seems to be performing best."
                    }
                  ]
                },
                %{
                  name: "Present findings to growth team",
                  description: "Share insights and propose next steps.",
                  assignee: :noah_lewis,
                  status: :pending,
                  due_offset_days: -1,
                  priority: "low",
                  size: "small",
                  comments: []
                }
              ]
            },
            %{
              title: "Next iteration planned",
              status: :pending,
              tasks: [
                %{
                  name: "Brainstorm new creative angles",
                  description: "Ideate new concepts based on test learnings.",
                  assignee: :olivia_hall,
                  status: :in_progress,
                  due_offset_days: -10,
                  priority: "high",
                  size: "medium",
                  comments: [
                    %{
                      author: :olivia_hall,
                      content: "Let's try a video ad next."
                    }
                  ]
                },
                %{
                  name: "Update targeting parameters",
                  description: "Refine audience definitions and exclusions.",
                  assignee: :noah_lewis,
                  status: :pending,
                  due_offset_days: -5,
                  priority: "medium",
                  size: "small",
                  comments: []
                },
                %{
                  name: "Set budget for next sprint",
                  description: "Allocate spend across successful channels.",
                  assignee: :emily_davis,
                  status: :pending,
                  due_offset_days: -1,
                  priority: "low",
                  size: "small",
                  comments: [
                    %{
                      author: :emily_davis,
                      content: "Approved for a 20% budget increase."
                    }
                  ]
                }
              ]
            },

            %{
              title: "1000 click-throughs achieved from Stack Overflow",
              status: :pending,
              tasks: [
                %{
                  name: "Draft Stack Overflow ad copy variants",
                  description: "Write and score copy variants for developer audiences.",
                  assignee: :noah_lewis,
                  status: :in_progress,
                  due_offset_days: -10,
                  priority: "high",
                  size: "medium",
                  comments: [
                    %{
                      author: :noah_lewis,
                      content: "Focusing on the 'Solve complex problems faster' angle."
                    },
                    %{
                      author: :paul_young,
                      content: "Make sure to mention the API integration capabilities."
                    }
                  ]
                },
                %{
                  name: "Target top programming tags",
                  description: "Select tags and audiences for initial campaigns.",
                  assignee: :paul_young,
                  status: :pending,
                  due_offset_days: -5,
                  priority: "medium",
                  size: "small",
                  comments: [
                    %{
                      author: :paul_young,
                      content: "Prioritizing #elixir, #ruby, and #react tags."
                    }
                  ]
                },
                %{
                  name: "Monitor spend and optimize bids",
                  description: "Adjust bids and placements to hit the click-through goal.",
                  assignee: :emily_davis,
                  status: :pending,
                  due_offset_days: -1,
                  priority: "low",
                  size: "small",
                  comments: []
                }
              ]
            }
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
            status: :off_track,
            content: "Referral program UI is complete, but we're facing delays in implementing the reward system. May need an additional week to resolve technical issues."
          },
          milestones: [
            %{
              title: "\"Golden Ticket\" referral UI implemented",
              status: :done,
              tasks: [
                %{
                  name: "Finalize referral entry flow wireframes",
                  description: "Lock the entry flow wireframes and approve interactions.",
                  assignee: :olivia_hall,
                  status: :done,
                  due_offset_days: -12,
                  priority: "high",
                  size: "medium",
                  comments: [
                    %{
                      author: :olivia_hall,
                      content: "Wireframes are attached. Please review the 'Invite Friends' modal."
                    },
                    %{
                      author: :emily_davis,
                      content: "Looks good. The copy on the success state is very clear."
                    }
                  ]
                },
                %{
                  name: "Define reward visuals and microcopy",
                  description: "Prepare the reward visuals and in-product microcopy.",
                  assignee: :rachel_king,
                  status: :done,
                  due_offset_days: -6,
                  priority: "medium",
                  size: "small",
                  comments: [
                    %{
                      author: :rachel_king,
                      content: "Using the gold coin icon for credits."
                    }
                  ]
                },
                %{
                  name: "QA referral CTA placement",
                  description: "Verify CTA placement across onboarding and settings.",
                  assignee: :emily_davis,
                  status: :done,
                  due_offset_days: -2,
                  priority: "low",
                  size: "small",
                  comments: []
                }
              ]
            },
            %{
              title: "Blockchain-based reward system deployed",
              status: :pending,
              tasks: [
                %{
                  name: "Validate wallet provider options",
                  description: "Compare wallet providers for cost, security, and user experience.",
                  assignee: :owner,
                  status: :in_progress,
                  due_offset_days: -10,
                  priority: "high",
                  size: "medium",
                  comments: [
                    %{
                      author: :owner,
                      content: "Metamask seems too complex for our target user."
                    },
                    %{
                      author: :paul_young,
                      content: "Agreed. Let's look at custodial options like Magic or Privy."
                    },
                    %{
                      author: :owner,
                      content: "Good call. Investigating Magic.link pricing."
                    }
                  ]
                },
                %{
                  name: "Implement reward ledger schema",
                  description: "Define data structures for reward credits and redemptions.",
                  assignee: :paul_young,
                  status: :pending,
                  due_offset_days: -5,
                  priority: "medium",
                  size: "small",
                  comments: [
                    %{
                      author: :paul_young,
                      content: "Draft schema is up for review. It handles partial redemptions."
                    }
                  ]
                },
                %{
                  name: "Security review of payout flow",
                  description: "Review payout workflows and document threat mitigations.",
                  assignee: :emily_davis,
                  status: :pending,
                  due_offset_days: -1,
                  priority: "low",
                  size: "small",
                  comments: [
                    %{
                      author: :emily_davis,
                      content: "We need to ensure rate limiting on payout requests."
                    },
                    %{
                      author: :paul_young,
                      content: "Added to the security checklist."
                    }
                  ]
                }
              ]
            },
            %{
              title: "Tiered reward system launched",
              status: :pending,
              tasks: [
                %{
                  name: "Define tier thresholds and perks",
                  description: "Set thresholds, perks, and messaging for each tier.",
                  assignee: :olivia_hall,
                  status: :in_progress,
                  due_offset_days: -10,
                  priority: "high",
                  size: "medium",
                  comments: [
                    %{
                      author: :olivia_hall,
                      content: "Thinking Bronze: 1 referral, Silver: 5, Gold: 10."
                    },
                    %{
                      author: :rachel_king,
                      content: "Maybe start Silver at 3 to make it more attainable?"
                    }
                  ]
                },
                %{
                  name: "Update in-app rewards screen",
                  description: "Add tier indicators and progress tracking to the rewards UI.",
                  assignee: :rachel_king,
                  status: :pending,
                  due_offset_days: -5,
                  priority: "medium",
                  size: "small",
                  comments: [
                    %{
                      author: :rachel_king,
                      content: "Will reuse the progress bar component from onboarding."
                    }
                  ]
                },
                %{
                  name: "Draft FAQ and support macros",
                  description: "Prepare customer support responses for tiered rewards.",
                  assignee: :emily_davis,
                  status: :canceled,
                  due_offset_days: -1,
                  priority: "low",
                  size: "small",
                  comments: []
                }
              ]
            },
            %{
              title: "Referral program soft-launched to top users",
              status: :pending,
              tasks: [
                %{
                  name: "Select pilot cohort list",
                  description: "Identify and confirm the initial group of pilot users.",
                  assignee: :olivia_hall,
                  status: :in_progress,
                  due_offset_days: -10,
                  priority: "high",
                  size: "medium",
                  comments: [
                    %{
                      author: :olivia_hall,
                      content: "Pulling the list of users with NPS > 9."
                    }
                  ]
                },
                %{
                  name: "Schedule launch email sequence",
                  description: "Draft and schedule the launch communications.",
                  assignee: :rachel_king,
                  status: :pending,
                  due_offset_days: -5,
                  priority: "medium",
                  size: "small",
                  comments: [
                    %{
                      author: :rachel_king,
                      content: "Drafting the 'You're Invited' email."
                    },
                    %{
                      author: :olivia_hall,
                      content: "Let's emphasize the exclusivity in the subject line."
                    }
                  ]
                },
                %{
                  name: "Set up feedback survey",
                  description: "Create the survey to capture pilot feedback.",
                  assignee: :paul_young,
                  status: :pending,
                  due_offset_days: -1,
                  priority: "low",
                  size: "small",
                  comments: []
                }
              ]
            }
          ]
        },
        %{
          key: :conduct_market_research_enterprise,
          name: "Conduct market research for expansion into Enterprise",
          space: :marketing_space,
          champion: :paul_young,
          reviewer: :emily_davis,
          contributors: [
            %{person: :paul_young, responsibility: "Market Research Analyst"}
          ],
          goal: :expand_into_new_markets,
          description: "This project is crucial for our expansion into the Enterprise market. We'll conduct comprehensive market research, including hiring a specialist consultant, attending relevant conferences, and conducting focus groups with potential users. The research will cover competitor analysis, local work habits, and cultural preferences. The insights gained will inform our product localization strategy and go-to-market approach for Enterprise.",
          check_in: %{
            status: :on_track,
            content: "Research is progressing well. We've identified key competitors and potential partners. On track to present findings next week."
          },
          milestones: [
            %{
              title: "Specialist consultant hired",
              status: :done,
              tasks: [
                %{
                  name: "Create consultant brief and scope",
                  description: "Draft the objectives and deliverables for the consultant.",
                  assignee: :paul_young,
                  status: :done,
                  due_offset_days: -12,
                  priority: "high",
                  size: "medium",
                  comments: [
                    %{
                      author: :paul_young,
                      content: "Key requirement: Experience with B2B SaaS in DACH region."
                    },
                    %{
                      author: :emily_davis,
                      content: "Make sure to include a clause about non-compete."
                    }
                  ]
                },
                %{
                  name: "Review proposals and shortlist",
                  description: "Evaluate proposals and select the top candidates.",
                  assignee: :rachel_king,
                  status: :done,
                  due_offset_days: -6,
                  priority: "medium",
                  size: "small",
                  comments: [
                    %{
                      author: :rachel_king,
                      content: "We have 3 strong candidates. Scheduling interviews."
                    }
                  ]
                },
                %{
                  name: "Finalize contract and kickoff call",
                  description: "Complete contracting and run the kickoff meeting.",
                  assignee: :emily_davis,
                  status: :done,
                  due_offset_days: -2,
                  priority: "low",
                  size: "small",
                  comments: []
                }
              ]
            },
            %{
              title: "\"Bits & Pretzels\" conference attended",
              status: :pending,
              tasks: [
                %{
                  name: "Prepare conference networking goals",
                  description: "Define target outcomes and meeting priorities.",
                  assignee: :paul_young,
                  status: :in_progress,
                  due_offset_days: -10,
                  priority: "high",
                  size: "medium",
                  comments: [
                    %{
                      author: :paul_young,
                      content: "Aiming for 20 qualified leads."
                    },
                    %{
                      author: :noah_lewis,
                      content: "Focus on meeting decision makers from FinTech."
                    }
                  ]
                },
                %{
                  name: "Compile list of target companies",
                  description: "Identify prospective partners and customers to meet.",
                  assignee: :noah_lewis,
                  status: :pending,
                  due_offset_days: -5,
                  priority: "medium",
                  size: "small",
                  comments: [
                    %{
                      author: :noah_lewis,
                      content: "Added 50 companies to the target list."
                    }
                  ]
                },
                %{
                  name: "Book travel and booth materials",
                  description: "Finalize travel plans and prepare conference assets.",
                  assignee: :emily_davis,
                  status: :pending,
                  due_offset_days: -1,
                  priority: "low",
                  size: "small",
                  comments: []
                }
              ]
            },
            %{
              title: "Focus groups conducted",
              status: :pending,
              tasks: [
                %{
                  name: "Recruit Enterprise participants",
                  description: "Recruit at least 12 participants for the sessions.",
                  assignee: :paul_young,
                  status: :in_progress,
                  due_offset_days: -10,
                  priority: "high",
                  size: "medium",
                  comments: [
                    %{
                      author: :paul_young,
                      content: "Reaching out to our existing waitlist first."
                    },
                    %{
                      author: :rachel_king,
                      content: "Consider offering an Amazon gift card as an incentive."
                    }
                  ]
                },
                %{
                  name: "Draft moderator guide and script",
                  description: "Prepare discussion prompts and session flow.",
                  assignee: :rachel_king,
                  status: :pending,
                  due_offset_days: -5,
                  priority: "medium",
                  size: "small",
                  comments: [
                    %{
                      author: :rachel_king,
                      content: "Focusing on the procurement process pain points."
                    }
                  ]
                },
                %{
                  name: "Synthesize session notes",
                  description: "Compile observations and summarize findings.",
                  assignee: :emily_davis,
                  status: :pending,
                  due_offset_days: -1,
                  priority: "low",
                  size: "small",
                  comments: []
                }
              ]
            },
            %{
              title: "Competitor analysis completed",
              status: :pending,
              tasks: [
                %{
                  name: "Build competitor feature matrix",
                  description: "Document feature sets and gaps across competitors.",
                  assignee: :paul_young,
                  status: :in_progress,
                  due_offset_days: -10,
                  priority: "high",
                  size: "medium",
                  comments: [
                    %{
                      author: :paul_young,
                      content: "Comparing us against Asana, Jira, and Monday."
                    },
                    %{
                      author: :emily_davis,
                      content: "Don't forget to include ClickUp."
                    }
                  ]
                },
                %{
                  name: "Estimate pricing and packaging ranges",
                  description: "Summarize pricing ranges and plan tiers.",
                  assignee: :emily_davis,
                  status: :pending,
                  due_offset_days: -5,
                  priority: "medium",
                  size: "small",
                  comments: [
                    %{
                      author: :emily_davis,
                      content: "Looking at per-seat vs flat-rate models."
                    }
                  ]
                },
                %{
                  name: "Summarize differentiation opportunities",
                  description: "Identify positioning and feature opportunities.",
                  assignee: :rachel_king,
                  status: :pending,
                  due_offset_days: -1,
                  priority: "low",
                  size: "small",
                  comments: []
                }
              ]
            }
          ]
        },
        %{
          key: :develop_international_expansion,
          name: "Develop localization strategy for International markets",
          space: :marketing_space,
          champion: :rachel_king,
          reviewer: :emily_davis,
          contributors: [
            %{person: :rachel_king, responsibility: "Localization Specialist"}
          ],
          goal: :expand_into_new_markets,
          description: "Let's focus on adapting our product for International markets. We'll develop culturally relevant features like a 'Timezone-Smart' scheduling option and a 'Cultural-Theme' UI theme. The project includes localizing product copy and establishing partnerships with local coworking spaces for beta testing. Success will be measured by user adoption and engagement rates in International regions.",
          check_in: %{
            status: :caution,
            content: "Facing challenges in adapting our UI for cultural preferences. May need to bring in a local UX consultant to assist."
          },
          milestones: [
            %{
              title: "\"Timezone-Smart\" feature conceptualized",
              status: :done,
              tasks: [
                %{
                  name: "Interview International users",
                  description: "Run interviews to capture local scheduling needs.",
                  assignee: :rachel_king,
                  status: :done,
                  due_offset_days: -12,
                  priority: "high",
                  size: "medium",
                  comments: [
                    %{
                      author: :rachel_king,
                      content: "Spoke with users in Tokyo and London. The overlap window is the main pain point."
                    },
                    %{
                      author: :emily_davis,
                      content: "Did they mention mobile usage patterns?"
                    }
                  ]
                },
                %{
                  name: "Document feature concept brief",
                  description: "Write the concept brief and success criteria.",
                  assignee: :emily_davis,
                  status: :done,
                  due_offset_days: -6,
                  priority: "medium",
                  size: "small",
                  comments: [
                    %{
                      author: :emily_davis,
                      content: "Brief is ready. I've included the 'Async First' principle."
                    }
                  ]
                },
                %{
                  name: "Review concept with product",
                  description: "Align the concept with product and design teams.",
                  assignee: :olivia_hall,
                  status: :done,
                  due_offset_days: -2,
                  priority: "low",
                  size: "small",
                  comments: []
                }
              ]
            },
            %{
              title: "Product copy localization completed",
              status: :done,
              tasks: [
                %{
                  name: "Translate core onboarding flows",
                  description: "Localize onboarding content and key product screens.",
                  assignee: :rachel_king,
                  status: :done,
                  due_offset_days: -12,
                  priority: "high",
                  size: "medium",
                  comments: [
                    %{
                      author: :rachel_king,
                      content: "Starting with French and German."
                    },
                    %{
                      author: :emily_davis,
                      content: "Please check the length constraints for German strings."
                    }
                  ]
                },
                %{
                  name: "Review tone and cultural nuances",
                  description: "Ensure language matches regional norms.",
                  assignee: :emily_davis,
                  status: :done,
                  due_offset_days: -6,
                  priority: "medium",
                  size: "small",
                  comments: [
                    %{
                      author: :emily_davis,
                      content: "The tone in Japan should be more formal than in the US."
                    }
                  ]
                },
                %{
                  name: "Proofread final copy set",
                  description: "Proofread the final copy before implementation.",
                  assignee: :olivia_hall,
                  status: :done,
                  due_offset_days: -2,
                  priority: "low",
                  size: "small",
                  comments: []
                }
              ]
            },
            %{
              title: "Global coworking space partnerships established",
              status: :done,
              tasks: [
                %{
                  name: "Identify coworking partners",
                  description: "Create a shortlist of potential partner spaces.",
                  assignee: :paul_young,
                  status: :done,
                  due_offset_days: -12,
                  priority: "high",
                  size: "medium",
                  comments: [
                    %{
                      author: :paul_young,
                      content: "Shortlisted WeWork and Impact Hub."
                    },
                    %{
                      author: :rachel_king,
                      content: "Also look at local independent spaces."
                    }
                  ]
                },
                %{
                  name: "Draft partnership outreach email",
                  description: "Write outreach messaging and benefits overview.",
                  assignee: :rachel_king,
                  status: :done,
                  due_offset_days: -6,
                  priority: "medium",
                  size: "small",
                  comments: [
                    %{
                      author: :rachel_king,
                      content: "Emphasizing the community benefits."
                    }
                  ]
                },
                %{
                  name: "Secure pilot agreements",
                  description: "Confirm pilot terms with at least two partners.",
                  assignee: :emily_davis,
                  status: :done,
                  due_offset_days: -2,
                  priority: "low",
                  size: "small",
                  comments: []
                }
              ]
            },
            %{
              title: "\"Cultural-Theme\" UI theme developed",
              status: :pending,
              tasks: [
                %{
                  name: "Gather visual inspiration references",
                  description: "Collect references for color, typography, and imagery.",
                  assignee: :rachel_king,
                  status: :in_progress,
                  due_offset_days: -10,
                  priority: "high",
                  size: "medium",
                  comments: [
                    %{
                      author: :rachel_king,
                      content: "Created a moodboard on Pinterest."
                    },
                    %{
                      author: :olivia_hall,
                      content: "Love the Nordic minimalism direction."
                    }
                  ]
                },
                %{
                  name: "Design theme palette and tokens",
                  description: "Define theme colors and UI tokens for implementation.",
                  assignee: :olivia_hall,
                  status: :pending,
                  due_offset_days: -5,
                  priority: "medium",
                  size: "small",
                  comments: [
                    %{
                      author: :olivia_hall,
                      content: "Testing accessibility contrast ratios."
                    }
                  ]
                },
                %{
                  name: "Prototype themed landing page",
                  description: "Build a prototype to validate the theme in context.",
                  assignee: :emily_davis,
                  status: :pending,
                  due_offset_days: -1,
                  priority: "low",
                  size: "small",
                  comments: []
                }
              ]
            }
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
            status: :on_track,
            content: "Beta testing of the real-time document collaboration feature is going well. We're on track for the full release next month."
          },
          milestones: [
            %{
              title: "Top 3 requested features identified",
              status: :done,
              tasks: [
                %{
                  name: "Analyze top 50 feature requests",
                  description: "Review request data and cluster by theme.",
                  assignee: :walter_baker,
                  status: :done,
                  due_offset_days: -12,
                  priority: "high",
                  size: "medium",
                  comments: [
                    %{
                      author: :walter_baker,
                      content: "Real-time editing is by far the most requested feature."
                    },
                    %{
                      author: :frank_miller,
                      content: "Are we seeing this across all plans or just Enterprise?"
                    }
                  ]
                },
                %{
                  name: "Rank requests by usage impact",
                  description: "Score requests by frequency and impact.",
                  assignee: :frank_miller,
                  status: :done,
                  due_offset_days: -6,
                  priority: "medium",
                  size: "small",
                  comments: [
                    %{
                      author: :frank_miller,
                      content: "Weighting 'time saved' heavily in the impact score."
                    }
                  ]
                },
                %{
                  name: "Share findings in roadmap review",
                  description: "Present findings to leadership and capture decisions.",
                  assignee: :liam_harris,
                  status: :done,
                  due_offset_days: -2,
                  priority: "low",
                  size: "small",
                  comments: []
                }
              ]
            },
            %{
              title: "Wireframes and user flows approved",
              status: :done,
              tasks: [
                %{
                  name: "Create wireframes for comments flow",
                  description: "Draft wireframes for inline comments and mentions.",
                  assignee: :liam_harris,
                  status: :done,
                  due_offset_days: -12,
                  priority: "high",
                  size: "medium",
                  comments: [
                    %{
                      author: :liam_harris,
                      content: "Here are the flows for resolving comments."
                    },
                    %{
                      author: :walter_baker,
                      content: "We need a way to filter resolved comments."
                    }
                  ]
                },
                %{
                  name: "Review flows with design and eng",
                  description: "Walk through flows and capture feedback.",
                  assignee: :frank_miller,
                  status: :done,
                  due_offset_days: -6,
                  priority: "medium",
                  size: "small",
                  comments: [
                    %{
                      author: :frank_miller,
                      content: "Engineering is concerned about the realtime sync latency."
                    }
                  ]
                },
                %{
                  name: "Incorporate leadership feedback",
                  description: "Apply feedback and finalize approvals.",
                  assignee: :walter_baker,
                  status: :done,
                  due_offset_days: -2,
                  priority: "low",
                  size: "small",
                  comments: []
                }
              ]
            },
            %{
              title: "MVP developed and internally tested",
              status: :done,
              tasks: [
                %{
                  name: "Implement realtime presence indicator",
                  description: "Add presence indicators to collaborative sessions.",
                  assignee: :walter_baker,
                  status: :done,
                  due_offset_days: -12,
                  priority: "high",
                  size: "medium",
                  comments: [
                    %{
                      author: :walter_baker,
                      content: "Using Phoenix Presence for this."
                    },
                    %{
                      author: :frank_miller,
                      content: "Make sure to handle the disconnect state gracefully."
                    }
                  ]
                },
                %{
                  name: "Build collaborative editing MVP",
                  description: "Deliver the core real-time editing experience.",
                  assignee: :walter_baker,
                  status: :done,
                  due_offset_days: -6,
                  priority: "medium",
                  size: "small",
                  comments: [
                    %{
                      author: :walter_baker,
                      content: "Basic OT algorithm is implemented."
                    }
                  ]
                },
                %{
                  name: "Run internal QA regression suite",
                  description: "Test collaboration features across edge cases.",
                  assignee: :frank_miller,
                  status: :done,
                  due_offset_days: -2,
                  priority: "low",
                  size: "small",
                  comments: []
                }
              ]
            },
            %{
              title: "Beta testing completed with power users",
              status: :pending,
              tasks: [
                %{
                  name: "Recruit power users for beta",
                  description: "Invite targeted power users into the beta program.",
                  assignee: :frank_miller,
                  status: :in_progress,
                  due_offset_days: -10,
                  priority: "high",
                  size: "medium",
                  comments: [
                    %{
                      author: :frank_miller,
                      content: "Invited 10 power users from the customer advisory board."
                    },
                    %{
                      author: :liam_harris,
                      content: "Let's make sure they sign the NDA."
                    }
                  ]
                },
                %{
                  name: "Collect structured beta feedback",
                  description: "Run surveys and interviews to capture feedback.",
                  assignee: :walter_baker,
                  status: :pending,
                  due_offset_days: -5,
                  priority: "medium",
                  size: "small",
                  comments: [
                    %{
                      author: :walter_baker,
                      content: "Feedback form is live."
                    }
                  ]
                },
                %{
                  name: "Summarize bug list and wins",
                  description: "Compile issues and positive feedback themes.",
                  assignee: :liam_harris,
                  status: :pending,
                  due_offset_days: -1,
                  priority: "low",
                  size: "small",
                  comments: []
                }
              ]
            },
            %{
              title: "Final iteration completed",
              status: :pending,
              tasks: [
                %{
                  name: "Address top beta issues",
                  description: "Fix priority issues identified during beta.",
                  assignee: :walter_baker,
                  status: :in_progress,
                  due_offset_days: -10,
                  priority: "high",
                  size: "medium",
                  comments: [
                    %{
                      author: :walter_baker,
                      content: "Fixing the cursor jump issue."
                    },
                    %{
                      author: :frank_miller,
                      content: "This is a blocker for launch."
                    }
                  ]
                },
                %{
                  name: "Finalize docs and release notes",
                  description: "Update documentation and prepare release notes.",
                  assignee: :frank_miller,
                  status: :pending,
                  due_offset_days: -5,
                  priority: "medium",
                  size: "small",
                  comments: [
                    %{
                      author: :frank_miller,
                      content: "Drafting the help center article."
                    }
                  ]
                },
                %{
                  name: "Prepare rollout checklist",
                  description: "List rollout steps and owners for launch.",
                  assignee: :liam_harris,
                  status: :canceled,
                  due_offset_days: -1,
                  priority: "low",
                  size: "small",
                  comments: []
                }
              ]
            }
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
            status: :on_track,
            content: "Template creation is on schedule. We've completed drafts for 3 out of 5 top processes and are gathering feedback."
          },
          milestones: [
            %{
              title: "Top 10 critical processes identified",
              status: :done,
              tasks: [
                %{
                  name: "Audit current SOP library",
                  description: "Review existing SOPs and identify gaps.",
                  assignee: :quinn_walker,
                  status: :done,
                  due_offset_days: -12,
                  priority: "high",
                  size: "medium"
                },
                %{
                  name: "Interview leads for critical processes",
                  description: "Collect input from team leads on key processes.",
                  assignee: :quinn_walker,
                  status: :done,
                  due_offset_days: -6,
                  priority: "medium",
                  size: "small"
                },
                %{
                  name: "Publish prioritized process list",
                  description: "Share the prioritized list with leadership.",
                  assignee: :bob_williams,
                  status: :done,
                  due_offset_days: -2,
                  priority: "low",
                  size: "small"
                }
              ]
            },
            %{
              title: "Current workflows for top 5 processes mapped",
              status: :done,
              tasks: [
                %{
                  name: "Facilitate mapping workshops",
                  description: "Run workshops to map current workflows.",
                  assignee: :quinn_walker,
                  status: :done,
                  due_offset_days: -12,
                  priority: "high",
                  size: "medium"
                },
                %{
                  name: "Document current-state swimlanes",
                  description: "Create swimlane diagrams for each workflow.",
                  assignee: :quinn_walker,
                  status: :done,
                  due_offset_days: -6,
                  priority: "medium",
                  size: "small"
                },
                %{
                  name: "Validate workflows with teams",
                  description: "Review workflows with stakeholders for accuracy.",
                  assignee: :bob_williams,
                  status: :done,
                  due_offset_days: -2,
                  priority: "low",
                  size: "small"
                }
              ]
            },
            %{
              title: "Template format approved",
              status: :pending,
              tasks: [
                %{
                  name: "Draft template outline with examples",
                  description: "Create a template outline and sample sections.",
                  assignee: :quinn_walker,
                  status: :in_progress,
                  due_offset_days: -10,
                  priority: "high",
                  size: "medium"
                },
                %{
                  name: "Collect feedback from department heads",
                  description: "Review the template with department heads.",
                  assignee: :bob_williams,
                  status: :pending,
                  due_offset_days: -5,
                  priority: "medium",
                  size: "small"
                },
                %{
                  name: "Finalize layout and headings",
                  description: "Confirm the final layout and section headings.",
                  assignee: :quinn_walker,
                  status: :pending,
                  due_offset_days: -1,
                  priority: "low",
                  size: "small"
                }
              ]
            },
            %{
              title: "First drafts of top 5 templates completed",
              status: :pending,
              tasks: [
                %{
                  name: "Draft onboarding template",
                  description: "Create the onboarding process template.",
                  assignee: :quinn_walker,
                  status: :in_progress,
                  due_offset_days: -10,
                  priority: "high",
                  size: "medium"
                },
                %{
                  name: "Draft customer escalation template",
                  description: "Document escalation steps and owner roles.",
                  assignee: :quinn_walker,
                  status: :pending,
                  due_offset_days: -5,
                  priority: "medium",
                  size: "small"
                },
                %{
                  name: "Draft quarterly planning template",
                  description: "Create the template for quarterly planning.",
                  assignee: :bob_williams,
                  status: :pending,
                  due_offset_days: -1,
                  priority: "low",
                  size: "small"
                }
              ]
            },
            %{
              title: "All 5 process templates finalized",
              status: :pending,
              tasks: [
                %{
                  name: "Run final review meeting",
                  description: "Review drafts and finalize changes.",
                  assignee: :quinn_walker,
                  status: :in_progress,
                  due_offset_days: -10,
                  priority: "high",
                  size: "medium"
                },
                %{
                  name: "Publish templates to resource hub",
                  description: "Upload templates and set permissions.",
                  assignee: :bob_williams,
                  status: :pending,
                  due_offset_days: -5,
                  priority: "medium",
                  size: "small"
                },
                %{
                  name: "Announce rollout in company update",
                  description: "Communicate rollout and adoption expectations.",
                  assignee: :bob_williams,
                  status: :pending,
                  due_offset_days: -1,
                  priority: "low",
                  size: "small"
                }
              ]
            }
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
            status: :on_track,
            content: "We've narrowed down to 3 top candidates. Design challenge results are due this Friday. On track to make an offer next week."
          },
          milestones: [
            %{
              title: "Job requirements defined",
              status: :done,
              tasks: [
                %{
                  name: "Define UX role responsibilities",
                  description: "Document core responsibilities and expectations.",
                  assignee: :karen_martinez,
                  status: :done,
                  due_offset_days: -12,
                  priority: "high",
                  size: "medium"
                },
                %{
                  name: "Align comp band with finance",
                  description: "Confirm compensation band and leveling.",
                  assignee: :karen_martinez,
                  status: :done,
                  due_offset_days: -6,
                  priority: "medium",
                  size: "small"
                },
                %{
                  name: "Create portfolio evaluation rubric",
                  description: "Set criteria for assessing portfolios.",
                  assignee: :liam_harris,
                  status: :done,
                  due_offset_days: -2,
                  priority: "low",
                  size: "small"
                }
              ]
            },
            %{
              title: "Job opening posted on key platforms",
              status: :done,
              tasks: [
                %{
                  name: "Publish job on LinkedIn",
                  description: "Post the role and confirm visibility.",
                  assignee: :karen_martinez,
                  status: :done,
                  due_offset_days: -12,
                  priority: "high",
                  size: "medium"
                },
                %{
                  name: "Share opening with design networks",
                  description: "Share the opening in community channels.",
                  assignee: :liam_harris,
                  status: :done,
                  due_offset_days: -6,
                  priority: "medium",
                  size: "small"
                },
                %{
                  name: "Set up applicant tracking pipeline",
                  description: "Configure stages, tags, and notifications.",
                  assignee: :karen_martinez,
                  status: :done,
                  due_offset_days: -2,
                  priority: "low",
                  size: "small"
                }
              ]
            },
            %{
              title: "Initial screening interviews completed",
              status: :done,
              tasks: [
                %{
                  name: "Review top resumes",
                  description: "Screen the top applicants for initial calls.",
                  assignee: :karen_martinez,
                  status: :done,
                  due_offset_days: -12,
                  priority: "high",
                  size: "medium"
                },
                %{
                  name: "Conduct first-round calls",
                  description: "Run structured screening interviews.",
                  assignee: :karen_martinez,
                  status: :done,
                  due_offset_days: -6,
                  priority: "medium",
                  size: "small"
                },
                %{
                  name: "Summarize candidate scorecards",
                  description: "Collect feedback and summarize scorecards.",
                  assignee: :liam_harris,
                  status: :done,
                  due_offset_days: -2,
                  priority: "low",
                  size: "small"
                }
              ]
            },
            %{
              title: "Design challenge assigned to top candidates",
              status: :pending,
              tasks: [
                %{
                  name: "Finalize design challenge prompt",
                  description: "Write the prompt and confirm evaluation goals.",
                  assignee: :liam_harris,
                  status: :in_progress,
                  due_offset_days: -10,
                  priority: "high",
                  size: "medium"
                },
                %{
                  name: "Schedule challenge walkthroughs",
                  description: "Coordinate walkthrough calls with candidates.",
                  assignee: :karen_martinez,
                  status: :pending,
                  due_offset_days: -5,
                  priority: "medium",
                  size: "small"
                },
                %{
                  name: "Set evaluation rubric for challenge",
                  description: "Define scoring criteria and reviewers.",
                  assignee: :liam_harris,
                  status: :pending,
                  due_offset_days: -1,
                  priority: "low",
                  size: "small"
                }
              ]
            },
            %{
              title: "Final interviews conducted",
              status: :pending,
              tasks: [
                %{
                  name: "Book panel interview slots",
                  description: "Schedule final interviews with the panel.",
                  assignee: :karen_martinez,
                  status: :in_progress,
                  due_offset_days: -10,
                  priority: "high",
                  size: "medium"
                },
                %{
                  name: "Collect final feedback notes",
                  description: "Gather and summarize feedback from interviewers.",
                  assignee: :liam_harris,
                  status: :pending,
                  due_offset_days: -5,
                  priority: "medium",
                  size: "small"
                },
                %{
                  name: "Prepare offer approval packet",
                  description: "Compile approvals and compensation details.",
                  assignee: :karen_martinez,
                  status: :pending,
                  due_offset_days: -1,
                  priority: "low",
                  size: "small"
                }
              ]
            }
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
            status: :caution,
            content: "Struggling to find candidates with the right mix of technical knowledge and customer service skills. May need to expand our search or consider internal training options."
          },
          milestones: [
            %{
              title: "Job description created",
              status: :done,
              tasks: [
                %{
                  name: "Draft support role responsibilities",
                  description: "Define daily responsibilities and success metrics.",
                  assignee: :karen_martinez,
                  status: :done,
                  due_offset_days: -12,
                  priority: "high",
                  size: "medium"
                },
                %{
                  name: "Define technical skill requirements",
                  description: "Outline required tools knowledge and troubleshooting skills.",
                  assignee: :jack_thomas,
                  status: :done,
                  due_offset_days: -6,
                  priority: "medium",
                  size: "small"
                },
                %{
                  name: "Review JD with support lead",
                  description: "Validate the job description with support leadership.",
                  assignee: :jack_thomas,
                  status: :done,
                  due_offset_days: -2,
                  priority: "low",
                  size: "small"
                }
              ]
            },
            %{
              title: "Posting on customer service job boards",
              status: :done,
              tasks: [
                %{
                  name: "Publish on Support Driven",
                  description: "Post the role and confirm it is live.",
                  assignee: :karen_martinez,
                  status: :done,
                  due_offset_days: -12,
                  priority: "high",
                  size: "medium"
                },
                %{
                  name: "Post to RemoteOK and Indeed",
                  description: "Publish the role on two additional boards.",
                  assignee: :karen_martinez,
                  status: :done,
                  due_offset_days: -6,
                  priority: "medium",
                  size: "small"
                },
                %{
                  name: "Update careers page listing",
                  description: "Ensure the careers page reflects the new opening.",
                  assignee: :jack_thomas,
                  status: :done,
                  due_offset_days: -2,
                  priority: "low",
                  size: "small"
                }
              ]
            },
            %{
              title: "Initial phone screenings conducted",
              status: :pending,
              tasks: [
                %{
                  name: "Shortlist applicants",
                  description: "Select candidates for phone screenings.",
                  assignee: :karen_martinez,
                  status: :in_progress,
                  due_offset_days: -10,
                  priority: "high",
                  size: "medium"
                },
                %{
                  name: "Schedule phone screens",
                  description: "Coordinate schedules and send invites.",
                  assignee: :karen_martinez,
                  status: :pending,
                  due_offset_days: -5,
                  priority: "medium",
                  size: "small"
                },
                %{
                  name: "Capture screening notes",
                  description: "Document outcomes and concerns for each candidate.",
                  assignee: :jack_thomas,
                  status: :pending,
                  due_offset_days: -1,
                  priority: "low",
                  size: "small"
                }
              ]
            },
            %{
              title: "Role-playing exercises performed",
              status: :pending,
              tasks: [
                %{
                  name: "Design support scenario script",
                  description: "Create realistic scenarios for role-play exercises.",
                  assignee: :jack_thomas,
                  status: :in_progress,
                  due_offset_days: -10,
                  priority: "high",
                  size: "medium"
                },
                %{
                  name: "Run role-play sessions",
                  description: "Conduct role-play exercises with candidates.",
                  assignee: :jack_thomas,
                  status: :pending,
                  due_offset_days: -5,
                  priority: "medium",
                  size: "small"
                },
                %{
                  name: "Score customer empathy rubric",
                  description: "Evaluate candidates against empathy criteria.",
                  assignee: :jack_thomas,
                  status: :pending,
                  due_offset_days: -1,
                  priority: "low",
                  size: "small"
                }
              ]
            },
            %{
              title: "Top candidate selected and offer extended",
              status: :pending,
              tasks: [
                %{
                  name: "Conduct reference checks",
                  description: "Complete reference checks for the finalist.",
                  assignee: :karen_martinez,
                  status: :in_progress,
                  due_offset_days: -10,
                  priority: "high",
                  size: "medium"
                },
                %{
                  name: "Draft offer letter",
                  description: "Prepare the offer letter and compensation details.",
                  assignee: :karen_martinez,
                  status: :pending,
                  due_offset_days: -5,
                  priority: "medium",
                  size: "small"
                },
                %{
                  name: "Align start date with team",
                  description: "Confirm start date and onboarding plan.",
                  assignee: :jack_thomas,
                  status: :pending,
                  due_offset_days: -1,
                  priority: "low",
                  size: "small"
                }
              ]
            }
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
            status: :caution,
            content: "Financial model is taking longer than expected due to complexities in our expansion plans. May need an extra week to finalize projections."
          },
          milestones: [
            %{
              title: "Key metrics and growth data gathered",
              status: :done,
              tasks: [
                %{
                  name: "Collect ARR and churn metrics",
                  description: "Compile ARR, churn, and retention trends.",
                  assignee: :martin_smith,
                  status: :done,
                  due_offset_days: -12,
                  priority: "high",
                  size: "medium"
                },
                %{
                  name: "Gather CAC and LTV analysis",
                  description: "Summarize CAC, LTV, and payback period metrics.",
                  assignee: :martin_smith,
                  status: :done,
                  due_offset_days: -6,
                  priority: "medium",
                  size: "small"
                },
                %{
                  name: "Compile operational KPIs",
                  description: "Aggregate growth, product, and support KPIs.",
                  assignee: :owner,
                  status: :done,
                  due_offset_days: -2,
                  priority: "low",
                  size: "small"
                }
              ]
            },
            %{
              title: "Financial model developed",
              status: :pending,
              tasks: [
                %{
                  name: "Build 3-year revenue model",
                  description: "Model revenue by plan and cohort assumptions.",
                  assignee: :martin_smith,
                  status: :in_progress,
                  due_offset_days: -10,
                  priority: "high",
                  size: "medium"
                },
                %{
                  name: "Add hiring plan assumptions",
                  description: "Incorporate hiring costs and timing.",
                  assignee: :owner,
                  status: :pending,
                  due_offset_days: -5,
                  priority: "medium",
                  size: "small"
                },
                %{
                  name: "Review sensitivity scenarios",
                  description: "Run upside and downside scenarios.",
                  assignee: :martin_smith,
                  status: :pending,
                  due_offset_days: -1,
                  priority: "low",
                  size: "small"
                }
              ]
            },
            %{
              title: "Pitch deck narrative and design created",
              status: :pending,
              tasks: [
                %{
                  name: "Draft deck storyline",
                  description: "Outline the narrative and key proof points.",
                  assignee: :owner,
                  status: :in_progress,
                  due_offset_days: -10,
                  priority: "high",
                  size: "medium"
                },
                %{
                  name: "Create financial slides",
                  description: "Build slides for metrics, model, and runway.",
                  assignee: :martin_smith,
                  status: :pending,
                  due_offset_days: -5,
                  priority: "medium",
                  size: "small"
                },
                %{
                  name: "Review deck with CEO",
                  description: "Run a narrative review with leadership.",
                  assignee: :martin_smith,
                  status: :pending,
                  due_offset_days: -1,
                  priority: "low",
                  size: "small"
                }
              ]
            },
            %{
              title: "Pitch rehearsed with advisors",
              status: :pending,
              tasks: [
                %{
                  name: "Schedule advisor rehearsal session",
                  description: "Coordinate a rehearsal with advisors.",
                  assignee: :martin_smith,
                  status: :in_progress,
                  due_offset_days: -10,
                  priority: "high",
                  size: "medium"
                },
                %{
                  name: "Incorporate feedback into deck",
                  description: "Apply feedback and refine the storyline.",
                  assignee: :owner,
                  status: :pending,
                  due_offset_days: -5,
                  priority: "medium",
                  size: "small"
                },
                %{
                  name: "Refine Q&A responses",
                  description: "Prepare answers to investor questions.",
                  assignee: :owner,
                  status: :pending,
                  due_offset_days: -1,
                  priority: "low",
                  size: "small"
                }
              ]
            },
            %{
              title: "Investor meetings scheduled",
              status: :pending,
              tasks: [
                %{
                  name: "Finalize target investor list",
                  description: "Create the prioritized investor outreach list.",
                  assignee: :owner,
                  status: :in_progress,
                  due_offset_days: -10,
                  priority: "high",
                  size: "medium"
                },
                %{
                  name: "Send intro emails",
                  description: "Send outreach emails and track responses.",
                  assignee: :martin_smith,
                  status: :pending,
                  due_offset_days: -5,
                  priority: "medium",
                  size: "small"
                },
                %{
                  name: "Coordinate calendar availability",
                  description: "Schedule meetings and confirm attendees.",
                  assignee: :martin_smith,
                  status: :pending,
                  due_offset_days: -1,
                  priority: "low",
                  size: "small"
                }
              ]
            }
          ]
        }
      ],
      discussions: [
        %{
          key: :market_expansion_update,
          space: :marketing_space,
          author: :emily_davis,
          title: "Market Expansion Update: Enterprise & International Progress",
          content: """
          Quick update on our market expansion efforts! Our research in Enterprise market is progressing well, with some valuable insights from our specialist consultant. Key findings suggest strong demand for our collaborative features among Enterprise clients.

          For International markets, we're adapting our approach based on recent user feedback. The "Timezone-Smart" scheduling feature concept has received positive initial responses, though we're still working through some UX challenges.

          Next steps:
          - Finalizing Enterprise market entry strategy
          - Recruiting local partners in Global hubs
          - Adapting our UI for International users
          """,
          comments: [
            %{
              author: :paul_young,
              content: "The Enterprise tech community has been very receptive during our initial outreach. We should have our full market analysis ready by next week."
            },
            %{
              author: :rachel_king,
              content: "Working with the product team on the International localization. We might need to bring in a local UX consultant to help with cultural nuances."
            }
          ]
        },
        %{
          key: :learning_development_launch,
          space: :people_space,
          author: :karen_martinez,
          title: "Learning & Development Initiative Launch",
          content: """
          I'm thrilled to announce our new Learning & Development initiative! As part of our goal to expand team capabilities, we're introducing structured development plans and learning resources for all team members.

          Program highlights:
          - Personalized development plans aligned with career goals
          - Monthly skill-sharing sessions led by team members
          - Access to online learning platforms and conference opportunities

          75% of the team has already completed their individual development plans, and we're seeing great engagement with the skill-sharing sessions.
          """,
          comments: [
            %{
              author: :grace_wilson,
              content: "The compliance training modules have been particularly helpful. Looking forward to leading a session on regulatory requirements next month."
            },
            %{
              author: :henry_taylor,
              content: "Great initiative! The engineering team is especially excited about the conference opportunities."
            }
          ]
        },
        %{
          key: :collaborative_features_beta,
          space: :product_space,
          author: :frank_miller,
          title: "New Collaborative Features Beta Launch",
          content: """
          Excited to announce that we're launching the beta of our new collaborative features next week! The development team has done an amazing job implementing real-time document collaboration, and early internal testing shows promising results.

          Key features in this release:

          - Real-time document editing with conflict resolution
          - Enhanced commenting system
          - New permission management controls

          We'll be rolling this out to our power users first for feedback before the full release next month. Special thanks to Walter and the engineering team for their outstanding work on this initiative.
          """,
          comments: [
            %{
              author: :walter_baker,
              content: "Thanks, Frank! The team is ready to support the beta users and gather feedback. We've set up dedicated monitoring for the real-time sync functionality."
            },
            %{
              author: :david_brown,
              content: "This is a game-changer for our product. Looking forward to seeing how our users leverage these new capabilities."
            },
            %{
              author: :olivia_hall,
              content: "Already getting excited messages from some of our power users who heard about the beta. They're eager to try it out!"
            }
          ]
        },
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
      ],
      documents: [
        %{
          key: :product_development_playbook,
          space: :product_space,
          name: "Product Development Playbook",
          content: """
          Our guide to building and shipping features that delight customers while maintaining high quality standards.

          ### Overview

          This playbook outlines our product development methodology, from ideation to launch. It serves as the single source of truth for how we build and ship features.

          ### Core Principles

          - User-First: Every feature starts with user needs
          - Data-Driven: Decisions backed by metrics and user feedback
          - Iterative Development: Build, measure, learn, repeat
          - Quality-Focused: Comprehensive testing at every stage

          ### Development Process

          1) Discovery Phase

          - User research and feedback analysis
          - Market and competitor analysis
          - Technical feasibility assessment

          2) Planning Phase

          - Feature specification
          - Success metrics definition
          - Resource allocation

          3) Development Phase

          - Sprint planning and execution
          - Regular progress updates
          - Quality assurance

          4) Launch Phase

          - Beta testing
          - Documentation
          - Marketing coordination
          - Post-launch monitoring
          """,
          comments: [
            %{
              author: :walter_baker,
              content: """
              The development process section has been incredibly helpful for our new team members. I'd suggest adding a subsection about our code review standards and deployment checklist. Also, could we include more details about our feature flagging strategy? It's become a crucial part of how we safely roll out new features.
              """,
            },
            %{
              author: :mia_clark,
              content: """
              Agreed with Walter about the code review standards. I'd also love to see a section about our technical debt management strategy and how we prioritize it alongside new feature development. The current sprint planning section could use some real-world examples from our recent collaborative features project.
              """,
            }
          ]
        },
        %{
          key: :brand_voice_guidelines,
          space: :product_space,
          name: "Brand Voice Guidelines 2025",
          content: """
          # Brand Voice Guidelines 2025

          ## Core Pillars
          1. **Clarity**: We speak plainly and avoid jargon.
          2. **Empathy**: We understand our users' challenges.
          3. **Optimism**: We focus on solutions and possibilities.

          ## Do's and Don'ts
          - **Do**: Use active voice, simple words, and direct sentences.
          - **Don't**: Use corporate buzzwords, passive voice, or complex sentence structures.

          ## Tone by Context
          - **Marketing**: Inspiring, bold, confident.
          - **Support**: Helpful, patient, clear.
          - **Product**: Functional, concise, guiding.
          """,
          comments: []
        },
        %{
          key: :technical_architecture_overview,
          space: :product_space,
          name: "Technical Architecture Overview",
          content: """
          A comprehensive overview of our system architecture, tech stack, and infrastructure.

          ### System Components

          - Frontend: React/TypeScript
          - Backend: Elixir/Phoenix
          - Database: PostgreSQL
          - Cache Layer: Redis
          - Message Queue: RabbitMQ

          ### Infrastructure

          - Cloud Provider: AWS
          - Deployment: Docker/Kubernetes
          - CI/CD: Semaphore
          - Monitoring: Grafana
          """
        },
        %{
          key: :brand_guidelines,
          space: :marketing_space,
          name: "Brand Guidelines",
          content: """
          Our comprehensive guide to maintaining consistent brand voice and visual identity.

          ### Brand Voice

          - Professional yet approachable
          - Solutions-oriented
          - Empowering
          - Clear and concise

          ### Visual Elements

          - Color palette
          - Typography
          - Logo usage
          - Image style guide

          ### Content Guidelines

          - Writing style
          - Social media tone
          - Email marketing templates
          - Blog post formats
          """,
          comments: [
            %{
              author: :rachel_king,
              content: """
              The updated brand voice guidelines have really improved our content consistency. I've noticed our social media engagement has increased by 23% since we implemented these changes. One thing we should consider adding is guidelines for video content, especially with our upcoming product launch videos.
              """,
            },
            %{
              author: :emily_davis,
              content: """
              Excellent point about video content, Rachel. Let's also add guidelines for webinar presentations and virtual events. @olivia_hall - Could you share some insights about how these guidelines have influenced our product marketing materials for the new collaborative features?
              """,
            }
          ]
        },
        %{
          key: :market_expansion_strategy,
          space: :marketing_space,
          name: "Market Expansion Strategy",
          content: """
          Detailed analysis and strategy for entering new markets.

          ### Target Markets

          Enterprise Market

          - Market size: €2.8B
          - Key competitors
          - Entry barriers
          - Growth potential

          International Market

          - Market size: €1.5B
          - Cultural considerations
          - Localization requirements
          - Partnership opportunities

          ### Go-to-Market Strategy

          - Localization approach
          - Marketing channels
          - Pricing strategy
          - Partnership model
          """
        },
        %{
          key: :employee_handbook,
          space: :people_space,
          name: "Employee Handbook",
          content: """
          A comprehensive guide to company policies, benefits, and culture.

          ### Company Culture

          - Mission and values
          - Work environment
          - Communication guidelines
          - Remote work policy

          ### Benefits & Policies

          - Health insurance
          - Flexible PTO
          - Professional development
          - Parental leave

          ### Career Development

          - Growth framework
          - Performance reviews
          - Mentorship program
          - Learning resources
          """
        },
        %{
          key: :onboarding_process_guide,
          space: :people_space,
          name: "Onboarding Process Guide",
          content: """
          Step-by-step guide for bringing new team members up to speed.

          ### Week 1

          - System access setup
          - Team introductions
          - Tool training
          - Initial assignments

          ### First Month

          - Role-specific training
          - Key stakeholder meetings
          - Project assignments
          - Progress check-ins
          """
        },
        %{
          key: :financial_controls_handbook,
          space: :finance_space,
          name: "Financial Controls Handbook",
          content: """
          Comprehensive guide to financial procedures and controls.

          ### Expense Policies

          - Approval processes
          - Reimbursement procedures
          - Corporate card usage
          - Travel expenses

          ### Revenue Recognition

          - Subscription revenue
          - Contract terms
          - Payment processing
          - Reconciliation procedures

          ### Reporting Procedures

          - Monthly close process
          - Board reporting
          - Audit preparation
          - Compliance requirements
          """
        },
      ]
    }
  end
end

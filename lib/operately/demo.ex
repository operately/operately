defmodule Operately.Demo do
  def run(company_name) do
    Operately.Repo.transaction(fn ->
      rename_others()
      account = find_account()
      company = build_company(account, company_name)
      me = find_me(company, account)

      product_space = add_space(me, "Product", "Build and ship high quality features to our customers", "IconBox", "text-blue-500")
      people_space = add_space(me, "People", "Hiring, internal operations, and employee experience", "IconFriends", "text-yellow-500")
      marketing_space = add_space(me, "Marketing", "Create product awareness and bring leads", "IconSpeakerphone", "text-pink-500")
      legal_space = add_space(me, "Legal", "Taking care of the legal side of things. Clarity, compliance, and confidence", "IconLifebuoy", "text-yellow-500")
      finance = add_space(me, "Finance", "Providing accurate and timely financial info and safeguarding company assets", "IconReportMoney", "text-red-500")

      add_employees(me, company)
      add_goals(me, company, product_space, people_space, marketing_space, legal_space, finance)
      check_in_to_every_goal(me, company)
    end)
  end

  def rename_others do
    import Ecto.Query
    companies = Operately.Repo.all(from c in Operately.Companies.Company)
    companies |> Enum.each(fn c ->
      if String.contains?(c.name, "Acme Inc.") do
        Operately.Companies.update_company(c, %{name: "#{c.short_id}"})
      end
    end)
  end

  def find_account do
    Operately.People.get_account_by_email("igisar@gmail.com")
  end

  def build_company(account, company_name) do
    attrs = %{company_name: company_name, title: "Founder"}
    {:ok, company} = Operately.Operations.CompanyAdding.run(attrs, account)
    company
  end

  def find_me(company, account) do
    person = Operately.People.get_person!(account, company)
    {:ok, person} = Operately.People.update_person(person, %{avatar_url: "https://lh3.googleusercontent.com/a/ACg8ocILTOndcnZ-XIGfLdRiI4i6h2QhDVTtaj9XBh3FD_V94g8wLMo=s96-c"})
    person
  end

  def add_space(me, name, mission, icon, color) do
    {:ok, space} = Operately.Groups.create_group(me, %{
      name: name,
      mission: mission,
      icon: icon,
      color: color,
      company_permissions: 100,
      public_permissions: 0
    })

    space
  end

  def avatar(source) do
    "https://images.unsplash.com/#{source}?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
  end

  def add_employees(me, company) do
    employees = [
      %{name: "Alice Johnson", title: "Chief Executive Officer (CEO)", avatar: avatar("photo-1550525811-e5869dd03032")},
      %{name: "Bob Williams", title: "Chief Operating Officer (COO)", avatar: avatar("photo-1500648767791-00dcc994a43e")},
      %{name: "Catherine Smith", title: "Chief Financial Officer (CFO)", avatar: avatar("photo-1472099645785-5658abf4ff4e")},
      %{name: "David Brown", title: "Chief Technology Officer (CTO)", avatar: avatar("photo-1491528323818-fdd1faba62cc")},
      %{name: "Emily Davis", title: "Chief Marketing Officer (CMO)", avatar: avatar("photo-1438761681033-6461ffad8d80")},
      %{name: "Frank Miller", title: "Chief Product Officer (CPO)", avatar: avatar("photo-1633332755192-727a05c4013d")},
      %{name: "Grace Wilson", title: "Chief Legal Officer (CLO)", avatar: avatar("photo-1494790108377-be9c29b29330")},
      %{name: "Henry Taylor", title: "VP of Engineering", avatar: avatar("photo-1492562080023-ab3db95bfbce")},
      %{name: "Ivy Anderson", title: "VP of Sales", avatar: avatar("photo-1522075469751-3a6694fb2f61")},
      %{name: "Jack Thomas", title: "VP of Customer Success", avatar: avatar("photo-1579038773867-044c48829161")},
      %{name: "Karen Martinez", title: "VP of Human Resources", avatar: avatar("photo-1534528741775-53994a69daeb")},
      %{name: "Liam Harris", title: "VP of Design", avatar: avatar("photo-1489980557514-251d61e3eeb6")},
      %{name: "Mia Clark", title: "Director of Engineering", avatar: avatar("photo-1541823709867-1b206113eafd")},
      %{name: "Noah Lewis", title: "Director of Sales", avatar: avatar("photo-1568602471122-7832951cc4c5")},
      %{name: "Olivia Hall", title: "Director of Product Management", avatar: avatar("photo-1531123897727-8f129e1688ce")},
      %{name: "Paul Young", title: "Director of Business Development", avatar: avatar("photo-1600180758890-6b94519a8ba6")},
      %{name: "Quinn Walker", title: "Director of Operations", avatar: avatar("photo-1584999734482-0361aecad844")},
      %{name: "Rachel King", title: "Director of Marketing", avatar: avatar("photo-1502031882019-24c0bccfffc6")},
      %{name: "Samuel Wright", title: "Director of Finance", avatar: avatar("photo-1702449269565-8bbe32972f65")},
      %{name: "Tina Scott", title: "Director of Customer Support", avatar: avatar("photo-1700248356502-ca48ae3bafd6")},
      %{name: "Walter Baker", title: "Lead Software Engineer", avatar: avatar("photo-1521341957697-b93449760f30")},
      %{name: "Xander Carter", title: "Senior Software Engineer", avatar: avatar("photo-1531265180709-e9b5fb594ca6")},
      # %{name: "Yasmine Phillips", title: "Product Manager", avatar: avatar("")},
      # %{name: "Zachary Perez", title: "Sales Manager", avatar: avatar("")},
      # %{name: "Abigail Rivera", title: "Marketing Manager", avatar: avatar("")},
      # %{name: "Benjamin Roberts", title: "HR Manager", avatar: avatar("")},
      # %{name: "Chloe Mitchell", title: "Operations Manager", avatar: avatar("")},
      # %{name: "Daniel Morgan", title: "Finance Manager", avatar: avatar("")},
      # %{name: "Eleanor Cooper", title: "UX/UI Designer", avatar: avatar("")},
      # %{name: "Felix Jenkins", title: "Data Scientist", avatar: avatar("")},
      # %{name: "Giselle Turner", title: "QA Engineer", avatar: avatar("")},
      # %{name: "Howard Kelly", title: "Business Analyst", avatar: avatar("")},
      # %{name: "Irene Foster", title: "Content Strategist", avatar: avatar("")},
      # %{name: "Jonathan Simmons", title: "DevOps Engineer", avatar: avatar("")},
      # %{name: "Katherine Rogers", title: "Account Executive", avatar: avatar("")},
      # %{name: "Lucas Stewart", title: "IT Support Specialist", avatar: avatar("")},
      # %{name: "Monica Campbell", title: "Executive Assistant", avatar: avatar("")},
      # %{name: "Nate Griffin", title: "Customer Success Manager", avatar: avatar("")},
    ]

    Enum.each(employees, fn attrs ->
      IO.puts("Adding #{attrs.name}")
      email = "#{String.replace(attrs.name, " ", "-")}-#{company.short_id}@acmeinc.com"

      {:ok, invitation} = Operately.Operations.CompanyMemberAdding.run(me, %{
        full_name: attrs.name,
        email: email,
        title: attrs.title,
      })

      person = Operately.Repo.preload(invitation, :member).member
      {:ok, _} = Operately.People.update_person(person, %{avatar_url: attrs.avatar})
    end)
  end

  def add_goals(me, company, product, people, marketing, _legal, _finance) do
    rev = find_person(company, "Emily Davis")

    g1 = add_goal(me, company, "Achieve Product-Market Fit", find_person(company, "Emily Davis"), rev, nil)
    g11 = add_goal(me, product, "Release v1.0 of the Product", find_person(company, "Henry Taylor"), rev, g1)
    _g111 = add_project(me, product, "Onboarding for new users", find_person(company, "Frank Miller"), rev, g11, company)
    _g112 = add_project(me, product, "Thighten the API security", find_person(company, "Olivia Hall"), rev, g11, company)
    _g113 = add_project(me, product, "Improve the performance of the app", find_person(company, "Frank Miller"), rev, g11, company)

    g12 = add_goal(me, marketing, "Launch Marketing Campaign", find_person(company, "Ivy Anderson"), rev, g1)
    _g121 = add_project(me, marketing, "Build and Launch the Website", find_person(company, "Grace Wilson"), rev, g12, company)
    _g122 = add_project(me, marketing, "Launch the Social Media Campaign", find_person(company, "Emily Davis"), rev, g12, company)

    g2 = add_goal(me, company, "Achive", find_person(company, "Bob Williams"), rev, nil)
    _g21 = add_project(me, company, "Do something", me, rev, g2, company)

    g3 = add_goal(me, company, "Build a Strong Team", find_person(company, "Rachel King"), rev, nil)
    g31 = add_goal(me, people, "Recruit Key Talent", find_person(company, "Alice Johnson"), rev, g3)
    _g311 = add_project(me, people, "Hire a Software Engineer", find_person(company, "Emily Davis"), me, g31, company)
    _g312 = add_project(me, people, "Hire a Designer", find_person(company, "Xander Carter"), rev, g31, company)
    _g312 = add_project(me, people, "Hire a Support Specialist", find_person(company, "Tina Scott"), rev, g31, company)

    g32 = add_goal(me, people, "Develop a Strong Company Culture", find_person(company, "Jack Thomas"), rev, g3)
    _g321 = add_project(me, people, "Employee Handbook", find_person(company, "Karen Martinez"), rev, g32, company)
  end

  def add_goal(me, space, name,  owner, reviewer, parent) do
    space = if space.__struct__ == Operately.Groups.Group do
      space
    else
      Operately.Groups.get_group!(space.company_space_id)
    end

    {:ok, goal} = Operately.Operations.GoalCreation.run(me, %{
      space_id: space.id,
      name: name,
      champion_id: owner.id,
      reviewer_id: reviewer.id,
      timeframe: %{
        start_date: ~D[2024-07-01],
        end_date: ~D[2024-09-30],
        type: "quarter"
      },
      targets: [
        %{
          index: 0,
          name: "All the core features are implemented",
          from: 1,
          to: 17,
          unit: "features"
        },
        %{
          index: 1,
          name: "Eliminate all the known bugs and issues before release",
          from: 0,
          to: 60,
          unit: "bugs"
        },
        %{
          index: 2,
          name: "Obtain feedback from at least 100 beta testers",
          from: 0,
          to: 100,
          unit: "testers"
        },
      ],
      parent_goal_id: parent && parent.id,
      anonymous_access_level: 0, 
      company_access_level: 100,
      space_access_level: 100,
    })

    goal
  end

  def find_person(company, name) do
    Operately.People.get_person_by_name!(company, name)
  end

  def add_project(_me, space, name, owner, reviewer, parent, company) do
    space = if space.__struct__ == Operately.Groups.Group do
      space
    else
      Operately.Groups.get_group!(space.company_space_id)
    end

    {:ok, project} = Operately.Operations.ProjectCreation.run(%Operately.Operations.ProjectCreation{
      company_id: space.company_id,
      name: name,
      champion_id: owner.id,
      reviewer_id: reviewer.id,
      creator_id: owner.id,
      creator_role: "contributor",
      creator_is_contributor: true,
      visibility: "everyone",
      group_id: space.id,
      goal_id: parent.id,
      anonymous_access_level: 0, 
      company_access_level: 100,
      space_access_level: 100,
    })

    case name do
      "Do something" ->
        start = "2024-08-10 00:00:00Z"
        deadline= "2024-08-27 00:00:00Z"

        {:ok, _} = Operately.Projects.EditTimelineOperation.run(owner, project, %{
          project_start_date: NaiveDateTime.from_iso8601!(start),
          project_due_date: NaiveDateTime.from_iso8601!(deadline),
          milestone_updates: [],
          new_milestones: [
            %{
              title: "Operately Demo is ready",
              due_time: ~N[2024-08-24 00:00:00],
              description: Operately.Support.RichText.rich_text("Record a demo of Operately"),
              status: :done,
              tasks_kanban_state: %{}
            },
            %{
              title: "Release the demo",
              due_time: ~N[2024-08-24 00:00:00],
              description: Operately.Support.RichText.rich_text("Demo is released"),
              status: :done,
              tasks_kanban_state: %{}
            }
          ]
        })

        desc = Operately.Support.RichText.rich_text("We’re working on getting our story right. It’s about showing why what we’re building matters and why we’re the right people to do it. We’re keeping it clear, simple, and focused on the real value we bring.")

        Operately.Projects.update_project(project, %{
          description: desc
        })

        {:ok, _} = Operately.Projects.update_project(project, %{
          next_check_in_scheduled_at: ~N[2024-08-22 00:00:00]
        })

      "Hire a Software Engineer" ->
        start = "2024-07-01 00:00:00Z"
        deadline= "2024-08-31 00:00:00Z"

        {:ok, _} = Operately.Projects.EditTimelineOperation.run(owner, project, %{
          project_start_date: NaiveDateTime.from_iso8601!(start),
          project_due_date: NaiveDateTime.from_iso8601!(deadline),
          milestone_updates: [],
          new_milestones: [
            %{
              title: "Candidates are selected for the second round",
              due_time: ~N[2024-08-24 00:00:00],
              description: Operately.Support.RichText.rich_text("Select the best candidates for the second round"),
              status: :done,
              tasks_kanban_state: %{}
            },
            %{
              title: "Engineer is hired",
              due_time: ~N[2024-08-24 00:00:00],
              description: Operately.Support.RichText.rich_text("Hire the best candidate"),
              status: :done,
              tasks_kanban_state: %{}
            }
          ]
        })

        desc = Operately.Support.RichText.rich_text("We want to hire a software engineer to enhance Operately's core functionalities, ensuring our product is robust, scalable, and user-friendly. The engineer will play a crucial role in developing new features, optimizing performance, and maintaining the codebase. This addition to our team is essential to accelerate our development process and meet our growing user demands.")
        Operately.Projects.update_project(project, %{
          description: desc
        })

        content = Operately.Support.RichText.rich_text("We have several good candidates in the final step of the selection process.  If everything goes well, we will have a hired engineer by the end of this week.")
        {:ok, _} = Operately.Operations.ProjectCheckIn.run(owner, project.id, "on_track", content)

      _ ->
        start = 10 + :rand.uniform(20)
        finish = 10 + :rand.uniform(20)

        start = "2024-07-#{start} 00:00:00Z"
        deadline= "2024-09-#{finish} 00:00:00Z"

        {:ok, _} = Operately.Projects.EditTimelineOperation.run(owner, project, %{
          project_start_date: NaiveDateTime.from_iso8601!(start),
          project_due_date: NaiveDateTime.from_iso8601!(deadline),
          milestone_updates: [],
          new_milestones: [
            %{
              title: "Kickoff",
              due_time: ~N[2024-08-15 00:00:00],
              description: Operately.Support.RichText.rich_text("The project is kicked off"),
              status: :done,
              tasks_kanban_state: %{}
            },
            %{
              title: "Design",
              due_time: ~N[2024-08-15 00:00:00],
              description: Operately.Support.RichText.rich_text("The project is designed"),
              status: :done,
              tasks_kanban_state: %{}
            },
            %{
              title: "Development",
              due_time: ~N[2024-08-15 00:00:00],
              description: Operately.Support.RichText.rich_text("The project is developed"),
              status: :done,
              tasks_kanban_state: %{}
            },
            %{
              title: "Testing",
              due_time: ~N[2024-08-15 00:00:00],
              description: Operately.Support.RichText.rich_text("The project is tested"),
              status: :done,
              tasks_kanban_state: %{}
            },
            %{
              title: "Launch",
              due_time: ~N[2024-08-15 00:00:00],
              description: Operately.Support.RichText.rich_text("The project is launched"),
              status: :done,
              tasks_kanban_state: %{}
            }
          ]
        })

        Operately.Repo.preload(project, :milestones).milestones |> Enum.take(:rand.uniform(4)) |> Enum.each(fn milestone ->
          {:ok, _} = Operately.Projects.update_milestone(milestone, %{
            status: :done,
            completed_at: NaiveDateTime.utc_now()
          })
        end)
    end

    [
      find_person(company, "Grace Wilson"),
      find_person(company, "Frank Miller"),
      find_person(company, "Olivia Hall"),
      find_person(company, "Mia Clark"),
    ] |> Enum.each(fn p ->
      if p.id != owner.id do
        {:ok, _} = Operately.Operations.ProjectContributorAddition.run(owner, %{
          person_id: p.id,
          project_id: project.id,
          permissions: 100,
          responsibility: "Build and Launch the Website",
          role: :contributor
        })
      end
    end)

    project
  end

  def check_in_to_every_goal(_me, company) do
    import Ecto.Query

    Operately.Repo.all(from g in Operately.Goals.Goal, where: g.company_id == ^company.id, preload: [:targets, :champion])
    |> Enum.each(fn g ->
      n = Enum.map(g.targets, fn t ->
        %{
          "id" => t.id,
          "value" => trunc(t.to/2) + :rand.uniform(trunc(t.to/2))
        }
      end)

      Operately.Operations.GoalCheckIn.run(g.champion, g, Operately.Support.RichText.rich_text("Everything is going as planned! Last week we had a new batch of beta testers and they loved the product! We are now fully focusing on eliminating the leftover bugs"), n)
    end)
  end
end

defmodule Operately.Support.RichText do
  def rich_text(text) do
    %{
      type: :doc,
      content: [
        %{
          type: :paragraph,
          content: [
            %{
              type: :text,
              text: text
            }
          ]
        }
      ]
    }
    |> Jason.encode!() 
    |> Jason.decode!()
  end

  def rich_text(text, :as_string) do
    rich_text(text) |> Jason.encode!()
  end
end


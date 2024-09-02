defmodule Operately.Demo.Goals do
  @moduledoc """
  Create several spaces for the demo.
  """

  import Ecto.Query

  def create_goals_and_projects(context) do 
    context
    |> add_goal(%{
      space: context.company_space,
      name: "Achieve Product-Market Fit",
      champion: find_person(context, "Emily Davis"),
      reviewer: find_person(context, "Frank Miller"),
    })
    |> add_goal(%{
      space: context.product_space,
      name: "Release v1.0 of the Product",
      champion: find_person(context, "Henry Taylor"),
      reviewer: find_person(context, "Emily Davis"),
      parent: find_goal(context, "Achieve Product-Market Fit"),
    })
    |> add_project(%{
      space: context.product_space,
      name: "Onboarding for new users",
      owner: find_person(context, "Frank Miller"),
      reviewer: find_person(context, "Emily Davis"),
      parent: find_goal(context, "Release v1.0 of the Product"),
    })
    |> add_project(%{
      space: context.product_space,
      name: "Thighten the API security",
      owner: find_person(context, "Olivia Hall"),
      reviewer: find_person(context, "Emily Davis"),
      parent: find_goal(context, "Release v1.0 of the Product"),
    })
    |> add_project(%{
      space: context.product_space,
      name: "Improve the performance of the app",
      owner: find_person(context, "Frank Miller"),
      reviewer: find_person(context, "Emily Davis"),
      parent: find_goal(context, "Release v1.0 of the Product"),
    })
    |> add_goal(%{
      space: context.marketing_space,
      name: "Launch Marketing Campaign",
      champion: find_person(context, "Ivy Anderson"),
      reviewer: find_person(context, "Emily Davis"),
    })
    |> add_project(%{
      space: context.marketing_space,
      name: "Build and Launch the Website",
      owner: find_person(context, "Grace Wilson"),
      reviewer: find_person(context, "Emily Davis"),
      parent: find_goal(context, "Launch Marketing Campaign"),
    })
    |> add_project(%{
      space: context.marketing_space,
      name: "Launch the Social Media Campaign",
      owner: find_person(context, "Emily Davis"),
      reviewer: find_person(context, "Emily Davis"),
      parent: find_goal(context, "Launch Marketing Campaign"),
    })
    |> add_goal(%{
      space: context.people_space,
      name: "Build a Strong Team",
      champion: find_person(context, "Rachel King"),
      reviewer: find_person(context, "Emily Davis"),
    })
    |> add_project(%{
      space: context.people_space,
      name: "Hire a Software Engineer",
      owner: find_person(context, "Emily Davis"),
      reviewer: find_person(context, "Emily Davis"),
      parent: find_goal(context, "Build a Strong Team"),
    })
    |> add_project(%{
      space: context.people_space,
      name: "Hire a Designer",
      owner: find_person(context, "Xander Carter"),
      reviewer: find_person(context, "Emily Davis"),
      parent: find_goal(context, "Build a Strong Team"),
    })
    |> add_project(%{
      space: context.people_space,
      name: "Hire a Support Specialist",
      owner: find_person(context, "Tina Scott"),
      reviewer: context.owner,
      parent: find_goal(context, "Build a Strong Team"),
    })
    |> add_goal(%{
      space: context.people_space,
      name: "Develop a Strong Company Culture",
      champion: find_person(context, "Jack Thomas"),
      reviewer: find_person(context, "Emily Davis"),
      parent: find_goal(context, "Build a Strong Team"),
    })
    |> add_project(%{
      space: context.people_space,
      name: "Employee Handbook",
      owner: find_person(context, "Karen Martinez"),
      reviewer: find_person(context, "Emily Davis"),
      parent: find_goal(context, "Develop a Strong Company Culture"),
    })
    |> add_project(%{
      space: context.people_space,
      name: "Employee Handbook",
      owner: find_person(context, "Karen Martinez"),
      reviewer: find_person(context, "Emily Davis"),
      parent: find_goal(context, "Develop a Strong Company Culture"),
    })
  end

  def add_goal(context, attrs) do
    {:ok, _} = Operately.Operations.GoalCreation.run(context.owner, %{
      space_id: attrs.space.id,
      name: attrs.name,
      champion_id: attrs.champion.id,
      reviewer_id: attrs.reviewer.id,
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
      parent_goal_id: attrs[:parent] && attrs.parent.id,
      anonymous_access_level: 0, 
      company_access_level: 100,
      space_access_level: 100,
    })

    context
  end

  def add_project(context, attrs) do
    {:ok, _} = Operately.Operations.ProjectCreation.run(%Operately.Operations.ProjectCreation{
      company_id: attrs.company.id,
      name: attrs.name,
      champion_id: attrs.champion.id,
      reviewer_id: attrs.reviewer.id,
      creator_id: attrs.owner.id,
      creator_role: "contributor",
      creator_is_contributor: true,
      visibility: "everyone",
      group_id: attrs.space.id,
      goal_id: attrs[:parent] && attrs.parent.id,
      anonymous_access_level: 0, 
      company_access_level: 100,
      space_access_level: 100,
    })

    context
  end

  #   [
  #     find_person(company, "Grace Wilson"),
  #     find_person(company, "Frank Miller"),
  #     find_person(company, "Olivia Hall"),
  #     find_person(company, "Mia Clark"),
  #   ] |> Enum.each(fn p ->
  #     if p.id != owner.id do
  #       {:ok, _} = Operately.Operations.ProjectContributorAddition.run(owner, %{
  #         person_id: p.id,
  #         project_id: project.id,
  #         permissions: 100,
  #         responsibility: "Build and Launch the Website",
  #         role: :contributor
  #       })
  #     end
  #   end)

  #   project
  # end

  defp find_person(context, name) do
    Operately.People.get_person_by_name!(context.company, name)
  end

  defp find_goal(context, name) do
    Operately.Repo.one!(from g in Operately.Goals.Goal, where: g.name == ^name and g.company_id == ^context.company.id)
  end

  #   case name do
  #     "Do something" ->
  #       start = "2024-08-10 00:00:00Z"
  #       deadline= "2024-08-27 00:00:00Z"

  #       {:ok, _} = Operately.Projects.EditTimelineOperation.run(owner, project, %{
  #         project_start_date: NaiveDateTime.from_iso8601!(start),
  #         project_due_date: NaiveDateTime.from_iso8601!(deadline),
  #         milestone_updates: [],
  #         new_milestones: [
  #           %{
  #             title: "Operately Demo is ready",
  #             due_time: ~N[2024-08-24 00:00:00],
  #             description: Operately.Support.RichText.rich_text("Record a demo of Operately"),
  #             status: :done,
  #             tasks_kanban_state: %{}
  #           },
  #           %{
  #             title: "Release the demo",
  #             due_time: ~N[2024-08-24 00:00:00],
  #             description: Operately.Support.RichText.rich_text("Demo is released"),
  #             status: :done,
  #             tasks_kanban_state: %{}
  #           }
  #         ]
  #       })

  #       desc = Operately.Support.RichText.rich_text("We’re working on getting our story right. It’s about showing why what we’re building matters and why we’re the right people to do it. We’re keeping it clear, simple, and focused on the real value we bring.")

  #       Operately.Projects.update_project(project, %{
  #         description: desc
  #       })

  #       {:ok, _} = Operately.Projects.update_project(project, %{
  #         next_check_in_scheduled_at: ~N[2024-08-22 00:00:00]
  #       })

  #     "Hire a Software Engineer" ->
  #       start = "2024-07-01 00:00:00Z"
  #       deadline= "2024-08-31 00:00:00Z"

  #       {:ok, _} = Operately.Projects.EditTimelineOperation.run(owner, project, %{
  #         project_start_date: NaiveDateTime.from_iso8601!(start),
  #         project_due_date: NaiveDateTime.from_iso8601!(deadline),
  #         milestone_updates: [],
  #         new_milestones: [
  #           %{
  #             title: "Candidates are selected for the second round",
  #             due_time: ~N[2024-08-24 00:00:00],
  #             description: Operately.Support.RichText.rich_text("Select the best candidates for the second round"),
  #             status: :done,
  #             tasks_kanban_state: %{}
  #           },
  #           %{
  #             title: "Engineer is hired",
  #             due_time: ~N[2024-08-24 00:00:00],
  #             description: Operately.Support.RichText.rich_text("Hire the best candidate"),
  #             status: :done,
  #             tasks_kanban_state: %{}
  #           }
  #         ]
  #       })

  #       desc = Operately.Support.RichText.rich_text("We want to hire a software engineer to enhance Operately's core functionalities, ensuring our product is robust, scalable, and user-friendly. The engineer will play a crucial role in developing new features, optimizing performance, and maintaining the codebase. This addition to our team is essential to accelerate our development process and meet our growing user demands.")
  #       Operately.Projects.update_project(project, %{
  #         description: desc
  #       })

  #       content = Operately.Support.RichText.rich_text("We have several good candidates in the final step of the selection process.  If everything goes well, we will have a hired engineer by the end of this week.")
  #       {:ok, _} = Operately.Operations.ProjectCheckIn.run(owner, project.id, "on_track", content)

  #     _ ->
  #       start = 10 + :rand.uniform(20)
  #       finish = 10 + :rand.uniform(20)

  #       start = "2024-07-#{start} 00:00:00Z"
  #       deadline= "2024-09-#{finish} 00:00:00Z"

  #       {:ok, _} = Operately.Projects.EditTimelineOperation.run(owner, project, %{
  #         project_start_date: NaiveDateTime.from_iso8601!(start),
  #         project_due_date: NaiveDateTime.from_iso8601!(deadline),
  #         milestone_updates: [],
  #         new_milestones: [
  #           %{
  #             title: "Kickoff",
  #             due_time: ~N[2024-08-15 00:00:00],
  #             description: Operately.Support.RichText.rich_text("The project is kicked off"),
  #             status: :done,
  #             tasks_kanban_state: %{}
  #           },
  #           %{
  #             title: "Design",
  #             due_time: ~N[2024-08-15 00:00:00],
  #             description: Operately.Support.RichText.rich_text("The project is designed"),
  #             status: :done,
  #             tasks_kanban_state: %{}
  #           },
  #           %{
  #             title: "Development",
  #             due_time: ~N[2024-08-15 00:00:00],
  #             description: Operately.Support.RichText.rich_text("The project is developed"),
  #             status: :done,
  #             tasks_kanban_state: %{}
  #           },
  #           %{
  #             title: "Testing",
  #             due_time: ~N[2024-08-15 00:00:00],
  #             description: Operately.Support.RichText.rich_text("The project is tested"),
  #             status: :done,
  #             tasks_kanban_state: %{}
  #           },
  #           %{
  #             title: "Launch",
  #             due_time: ~N[2024-08-15 00:00:00],
  #             description: Operately.Support.RichText.rich_text("The project is launched"),
  #             status: :done,
  #             tasks_kanban_state: %{}
  #           }
  #         ]
  #       })

  #       Operately.Repo.preload(project, :milestones).milestones |> Enum.take(:rand.uniform(4)) |> Enum.each(fn milestone ->
  #         {:ok, _} = Operately.Projects.update_milestone(milestone, %{
  #           status: :done,
  #           completed_at: NaiveDateTime.utc_now()
  #         })
  #       end)
  #   end
end

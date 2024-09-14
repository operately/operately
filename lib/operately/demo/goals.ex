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
      check_in: :default,
    })
    |> add_goal(%{
      space: context.product_space,
      name: "Release v1.0 of the Product",
      champion: find_person(context, "Henry Taylor"),
      reviewer: find_person(context, "Emily Davis"),
      parent: find_goal(context, "Achieve Product-Market Fit"),
      check_in: :default,
    })
    |> add_project(%{
      space: context.product_space,
      name: "Onboarding for new users",
      champion: find_person(context, "Frank Miller"),
      reviewer: find_person(context, "Emily Davis"),
      parent: find_goal(context, "Release v1.0 of the Product"),
      check_in: :default,
      milestones: :default,
    })
    |> add_project(%{
      space: context.product_space,
      name: "Thighten the API security",
      champion: find_person(context, "Olivia Hall"),
      reviewer: find_person(context, "Emily Davis"),
      parent: find_goal(context, "Release v1.0 of the Product"),
      check_in: :default,
      milestones: :default,
    })
    |> add_project(%{
      space: context.product_space,
      name: "Self-hosted Installation",
      champion: context.owner,
      reviewer: find_person(context, "Frank Miller"),
      parent: find_goal(context, "Release v1.0 of the Product"),
      check_in: :no_check_in,
      milestones: [
        "A self-hosted installation is available",
        "The installation process is tested on different environments",
        "Documentation is complete",
      ],
      description: rich_text("We want to provide our users with the option to host Operately on their own servers. This will allow them to have full control over their data and infrastructure, and it will also help us reach customers who have strict data privacy requirements."),
    })
    |> add_goal(%{
      space: context.marketing_space,
      name: "Launch Marketing Campaign",
      champion: find_person(context, "Ivy Anderson"),
      reviewer: find_person(context, "Emily Davis"),
      parent: find_goal(context, "Achieve Product-Market Fit"),
      check_in: :default,
    })
    |> add_project(%{
      space: context.marketing_space,
      name: "Build and Launch the Website",
      champion: find_person(context, "Grace Wilson"),
      reviewer: find_person(context, "Emily Davis"),
      parent: find_goal(context, "Launch Marketing Campaign"),
      check_in: :default,
      milestones: :default,
    })
    |> add_project(%{
      space: context.marketing_space,
      name: "Launch the Social Media Campaign",
      champion: find_person(context, "Emily Davis"),
      reviewer: find_person(context, "Emily Davis"),
      parent: find_goal(context, "Launch Marketing Campaign"),
      check_in: :default,
      milestones: :default,
    })
    |> add_goal(%{
      space: context.people_space,
      name: "Build a Strong Team",
      champion: find_person(context, "Rachel King"),
      reviewer: find_person(context, "Emily Davis"),
      check_in: :default,
    })
    |> add_goal(%{
      space: context.people_space,
      name: "Recruit Key Talent",
      champion: find_person(context, "Rachel King"),
      reviewer: find_person(context, "Emily Davis"),
      parent: find_goal(context, "Build a Strong Team"),
      check_in: :default,
    })
    |> add_project(%{
      space: context.people_space,
      name: "Hire a Software Engineer",
      description: rich_text("We want to hire a software engineer to enhance Operately's core functionalities, ensuring our product is robust, scalable, and user-friendly. The engineer will play a crucial role in developing new features, optimizing performance, and maintaining the codebase. This addition to our team is essential to accelerate our development process and meet our growing user demands."),
      champion: find_person(context, "Emily Davis"),
      reviewer: context.owner,
      parent: find_goal(context, "Recruit Key Talent"),
      check_in: %{
        status: "on_track",
        content: rich_text("We have several good candidates in the final step of the selection process. If everything goes well, we will have a hired engineer by the end of this week."),
      },
      milestones: [
        "Candidates are selected for the second round",
        "Engineer is hired"
      ]
    })
    |> add_project(%{
      space: context.people_space,
      name: "Hire a Designer",
      champion: find_person(context, "Jack Thomas"),
      reviewer: find_person(context, "Emily Davis"),
      parent: find_goal(context, "Recruit Key Talent"),
      check_in: :default,
      milestones: :default
    })
    |> add_project(%{
      space: context.people_space,
      name: "Hire a Support Specialist",
      champion: find_person(context, "Tina Scott"),
      reviewer: find_person(context, "Emily Davis"),
      parent: find_goal(context, "Recruit Key Talent"),
      check_in: :default,
      milestones: :default
    })
    |> add_goal(%{
      space: context.people_space,
      name: "Develop a Strong Company Culture",
      champion: find_person(context, "Jack Thomas"),
      reviewer: find_person(context, "Emily Davis"),
      parent: find_goal(context, "Build a Strong Team"),
      check_in: :default,
    })
    |> add_project(%{
      space: context.people_space,
      name: "Employee Handbook",
      champion: find_person(context, "Karen Martinez"),
      reviewer: find_person(context, "Emily Davis"),
      parent: find_goal(context, "Develop a Strong Company Culture"),
      check_in: :default,
      milestones: :default
    })
  end

  def add_goal(context, attrs) do
    {:ok, goal} = Operately.Operations.GoalCreation.run(context.owner, %{
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

    goal = Operately.Repo.preload(goal, [:targets, :champion])

    if attrs.check_in == :default do
      targets = Enum.map(goal.targets, fn t ->
        %{
          "id" => t.id,
          "value" => trunc(t.to/2) + :rand.uniform(trunc(t.to/2))
        }
      end)

      {:ok, _} = Operately.Operations.GoalCheckIn.run(goal.champion, goal, %{
        content: rich_text("Everything is going as planned! Last week we had a new batch of beta testers and they loved the product! We are now fully focusing on eliminating the leftover bugs"),
        target_values: targets,
        subscription_parent_type: :goal_update,
        subscriber_ids: [],
      } )
    end

    context
  end

  def add_project(context, attrs) do
    {:ok, project} = Operately.Operations.ProjectCreation.run(%Operately.Operations.ProjectCreation{
      company_id: context.company.id,
      name: attrs.name,
      champion_id: attrs.champion.id,
      reviewer_id: attrs.reviewer.id,
      creator_id: context.owner.id,
      creator_role: "contributor",
      creator_is_contributor: "yes",
      visibility: "everyone",
      group_id: attrs.space.id,
      goal_id: attrs[:parent] && attrs.parent.id,
      anonymous_access_level: 0,
      company_access_level: 100,
      space_access_level: 100,
    })

    if attrs[:description] do
      {:ok, _} = Operately.Projects.update_project(project, %{
        description: attrs.description
      })
    end

    {:ok, project} = set_project_timeline(attrs.champion, project)
    {:ok, _} = create_project_check_in(attrs.champion, project, attrs.check_in)
    {:ok, _} = create_project_milestones(attrs.champion, project, attrs.milestones)
    {:ok, _} = complete_project_milestones(project)

    context
  end

  def set_project_timeline(champion, project) do
    start = Date.utc_today() |> Date.add(:rand.uniform(20)) |> Date.add(-:rand.uniform(20))
    deadline = start |> Date.add(10 + :rand.uniform(20))

    Operately.Projects.EditTimelineOperation.run(champion, project, %{
      project_start_date: DateTime.new!(start, ~T[00:00:00], "Etc/UTC"),
      project_due_date: DateTime.new!(deadline, ~T[00:00:00], "Etc/UTC"),
      milestone_updates: [],
      new_milestones: []
    })
  end

  def create_project_check_in(_champion, project, :no_check_in) do
    Operately.Projects.update_project(project, %{
      next_check_in_scheduled_at: Date.utc_today() |> Date.add(-1) |> DateTime.new!(~T[00:00:00], "Etc/UTC")
    })
  end

  def create_project_check_in(champion, project, :default) do
    create_project_check_in(champion, project, %{
      status: "on_track",
      content: rich_text("Everything is going as planned! Last week we had a new batch of beta testers and they loved the product! We are now fully focusing on eliminating the leftover bugs"),
    })
  end

  def create_project_check_in(champion, project, attrs) do
    Operately.Operations.ProjectCheckIn.run(champion, project, Map.merge(attrs, %{
      subscription_parent_type: :project_check_in,
      subscriber_ids: []
    }))
  end

  def create_project_milestones(champion, project, :default) do
    create_project_milestones(champion, project, [
      "Kickoff",
      "Design",
      "Development",
      "Testing",
      "Launch"
    ])
  end

  def create_project_milestones(champion, project, milestone_names) do
    {:ok, _} = Operately.Projects.EditTimelineOperation.run(champion, project, %{
      project_start_date: project.started_at,
      project_due_date: project.deadline,
      milestone_updates: [],
      new_milestones: Enum.with_index(milestone_names) |> Enum.map(fn {name, index} ->
        due = Date.add(project.deadline, length(milestone_names) - index - 1)

        %{
          title: name,
          due_time: due |> NaiveDateTime.new!(~T[00:00:00]),
          description: rich_text(""),
          status: :done,
          tasks_kanban_state: %{}
        }
      end)
    })
  end

  def complete_project_milestones(project) do
    milestones = Operately.Repo.preload(project, :milestones).milestones
    completed = Enum.take(milestones, :rand.uniform(length(milestones)))

    completed
    |> Enum.each(fn milestone ->
      {:ok, _} = Operately.Projects.update_milestone(milestone, %{
        status: :done,
        completed_at: NaiveDateTime.utc_now()
      })
    end)

    {:ok, completed}
  end

  def add_project_contributors(context, project, attrs) do
    [
      find_person(context, "Grace Wilson"),
      find_person(context, "Frank Miller"),
      find_person(context, "Olivia Hall"),
      find_person(context, "Mia Clark"),
    ]
    |> Enum.filter(fn p -> p.id != attrs.champion.id end)
    |> Enum.filter(fn p -> p.id != attrs.reviewer.id end)
    |> Enum.each(fn p ->
      {:ok, _} = Operately.Operations.ProjectContributorAddition.run(attrs.champion, %{
        person_id: p.id,
        project_id: project.id,
        permissions: 100,
        responsibility: "Build and Launch the Website",
        role: :contributor
      })
    end)

    context
  end

  defp find_person(context, name) do
    Operately.People.get_person_by_name!(context.company, name)
  end

  defp find_goal(context, name) do
    Operately.Repo.one!(from g in Operately.Goals.Goal, where: g.name == ^name and g.company_id == ^context.company.id)
  end

  defp rich_text(text) do
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
end

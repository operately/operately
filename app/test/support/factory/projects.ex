defmodule Operately.Support.Factory.Projects do
  alias Operately.Repo
  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Support.Factory.Utils
  alias Operately.Support.RichText

  def add_project(ctx, testid, space_name, opts \\ []) do
    creator = Keyword.get(opts, :creator, :creator)
    champion = Keyword.get(opts, :champion, nil)
    reviewer = Keyword.get(opts, :reviewer, nil)
    goal = Keyword.get(opts, :goal, nil)
    company_access_level = Keyword.get(opts, :company_access_level, Binding.edit_access())
    space_access_level = Keyword.get(opts, :space_access_level, Binding.edit_access())

    atts = %{
      name: Keyword.get(opts, :name, Atom.to_string(testid)),
      creator_id: ctx[creator].id,
      company_id: ctx.company.id,
      group_id: ctx[space_name].id,
      company_access_level: company_access_level,
      space_access_level: space_access_level
    }

    project =
      atts
      |> maybe_add_key(:champion_id, champion && ctx[champion].id)
      |> maybe_add_key(:reviewer_id, reviewer && ctx[reviewer].id)
      |> maybe_add_key(:goal_id, goal && ctx[goal].id)
      |> Operately.ProjectsFixtures.project_fixture()
      |> set_timeframe(opts)

    Map.put(ctx, testid, project)
  end

  def add_project_reviewer(ctx, testid, project_name, opts \\ [])

  def add_project_reviewer(ctx, testid, project_name, :as_person) do
    ctx = add_project_reviewer(ctx, testid, project_name)
    person = Repo.preload(ctx[testid], :person).person

    Map.put(ctx, testid, person)
  end

  def add_project_reviewer(ctx, testid, project_name, opts) do
    project = Map.fetch!(ctx, project_name)

    name = Keyword.get(opts, :name, Utils.testid_to_name(testid))
    role = Keyword.get(opts, :role, :reviewer)
    level = Keyword.get(opts, :permissions, :full_access)
    responsibility = Keyword.get(opts, :responsibility, "Project Manager & Developer")

    person =
      Operately.PeopleFixtures.person_fixture_with_account(%{
        company_id: ctx.company.id,
        full_name: name
      })

    reviewer =
      Operately.ProjectsFixtures.contributor_fixture(ctx.creator, %{
        project_id: project.id,
        person_id: person.id,
        permissions: Binding.from_atom(level),
        responsibility: responsibility,
        role: role
      })

    Map.put(ctx, testid, reviewer)
  end

  def add_project_contributor(ctx, testid, project_name, opts \\ [])

  def add_project_contributor(ctx, testid, project_name, :as_person) do
    ctx = add_project_contributor(ctx, testid, project_name)
    person = Repo.preload(ctx[testid], :person).person

    Map.put(ctx, testid, person)
  end

  def add_project_contributor(ctx, testid, project_name, opts) do
    project = Map.fetch!(ctx, project_name)

    name = Keyword.get(opts, :name, Utils.testid_to_name(testid))
    role = Keyword.get(opts, :role, :contributor)
    level = Keyword.get(opts, :permissions, :edit_access)
    responsibility = Keyword.get(opts, :responsibility, "Project Manager & Developer")

    person =
      case Keyword.get(opts, testid) do
        nil ->
          Operately.PeopleFixtures.person_fixture_with_account(%{
            company_id: ctx.company.id,
            full_name: name
          })

        person ->
          person
      end

    contributor =
      Operately.ProjectsFixtures.contributor_fixture(ctx.creator, %{
        project_id: project.id,
        person_id: person.id,
        permissions: Binding.from_atom(level),
        responsibility: responsibility,
        role: role
      })

    Map.put(ctx, testid, contributor)
  end

  def add_project_retrospective(ctx, testid, project_name, author_name) do
    project = Map.fetch!(ctx, project_name)
    author = Map.fetch!(ctx, author_name)

    retrospective =
      Operately.ProjectsFixtures.retrospective_fixture(%{
        project_id: project.id,
        author_id: author.id
      })

    Map.put(ctx, testid, retrospective)
  end

  def add_project_check_in(ctx, testid, project_name, author_name, opts \\ []) do
    project = Map.fetch!(ctx, project_name)
    author = Map.fetch!(ctx, author_name)
    status = Keyword.get(opts, :status, "on_track")

    check_in =
      Operately.ProjectsFixtures.check_in_fixture(%{
        project_id: project.id,
        author_id: author.id,
        status: status
      })

    {:ok, project} = Operately.Projects.update_project(project, %{
      last_check_in_id: check_in.id,
      last_check_in_status: status,
    })

    ctx
    |> Map.put(testid, check_in)
    |> Map.put(project_name, project)
  end

  def add_project_milestone(ctx, testid, project_name, opts \\ []) do
    project = Map.fetch!(ctx, project_name)
    status = Keyword.get(opts, :status, :pending)

    attrs =
      %{
        project_id: project.id,
        title: Keyword.get(opts, :title, "Milestone #{testid}"),
        status: status
      }
      |> maybe_add_key(:deadline_at, Keyword.get(opts, :deadline_at))
      |> maybe_add_key(:timeframe, Keyword.get(opts, :timeframe))


    milestone = Operately.ProjectsFixtures.milestone_fixture(attrs)
    milestone = Repo.preload(milestone, :project)

    Map.put(ctx, testid, milestone)
  end

  def edit_project_company_members_access(ctx, project_name, access_level) do
    project = Map.fetch!(ctx, project_name)

    context = Access.get_context!(project_id: project.id)
    group = Access.get_group!(company_id: project.company_id, tag: :standard)
    binding = Operately.Access.get_binding(group_id: group.id, context_id: context.id)

    {:ok, _} = Operately.Access.update_binding(binding, %{access_level: Binding.from_atom(access_level)})

    ctx
  end

  def edit_project_space_members_access(ctx, project_name, access_level) do
    project = Map.fetch!(ctx, project_name)

    context = Access.get_context!(project_id: project.id)
    group = Access.get_group!(group_id: project.group_id, tag: :standard)
    binding = Operately.Access.get_binding(group_id: group.id, context_id: context.id)

    {:ok, _} = Operately.Access.update_binding(binding, %{access_level: Binding.from_atom(access_level)})

    ctx
  end

  def set_project_next_check_in_date(ctx, project_name, date) do
    project = Map.fetch!(ctx, project_name)

    {:ok, project} =
      Operately.Projects.update_project(project, %{
        next_check_in_scheduled_at: date
      })

    Map.put(ctx, project_name, project)
  end

  def set_project_milestone_deadline(ctx, milestone_name, date) do
    milestone = Map.fetch!(ctx, milestone_name)

    {:ok, milestone} =
      Operately.Projects.update_milestone(milestone, %{
        deadline_at: date
      })

    Map.put(ctx, milestone_name, milestone)
  end

  def close_project(ctx, project_name) do
    project = Map.fetch!(ctx, project_name)

    {:ok, _} =
      Operately.Operations.ProjectClosed.run(ctx.creator, project, %{
        retrospective: RichText.rich_text("some content"),
        content: RichText.rich_text("some content"),
        success_status: "achieved",
        send_to_everyone: true,
        subscription_parent_type: :project_retrospective,
        subscriber_ids: []
      })

    project = Repo.reload(project)
    Map.put(ctx, project_name, project)
  end

  def pause_project(ctx, project_name) do
    project = Map.fetch!(ctx, project_name)

    {:ok, project} = Operately.Operations.ProjectPausing.run(ctx.creator, project)

    Map.put(ctx, project_name, project)
  end

  def close_project_milestone(ctx, milestone_name, creator_name \\ :creator) do
    creator = Map.fetch!(ctx, creator_name)
    milestone = Map.fetch!(ctx, milestone_name)

    {:ok, _} =
      Operately.Comments.create_milestone_comment(
        creator,
        milestone,
        "complete",
        %{
          content: %{"message" => RichText.rich_text("some content")},
          author_id: creator.id,
          entity_id: milestone.id,
          entity_type: :project_milestone
        }
      )

    milestone = Repo.reload(milestone)

    Map.put(ctx, milestone_name, milestone)
  end

  def add_project_discussion(ctx, testid, project_name, opts \\ []) do
    project = Map.fetch!(ctx, project_name)

    title = Keyword.get(opts, :title, "Discussion #{testid}")
    message = RichText.rich_text(Keyword.get(opts, :message, "Hello"))
    author = Keyword.get(opts, :author, ctx.creator)

    alias Operately.Operations.Notifications.SubscriptionList
    alias Operately.Operations.Notifications.Subscription
    alias Operately.Comments.CommentThread
    alias Operately.Activities

    contribs = Operately.Repo.preload(project, contributors: :person).contributors
    subscriber_ids = Enum.map(contribs, & &1.person_id)

    {:ok, res} =
      Ecto.Multi.new()
      |> SubscriptionList.insert(%{send_to_everyone: true, subscription_parent_type: :comment_thread})
      |> Subscription.insert(author, %{content: message, subscriber_ids: subscriber_ids})
      |> Ecto.Multi.insert(:thread, fn changes ->
        CommentThread.changeset(%{
          author_id: author.id,
          parent_id: project.id,
          parent_type: :project,
          message: message,
          title: title,
          has_title: true,
          subscription_list_id: changes.subscription_list.id
        })
      end)
      |> SubscriptionList.update(:thread)
      |> Ecto.Multi.merge(fn changes ->
        Activities.insert_sync(Ecto.Multi.new(), author.id, :project_discussion_submitted, fn _ ->
          %{
            company_id: project.company_id,
            project_id: project.id,
            discussion_id: changes.thread.id,
            title: changes.thread.title
          }
        end, [comment_thread_id: changes.thread.id])
      end)
      |> Operately.Repo.transaction()

    Map.put(ctx, testid, res.thread)
  end

  def add_project_task(ctx, testid, milestone_name, opts \\ []) do
    # To add a task without milestone,
    # set milestone_name to nil and include project_id in opts
    {milestone_id, project_id} =
      if milestone_name do
        m = Map.fetch!(ctx, milestone_name)
        {m.id, m.project_id}
      else
        project_id = Keyword.get(opts, :project_id)
        {nil, project_id}
      end

    attrs = Enum.into(opts, %{
      creator_id: ctx.creator.id,
      milestone_id: milestone_id,
      project_id: project_id,
      name: Keyword.get(opts, :name, "Task #{testid}")
    })

    task = Operately.TasksFixtures.task_fixture(attrs)

    Map.put(ctx, testid, task)
  end

  def add_task_assignee(ctx, testid, task_name, person_name) do
    task = Map.fetch!(ctx, task_name)
    person = Map.fetch!(ctx, person_name)

    assignee = Operately.TasksFixtures.assignee_fixture(%{
      task_id: task.id,
      person_id: person.id
    })

    Map.put(ctx, testid, assignee)
  end

  #
  # Helpers
  #

  defp maybe_add_key(map, key, value) do
    if value do
      Map.put(map, key, value)
    else
      map
    end
  end

  defp set_timeframe(project, opts) do
    if opts[:timeframe] do
      {:ok, project} =
        Operately.Projects.update_project(project, %{
          timeframe: Keyword.get(opts, :timeframe)
        })

      project
    else
      project
    end
  end
end

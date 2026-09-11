defmodule Operately.FeedBenchmark.Seed do
  import Ecto.Query
  alias Operately.{Repo, People, Activities, FeedBenchmark}
  alias Operately.Activities.Activity
  alias Operately.Access.{Binding, Context, Group, GroupMembership}
  alias Operately.Operations

  @timestamp ~N[2026-01-01 12:00:00]

  # Small dimensions are used by sandboxed tests; CLI always uses the full topology.
  def generate(options) do
    options = Map.merge(%{people: 50, spaces: 29, resources: 430}, options)

    {:ok, manifest} =
      Repo.transaction(
        fn ->
          Activities.without_notification_dispatch(fn -> populate(options) end)
        end,
        timeout: 600_000
      )

    manifest
  end

  defp populate(options) do
    IO.puts("Creating benchmark company and #{options.people} people...")
    password = :crypto.strong_rand_bytes(32) |> Base.url_encode64(padding: false)
    {:ok, account} = People.register_account(%{full_name: "Benchmark Owner", email: "owner@feed-benchmark.test", password: password})
    {:ok, company} = Operations.CompanyAdding.run(%{company_name: "Feed Benchmark", title: "Owner"}, account)
    owner = People.get_person_by_email(company, account.email)
    people = create_people(owner, company, options.people)
    [member, restricted | _] = people
    spaces = create_spaces(owner, people, options.spaces)
    restrict_member(company, restricted, spaces)

    IO.puts("Creating #{options.resources} goals/projects with overlapping permissions...")
    resources = create_resources(owner, member, spaces, options.resources)
    create_extra_activities(owner, member, resources)
    create_documents(owner, resources)

    actions = FeedBenchmark.actions()
    templates = Repo.all(from a in Activity, where: a.action in ^actions, order_by: [asc: a.inserted_at, asc: a.id])
    Repo.update_all(Activity, set: [inserted_at: NaiveDateTime.add(@timestamp, -1_000_000), updated_at: @timestamp])
    insert_history(templates, context_order(company, spaces, resources), options.activities)
    counts = counts(member)
    {:ok, _} = Operately.Companies.update_company(company, %{setup_completed: true})

    %{
      "version" => FeedBenchmark.version(),
      "activities" => options.activities,
      "company_id" => company.id,
      "company_name" => company.name,
      "counts" => counts,
      "people" =>
        Map.new([owner: owner, member: member, restricted: restricted], fn {role, p} ->
          {to_string(role), %{"id" => p.id, "email" => p.email}}
        end)
    }
  end

  defp create_people(owner, company, count) do
    for index <- 1..(count - 1) do
      email =
        case index do
          1 -> "member@feed-benchmark.test"
          2 -> "restricted@feed-benchmark.test"
          _ -> "person#{index}@feed-benchmark.test"
        end

      {:ok, changes} = Operations.CompanyMemberAdding.run(owner, company, %{full_name: "Benchmark Person #{index}", email: email, title: "Member"}, true)

      changes.person
    end
  end

  defp create_spaces(owner, people, count) do
    member = hd(people)

    for index <- 1..count do
      {:ok, space} = Operately.Groups.create_group(owner, %{name: "Benchmark Space #{index}", mission: "Synthetic benchmark space", company_permissions: 10, public_permissions: 0})
      others = people |> Enum.drop(2) |> Enum.filter(fn p -> rem(Enum.find_index(people, &(&1.id == p.id)), count) == rem(index, count) end)
      members = if index <= min(11, count), do: [member | others], else: others
      {:ok, _} = Operately.Groups.add_members(owner, space.id, Enum.map(members, &%{id: &1.id, access_level: 70}))
      space
    end
  end

  defp restrict_member(company, person, spaces) do
    standard = Operately.Access.get_group!(company_id: company.id, tag: :standard)
    Repo.delete_all(from m in GroupMembership, where: m.person_id == ^person.id and m.group_id == ^standard.id)
    space_group = Operately.Access.get_group!(group_id: hd(spaces).id, tag: :standard)
    {:ok, _} = Operately.Access.add_to_group(space_group, person_id: person.id)
    personal = Operately.Access.get_group!(person_id: person.id)
    context = Repo.get_by!(Context, company_id: company.id)
    {:ok, _} = Operately.Access.create_binding(%{group_id: personal.id, context_id: context.id, access_level: 10})
  end

  defp create_resources(owner, member, spaces, count) do
    for index <- 0..(count - 1) do
      space = Enum.at(spaces, rem(index, length(spaces)))
      reviewer = if index < div(count * 3, 10) or rem(index, 5) == 0, do: member, else: owner

      if rem(index, 2) == 0 do
        {:ok, goal} =
          Operations.GoalCreation.run(owner, %{
            space_id: space.id,
            name: "Benchmark Goal #{index}",
            champion_id: owner.id,
            reviewer_id: reviewer.id,
            description: rich_text("A synthetic goal with realistic activity content."),
            anonymous_access_level: 0,
            company_access_level: 10,
            space_access_level: 70,
            timeframe: %{
              contextual_start_date: Operately.ContextualDates.ContextualDate.create_day_date(~D[2026-01-01]),
              contextual_end_date: Operately.ContextualDates.ContextualDate.create_day_date(~D[2026-12-31])
            }
          })

        {:goal, goal}
      else
        {:ok, project} =
          Operations.ProjectCreation.run(%Operations.ProjectCreation{
            company_id: owner.company_id,
            group_id: space.id,
            name: "Benchmark Project #{index}",
            creator_id: owner.id,
            creator_role: "contributor",
            champion_id: owner.id,
            reviewer_id: reviewer.id,
            visibility: "everyone",
            description: rich_text("A synthetic project for measuring feed queries."),
            anonymous_access_level: 0,
            company_access_level: 10,
            space_access_level: 70
          })

        {:project, project}
      end
    end
  end

  defp create_extra_activities(owner, member, resources) do
    conn = connection(owner)

    resources
    |> Enum.take(20)
    |> Enum.each(fn
      {:goal, goal} ->
        {:ok, activity} =
          Operations.GoalDiscussionCreation.run(owner, goal, %{
            title: "Benchmark discussion",
            content: rich_text("Discussion for nested activity preloading."),
            subscription_parent_type: :comment_thread,
            subscriber_ids: [],
            send_to_everyone: false
          })

        {:ok, _} = Operations.CommentAdding.run(member, activity.comment_thread, :comment_thread, rich_text("Synthetic discussion reply."))

      {:project, project} ->
        {:ok, %{task: serialized}} =
          OperatelyWeb.Api.Tasks.Create.call(conn, %{
            type: :project,
            id: project.id,
            name: "Benchmark task",
            milestone_id: nil,
            assignee_id: nil,
            description: rich_text("Task for the feed benchmark."),
            due_date: nil
          })

        {:ok, task_id} = OperatelyWeb.Api.Helpers.decode_id(serialized.id)
        {:ok, _} = OperatelyWeb.Api.Tasks.UpdateAssignee.call(conn, %{task_id: task_id, type: :project, assignee_ids: [member.id]})
    end)
  end

  defp create_documents(owner, resources) do
    resources
    |> Enum.take(30)
    |> Enum.with_index()
    |> Enum.each(fn {{type, resource}, index} ->
      hub = Repo.get_by!(Operately.ResourceHubs.ResourceHub, [{if(type == :goal, do: :goal_id, else: :project_id), resource.id}])

      {:ok, document} =
        Operations.ResourceHubDocumentCreating.run(owner, hub, %{
          name: "Benchmark document #{index}",
          content: rich_text("Document content for resource activity filtering."),
          post_as_draft: false,
          send_to_everyone: false,
          subscription_parent_type: :resource_hub_document,
          subscriber_ids: []
        })

      if rem(index, 5) == 0 do
        document.node |> Ecto.Changeset.change(deleted_at: ~U[2026-01-01 12:00:00.000000Z]) |> Repo.update!()
      end
    end)
  end

  defp context_order(company, spaces, resources) do
    contexts = Repo.all(Context)

    parents =
      [{:company_id, company.id}, {:group_id, company.company_space_id}] ++
        Enum.map(spaces, &{:group_id, &1.id}) ++
        Enum.map(resources, fn {type, resource} -> {if(type == :goal, do: :goal_id, else: :project_id), resource.id} end)

    Enum.map(parents, fn {field, id} -> Enum.find(contexts, &(Map.get(&1, field) == id)).id end)
  end

  defp insert_history(templates, context_order, total) do
    existing = Repo.aggregate(Activity, :count)
    if existing >= total, do: raise(ArgumentError, "ACTIVITIES must exceed #{existing} setup activities")
    IO.puts("Inserting #{total - existing} historical activities...")

    history_rows(templates, context_order, total - existing)
    |> Stream.chunk_every(500)
    |> Enum.each(&Repo.insert_all(Activity, &1))
  end

  @doc false
  def history_rows(templates, context_order, count) do
    by_context = Enum.group_by(templates, & &1.access_context_id)

    groups =
      context_order
      |> Enum.filter(&Map.has_key?(by_context, &1))
      |> Enum.map(fn id ->
        Enum.sort_by(by_context[id], &{&1.action, &1.content["email"], &1.content["name"]})
      end)

    {hot, rest} = Enum.split(groups, max(div(length(groups), 5), 1))
    cold = if rest == [], do: hot, else: rest

    1..count
    |> Stream.map(fn index ->
      pool = if rem(index, 10) < 7, do: hot, else: cold
      group = Enum.at(pool, rem(div(index, 10), length(pool)))
      template = Enum.at(group, rem(index, length(group)))
      {:ok, id} = Ecto.UUID.load(:crypto.hash(:md5, "feed-benchmark-#{index}"))
      timestamp = NaiveDateTime.add(@timestamp, -div(index, 3))

      template
      |> Map.take([:author_id, :comment_thread_id, :access_context_id, :action, :content])
      |> Map.merge(%{id: id, inserted_at: timestamp, updated_at: timestamp})
    end)
  end

  def connection(person) do
    %Plug.Conn{assigns: %{current_person: person, current_company: Repo.get!(Operately.Companies.Company, person.company_id)}}
  end

  def counts(person) do
    tables = [activities: Activity, people: People.Person, access_contexts: Context, access_groups: Group, access_group_memberships: GroupMembership, access_bindings: Binding]
    totals = Map.new(tables, fn {name, schema} -> {to_string(name), Repo.aggregate(schema, :count)} end)
    qualified = from b in Binding, join: m in GroupMembership, on: m.group_id == b.group_id, where: m.person_id == ^person.id and b.access_level >= 10

    joined =
      from a in Activity,
        join: b in Binding,
        on: b.context_id == a.access_context_id,
        join: m in GroupMembership,
        on: m.group_id == b.group_id,
        where: m.person_id == ^person.id and b.access_level >= 10

    totals
    |> Map.put("member_bindings", Repo.aggregate(qualified, :count))
    |> Map.put("member_joined_activities", Repo.aggregate(joined, :count))
    |> Map.put("member_memberships", Repo.aggregate(from(m in GroupMembership, where: m.person_id == ^person.id), :count))
  end

  def validate!(manifest) do
    if manifest["version"] != FeedBenchmark.version(), do: raise("Dataset version differs; seed with RESET=true")
    member = Repo.get!(People.Person, manifest["people"]["member"]["id"])
    if counts(member) != manifest["counts"], do: raise("Dataset counts changed; seed with RESET=true")

    Enum.each(manifest["people"], fn {_role, p} ->
      person = People.get_person_by_email(Repo.get!(Operately.Companies.Company, manifest["company_id"]), p["email"])
      if person == nil or person.id != p["id"], do: raise("Dataset identities changed; seed with RESET=true")
    end)

    :ok
  end

  def analyze do
    Enum.each(~w(activities access_contexts access_bindings access_groups access_group_memberships people resource_nodes), fn table ->
      Repo.query!("ANALYZE " <> table)
    end)
  end

  defp rich_text(text), do: Operately.Demo.RichText.from_string(text)
end

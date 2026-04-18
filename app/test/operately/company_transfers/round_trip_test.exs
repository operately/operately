defmodule Operately.CompanyTransfers.RoundTripTest do
  use Operately.DataCase

  alias Operately.Access.{Binding, Context, Group, GroupMembership}
  alias Operately.Companies.Company
  alias Operately.CompanyTransfers.Package.Paths
  alias Operately.Demo
  alias Operately.People.Person
  alias Operately.Projects.Project
  alias Operately.Repo
  alias Operately.RichContent
  alias Operately.Support.CompanyTransfer.Helpers, as: Transfers
  alias Operately.Support.RichText
  alias OperatelyWeb.Api.Helpers

  setup do
    on_exit(fn -> File.rm_rf!(Paths.root()) end)
    {:ok, Factory.setup(%{})}
  end

  test "permissions and deferred references survive a round trip", ctx do
    ctx =
      ctx
      |> Factory.add_company_owner(:owner)
      |> Factory.add_company_admin(:admin)
      |> Factory.add_company_member(:member)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space, creator: :admin)
      |> Factory.add_project_check_in(:check_in, :project, :admin, status: "caution")
      |> Factory.set_person_manager(:member, :admin)
      |> Factory.edit_project_company_members_access(:project, :view_access)
      |> Factory.edit_project_space_members_access(:project, :comment_access)

    round_trip =
      Transfers.round_trip!(ctx.company, ctx.account,
        mutate_package: &Transfers.replace_company_short_id(&1, unique_short_id())
      )

    source_counts = table_row_counts(round_trip.source.package)
    imported_counts = table_row_counts(round_trip.reexported.package)

    assert_counts_doubled(source_counts, imported_counts, [
      "access_contexts",
      "access_groups",
      "access_group_memberships",
      "access_bindings"
    ])

    assert permission_snapshot(round_trip.source.package) == permission_snapshot(round_trip.reexported.package)
    assert company_space_snapshot(round_trip.source.package) == company_space_snapshot(round_trip.reexported.package)
    assert manager_snapshot(round_trip.source.package) == manager_snapshot(round_trip.reexported.package)
    assert project_last_check_in_snapshot(round_trip.source.package) == project_last_check_in_snapshot(round_trip.reexported.package)
  end

  test "rolls the import back when a later foreign key cannot be translated", ctx do
    ctx =
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_company_member(:member)

    before_counts = db_counts()
    invalid_creator_id = Ecto.UUID.generate()

    export = Transfers.export!(ctx.company, ctx.account)

    package =
      export.package
      |> Transfers.replace_company_short_id(unique_short_id())
      |> Transfers.update_row("projects", ctx.project.id, &Map.put(&1, "creator_id", invalid_creator_id))

    assert {:error, %{reason: {:missing_reference_translation, "projects", "creator_id", "people", ^invalid_creator_id}}} =
             Transfers.run_import(package, ctx.account)

    assert Repo.get_by(Company, short_id: get_in(package, ["manifest", "source_company", "short_id"])) == nil
    assert db_counts() == before_counts
  end

  test "re-exported packages keep table counts and core relationships for a rich minimal-slice company", ctx do
    ctx = build_rich_minimal_slice_company(ctx)

    round_trip =
      Transfers.round_trip!(ctx.company, ctx.account,
        mutate_package: &Transfers.replace_company_short_id(&1, unique_short_id())
      )

    assert table_row_counts(round_trip.source.package) == table_row_counts(round_trip.reexported.package)
    assert core_relationship_snapshot(round_trip.source.package) == core_relationship_snapshot(round_trip.reexported.package)

    [source_document] = table_rows(round_trip.source.package, "resource_documents")
    [imported_document] = table_rows(round_trip.reexported.package, "resource_documents")
    imported_member = person_row_by_full_name(round_trip.reexported.package, ctx.member.full_name)

    assert mention_labels(imported_document["content"]) == mention_labels(source_document["content"])
    refute RichContent.find_mentioned_ids(imported_document["content"]) == RichContent.find_mentioned_ids(source_document["content"])

    assert [imported_mention_id] = RichContent.find_mentioned_ids(imported_document["content"])
    assert {:ok, imported_member["id"]} == Helpers.decode_id(imported_mention_id)
  end

  test "imports into a destination with unrelated companies and multiple existing accounts", ctx do
    ctx =
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_company_member(:member)

    destination_ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:existing_match)
      |> Factory.add_company_member(:other_dest_member)
      |> Factory.add_account(:loose_account)

    destination_people_before = Repo.aggregate(Ecto.assoc(destination_ctx.company, :people), :count, :id)

    # Use existing_match's account for reexport since that person will be in the imported company
    reexport_account = Repo.get!(Operately.People.Account, destination_ctx.existing_match.account_id)

    round_trip =
      Transfers.round_trip!(ctx.company, ctx.account,
        import_account: destination_ctx.account,
        reexport_account: reexport_account,
        mutate_package: fn package ->
          package
          |> Transfers.replace_company_short_id(unique_short_id())
          |> Transfers.replace_account_email(ctx.member.account_id, destination_ctx.existing_match.email, destination_ctx.existing_match.full_name)
          |> Transfers.replace_person_email(ctx.member.id, destination_ctx.existing_match.email, destination_ctx.existing_match.full_name)
        end
      )

    imported_person =
      Repo.get_by!(Person,
        company_id: round_trip.imported_company.id,
        email: destination_ctx.existing_match.email
      )

    imported_people =
      from(p in Person, where: p.company_id == ^round_trip.imported_company.id, select: {p.full_name, p.account_id})
      |> Repo.all()
      |> Map.new()

    assert imported_person.account_id == destination_ctx.existing_match.account_id
    assert Repo.aggregate(Ecto.assoc(destination_ctx.company, :people), :count, :id) == destination_people_before
    refute destination_ctx.other_dest_member.account_id in Map.values(imported_people)
    refute destination_ctx.loose_account.id in Map.values(imported_people)
  end

  @tag ownership_timeout: 180_000
  test "a demo-built company can round-trip across the minimal slice", ctx do
    ctx = Factory.add_account(ctx, :demo_account)
    previous_demo_setting = Application.get_env(:operately, :demo_builder_allowed)
    Application.put_env(:operately, :demo_builder_allowed, true)

    on_exit(fn ->
      Application.put_env(:operately, :demo_builder_allowed, previous_demo_setting)
    end)

    {:ok, demo_company} =
      Demo.run(
        ctx.demo_account,
        "Demo #{System.unique_integer([:positive])}",
        "Chief Executive Officer",
        demo_slice_1_data()
      )

    round_trip =
      Transfers.round_trip!(demo_company, ctx.demo_account,
        mutate_package: fn package ->
          package
          |> Transfers.replace_company_short_id(unique_short_id())
          |> refresh_unique_tokens()
        end
      )

    source_counts = table_row_counts(round_trip.source.package)
    imported_counts = table_row_counts(round_trip.reexported.package)

    assert_counts_doubled(source_counts, imported_counts, [
      "people",
      "groups",
      "goals",
      "projects",
      "messages",
      "resource_documents",
      "tasks"
    ])

    assert source_counts == table_row_counts(round_trip.reexported.package)
    assert company_space_snapshot(round_trip.source.package) == company_space_snapshot(round_trip.reexported.package)
    assert manager_snapshot(round_trip.source.package) == manager_snapshot(round_trip.reexported.package)
  end

  defp build_rich_minimal_slice_company(ctx) do
    ctx =
      ctx
      |> Factory.add_company_admin(:admin)
      |> Factory.add_company_member(:manager)
      |> Factory.add_company_member(:member)
      |> Factory.set_person_manager(:member, :manager)
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, champion: :admin, reviewer: :manager)
      |> Factory.add_goal_update(:goal_update, :goal, :admin, status: "caution")
      |> Factory.add_goal_check(:goal_check, :goal, creator: :admin, completed: true)
      |> Factory.add_project(:project, :space, creator: :admin, goal: :goal)
      |> Factory.add_project_check_in(:check_in, :project, :admin, status: "caution")
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)
      |> Factory.add_task_assignee(:task_assignee, :task, :member)
      |> Factory.add_messages_board(:board, :space)
      |> Factory.add_message(:message, :board)
      |> Factory.add_resource_hub(:hub, :space, :admin)

    ctx =
      ctx
      |> Factory.add_document(:document, :hub, author: :admin, content: mention_doc([ctx.member]))
      |> Factory.add_link(:link, :hub, author: :admin)

    Factory.add_subscription(ctx, :subscription, :project, person: ctx.member, type: :mentioned)
  end

  defp db_counts do
    %{
      companies: Repo.aggregate(Company, :count, :id),
      people: Repo.aggregate(Person, :count, :id),
      projects: Repo.aggregate(Project, :count, :id),
      access_contexts: Repo.aggregate(Context, :count, :id),
      access_groups: Repo.aggregate(Group, :count, :id),
      access_group_memberships: Repo.aggregate(GroupMembership, :count, :id),
      access_bindings: Repo.aggregate(Binding, :count, :id)
    }
  end

  defp assert_counts_doubled(source_counts, imported_counts, table_names) do
    Enum.each(table_names, fn table_name ->
      assert source_counts[table_name] > 0
      assert source_counts[table_name] * 2 == source_counts[table_name] + imported_counts[table_name]
    end)
  end

  defp table_row_counts(package) do
    Map.new(package["tables"], &{&1["name"], &1["row_count"]})
  end

  defp core_relationship_snapshot(package) do
    %{
      company_space: company_space_snapshot(package),
      managers: manager_snapshot(package),
      goals: goal_snapshot(package),
      projects: project_last_check_in_snapshot(package),
      task_assignees: task_assignee_snapshot(package)
    }
  end

  defp permission_snapshot(package) do
    %{
      contexts:
        package
        |> table_rows("access_contexts")
        |> Enum.map(fn row -> context_scope(row, package) end)
        |> Enum.sort(),
      groups:
        package
        |> table_rows("access_groups")
        |> Enum.map(fn row -> {group_scope(row, package), row["tag"]} end)
        |> Enum.sort(),
      memberships:
        package
        |> table_rows("access_group_memberships")
        |> Enum.map(fn row ->
          {
            group_scope_for_id(package, row["group_id"]),
            person_name(package, row["person_id"])
          }
        end)
        |> Enum.sort(),
      bindings:
        package
        |> table_rows("access_bindings")
        |> Enum.map(fn row ->
          {
            context_scope_for_id(package, row["context_id"]),
            group_scope_for_id(package, row["group_id"]),
            row["access_level"],
            row["tag"]
          }
        end)
        |> Enum.sort()
    }
  end

  defp company_space_snapshot(package) do
    [company] = table_rows(package, "companies")
    {company["name"], resolve_name(package, "groups", company["company_space_id"])}
  end

  defp manager_snapshot(package) do
    package
    |> table_rows("people")
    |> Enum.map(fn row -> {row["full_name"], person_name(package, row["manager_id"])} end)
    |> Enum.sort()
  end

  defp goal_snapshot(package) do
    package
    |> table_rows("goals")
    |> Enum.map(fn row ->
      {
        row["name"],
        resolve_name(package, "groups", row["group_id"]),
        person_name(package, row["champion_id"]),
        person_name(package, row["reviewer_id"]),
        goal_update_signature(package, row["last_check_in_id"])
      }
    end)
    |> Enum.sort()
  end

  defp project_last_check_in_snapshot(package) do
    package
    |> table_rows("projects")
    |> Enum.map(fn row ->
      {
        row["name"],
        resolve_name(package, "groups", row["group_id"]),
        person_name(package, row["creator_id"]),
        resolve_name(package, "goals", row["goal_id"]),
        check_in_signature(package, row["last_check_in_id"]),
        row["last_check_in_status"]
      }
    end)
    |> Enum.sort()
  end

  defp task_assignee_snapshot(package) do
    tasks_by_id =
      package
      |> table_rows("tasks")
      |> Map.new(&{&1["id"], &1})

    assignees_by_task =
      package
      |> table_rows("task_assignees")
      |> Enum.group_by(& &1["task_id"], &person_name(package, &1["person_id"]))

    tasks_by_id
    |> Enum.map(fn {_id, row} ->
      {
        row["name"],
        resolve_name(package, "projects", row["project_id"]),
        resolve_name(package, "project_milestones", row["milestone_id"]),
        assignees_by_task |> Map.get(row["id"], []) |> Enum.sort()
      }
    end)
    |> Enum.sort()
  end

  defp check_in_signature(_package, nil), do: nil

  defp check_in_signature(package, check_in_id) do
    row = find_row!(package, "project_check_ins", check_in_id)
    {row["status"], person_name(package, row["author_id"]), row["inserted_at"]}
  end

  defp goal_update_signature(_package, nil), do: nil

  defp goal_update_signature(package, update_id) do
    row = find_row!(package, "goal_updates", update_id)
    {row["status"], row["inserted_at"]}
  end

  defp context_scope_for_id(package, context_id) do
    package
    |> find_row!("access_contexts", context_id)
    |> context_scope(package)
  end

  defp context_scope(row, package) do
    cond do
      row["company_id"] -> {:company, resolve_name(package, "companies", row["company_id"])}
      row["group_id"] -> {:group, resolve_name(package, "groups", row["group_id"])}
      row["project_id"] -> {:project, resolve_name(package, "projects", row["project_id"])}
      row["goal_id"] -> {:goal, resolve_name(package, "goals", row["goal_id"])}
      row["resource_hub_id"] -> {:resource_hub, resolve_name(package, "resource_hubs", row["resource_hub_id"])}
      true -> {:unknown, row["id"]}
    end
  end

  defp group_scope_for_id(package, group_id) do
    package
    |> find_row!("access_groups", group_id)
    |> group_scope(package)
  end

  defp group_scope(row, package) do
    cond do
      row["person_id"] -> {:person, person_name(package, row["person_id"])}
      row["company_id"] -> {:company, resolve_name(package, "companies", row["company_id"])}
      row["group_id"] -> {:group, resolve_name(package, "groups", row["group_id"])}
      true -> {:unknown, row["id"]}
    end
  end

  defp person_name(_package, nil), do: nil
  defp person_name(package, person_id), do: resolve_name(package, "people", person_id, "full_name")

  defp resolve_name(package, table_name, row_id, field \\ "name")
  defp resolve_name(_package, _table_name, nil, _field), do: nil

  defp resolve_name(package, table_name, row_id, field) do
    find_row!(package, table_name, row_id)[field]
  end

  defp table_rows(package, table_name) do
    package["tables"]
    |> Enum.find(&(&1["name"] == table_name))
    |> Map.get("rows", [])
  end

  defp person_row_by_full_name(package, full_name) do
    package
    |> table_rows("people")
    |> Enum.find(&(&1["full_name"] == full_name))
    |> case do
      nil -> raise "Person #{inspect(full_name)} not found"
      row -> row
    end
  end

  defp mention_doc(people) do
    RichText.rich_text(mentioned_people: people)
    |> Jason.decode!()
  end

  defp mention_labels(document) do
    document
    |> extract_mention_labels()
    |> Enum.sort()
  end

  defp find_row!(package, table_name, row_id) do
    package
    |> table_rows(table_name)
    |> Enum.find(&(&1["id"] == row_id))
    |> case do
      nil -> raise "Row #{inspect(row_id)} not found in #{table_name}"
      row -> row
    end
  end

  defp extract_mention_labels(value) when is_list(value) do
    Enum.flat_map(value, &extract_mention_labels/1)
  end

  defp extract_mention_labels(%{"type" => "mention", "attrs" => %{"label" => label}}) when is_binary(label) do
    [label]
  end

  defp extract_mention_labels(value) when is_map(value) do
    Enum.flat_map(value, fn {_key, nested_value} -> extract_mention_labels(nested_value) end)
  end

  defp extract_mention_labels(_value), do: []

  defp demo_slice_1_data do
    data = Demo.Data.data()

    people =
      Enum.map(data[:people], fn person ->
        person
        |> Map.delete(:invited)
      end)

    %{data | people: people}
  end

  defp refresh_unique_tokens(package) do
    package
    |> refresh_table_tokens("invite_links")
  end

  defp refresh_table_tokens(package, table_name) do
    Transfers.update_table_rows(package, table_name, fn row ->
      if Map.has_key?(row, "token") do
        Map.put(row, "token", Operately.InviteLinks.InviteLink.build_token())
      else
        row
      end
    end)
  end

  defp unique_short_id do
    4_000_000 + System.unique_integer([:positive])
  end
end

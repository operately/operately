defmodule Operately.Support.Features.CompanyTransfersRoundTripSteps do
  import ExUnit.Assertions
  import Ecto.Query
  import Operately.FeatureSteps

  alias Operately.Activities
  alias Operately.Access.{Binding, Context, Group, GroupMembership}
  alias Operately.Companies.Company
  alias Operately.Demo
  alias Operately.People.Person
  alias Operately.Projects.Project
  alias Operately.Repo
  alias Operately.RichContent
  alias Operately.Support.CompanyTransfer.Helpers, as: Transfers
  alias Operately.Support.Factory
  alias Operately.Support.RichText
  alias OperatelyWeb.Api.Helpers

  step :setup, ctx do
    Factory.setup(ctx)
  end

  step :given_permissions_and_deferred_reference_company, ctx do
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
  end

  step :when_company_round_trips, ctx do
    Map.put(ctx, :round_trip, round_trip_company!(ctx.company, ctx.account))
  end

  step :then_permissions_and_deferred_references_match, ctx do
    source_counts = table_row_counts(ctx.round_trip.source.package)
    imported_counts = table_row_counts(ctx.round_trip.reexported.package)

    assert_counts_doubled(source_counts, imported_counts, [
      "access_contexts",
      "access_groups",
      "access_group_memberships",
      "access_bindings"
    ])

    assert permission_snapshot(ctx.round_trip.source.package) == permission_snapshot(ctx.round_trip.reexported.package)
    assert company_space_snapshot(ctx.round_trip.source.package) == company_space_snapshot(ctx.round_trip.reexported.package)
    assert manager_snapshot(ctx.round_trip.source.package) == manager_snapshot(ctx.round_trip.reexported.package)
    assert project_last_check_in_snapshot(ctx.round_trip.source.package) == project_last_check_in_snapshot(ctx.round_trip.reexported.package)

    ctx
  end

  step :given_project_company_for_failed_import, ctx do
    ctx
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_company_member(:member)
  end

  step :when_import_uses_missing_project_creator, ctx do
    before_counts = db_counts()
    invalid_creator_id = Ecto.UUID.generate()

    export = Transfers.export!(ctx.company, ctx.account)

    package =
      export.package
      |> Transfers.replace_company_short_id(unique_short_id())
      |> Transfers.update_row("projects", ctx.project.id, &Map.put(&1, "creator_id", invalid_creator_id))

    import_result = Transfers.run_import(package, ctx.account)

    ctx
    |> Map.put(:before_counts, before_counts)
    |> Map.put(:invalid_creator_id, invalid_creator_id)
    |> Map.put(:package, package)
    |> Map.put(:import_result, import_result)
  end

  step :then_import_is_rolled_back, ctx do
    invalid_creator_id = ctx.invalid_creator_id

    assert {:error, %{reason: {:missing_reference_translation, "projects", "creator_id", "people", ^invalid_creator_id}}} = ctx.import_result
    assert Repo.get_by(Company, short_id: get_in(ctx.package, ["manifest", "source_company", "short_id"])) == nil
    assert db_counts() == ctx.before_counts

    ctx
  end

  step :given_rich_minimal_slice_company, ctx do
    build_rich_minimal_slice_company(ctx)
  end

  step :then_core_minimal_slice_data_matches, ctx do
    assert table_row_counts(ctx.round_trip.source.package) == table_row_counts(ctx.round_trip.reexported.package)
    assert core_relationship_snapshot(ctx.round_trip.source.package) == core_relationship_snapshot(ctx.round_trip.reexported.package)

    [source_document] = table_rows(ctx.round_trip.source.package, "resource_documents")
    [imported_document] = table_rows(ctx.round_trip.reexported.package, "resource_documents")
    imported_member = person_row_by_full_name(ctx.round_trip.reexported.package, ctx.member.full_name)

    assert mention_labels(imported_document["content"]) == mention_labels(source_document["content"])
    refute RichContent.find_mentioned_ids(imported_document["content"]) == RichContent.find_mentioned_ids(source_document["content"])

    assert [imported_mention_id] = RichContent.find_mentioned_ids(imported_document["content"])
    assert {:ok, imported_member["id"]} == Helpers.decode_id(imported_mention_id)

    ctx
  end

  step :given_company_with_milestone_comment, ctx do
    comment_content = RichText.rich_text("Milestone comment survives transfer")

    ctx =
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_comment(:comment, :milestone, content: comment_content)

    Map.put(ctx, :comment_content, comment_content)
  end

  step :then_milestone_comments_survive, ctx do
    assert table_row_counts(ctx.round_trip.source.package)["milestone_comments"] == 1
    assert table_row_counts(ctx.round_trip.reexported.package)["milestone_comments"] == 1
    assert table_row_counts(ctx.round_trip.source.package)["comments"] == 1
    assert table_row_counts(ctx.round_trip.reexported.package)["comments"] == 1

    [source_comment] = table_rows(ctx.round_trip.source.package, "comments")
    [imported_comment] = table_rows(ctx.round_trip.reexported.package, "comments")
    [source_milestone_comment] = table_rows(ctx.round_trip.source.package, "milestone_comments")
    [imported_milestone_comment] = table_rows(ctx.round_trip.reexported.package, "milestone_comments")

    assert source_comment["content"] == ctx.comment_content
    assert imported_comment["content"] == ctx.comment_content
    assert source_milestone_comment["action"] == "none"
    assert imported_milestone_comment["action"] == "none"

    ctx
  end

  step :given_company_for_existing_account_import, ctx do
    ctx
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_company_member(:member)
  end

  step :given_destination_with_existing_accounts, ctx do
    destination_ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:existing_match)
      |> Factory.add_company_member(:other_dest_member)
      |> Factory.add_account(:loose_account)

    destination_people_before = Repo.aggregate(Ecto.assoc(destination_ctx.company, :people), :count, :id)

    ctx
    |> Map.put(:destination_ctx, destination_ctx)
    |> Map.put(:destination_people_before, destination_people_before)
  end

  step :when_import_targets_existing_destination_accounts, ctx do
    reexport_account = Repo.get!(Operately.People.Account, ctx.destination_ctx.existing_match.account_id)

    round_trip =
      round_trip_company!(ctx.company, ctx.account,
        import_account: ctx.destination_ctx.account,
        reexport_account: reexport_account,
        mutate_package: fn package ->
          package
          |> replace_exported_company_short_id()
          |> Transfers.replace_account_email(ctx.member.account_id, ctx.destination_ctx.existing_match.email, ctx.destination_ctx.existing_match.full_name)
          |> Transfers.replace_person_email(ctx.member.id, ctx.destination_ctx.existing_match.email, ctx.destination_ctx.existing_match.full_name)
        end
      )

    Map.put(ctx, :round_trip, round_trip)
  end

  step :then_existing_account_is_reused_without_touching_unrelated_people, ctx do
    imported_person =
      Repo.get_by!(Person,
        company_id: ctx.round_trip.imported_company.id,
        email: ctx.destination_ctx.existing_match.email
      )

    imported_people =
      from(p in Person, where: p.company_id == ^ctx.round_trip.imported_company.id, select: {p.full_name, p.account_id})
      |> Repo.all()
      |> Map.new()

    assert imported_person.account_id == ctx.destination_ctx.existing_match.account_id
    assert Repo.aggregate(Ecto.assoc(ctx.destination_ctx.company, :people), :count, :id) == ctx.destination_people_before
    refute ctx.destination_ctx.other_dest_member.account_id in Map.values(imported_people)
    refute ctx.destination_ctx.loose_account.id in Map.values(imported_people)

    ctx
  end

  step :given_company_with_activity_content_ids, ctx do
    ctx =
      ctx
      |> Factory.add_company_member(:member)
      |> Factory.add_company_member(:reviewer)
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, champion: :creator, reviewer: :reviewer)
      |> Factory.add_goal_target(:target_one, :goal, name: "Growth")
      |> Factory.add_goal_target(:target_two, :goal, name: "Retention")
      |> Factory.add_goal_target(:target_three, :goal, name: "Revenue")
      |> Factory.add_project(:project, :space, creator: :creator)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_folder(:folder, :hub)
      |> Factory.add_document(:document, :hub, author: :creator)

    create_transfer_activity!(ctx.creator, :project_champion_updating, %{
      company_id: ctx.company.id,
      space_id: ctx.space.id,
      project_id: ctx.project.id,
      old_champion_id: ctx.creator.id,
      new_champion_id: ctx.member.id
    })

    create_transfer_activity!(ctx.creator, :space_members_added, %{
      company_id: ctx.company.id,
      space_id: ctx.space.id,
      members: [%{person_id: ctx.member.id, person_name: ctx.member.full_name, access_level: 1}]
    })

    create_transfer_activity!(ctx.creator, :goal_editing, %{
      company_id: ctx.company.id,
      space_id: ctx.space.id,
      goal_id: ctx.goal.id,
      old_name: ctx.goal.name,
      new_name: "#{ctx.goal.name} updated",
      old_champion_id: ctx.creator.id,
      new_champion_id: ctx.member.id,
      old_reviewer_id: ctx.reviewer.id,
      new_reviewer_id: ctx.reviewer.id,
      added_targets: [%{id: ctx.target_one.id, name: "Growth", from: 0.0, to: 10.0, unit: "%", index: 1}],
      updated_targets: [
        %{
          id: ctx.target_two.id,
          old_name: "Retention",
          new_name: "Retention+",
          old_from: 0.0,
          new_from: 1.0,
          old_to: 5.0,
          new_to: 6.0,
          old_unit: "%",
          new_unit: "%",
          old_index: 1,
          new_index: 2
        }
      ],
      deleted_targets: [%{id: ctx.target_three.id, name: "Revenue", from: 0.0, to: 2.0, unit: "$", index: 3}]
    })

    create_transfer_activity!(ctx.creator, :resource_hub_parent_folder_edited, %{
      company_id: ctx.company.id,
      space_id: ctx.space.id,
      resource_hub_id: ctx.hub.id,
      node_id: ctx.document.node_id,
      new_folder_id: ctx.folder.id,
      resource_id: ctx.document.id,
      resource_type: "document"
    })

    missing_person_id = Ecto.UUID.generate()
    missing_email = "missing-admin-#{System.unique_integer([:positive])}@example.com"

    create_transfer_activity!(ctx.creator, :company_admin_added, %{
      company_id: ctx.company.id,
      people: [%{id: ctx.member.id, full_name: "Missing Admin", email: missing_email}]
    })

    ctx
    |> Map.put(:missing_person_id, missing_person_id)
    |> Map.put(:missing_email, missing_email)
  end

  step :when_activity_content_round_trips_with_missing_serialized_person, ctx do
    round_trip =
      round_trip_company!(ctx.company, ctx.account,
        mutate_package: fn package ->
          package
          |> replace_exported_company_short_id()
          |> update_missing_admin_activity_id(ctx.missing_email, ctx.missing_person_id)
        end
      )

    Map.put(ctx, :round_trip, round_trip)
  end

  step :then_activity_content_ids_are_rewritten_and_missing_ids_preserved, ctx do
    reexported_package = ctx.round_trip.reexported.package

    champion_activity = activity_row!(reexported_package, "project_champion_updating")
    space_members_activity = activity_row!(reexported_package, "space_members_added")
    goal_editing_activity = activity_row!(reexported_package, "goal_editing")
    parent_folder_activity = activity_row!(reexported_package, "resource_hub_parent_folder_edited")

    missing_admin_activity =
      activity_row!(reexported_package, "company_admin_added", fn row ->
        row["content"]["people"] |> hd() |> Map.fetch!("email") == ctx.missing_email
      end)

    imported_project = find_named_row!(reexported_package, "projects", ctx.project.name)
    imported_member = person_row_by_full_name(reexported_package, ctx.member.full_name)
    imported_target_one = find_named_row!(reexported_package, "targets", "Growth")
    imported_target_two = find_named_row!(reexported_package, "targets", "Retention")
    imported_target_three = find_named_row!(reexported_package, "targets", "Revenue")
    [imported_document] = table_rows(reexported_package, "resource_documents")

    assert table_row_counts(ctx.round_trip.imported.package)["activities"] == table_row_counts(reexported_package)["activities"]

    assert champion_activity["content"]["project_id"] == imported_project["id"]
    assert champion_activity["content"]["new_champion_id"] == imported_member["id"]
    assert (space_members_activity["content"]["members"] |> hd() |> Map.fetch!("person_id")) == imported_member["id"]
    assert (goal_editing_activity["content"]["added_targets"] |> hd() |> Map.fetch!("id")) == imported_target_one["id"]
    assert (goal_editing_activity["content"]["updated_targets"] |> hd() |> Map.fetch!("id")) == imported_target_two["id"]
    assert (goal_editing_activity["content"]["deleted_targets"] |> hd() |> Map.fetch!("id")) == imported_target_three["id"]
    assert parent_folder_activity["content"]["resource_id"] == imported_document["id"]
    assert (missing_admin_activity["content"]["people"] |> hd() |> Map.fetch!("id")) == ctx.missing_person_id

    ctx
  end

  step :given_company_with_polymorphic_threads_comments_and_reactions, ctx do
    ctx =
      ctx
      |> Factory.add_company_member(:member)
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_project(:project, :space, goal: :goal)

    ctx =
      ctx
      |> Factory.add_project_discussion(:project_discussion, :project, title: "Project Thread", message: "Project thread message")
      |> Factory.add_comment(:project_comment, :project_discussion, creator: ctx.member, content: mention_doc([ctx.creator]))
      |> Factory.add_reactions(:project_thread_reaction, :project_discussion, creator: ctx.creator, emoji: "rocket")
      |> Factory.add_reactions(:project_comment_reaction, :project_comment, creator: ctx.member, emoji: "eyes")

    ctx
    |> Factory.add_goal_discussion(:goal_discussion, :goal, title: "Goal Thread", message: mention_doc([ctx.member]))
    |> Factory.add_comment(:goal_comment, :goal_discussion, creator: ctx.creator, content: mention_doc([ctx.member]))
    |> Factory.add_reactions(:goal_thread_reaction, :goal_discussion, creator: ctx.member, emoji: "tada")
    |> Factory.add_reactions(:goal_comment_reaction, :goal_comment, creator: ctx.creator, emoji: "heart")
  end

  step :then_polymorphic_graph_survives, ctx do
    assert table_row_counts(ctx.round_trip.source.package)["comment_threads"] == 2
    assert table_row_counts(ctx.round_trip.reexported.package)["comment_threads"] == 2
    assert table_row_counts(ctx.round_trip.source.package)["comments"] == 2
    assert table_row_counts(ctx.round_trip.reexported.package)["comments"] == 2
    assert table_row_counts(ctx.round_trip.source.package)["reactions"] == 4
    assert table_row_counts(ctx.round_trip.reexported.package)["reactions"] == 4

    assert polymorphic_snapshot(ctx.round_trip.source.package) == polymorphic_snapshot(ctx.round_trip.reexported.package)

    assert_mentions_resolve_to_people(ctx.round_trip.reexported.package, "comment_threads", "message")
    assert_mentions_resolve_to_people(ctx.round_trip.reexported.package, "comments", "content")

    ctx
  end

  step :given_demo_built_company, ctx do
    ctx = Factory.add_account(ctx, :demo_account)

    {:ok, demo_company} =
      Demo.run(
        ctx.demo_account,
        "Demo #{System.unique_integer([:positive])}",
        "Chief Executive Officer",
        demo_slice_1_data()
      )

    Map.put(ctx, :demo_company, demo_company)
  end

  step :when_demo_company_round_trips, ctx do
    round_trip =
      round_trip_company!(ctx.demo_company, ctx.demo_account,
        mutate_package: fn package ->
          package
          |> replace_exported_company_short_id()
          |> refresh_unique_tokens()
        end
      )

    Map.put(ctx, :round_trip, round_trip)
  end

  step :then_demo_slice_matches, ctx do
    source_counts = table_row_counts(ctx.round_trip.source.package)
    imported_counts = table_row_counts(ctx.round_trip.reexported.package)

    assert_counts_doubled(source_counts, imported_counts, [
      "people",
      "groups",
      "goals",
      "projects",
      "messages",
      "resource_documents",
      "tasks"
    ])

    assert source_counts == table_row_counts(ctx.round_trip.reexported.package)
    assert company_space_snapshot(ctx.round_trip.source.package) == company_space_snapshot(ctx.round_trip.reexported.package)
    assert manager_snapshot(ctx.round_trip.source.package) == manager_snapshot(ctx.round_trip.reexported.package)

    ctx
  end

  defp round_trip_company!(company, export_account, opts \\ []) do
    default_opts = [mutate_package: &replace_exported_company_short_id/1]
    Transfers.round_trip!(company, export_account, Keyword.merge(default_opts, opts))
  end

  defp replace_exported_company_short_id(package) do
    Transfers.replace_company_short_id(package, unique_short_id())
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

  defp polymorphic_snapshot(package) do
    %{
      comment_threads:
        package
        |> table_rows("comment_threads")
        |> Enum.map(fn row ->
          {
            row["title"],
            comment_thread_parent_signature(package, row),
            person_name(package, row["author_id"]),
            rich_text_signature(row["message"])
          }
        end)
        |> Enum.sort(),
      comments:
        package
        |> table_rows("comments")
        |> Enum.map(fn row ->
          {
            row["entity_type"],
            comment_entity_signature(package, row["entity_type"], row["entity_id"]),
            person_name(package, row["author_id"]),
            rich_text_signature(row["content"])
          }
        end)
        |> Enum.sort(),
      reactions:
        package
        |> table_rows("reactions")
        |> Enum.map(fn row ->
          {
            row["entity_type"],
            reaction_entity_signature(package, row["entity_type"], row["entity_id"]),
            person_name(package, row["person_id"]),
            row["emoji"]
          }
        end)
        |> Enum.sort()
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

  defp comment_thread_parent_signature(package, row) do
    case row["parent_type"] do
      "project" ->
        {:project, resolve_name(package, "projects", row["parent_id"])}

      "activity" ->
        activity = find_row!(package, "activities", row["parent_id"])
        {:activity, activity["action"], activity_scope_name(package, activity)}

      other ->
        {other, row["parent_id"]}
    end
  end

  defp comment_entity_signature(package, "comment_thread", entity_id) do
    row = find_row!(package, "comment_threads", entity_id)
    {:comment_thread, row["title"]}
  end

  defp comment_entity_signature(package, entity_type, entity_id) do
    {entity_type, reaction_entity_signature(package, entity_type, entity_id)}
  end

  defp reaction_entity_signature(package, "comment", entity_id) do
    row = find_row!(package, "comments", entity_id)
    {:comment, rich_text_signature(row["content"])}
  end

  defp reaction_entity_signature(package, "comment_thread", entity_id) do
    row = find_row!(package, "comment_threads", entity_id)
    {:comment_thread, row["title"]}
  end

  defp reaction_entity_signature(package, entity_type, entity_id) do
    {entity_type, resolve_reaction_entity_name(package, entity_type, entity_id)}
  end

  defp resolve_reaction_entity_name(package, "message", entity_id), do: resolve_name(package, "messages", entity_id, "title")
  defp resolve_reaction_entity_name(package, "goal_update", entity_id), do: goal_update_signature(package, entity_id)
  defp resolve_reaction_entity_name(package, "project_check_in", entity_id), do: check_in_signature(package, entity_id)
  defp resolve_reaction_entity_name(package, "project_retrospective", entity_id), do: resolve_name(package, "project_retrospectives", entity_id, "name")
  defp resolve_reaction_entity_name(package, "resource_hub_document", entity_id), do: resolve_name(package, "resource_documents", entity_id)
  defp resolve_reaction_entity_name(package, "resource_hub_file", entity_id), do: resolve_name(package, "resource_files", entity_id)
  defp resolve_reaction_entity_name(package, "resource_hub_link", entity_id), do: resolve_name(package, "resource_links", entity_id)
  defp resolve_reaction_entity_name(package, "space_task", entity_id), do: resolve_name(package, "tasks", entity_id)
  defp resolve_reaction_entity_name(package, "project_task", entity_id), do: resolve_name(package, "tasks", entity_id)
  defp resolve_reaction_entity_name(_package, _entity_type, entity_id), do: entity_id

  defp activity_scope_name(package, activity) do
    cond do
      activity["content"]["project_id"] -> resolve_name(package, "projects", activity["content"]["project_id"])
      activity["content"]["goal_id"] -> resolve_name(package, "goals", activity["content"]["goal_id"])
      activity["content"]["space_id"] -> resolve_name(package, "groups", activity["content"]["space_id"])
      true -> nil
    end
  end

  defp rich_text_signature(nil), do: nil

  defp rich_text_signature(document) do
    {RichContent.rich_content_to_string(document), mention_labels(document)}
  end

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

  defp assert_mentions_resolve_to_people(package, table_name, field) do
    people_ids =
      package
      |> table_rows("people")
      |> Enum.map(& &1["id"])
      |> MapSet.new()

    package
    |> table_rows(table_name)
    |> Enum.each(fn row ->
      row
      |> Map.get(field)
      |> RichContent.find_mentioned_ids()
      |> Enum.each(fn mention_id ->
        assert {:ok, decoded_person_id} = Helpers.decode_id(mention_id)
        assert decoded_person_id in people_ids
      end)
    end)
  end

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
    refresh_table_tokens(package, "invite_links")
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

  defp create_transfer_activity!(author, action, content) do
    multi =
      Ecto.Multi.new()
      |> Activities.insert_sync(author.id, action, fn _ -> content end, include_notification: false)

    {:ok, %{updated_activity: activity}} = Repo.transaction(multi)
    activity
  end

  defp activity_row!(package, action, predicate \\ fn _row -> true end) do
    package
    |> table_rows("activities")
    |> Enum.find(&(&1["action"] == action and predicate.(&1)))
    |> case do
      nil -> raise "Activity #{inspect(action)} not found"
      row -> row
    end
  end

  defp find_named_row!(package, table_name, name) do
    package
    |> table_rows(table_name)
    |> Enum.find(&(&1["name"] == name))
    |> case do
      nil -> raise "Row #{inspect(name)} not found in #{table_name}"
      row -> row
    end
  end

  defp update_missing_admin_activity_id(package, email, missing_person_id) do
    activity =
      activity_row!(package, "company_admin_added", fn row ->
        row["content"]["people"] |> hd() |> Map.fetch!("email") == email
      end)

    Transfers.update_row(package, "activities", activity["id"], fn row ->
      update_in(row, ["content", "people"], fn people ->
        List.update_at(people, 0, &Map.put(&1, "id", missing_person_id))
      end)
    end)
  end
end

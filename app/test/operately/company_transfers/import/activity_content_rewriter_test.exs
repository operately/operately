defmodule Operately.CompanyTransfers.Import.ActivityContentRewriterTest do
  use ExUnit.Case, async: true

  alias Operately.CompanyTransfers.Import.{ActivityContentRewriter, TranslationPlan}

  test "translates root belongs_to ids in activity content" do
    source_company_id = Ecto.UUID.generate()
    source_space_id = Ecto.UUID.generate()
    source_project_id = Ecto.UUID.generate()
    source_old_champion_id = Ecto.UUID.generate()
    source_new_champion_id = Ecto.UUID.generate()

    destination_company_id = Ecto.UUID.generate()
    destination_space_id = Ecto.UUID.generate()
    destination_project_id = Ecto.UUID.generate()
    destination_old_champion_id = Ecto.UUID.generate()
    destination_new_champion_id = Ecto.UUID.generate()

    row = %{
      "action" => "project_champion_updating",
      "content" => %{
        "company_id" => source_company_id,
        "space_id" => source_space_id,
        "project_id" => source_project_id,
        "old_champion_id" => source_old_champion_id,
        "new_champion_id" => source_new_champion_id
      }
    }

    plan =
      translation_plan(%{
        "companies" => %{source_company_id => destination_company_id},
        "groups" => %{source_space_id => destination_space_id},
        "projects" => %{source_project_id => destination_project_id},
        "people" => %{
          source_old_champion_id => destination_old_champion_id,
          source_new_champion_id => destination_new_champion_id
        }
      })

    assert {:ok, rewritten} = ActivityContentRewriter.rewrite_row_content(row, "activities", plan)

    assert rewritten["content"] == %{
             "company_id" => destination_company_id,
             "space_id" => destination_space_id,
             "project_id" => destination_project_id,
             "old_champion_id" => destination_old_champion_id,
             "new_champion_id" => destination_new_champion_id
           }
  end

  test "translates nested embedded belongs_to ids" do
    source_previous_person_id = Ecto.UUID.generate()
    source_updated_person_id = Ecto.UUID.generate()

    row = %{
      "action" => "project_contributor_edited",
      "content" => %{
        "company_id" => Ecto.UUID.generate(),
        "space_id" => Ecto.UUID.generate(),
        "project_id" => Ecto.UUID.generate(),
        "previous_contributor" => %{"person_id" => source_previous_person_id, "role" => "champion", "permissions" => 1},
        "updated_contributor" => %{"person_id" => source_updated_person_id, "role" => "reviewer", "permissions" => 2}
      }
    }

    plan =
      translation_plan(%{
        "companies" => %{row["content"]["company_id"] => Ecto.UUID.generate()},
        "groups" => %{row["content"]["space_id"] => Ecto.UUID.generate()},
        "projects" => %{row["content"]["project_id"] => Ecto.UUID.generate()},
        "people" => %{
          source_previous_person_id => Ecto.UUID.generate(),
          source_updated_person_id => Ecto.UUID.generate()
        }
      })

    assert {:ok, rewritten} = ActivityContentRewriter.rewrite_row_content(row, "activities", plan)

    assert rewritten["content"]["previous_contributor"]["person_id"] == plan.id_map["people"][source_previous_person_id]
    assert rewritten["content"]["updated_contributor"]["person_id"] == plan.id_map["people"][source_updated_person_id]
  end

  test "translates override-registry person ids" do
    source_person_id = Ecto.UUID.generate()
    destination_person_id = Ecto.UUID.generate()

    row = %{
      "action" => "company_admin_added",
      "content" => %{
        "company_id" => Ecto.UUID.generate(),
        "people" => [%{"id" => source_person_id, "full_name" => "Admin", "email" => "admin@example.com"}]
      }
    }

    plan =
      translation_plan(%{
        "companies" => %{row["content"]["company_id"] => Ecto.UUID.generate()},
        "people" => %{source_person_id => destination_person_id}
      })

    assert {:ok, rewritten} = ActivityContentRewriter.rewrite_row_content(row, "activities", plan)
    assert rewritten["content"]["people"] == [%{"id" => destination_person_id, "full_name" => "Admin", "email" => "admin@example.com"}]
  end

  test "translates override-registry target ids" do
    added_target_id = Ecto.UUID.generate()
    updated_target_id = Ecto.UUID.generate()
    deleted_target_id = Ecto.UUID.generate()

    row = %{
      "action" => "goal_editing",
      "content" => %{
        "company_id" => Ecto.UUID.generate(),
        "space_id" => Ecto.UUID.generate(),
        "goal_id" => Ecto.UUID.generate(),
        "old_name" => "Old",
        "new_name" => "New",
        "old_champion_id" => Ecto.UUID.generate(),
        "new_champion_id" => Ecto.UUID.generate(),
        "old_reviewer_id" => Ecto.UUID.generate(),
        "new_reviewer_id" => Ecto.UUID.generate(),
        "added_targets" => [%{"id" => added_target_id, "name" => "Added", "from" => 0.0, "to" => 1.0, "unit" => "%", "index" => 1}],
        "updated_targets" => [
          %{
            "id" => updated_target_id,
            "old_name" => "Updated",
            "new_name" => "Updated+",
            "old_from" => 0.0,
            "new_from" => 1.0,
            "old_to" => 2.0,
            "new_to" => 3.0,
            "old_unit" => "%",
            "new_unit" => "%",
            "old_index" => 1,
            "new_index" => 2
          }
        ],
        "deleted_targets" => [%{"id" => deleted_target_id, "name" => "Deleted", "from" => 0.0, "to" => 1.0, "unit" => "$", "index" => 3}]
      }
    }

    plan =
      translation_plan(%{
        "companies" => %{row["content"]["company_id"] => Ecto.UUID.generate()},
        "groups" => %{row["content"]["space_id"] => Ecto.UUID.generate()},
        "goals" => %{row["content"]["goal_id"] => Ecto.UUID.generate()},
        "people" => %{
          row["content"]["old_champion_id"] => Ecto.UUID.generate(),
          row["content"]["new_champion_id"] => Ecto.UUID.generate(),
          row["content"]["old_reviewer_id"] => Ecto.UUID.generate(),
          row["content"]["new_reviewer_id"] => Ecto.UUID.generate()
        },
        "targets" => %{
          added_target_id => Ecto.UUID.generate(),
          updated_target_id => Ecto.UUID.generate(),
          deleted_target_id => Ecto.UUID.generate()
        }
      })

    assert {:ok, rewritten} = ActivityContentRewriter.rewrite_row_content(row, "activities", plan)

    assert (rewritten["content"]["added_targets"] |> hd() |> Map.fetch!("id")) == plan.id_map["targets"][added_target_id]
    assert (rewritten["content"]["updated_targets"] |> hd() |> Map.fetch!("id")) == plan.id_map["targets"][updated_target_id]
    assert (rewritten["content"]["deleted_targets"] |> hd() |> Map.fetch!("id")) == plan.id_map["targets"][deleted_target_id]
  end

  test "translates override-registry milestone ids" do
    source_milestone_id = Ecto.UUID.generate()
    destination_milestone_id = Ecto.UUID.generate()

    row = %{
      "action" => "project_timeline_edited",
      "content" => %{
        "company_id" => Ecto.UUID.generate(),
        "space_id" => Ecto.UUID.generate(),
        "project_id" => Ecto.UUID.generate(),
        "new_start_date" => Date.to_iso8601(Date.utc_today()),
        "milestone_updates" => [%{"milestone_id" => source_milestone_id, "old_title" => "Old", "new_title" => "New", "old_due_date" => nil, "new_due_date" => nil}],
        "new_milestones" => [%{"milestone_id" => source_milestone_id, "title" => "Milestone", "due_date" => nil}]
      }
    }

    plan =
      translation_plan(%{
        "companies" => %{row["content"]["company_id"] => Ecto.UUID.generate()},
        "groups" => %{row["content"]["space_id"] => Ecto.UUID.generate()},
        "projects" => %{row["content"]["project_id"] => Ecto.UUID.generate()},
        "project_milestones" => %{source_milestone_id => destination_milestone_id}
      })

    assert {:ok, rewritten} = ActivityContentRewriter.rewrite_row_content(row, "activities", plan)

    assert (rewritten["content"]["milestone_updates"] |> hd() |> Map.fetch!("milestone_id")) == destination_milestone_id
    assert (rewritten["content"]["new_milestones"] |> hd() |> Map.fetch!("milestone_id")) == destination_milestone_id
  end

  test "translates typed resource overrides" do
    source_resource_id = Ecto.UUID.generate()
    destination_resource_id = Ecto.UUID.generate()

    row = %{
      "action" => "resource_hub_parent_folder_edited",
      "content" => %{
        "company_id" => Ecto.UUID.generate(),
        "space_id" => Ecto.UUID.generate(),
        "resource_hub_id" => Ecto.UUID.generate(),
        "node_id" => Ecto.UUID.generate(),
        "new_folder_id" => Ecto.UUID.generate(),
        "resource_id" => source_resource_id,
        "resource_type" => "document"
      }
    }

    plan =
      translation_plan(%{
        "companies" => %{row["content"]["company_id"] => Ecto.UUID.generate()},
        "groups" => %{
          row["content"]["space_id"] => Ecto.UUID.generate(),
          row["content"]["new_folder_id"] => Ecto.UUID.generate()
        },
        "resource_hubs" => %{row["content"]["resource_hub_id"] => Ecto.UUID.generate()},
        "resource_nodes" => %{row["content"]["node_id"] => Ecto.UUID.generate()},
        "resource_folders" => %{row["content"]["new_folder_id"] => Ecto.UUID.generate()},
        "resource_documents" => %{source_resource_id => destination_resource_id}
      })

    assert {:ok, rewritten} = ActivityContentRewriter.rewrite_row_content(row, "activities", plan)
    assert rewritten["content"]["resource_id"] == destination_resource_id
  end

  test "keeps missing translated values unchanged" do
    missing_person_id = Ecto.UUID.generate()

    row = %{
      "action" => "space_members_added",
      "content" => %{
        "company_id" => Ecto.UUID.generate(),
        "space_id" => Ecto.UUID.generate(),
        "members" => [%{"person_id" => missing_person_id, "person_name" => "Missing", "access_level" => 1}]
      }
    }

    plan =
      translation_plan(%{
        "companies" => %{row["content"]["company_id"] => Ecto.UUID.generate()},
        "groups" => %{row["content"]["space_id"] => Ecto.UUID.generate()}
      })

    assert {:ok, rewritten} = ActivityContentRewriter.rewrite_row_content(row, "activities", plan)
    assert (rewritten["content"]["members"] |> hd() |> Map.fetch!("person_id")) == missing_person_id
  end

  test "leaves content unchanged when the action has no current content module" do
    row = %{"action" => "legacy_removed_action", "content" => %{"company_id" => Ecto.UUID.generate(), "person_id" => Ecto.UUID.generate()}}

    assert {:ok, ^row} = ActivityContentRewriter.rewrite_row_content(row, "activities", translation_plan(%{}))
  end

  defp translation_plan(id_map) do
    %TranslationPlan{id_map: id_map, table_index: %{}}
  end
end

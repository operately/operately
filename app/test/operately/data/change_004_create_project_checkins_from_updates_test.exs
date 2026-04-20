defmodule Operately.Data.Change004CreateProjectCheckinsFromUpdatesTest do
  use Operately.DataCase

  alias Operately.Activities.Activity
  alias Operately.Data.Change004CreateProjectCheckinsFromUpdates, as: Change
  alias Operately.Data.Change004CreateProjectCheckinsFromUpdates.Update
  alias Operately.Projects.CheckIn
  alias Operately.Support.RichText

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_company_member(:reviewer)
  end

  test "run/0 creates a project check-in from a legacy update and rewrites the activity", ctx do
    inserted_at = ~N[2024-02-15 10:00:00]
    updated_at = ~N[2024-02-16 12:30:00]
    acknowledged_at = ~U[2024-02-17 09:45:00Z]
    message = RichText.rich_text("Legacy update content")

    update =
      Repo.insert!(%Update{
        author_id: ctx.creator.id,
        updatable_id: ctx.project.id,
        content: %{
          "message" => message,
          "health" => %{
            "status" => %{"value" => "at_risk"}
          }
        },
        acknowledging_person_id: ctx.reviewer.id,
        acknowledged_at: acknowledged_at,
        inserted_at: inserted_at,
        updated_at: updated_at
      })

    activity =
      Repo.insert!(%Activity{
        action: "project_status_update_submitted",
        author_id: ctx.creator.id,
        content: %{
          "company_id" => ctx.company.id,
          "project_id" => ctx.project.id,
          "space_id" => ctx.space.id,
          "status_update_id" => update.id
        }
      })

    Change.run()

    updated_activity = Repo.get!(Activity, activity.id)
    check_in = Repo.get!(CheckIn, updated_activity.content["check_in_id"])

    assert updated_activity.action == "project_check_in_submitted"
    assert updated_activity.content["status_update_id"] == update.id
    assert updated_activity.content["project_id"] == ctx.project.id
    assert updated_activity.content["check_in_id"] == check_in.id

    assert check_in.author_id == ctx.creator.id
    assert check_in.project_id == ctx.project.id
    assert check_in.status == :caution
    assert check_in.description == message
    assert check_in.acknowledged_by_id == ctx.reviewer.id
    assert check_in.acknowledged_at == acknowledged_at
    assert check_in.inserted_at == inserted_at
    assert check_in.updated_at == updated_at
    assert check_in.subscription_list_id == nil
  end

  test "run/0 ignores activities that are not project status updates", ctx do
    update =
      Repo.insert!(%Update{
        author_id: ctx.creator.id,
        updatable_id: ctx.project.id,
        content: %{
          "message" => RichText.rich_text("Ignored update"),
          "health" => %{
            "status" => %{"value" => "on_track"}
          }
        },
        inserted_at: ~N[2024-03-01 08:00:00],
        updated_at: ~N[2024-03-01 08:00:00]
      })

    Repo.insert!(%Activity{
      action: "project_status_update_acknowledged",
      author_id: ctx.creator.id,
      content: %{
        "company_id" => ctx.company.id,
        "project_id" => ctx.project.id,
        "space_id" => ctx.space.id,
        "status_update_id" => update.id
      }
    })

    Change.run()

    assert Repo.aggregate(CheckIn, :count) == 0
  end

  test "calculate_new_status/1 maps legacy statuses to project check-in statuses" do
    assert Change.calculate_new_status("on_track") == :on_track
    assert Change.calculate_new_status("at_risk") == :caution
    assert Change.calculate_new_status("off_track") == :off_track
    assert Change.calculate_new_status("paused") == :on_track

    assert_raise RuntimeError, "Unknown status: unknown", fn ->
      Change.calculate_new_status("unknown")
    end
  end
end

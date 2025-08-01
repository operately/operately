defmodule OperatelyWeb.Api.ProjectsTest do
  alias Operately.ContextualDates.Timeframe

  use OperatelyWeb.TurboCase

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:engineering)
    |> Factory.add_project(:project, :engineering)
    |> Factory.add_space_member(:new_champion, :engineering)
  end

  describe "update due date" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:projects, :update_due_date], %{})
    end

    test "it requires a project_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:projects, :update_due_date], %{due_date: %{date: "2023-01-01", date_type: "day"}})
      assert res.message == "Missing required fields: project_id"
    end

    test "it updates the due date", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      contextual_date = %{
        date: "2026-01-01",
        date_type: "day",
        value: "Jan 1, 2026"
      }

      assert {200, res} = mutation(ctx.conn, [:projects, :update_due_date], %{
        project_id: Paths.project_id(ctx.project),
        due_date: contextual_date
      })
      assert res.success == true

      ctx = Factory.reload(ctx, :project)
      assert Timeframe.end_date(ctx.project.timeframe) == ~D[2026-01-01]
    end

    test "it can update the due date to nil", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = mutation(ctx.conn, [:projects, :update_due_date], %{
        project_id: Paths.project_id(ctx.project),
        due_date: nil
      })
      assert res.success == true

      ctx = Factory.reload(ctx, :project)
      assert ctx.project.timeframe.contextual_end_date == nil
    end

    test "it creates an activity when due date is updated", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      contextual_date = %{
        date: "2026-01-01",
        date_type: "day",
        value: "Jan 1, 2026"
      }

      before_count = count_activities(ctx.project.id, "project_due_date_updating")

      assert {200, _} = mutation(ctx.conn, [:projects, :update_due_date], %{
        project_id: Paths.project_id(ctx.project),
        due_date: contextual_date
      })

      after_count = count_activities(ctx.project.id, "project_due_date_updating")
      assert after_count == before_count + 1
    end
  end

  describe "update start date" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:projects, :update_start_date], %{})
    end

    test "it requires a project_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:projects, :update_start_date], %{start_date: %{date: "2023-01-01", date_type: "day"}})
      assert res.message == "Missing required fields: project_id"
    end

    test "it updates the start date", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      contextual_date = %{
        date: "2025-01-01",
        date_type: "day",
        value: "Jan 1, 2025"
      }

      assert {200, res} = mutation(ctx.conn, [:projects, :update_start_date], %{
        project_id: Paths.project_id(ctx.project),
        start_date: contextual_date
      })
      assert res.success == true

      ctx = Factory.reload(ctx, :project)
      assert Timeframe.start_date(ctx.project.timeframe) == ~D[2025-01-01]
    end

    test "it can update the start date to nil", ctx do
      # First set a timeframe with an end date
      ctx = Factory.log_in_person(ctx, :creator)

      end_date = %{
        date: "2026-01-01",
        date_type: "day",
        value: "Jan 1, 2026"
      }

      assert {200, _} = mutation(ctx.conn, [:projects, :update_due_date], %{
        project_id: Paths.project_id(ctx.project),
        due_date: end_date
      })

      # Then test setting the start date to nil
      assert {200, res} = mutation(ctx.conn, [:projects, :update_start_date], %{
        project_id: Paths.project_id(ctx.project),
        start_date: nil
      })
      assert res.success == true

      ctx = Factory.reload(ctx, :project)
      assert ctx.project.timeframe != nil
      assert Timeframe.start_date(ctx.project.timeframe) == nil
      assert Timeframe.end_date(ctx.project.timeframe) == ~D[2026-01-01]
    end

    test "it creates an activity when start date is updated", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      contextual_date = %{
        date: "2025-01-01",
        date_type: "day",
        value: "Jan 1, 2025"
      }

      before_count = count_activities(ctx.project.id, "project_start_date_updating")

      assert {200, _} = mutation(ctx.conn, [:projects, :update_start_date], %{
        project_id: Paths.project_id(ctx.project),
        start_date: contextual_date
      })

      after_count = count_activities(ctx.project.id, "project_start_date_updating")
      assert after_count == before_count + 1
    end
  end

  describe "update champion" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:projects, :update_champion], %{})
    end

    test "it requires a project_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:projects, :update_champion], %{champion_id: ctx.new_champion.id})
      assert res.message == "Missing required fields: project_id"
    end

    test "it updates the champion", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = mutation(ctx.conn, [:projects, :update_champion], %{
        project_id: Paths.project_id(ctx.project),
        champion_id: Paths.person_id(ctx.new_champion)
      })
      assert res.success == true

      project = Repo.reload(ctx.project) |> Repo.preload(:champion)
      assert project.champion.id == ctx.new_champion.id
    end

    test "it can update the champion to nil", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      # First set a champion
      assert {200, _} = mutation(ctx.conn, [:projects, :update_champion], %{
        project_id: Paths.project_id(ctx.project),
        champion_id: Paths.person_id(ctx.new_champion)
      })

      # Then remove the champion
      assert {200, res} = mutation(ctx.conn, [:projects, :update_champion], %{
        project_id: Paths.project_id(ctx.project),
        champion_id: nil
      })
      assert res.success == true

      project = Repo.reload(ctx.project) |> Repo.preload(:champion)
      assert project.champion == nil
    end

    test "it creates an activity when champion is updated", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      before_count = count_activities(ctx.project.id, "project_champion_updating")

      assert {200, _} = mutation(ctx.conn, [:projects, :update_champion], %{
        project_id: Paths.project_id(ctx.project),
        champion_id: Paths.person_id(ctx.new_champion)
      })

      after_count = count_activities(ctx.project.id, "project_champion_updating")
      assert after_count == before_count + 1
    end
  end

  defp count_activities(project_id, action) do
    Operately.Activities.Activity
    |> Operately.Repo.all(where: [action: action, resource_id: project_id])
    |> length()
  end
end

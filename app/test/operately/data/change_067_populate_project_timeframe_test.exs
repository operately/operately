defmodule Operately.Data.Change067PopulateProjectTimeframeTest do
  use Operately.DataCase

  alias Operately.Repo
  alias Operately.Data.Change067PopulateProjectTimeframe

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  test "populates timeframe with started_at for start date and deadline for end date", ctx do
    started_at = ~U[2023-01-15 10:00:00Z]
    deadline = ~U[2023-06-30 23:59:59Z]

    ctx = Factory.add_project(ctx, :project, :space, started_at: started_at, deadline: deadline)

    assert ctx.project.timeframe == nil

    Change067PopulateProjectTimeframe.run()

    project = Repo.reload(ctx.project)

    assert project.timeframe.contextual_start_date.date == ~D[2023-01-15]
    assert project.timeframe.contextual_start_date.date_type == :day
    assert project.timeframe.contextual_start_date.value == "Jan 15, 2023"

    assert project.timeframe.contextual_end_date.date == ~D[2023-06-30]
    assert project.timeframe.contextual_end_date.date_type == :day
    assert project.timeframe.contextual_end_date.value == "Jun 30, 2023"
  end

  test "uses inserted_at for start date when started_at is nil", ctx do
    deadline = ~U[2023-06-30 23:59:59Z]

    ctx = Factory.add_project(ctx, :project, :space, deadline: deadline)

    inserted_date = NaiveDateTime.to_date(ctx.project.inserted_at)
    formatted_date = Calendar.strftime(inserted_date, "%b %-d, %Y")

    assert ctx.project.timeframe == nil

    Change067PopulateProjectTimeframe.run()

    project = Repo.reload(ctx.project)

    assert project.timeframe.contextual_start_date.date == inserted_date
    assert project.timeframe.contextual_start_date.date_type == :day
    assert project.timeframe.contextual_start_date.value == formatted_date

    assert project.timeframe.contextual_end_date.date == ~D[2023-06-30]
    assert project.timeframe.contextual_end_date.date_type == :day
    assert project.timeframe.contextual_end_date.value == "Jun 30, 2023"
  end

  test "sets contextual_end_date to nil when both deadline is nil", ctx do
    ctx = Factory.add_project(ctx, :project, :space)

    assert ctx.project.timeframe == nil

    Change067PopulateProjectTimeframe.run()

    project = Repo.reload(ctx.project)

    assert project.timeframe.contextual_end_date == nil
  end

  test "updates multiple projects correctly", ctx do
    ctx =
      ctx
      |> Factory.add_project(:p1, :space, started_at: ~U[2023-01-15 10:00:00Z], deadline: ~U[2023-06-30 23:59:59Z])
      |> Factory.add_project(:p2, :space, deadline: ~U[2023-12-31 23:59:59Z])
      |> Factory.add_project(:p3, :space, started_at: ~U[2023-03-01 10:00:00Z])

    Change067PopulateProjectTimeframe.run()

    p1 = Repo.reload(ctx.p1)
    p2 = Repo.reload(ctx.p2)
    p3 = Repo.reload(ctx.p3)

    assert p1.timeframe.contextual_start_date.date == ~D[2023-01-15]
    assert p1.timeframe.contextual_end_date.date == ~D[2023-06-30]

    assert p2.timeframe.contextual_start_date.date == NaiveDateTime.to_date(p2.inserted_at)
    assert p2.timeframe.contextual_end_date.date == ~D[2023-12-31]

    assert p3.timeframe.contextual_start_date.date == ~D[2023-03-01]
    assert p3.timeframe.contextual_end_date == nil
  end
end

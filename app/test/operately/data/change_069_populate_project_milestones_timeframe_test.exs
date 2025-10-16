defmodule Operately.Data.Change069PopulateProjectMilestonesTimeframeTest do
  use Operately.DataCase

  alias Operately.Repo
  alias Operately.Data.Change069PopulateProjectMilestonesTimeframe

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
  end

  test "populates timeframe with inserted_at for start date and deadline_at for end date", ctx do
    deadline_at = ~U[2023-06-30 23:59:59Z]

    ctx = Factory.add_project_milestone(ctx, :milestone, :project, deadline_at: deadline_at, timeframe: %{})

    Change069PopulateProjectMilestonesTimeframe.run()

    milestone = Repo.reload(ctx.milestone)

    inserted_date = NaiveDateTime.to_date(milestone.inserted_at)
    formatted_inserted_date = Calendar.strftime(inserted_date, "%b %-d, %Y")

    assert milestone.timeframe.contextual_start_date.date == inserted_date
    assert milestone.timeframe.contextual_start_date.date_type == :day
    assert milestone.timeframe.contextual_start_date.value == formatted_inserted_date

    assert milestone.timeframe.contextual_end_date.date == ~D[2023-06-30]
    assert milestone.timeframe.contextual_end_date.date_type == :day
    assert milestone.timeframe.contextual_end_date.value == "Jun 30, 2023"
  end

  test "does not overwrite existing contextual dates", ctx do
    deadline_at = ~U[2023-06-30 23:59:59Z]
    custom_start_date = ~D[2023-01-01]
    custom_end_date = ~D[2023-12-31]

    existing_timeframe = %{
      contextual_start_date: %{
        date: custom_start_date,
        date_type: :day,
        value: "Jan 1, 2023"
      },
      contextual_end_date: %{
        date: custom_end_date,
        date_type: :day,
        value: "Dec 31, 2023"
      }
    }

    ctx =
      Factory.add_project_milestone(ctx, :milestone, :project,
        deadline_at: deadline_at,
        timeframe: existing_timeframe
      )

    Change069PopulateProjectMilestonesTimeframe.run()

    milestone = Repo.reload(ctx.milestone)

    assert milestone.timeframe.contextual_start_date.date == custom_start_date
    assert milestone.timeframe.contextual_start_date.value == "Jan 1, 2023"
    assert milestone.timeframe.contextual_end_date.date == custom_end_date
    assert milestone.timeframe.contextual_end_date.value == "Dec 31, 2023"
  end

  test "updates multiple milestones correctly", ctx do
    ctx =
      ctx
      |> Factory.add_project_milestone(:m1, :project, deadline_at: ~U[2023-06-30 23:59:59Z], timeframe: %{})
      |> Factory.add_project_milestone(:m2, :project, deadline_at: ~U[2023-12-31 23:59:59Z], timeframe: %{})
      |> Factory.add_project_milestone(:m3, :project, deadline_at: ~U[2024-01-01 23:59:59Z], timeframe: %{})

    Change069PopulateProjectMilestonesTimeframe.run()

    m1 = Repo.reload(ctx.m1)
    m2 = Repo.reload(ctx.m2)
    m3 = Repo.reload(ctx.m3)

    assert m1.timeframe.contextual_start_date.date == NaiveDateTime.to_date(m1.inserted_at)
    assert m1.timeframe.contextual_end_date.date == ~D[2023-06-30]

    assert m2.timeframe.contextual_start_date.date == NaiveDateTime.to_date(m2.inserted_at)
    assert m2.timeframe.contextual_end_date.date == ~D[2023-12-31]

    assert m3.timeframe.contextual_start_date.date == NaiveDateTime.to_date(m3.inserted_at)
    assert m3.timeframe.contextual_end_date.date == ~D[2024-01-01]
  end
end

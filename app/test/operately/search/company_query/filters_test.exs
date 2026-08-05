defmodule Operately.Search.CompanyQuery.FiltersTest do
  use Operately.DataCase

  import Ecto.Query

  alias Operately.Goals.Goal
  alias Operately.Projects.Project
  alias Operately.Repo
  alias Operately.Search
  alias Operately.Search.{Entry, SourceIndexer}
  alias Operately.Support.{Factory, RichText}

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:product, name: "Product")
      |> Factory.add_space(:marketing, name: "Marketing")
      |> Factory.add_project(:product_project, :product, name: "Shared marker alpha")
      |> Factory.add_project(:marketing_project, :marketing, name: "Shared marker beta")
      |> Factory.add_goal(:product_goal, :product, name: "Shared marker goal")
      |> set_project_description(:product_project, "Shared marker body for product")
      |> set_project_description(:marketing_project, "Shared marker body for marketing")
      |> set_goal_description(:product_goal, "Shared marker body for goal")
      |> index(:project, :product_project)
      |> index(:project, :marketing_project)
      |> index(:goal, :product_goal)

    ctx
  end

  test "empty filters return the unfiltered result set", ctx do
    unfiltered = MapSet.new(search_ids(ctx.creator, "Shared marker", %{}))

    assert unfiltered == MapSet.new([ctx.product_goal.id, ctx.product_project.id, ctx.marketing_project.id])

    assert unfiltered ==
             MapSet.new(
               search_ids(ctx.creator, "Shared marker", %{
                 space_ids: [],
                 types: [],
                 time_range: nil,
                 sort: :best_match
               })
             )
  end

  test "filters by space ids", ctx do
    assert MapSet.new(search_ids(ctx.creator, "Shared marker", %{space_ids: [ctx.product.id]})) ==
             MapSet.new([ctx.product_goal.id, ctx.product_project.id])

    assert search_ids(ctx.creator, "Shared marker", %{space_ids: [ctx.marketing.id]}) == [ctx.marketing_project.id]
  end

  test "filters by source types", ctx do
    assert search_ids(ctx.creator, "Shared marker", %{types: [:goal]}) == [ctx.product_goal.id]

    assert MapSet.new(search_ids(ctx.creator, "Shared marker", %{types: [:project]})) ==
             MapSet.new([ctx.product_project.id, ctx.marketing_project.id])
  end

  test "filters by time range using source_inserted_at", ctx do
    set_entry_inserted_at(ctx.product_project, days_ago(3))
    set_entry_inserted_at(ctx.marketing_project, days_ago(20))
    set_entry_inserted_at(ctx.product_goal, days_ago(100))

    assert search_ids(ctx.creator, "Shared marker", %{time_range: :last_7_days}) == [ctx.product_project.id]

    assert MapSet.new(search_ids(ctx.creator, "Shared marker", %{time_range: :last_30_days})) ==
             MapSet.new([ctx.product_project.id, ctx.marketing_project.id])

    assert MapSet.new(search_ids(ctx.creator, "Shared marker", %{time_range: :last_90_days})) ==
             MapSet.new([ctx.product_project.id, ctx.marketing_project.id])

    assert MapSet.new(search_ids(ctx.creator, "Shared marker", %{time_range: :last_12_months})) ==
             MapSet.new([ctx.product_project.id, ctx.marketing_project.id, ctx.product_goal.id])
  end

  test "sorts by most recent source_inserted_at", ctx do
    set_entry_inserted_at(ctx.product_project, days_ago(1))
    set_entry_inserted_at(ctx.marketing_project, days_ago(2))
    set_entry_inserted_at(ctx.product_goal, days_ago(3))

    assert search_ids(ctx.creator, "Shared marker", %{sort: :most_recent}) == [
             ctx.product_project.id,
             ctx.marketing_project.id,
             ctx.product_goal.id
           ]
  end

  defp search_ids(person, query, filters) do
    person
    |> Search.search_company(query, filters)
    |> Enum.map(& &1.id)
  end

  defp set_project_description(ctx, key, description) do
    project =
      ctx
      |> Map.fetch!(key)
      |> Project.changeset(%{description: RichText.rich_text(description)})
      |> Repo.update!()

    Map.put(ctx, key, project)
  end

  defp set_goal_description(ctx, key, description) do
    goal =
      ctx
      |> Map.fetch!(key)
      |> Goal.changeset(%{description: RichText.rich_text(description)})
      |> Repo.update!()

    Map.put(ctx, key, goal)
  end

  defp index(ctx, type, key) do
    resource = Map.fetch!(ctx, key)
    assert {:ok, _} = SourceIndexer.sync(Atom.to_string(type), resource.id)
    ctx
  end

  defp set_entry_inserted_at(resource, inserted_at) do
    source_type =
      case resource do
        %Project{} -> :project
        %Goal{} -> :goal
      end

    from(entry in Entry, where: entry.source_type == ^source_type and entry.source_id == ^resource.id)
    |> Repo.update_all(set: [source_inserted_at: inserted_at])
  end

  defp days_ago(days) do
    DateTime.utc_now()
    |> DateTime.shift(day: -days)
    |> DateTime.to_naive()
    |> NaiveDateTime.truncate(:microsecond)
  end
end

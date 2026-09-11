defmodule Operately.FeedBenchmark.SeedTest do
  use Operately.DataCase
  alias Operately.FeedBenchmark.{Seed, Runner}
  alias OperatelyWeb.Api.Companies.ListActivities, as: Feed

  @tag timeout: 120_000
  test "small dataset supports serialization, overlapping access, restricted pages, and reuse validation" do
    manifest = Seed.generate(%{activities: 600, people: 6, spaces: 4, resources: 12})
    assert Seed.validate!(manifest) == :ok
    assert manifest["counts"]["activities"] == 600
    assert manifest["counts"]["member_joined_activities"] > 600
    company = Repo.get!(Operately.Companies.Company, manifest["company_id"])
    member = Repo.get!(Operately.People.Person, manifest["people"]["member"]["id"])
    restricted = Repo.get!(Operately.People.Person, manifest["people"]["restricted"]["id"])
    inputs = %{scope_type: :company, scope_id: OperatelyWeb.Paths.company_id(company), actions: Operately.FeedBenchmark.actions(), paginate: true}
    assert {:ok, first} = Feed.call(Seed.connection(member), inputs)
    assert length(first.activities) == 20
    assert length(Enum.uniq_by(first.activities, & &1.id)) == 20
    assert {:ok, second} = Feed.call(Seed.connection(member), Map.put(inputs, :cursor, first.next_cursor))
    refute Enum.any?(second.activities, fn a -> Enum.any?(first.activities, &(&1.id == a.id)) end)
    assert {:ok, all} = Feed.call(Seed.connection(member), %{inputs | paginate: false})
    assert {:ok, limited} = Feed.call(Seed.connection(restricted), %{inputs | paginate: false})
    assert length(limited.activities) < length(all.activities)
    assert length(limited.activities) > 20
    sample = Runner.sample(member, inputs)
    assert sample.stages.query.query_count == 1
    assert sample.stages.handler.query_count > 1
    assert sample.ids == Enum.map(first.activities, & &1.id)
    Repo.delete!(Repo.get!(Operately.Activities.Activity, hd(Repo.all(Operately.Activities.Activity)).id))
    assert_raise RuntimeError, ~r/counts changed/, fn -> Seed.validate!(manifest) end
  end
end

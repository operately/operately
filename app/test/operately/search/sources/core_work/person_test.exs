defmodule Operately.Search.Sources.CoreWork.PersonTest do
  use Operately.DataCase, async: true

  alias Operately.Access
  alias Operately.People.Person
  alias Operately.Search.Sources.CoreWork.Person, as: PersonSource
  alias Operately.Support.{Factory, RichText}

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_member(:person, name: "Taylor Reed", title: "VP of Product", description: RichText.rich_text("Unindexed biography"))
    |> Factory.add_company_member(:guest, name: "Morgan Lee", title: "Advisor", type: :guest)
  end

  test "indexes full name and company title but not profile description", ctx do
    attrs = entry_attrs(ctx.person.id)

    assert attrs.title == "Taylor Reed"
    assert attrs.body == "VP of Product"
    assert attrs.body_kind == "title"
    refute attrs.body =~ "biography"
    assert attrs.company_id == ctx.company.id
    assert attrs.access_context_id == Access.get_context!(company_id: ctx.company.id).id
    assert attrs.space_id == nil
    assert attrs.project_id == nil
    assert attrs.goal_id == nil
    assert attrs.state == nil
  end

  test "includes active guests and skips suspended people", ctx do
    assert {:ok, _attrs} = ctx.guest.id |> fetch_record() |> PersonSource.to_entry()

    suspended = update_person(ctx.person, %{suspended: true, suspended_at: DateTime.utc_now()})
    assert suspended.id |> fetch_record() |> PersonSource.to_entry() == :skip
  end

  test "uses stable UUID keyset pagination", _ctx do
    {:ok, [first]} = PersonSource.fetch_batch(nil, 1)
    {:ok, remaining} = PersonSource.fetch_batch(first.id, 10)

    assert Enum.all?(remaining, &(&1.id > first.id))
  end

  defp update_person(person, attrs) do
    person |> Person.changeset(attrs) |> Repo.update!()
  end

  defp entry_attrs(id) do
    assert {:ok, attrs} = id |> fetch_record() |> PersonSource.to_entry()
    attrs
  end

  defp fetch_record(id) do
    assert {:ok, [record]} = PersonSource.fetch_by_ids([id])
    record
  end
end

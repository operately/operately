defmodule Operately.KpisTest do
  use Operately.DataCase

  alias Operately.Kpis
  alias Operately.Kpis.Kpi
  alias Operately.Support.Factory

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:member, :space)
  end

  defp kpi_attrs(ctx, overrides \\ %{}) do
    Map.merge(
      %{
        name: "Monthly Revenue",
        unit: "USD",
        space_id: ctx.space.id,
        creator_id: ctx.creator.id
      },
      overrides
    )
  end

  describe "create_kpi/1" do
    test "creates a kpi with valid attrs", ctx do
      assert {:ok, kpi} = Kpis.create_kpi(kpi_attrs(ctx))
      assert kpi.name == "Monthly Revenue"
      assert kpi.unit == "USD"
      assert kpi.space_id == ctx.space.id
      assert kpi.creator_id == ctx.creator.id
    end

    test "returns an error changeset with invalid attrs", _ctx do
      assert {:error, changeset} = Kpis.create_kpi(%{})
      refute changeset.valid?
    end
  end

  describe "list_kpis/1" do
    test "returns only the kpis of the given space, excluding archived ones", ctx do
      {:ok, kpi} = Kpis.create_kpi(kpi_attrs(ctx))
      {:ok, archived} = Kpis.create_kpi(kpi_attrs(ctx, %{name: "Old"}))
      {:ok, _archived} = Kpis.archive_kpi(archived)

      ids = Kpis.list_kpis(ctx.space.id) |> Enum.map(& &1.id)

      assert ids == [kpi.id]
    end
  end

  describe "get_kpi!/1" do
    test "returns the kpi with the given id", ctx do
      {:ok, kpi} = Kpis.create_kpi(kpi_attrs(ctx))
      assert Kpis.get_kpi!(kpi.id).id == kpi.id
    end
  end

  describe "update_kpi/2" do
    test "updates the kpi", ctx do
      {:ok, kpi} = Kpis.create_kpi(kpi_attrs(ctx))
      assert {:ok, updated} = Kpis.update_kpi(kpi, %{name: "New Name"})
      assert updated.name == "New Name"
    end
  end

  describe "archive_kpi/1" do
    test "sets archived_at", ctx do
      {:ok, kpi} = Kpis.create_kpi(kpi_attrs(ctx))
      assert is_nil(kpi.archived_at)
      assert {:ok, archived} = Kpis.archive_kpi(kpi)
      assert %NaiveDateTime{} = archived.archived_at
    end
  end

  describe "kpi values" do
    test "create_kpi_value/1 and list_kpi_values/1 ordered by recorded_at", ctx do
      {:ok, kpi} = Kpis.create_kpi(kpi_attrs(ctx))

      {:ok, second} =
        Kpis.create_kpi_value(%{
          value: 20.0,
          recorded_at: ~N[2026-02-01 00:00:00],
          kpi_id: kpi.id,
          person_id: ctx.creator.id
        })

      {:ok, first} =
        Kpis.create_kpi_value(%{
          value: 10.0,
          recorded_at: ~N[2026-01-01 00:00:00],
          kpi_id: kpi.id,
          person_id: ctx.creator.id
        })

      ids = Kpis.list_kpi_values(kpi.id) |> Enum.map(& &1.id)

      assert ids == [first.id, second.id]
    end
  end

  describe "Kpi.get/2 access control" do
    test "space members can read the kpi", ctx do
      {:ok, kpi} = Kpis.create_kpi(kpi_attrs(ctx))

      assert {:ok, found} = Kpi.get(ctx.member, id: kpi.id)
      assert found.id == kpi.id
    end

    test "people without access cannot read the kpi", ctx do
      {:ok, kpi} = Kpis.create_kpi(kpi_attrs(ctx))
      outsider = Operately.PeopleFixtures.person_fixture(%{company_id: ctx.company.id})

      assert {:error, :not_found} = Kpi.get(outsider, id: kpi.id)
    end

    test "system requester can always read the kpi", ctx do
      {:ok, kpi} = Kpis.create_kpi(kpi_attrs(ctx))

      assert {:ok, found} = Kpi.get(:system, id: kpi.id)
      assert found.id == kpi.id
    end
  end
end

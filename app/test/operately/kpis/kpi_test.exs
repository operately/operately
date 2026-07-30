defmodule Operately.Kpis.KpiTest do
  use Operately.DataCase

  alias Operately.Kpis.Kpi

  describe "changeset" do
    test "requires company_id, space_id and name" do
      changeset = Kpi.changeset(%{})

      refute changeset.valid?
      assert %{company_id: _, space_id: _, name: _} = errors_on(changeset)
    end

    test "is valid with the required fields" do
      changeset =
        Kpi.changeset(%{
          company_id: Ecto.UUID.generate(),
          space_id: Ecto.UUID.generate(),
          name: "Monthly Revenue",
          unit: "$",
          target: 1000.0
        })

      assert changeset.valid?
    end
  end

  describe "scopes" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_space(:other_space)
    end

    test "scope_space/2 returns only KPIs in the given space", ctx do
      {:ok, kpi} =
        Operately.Operations.CreateKpi.run(ctx.creator, ctx.space, %{name: "Revenue"})

      {:ok, _other} =
        Operately.Operations.CreateKpi.run(ctx.creator, ctx.other_space, %{name: "Churn"})

      ids =
        Kpi
        |> Kpi.scope_space(ctx.space.id)
        |> Repo.all()
        |> Enum.map(& &1.id)

      assert ids == [kpi.id]
    end
  end
end

defmodule Operately.Kpis.KpiTest do
  use Operately.DataCase

  alias Operately.Kpis.Kpi
  alias Operately.Support.Factory

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  describe "changeset/1" do
    test "is valid with the required fields", ctx do
      changeset =
        Kpi.changeset(%{
          name: "Monthly Revenue",
          unit: "USD",
          space_id: ctx.space.id,
          creator_id: ctx.creator.id
        })

      assert changeset.valid?
    end

    test "requires name, unit, space_id and creator_id" do
      changeset = Kpi.changeset(%{})

      refute changeset.valid?
      assert %{name: ["can't be blank"]} = errors_on(changeset)
      assert %{unit: ["can't be blank"]} = errors_on(changeset)
      assert %{space_id: ["can't be blank"]} = errors_on(changeset)
      assert %{creator_id: ["can't be blank"]} = errors_on(changeset)
    end
  end
end

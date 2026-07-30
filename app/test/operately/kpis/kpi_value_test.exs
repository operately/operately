defmodule Operately.Kpis.KpiValueTest do
  use Operately.DataCase

  alias Operately.Kpis.KpiValue
  alias Operately.Support.Factory

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)

    {:ok, kpi} =
      Operately.Kpis.create_kpi(%{
        name: "Signups",
        unit: "count",
        space_id: ctx.space.id,
        creator_id: ctx.creator.id
      })

    Map.put(ctx, :kpi, kpi)
  end

  describe "changeset/1" do
    test "is valid with the required fields", ctx do
      changeset =
        KpiValue.changeset(%{
          value: 42.0,
          kpi_id: ctx.kpi.id,
          person_id: ctx.creator.id
        })

      assert changeset.valid?
    end

    test "requires value, kpi_id and person_id" do
      changeset = KpiValue.changeset(%{})

      refute changeset.valid?
      assert %{value: ["can't be blank"]} = errors_on(changeset)
      assert %{kpi_id: ["can't be blank"]} = errors_on(changeset)
      assert %{person_id: ["can't be blank"]} = errors_on(changeset)
    end

    test "rejects a non-numeric value", ctx do
      changeset =
        KpiValue.changeset(%{
          value: "not-a-number",
          kpi_id: ctx.kpi.id,
          person_id: ctx.creator.id
        })

      refute changeset.valid?
      assert %{value: ["is invalid"]} = errors_on(changeset)
    end

    test "defaults recorded_at to now when not supplied", ctx do
      changeset =
        KpiValue.changeset(%{
          value: 10.0,
          kpi_id: ctx.kpi.id,
          person_id: ctx.creator.id
        })

      assert %NaiveDateTime{} = Ecto.Changeset.get_field(changeset, :recorded_at)
    end

    test "keeps recorded_at when supplied", ctx do
      recorded_at = ~N[2026-01-01 12:00:00]

      changeset =
        KpiValue.changeset(%{
          value: 10.0,
          recorded_at: recorded_at,
          kpi_id: ctx.kpi.id,
          person_id: ctx.creator.id
        })

      assert Ecto.Changeset.get_field(changeset, :recorded_at) == recorded_at
    end
  end
end

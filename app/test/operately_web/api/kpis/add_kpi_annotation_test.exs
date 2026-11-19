defmodule OperatelyWeb.Api.Kpis.AddKpiAnnotationTest do
  use OperatelyWeb.TurboCase

  import Operately.KpisFixtures
  import Ecto.Query
  import Mock

  alias Operately.Kpis
  alias Operately.Activities.Activity

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:kpis, :add_kpi_annotation], %{})
    end
  end

  describe "add_kpi_annotation" do
    setup ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_space(:space)
        |> Factory.add_space_member(:member, :space)
        |> Factory.add_space_member(:champion, :space)
        |> Factory.add_company_member(:outsider)

      kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id, champion_id: ctx.champion.id)
      Map.put(ctx, :kpi, kpi)
    end

    test "any space member can add an annotation", ctx do
      ctx = Factory.log_in_person(ctx, :member)

      inputs = %{
        kpi_id: Paths.kpi_id(ctx.kpi),
        date: "2026-03-15",
        title: "Launched enterprise plan"
      }

      assert {200, res} = mutation(ctx.conn, [:kpis, :add_kpi_annotation], inputs)

      assert res.annotation.title == "Launched enterprise plan"
      assert res.annotation.date == "2026-03-15"

      assert [annotation] = Kpis.list_annotations(ctx.kpi.id)
      assert annotation.title == "Launched enterprise plan"
      assert annotation.created_by_id == ctx.member.id
    end

    test "invalid titles return bad request without adding annotations or activities", ctx do
      ctx = Factory.log_in_person(ctx, :member)

      for title <- [String.duplicate("a", 81), "", " \t\n "] do
        inputs = %{kpi_id: Paths.kpi_id(ctx.kpi), date: "2026-03-15", title: title}

        assert {400, _} = mutation(ctx.conn, [:kpis, :add_kpi_annotation], inputs)
        assert Kpis.list_annotations(ctx.kpi.id) == []
        refute Repo.exists?(from(a in Activity, where: a.action == "kpi_annotation_added" and a.content["kpi_id"] == ^ctx.kpi.id))
      end
    end

    test "transaction failures outside annotation validation return internal server error", ctx do
      ctx = Factory.log_in_person(ctx, :member)
      inputs = %{kpi_id: Paths.kpi_id(ctx.kpi), date: "2026-03-15", title: "Launch"}

      with_mock Operately.Operations.KpiAnnotationAdding, run: fn _, _, _ -> {:error, :activity, %Ecto.Changeset{}, %{}} end do
        assert {500, _} = mutation(ctx.conn, [:kpis, :add_kpi_annotation], inputs)
      end
    end

    test "accepts an 80-character title after trimming whitespace", ctx do
      ctx = Factory.log_in_person(ctx, :member)
      title = String.duplicate("a", 80)
      inputs = %{kpi_id: Paths.kpi_id(ctx.kpi), date: "2026-03-15", title: "  #{title}  "}

      assert {200, res} = mutation(ctx.conn, [:kpis, :add_kpi_annotation], inputs)
      assert res.annotation.title == title
      assert [annotation] = Kpis.list_annotations(ctx.kpi.id)
      assert annotation.title == title
    end

    test "a non-space-member cannot add an annotation", ctx do
      ctx = Factory.log_in_person(ctx, :outsider)

      inputs = %{kpi_id: Paths.kpi_id(ctx.kpi), date: "2026-03-15", title: "Launched enterprise plan"}
      assert {404, _} = mutation(ctx.conn, [:kpis, :add_kpi_annotation], inputs)
      assert Kpis.list_annotations(ctx.kpi.id) == []
    end
  end
end

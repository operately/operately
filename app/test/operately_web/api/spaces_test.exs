defmodule OperatelyWeb.Api.SpacesTest do
  use OperatelyWeb.TurboCase

  setup ctx do
    ctx |> Factory.setup()
  end

  describe "search" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:spaces, :search], %{})
    end

    test "it returns spaces matching the query", ctx do
      ctx = Factory.add_space(ctx, :product, name: "Product Space")
      ctx = Factory.add_space(ctx, :marketing, name: "Marketing Space")
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = query(ctx.conn, [:spaces, :search], %{query: "Product"})
      assert length(res.spaces) == 1
      assert res.spaces |> hd() |> Map.get(:name) == "Product Space"
    end
  end
end

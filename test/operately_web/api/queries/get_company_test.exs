defmodule OperatelyWeb.Api.Queries.GetCompanyTest do
  use OperatelyWeb.TurboCase

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_company, %{id: "1"})
    end
  end
end 

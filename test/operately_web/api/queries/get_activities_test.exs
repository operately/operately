defmodule OperatelyWeb.Api.Queries.GetActivitiesTest do
  use OperatelyWeb.TurboCase

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_activities, %{})
    end
  end

  describe "get_activities functionality" do
    setup :register_and_log_in_account
  end
end 

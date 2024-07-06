defmodule OperatelyWeb.Api.HelpersTest do
  use Operately.DataCase
  alias OperatelyWeb.Api.Helpers

  describe "id_with_comments/2" do
    setup do
       %{id: Operately.ShortUuid.generate()}
    end

    test "returns the id with comments", ctx do
      assert Helpers.id_with_comments("hello", ctx.id) == "hello-#{ctx.id}"
    end

    test "doesn't create multiple dashes", ctx do
      assert Helpers.id_with_comments("hello  there", ctx.id) == "hello-there-#{ctx.id}"
    end

    test "takes at most 25 characters", ctx do
      title = "✨ New: Setting Goals, Listing My Projects, Viewing the Org Chart, Discussions and more"

      assert Helpers.id_with_comments(title, ctx.id) == "new-setting-goals-listing-#{ctx.id}"
    end
  end
end

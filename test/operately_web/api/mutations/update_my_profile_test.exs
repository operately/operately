defmodule OperatelyWeb.Api.Mutations.UpdateMyProfileTest do
  use OperatelyWeb.TurboCase

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :update_my_profile, %{})
    end
  end

  describe "update_my_profile functionality" do
    setup :register_and_log_in_account

    test "it updates the profile", ctx do
      person = ctx.person

      assert {200, %{me: %{}}} = mutation(ctx.conn, :update_my_profile, %{
        full_name: "John Doe",
        title: "Software Engineer",
        timezone: "America/New_York",
        avatar_url: "https://example.com/avatar.jpg",
      })

      person = Operately.People.get_person!(person.id)

      assert person.full_name == "John Doe"
      assert person.title == "Software Engineer"
      assert person.timezone == "America/New_York"
      assert person.avatar_url == "https://example.com/avatar.jpg"
    end
  end
end 

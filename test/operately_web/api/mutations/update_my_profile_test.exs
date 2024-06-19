defmodule OperatelyWeb.Api.Mutations.UpdateMyProfileTest do
  use OperatelyWeb.TurboCase

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :update_my_profile, %{})
    end

    test "if extra fields are provided, it is an error and won't update the profile", ctx do
      assert {400, "Unknown input field: password"} = mutation(ctx.conn, :update_my_profile, %{password: "hack"})
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

    test "update the theme", ctx do
      person = ctx.person

      assert {200, %{me: %{}}} = mutation(ctx.conn, :update_my_profile, %{theme: "dark"})
      person = Operately.People.get_person!(person.id)
      assert person.theme == "dark"

      assert {200, %{me: %{}}} = mutation(ctx.conn, :update_my_profile, %{theme: "light"})
      person = Operately.People.get_person!(person.id)
      assert person.theme == "light"
    end

    test "inputs that are not provided are not updated", ctx do
      person = ctx.person

      assert {200, %{me: %{}}} = mutation(ctx.conn, :update_my_profile, %{full_name: "John Doe"})

      person = Operately.People.get_person!(person.id)

      assert person.full_name == "John Doe"
      assert person.title == ctx.person.title
      assert person.timezone == ctx.person.timezone
      assert person.avatar_url == ctx.person.avatar_url
    end
  end
end 

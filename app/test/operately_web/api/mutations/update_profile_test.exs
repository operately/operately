defmodule OperatelyWeb.Api.Mutations.UpdateProfileTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :update_profile, %{})
    end

    test "if extra fields are provided, it is an error and won't update the profile", ctx do
      assert {400, "Unknown input field: password"} = mutation(ctx.conn, :update_profile, %{password: "hack"})
    end
  end

  describe "updating someone else's profile" do
    setup :register_and_log_in_account

    setup ctx do
      person = person_fixture(%{
        company_id: ctx.company.id,
        full_name: "Jane Doe",
        title: "Software Engineer",
        timezone: "America/New_York",
        theme: "light",
      })

      Map.put(ctx, :company_member, person)
    end

    test "when I'm an admin, it updates the profile", ctx do
      promote_me_to_admin(ctx)

      assert {200, %{person: %{}}} = mutation(ctx.conn, :update_profile, %{
        id: Paths.person_id(ctx.company_member),
        full_name: "John Doe",
        title: "Software Developer",
        timezone: "America/New_Jersey",
      })

      person = Operately.People.get_person!(ctx.company_member.id)

      assert person.full_name == "John Doe"
      assert person.title == "Software Developer"
      assert person.timezone == "America/New_Jersey"
    end

    test "when I'm not an admin, it doesn't update the profile", ctx do
      assert {403, %{}} = mutation(ctx.conn, :update_profile, %{
        id: Paths.person_id(ctx.company_member),
        full_name: "John Doe",
        title: "Software Developer",
        timezone: "America/New_Jersey",
      })

      person = Operately.People.get_person!(ctx.company_member.id)

      assert person.full_name == "Jane Doe"
      assert person.title == "Software Engineer"
      assert person.timezone == "America/New_York"
    end

    test "you can't update the theme of someone else", ctx do
      promote_me_to_admin(ctx)

      assert {200, %{person: %{}}} = mutation(ctx.conn, :update_profile, %{id: Paths.person_id(ctx.company_member), theme: "dark"})
      person = Operately.People.get_person!(ctx.company_member.id)
      assert person.theme == "light"
    end
  end

  describe "updating my own profile" do
    setup :register_and_log_in_account

    test "it updates the profile", ctx do
      assert {200, %{person: %{}}} = mutation(ctx.conn, :update_profile, %{
        id: Paths.person_id(ctx.person),
        full_name: "John Doe",
        title: "Software Engineer",
        timezone: "America/New_York",
      })

      person = Operately.People.get_person!(ctx.person.id)

      assert person.full_name == "John Doe"
      assert person.title == "Software Engineer"
      assert person.timezone == "America/New_York"
    end

    test "update the theme", ctx do
      assert {200, %{person: %{}}} = mutation(ctx.conn, :update_profile, %{id: Paths.person_id(ctx.person), theme: "dark"})
      person = Operately.People.get_person!(ctx.person.id)
      assert person.theme == "dark"

      assert {200, %{person: %{}}} = mutation(ctx.conn, :update_profile, %{id: Paths.person_id(ctx.person), theme: "light"})
      person = Operately.People.get_person!(ctx.person.id)
      assert person.theme == "light"
    end

    test "inputs that are not provided are not updated", ctx do
      person = ctx.person

      assert {200, %{person: %{}}} = mutation(ctx.conn, :update_profile, %{id: Paths.person_id(person), full_name: "John Doe"})

      person = Operately.People.get_person!(person.id)

      assert person.full_name == "John Doe"
      assert person.title == ctx.person.title
      assert person.timezone == ctx.person.timezone
    end
  end

  defp promote_me_to_admin(ctx) do
    group = Operately.Access.get_group!(company_id: ctx.company.id, tag: :full_access)
    cs = Operately.Access.GroupMembership.changeset(%{group_id: group.id, person_id: ctx.person.id})
    Operately.Repo.insert(cs)
  end
end 

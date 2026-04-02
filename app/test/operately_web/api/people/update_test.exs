defmodule OperatelyWeb.Api.People.UpdateTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures

  alias Operately.Support.RichText

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:people, :update], %{})
    end

    test "if extra fields are provided, it is an error and won't update the profile", ctx do
      assert {400, %{message: "Unknown input field: password"}} = mutation(ctx.conn, [:people, :update], %{password: "hack"})
    end
  end

  describe "updating someone else's profile" do
    setup :register_and_log_in_account

    setup ctx do
      person =
        person_fixture(%{
          company_id: ctx.company.id,
          full_name: "Jane Doe",
          title: "Software Engineer",
          timezone: "America/New_York",
          theme: "light"
        })

      Map.put(ctx, :company_member, person)
    end

    test "when I'm an admin, it updates the profile", ctx do
      promote_me_to_admin(ctx)

      assert {200, %{person: %{}}} =
               mutation(ctx.conn, [:people, :update], %{
                 id: Paths.person_id(ctx.company_member),
                 full_name: "John Doe",
                 title: "Software Developer",
                 timezone: "America/New_Jersey"
               })

      person = Operately.People.get_person!(ctx.company_member.id)

      assert person.full_name == "John Doe"
      assert person.title == "Software Developer"
      assert person.timezone == "America/New_Jersey"
    end

    test "when I'm an admin, it ignores description changes", ctx do
      promote_me_to_admin(ctx)

      {:ok, _} = Operately.People.update_person(ctx.company_member, %{description: RichText.rich_text("Original description")})

      assert {200, %{person: %{}}} =
               mutation(ctx.conn, [:people, :update], %{
                 id: Paths.person_id(ctx.company_member),
                 description: RichText.rich_text("New description", :as_string)
               })

      person = Operately.People.get_person!(ctx.company_member.id)

      assert person.description == RichText.rich_text("Original description")
    end

    test "when I'm not an admin, it doesn't update the profile", ctx do
      assert {403, %{}} =
               mutation(ctx.conn, [:people, :update], %{
                 id: Paths.person_id(ctx.company_member),
                 full_name: "John Doe",
                 title: "Software Developer",
                 timezone: "America/New_Jersey"
               })

      person = Operately.People.get_person!(ctx.company_member.id)

      assert person.full_name == "Jane Doe"
      assert person.title == "Software Engineer"
      assert person.timezone == "America/New_York"
    end
  end

  describe "updating my own profile" do
    setup :register_and_log_in_account

    test "it updates the profile", ctx do
      assert {200, %{person: %{}}} =
               mutation(ctx.conn, [:people, :update], %{
                 id: Paths.person_id(ctx.person),
                 full_name: "John Doe",
                 title: "Software Engineer",
                 timezone: "America/New_York"
               })

      person = Operately.People.get_person!(ctx.person.id)

      assert person.full_name == "John Doe"
      assert person.title == "Software Engineer"
      assert person.timezone == "America/New_York"
    end

    test "it updates the description", ctx do
      assert {200, %{person: %{}}} =
               mutation(ctx.conn, [:people, :update], %{
                 id: Paths.person_id(ctx.person),
                 description: RichText.rich_text("Bio goes here", :as_string)
               })

      person = Operately.People.get_person!(ctx.person.id)

      assert person.description == RichText.rich_text("Bio goes here")
    end

    test "inputs that are not provided are not updated", ctx do
      person = ctx.person

      assert {200, %{person: %{}}} = mutation(ctx.conn, [:people, :update], %{id: Paths.person_id(person), full_name: "John Doe"})

      person = Operately.People.get_person!(person.id)

      assert person.full_name == "John Doe"
      assert person.title == ctx.person.title
      assert person.timezone == ctx.person.timezone
    end

    test "it updates notification preferences", ctx do
      assert {200, %{person: %{}}} =
               mutation(ctx.conn, [:people, :update], %{
                 id: Paths.person_id(ctx.person),
                 notify_about_assignments: false,
                 send_daily_summary: false,
                 email_preference: "mentions_only",
                 email_window_minutes: 30
               })

      person = Operately.People.get_person!(ctx.person.id)

      assert Operately.People.Person.email_preference(person) == :mentions_only
      assert Operately.People.Person.email_window_minutes(person) == 30
      refute Operately.People.Person.notify_about_assignments?(person)
      assert Operately.People.Person.notify_on_mention?(person)
      refute Operately.People.Person.send_daily_summary?(person)
    end

    test "it rejects invalid notification preferences", ctx do
      assert {400, %{}} =
               mutation(ctx.conn, [:people, :update], %{
                 id: Paths.person_id(ctx.person),
                 email_preference: "other",
                 email_window_minutes: 7
               })
    end
  end

  defp promote_me_to_admin(ctx) do
    group = Operately.Access.get_group!(company_id: ctx.company.id, tag: :full_access)
    cs = Operately.Access.GroupMembership.changeset(%{group_id: group.id, person_id: ctx.person.id})
    Operately.Repo.insert(cs)
  end
end

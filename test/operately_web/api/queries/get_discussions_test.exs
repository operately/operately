defmodule OperatelyWeb.Api.Queries.GetDiscussionsTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.UpdatesFixtures

  alias Operately.Access.Binding
  alias Operately.Support.RichText

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_discussions, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator})
    end

    test "company space - company members have access", ctx do
      discussions = Enum.map(1..3, fn _ ->
        create_discussion(ctx, space_id: ctx.company.company_space_id)
      end)
      space = Operately.Groups.get_group!(ctx.company.company_space_id)

      assert {200, res} = query(ctx.conn, :get_discussions, %{space_id: Paths.space_id(space)})
      assert_discussions(res, discussions)
    end

    test "company members have no access", ctx do
      space = create_space(ctx, company_permissions: Binding.no_access())
      Enum.each(1..3, fn _ ->
        create_discussion(ctx, space_id: space.id)
      end)

      assert {200, res} = query(ctx.conn, :get_discussions, %{space_id: Paths.space_id(space)})
      assert length(res.discussions) == 0
    end

    test "company members have access", ctx do
      space = create_space(ctx, company_permissions: Binding.view_access())
      discussions = Enum.map(1..3, fn _ ->
        create_discussion(ctx, space_id: space.id)
      end)

      assert {200, res} = query(ctx.conn, :get_discussions, %{space_id: Paths.space_id(space)})
      assert_discussions(res, discussions)
    end

    test "space members have access", ctx do
      space = create_space(ctx, company_permissions: Binding.no_access())
      discussions = Enum.map(1..3, fn _ ->
        create_discussion(ctx, space_id: space.id)
      end)

      assert {200, res} = query(ctx.conn, :get_discussions, %{space_id: Paths.space_id(space)})
      assert length(res.discussions) == 0

      add_person_to_space(ctx, space)

      assert {200, res} = query(ctx.conn, :get_discussions, %{space_id: Paths.space_id(space)})
      assert_discussions(res, discussions)
    end
  end

  #
  # Helpers
  #

  defp assert_discussions(res, discussions) do
    assert length(res.discussions) == length(discussions)
    Enum.each(res.discussions, fn d ->
      assert Enum.find(discussions, &(Paths.discussion_id(&1) == d.id))
      assert d.author
      assert d.body
      assert d.title
    end)
  end

  defp create_space(ctx, attrs) do
    group_fixture(ctx.creator, Enum.into(attrs, %{company_id: ctx.company.id}))
  end

  defp create_discussion(ctx, attrs) do
    update_fixture(%{
      author_id: ctx.creator.id,
      updatable_id: Keyword.get(attrs, :space_id, ctx.company.company_space_id),
      updatable_type: :space,
      type: :project_discussion,
      content: %{
        title: Keyword.get(attrs, :title, "Hello World"),
        body: Keyword.get(attrs, :body, "How are you doing?") |> RichText.rich_text()
      }
    })
  end

  defp add_person_to_space(ctx, space) do
    Operately.Groups.add_members(ctx.person, space.id, [%{
      id: ctx.person.id,
      permissions: Binding.view_access(),
    }])
  end
end

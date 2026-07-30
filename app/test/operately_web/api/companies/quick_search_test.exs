defmodule OperatelyWeb.Api.Companies.QuickSearchTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Repo
  alias Operately.Support.{Factory, RichText}

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space, name: "Searchable Space")
    |> Factory.add_messages_board(:board, :space)
    |> Factory.add_message(:discussion, :board, title: "Searchable Discussion")
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_document(:document, :hub, name: "Searchable Document")
  end

  test "requires authentication", ctx do
    assert {401, _} = query(ctx.conn, [:companies, :quick_search], query: "Searchable")
  end

  test "returns all eleven non-null groups", ctx do
    ctx = Factory.log_in_person(ctx, :creator)

    assert {200, result} = query(ctx.conn, [:companies, :quick_search], query: "Searchable")

    assert Enum.map(result.spaces, & &1.id) == [Paths.space_id(ctx.space)]

    assert result.discussions == [
             %{
               id: Paths.message_id(ctx.discussion),
               title: "Searchable Discussion",
               context: "Searchable Space"
             }
           ]

    assert result.documents == [
             %{
               id: Paths.document_id(ctx.document),
               name: "Searchable Document",
               context: "Searchable Space"
             }
           ]

    assert Map.keys(result) |> Enum.sort() ==
             ~w(discussions documents files folders goals links milestones people projects spaces tasks)a
  end

  test "returns the complete empty response for short and invalid queries", ctx do
    ctx = Factory.log_in_person(ctx, :creator)

    expected = %{
      spaces: [],
      projects: [],
      goals: [],
      milestones: [],
      tasks: [],
      people: [],
      discussions: [],
      folders: [],
      documents: [],
      files: [],
      links: []
    }

    assert {200, ^expected} = query(ctx.conn, [:companies, :quick_search], query: "a")
    assert {200, ^expected} = query(ctx.conn, [:companies, :quick_search], query: <<0, ?x>>)
  end

  test "does not return body-only matches or body fields", ctx do
    ctx.discussion
    |> Ecto.Changeset.change(body: RichText.rich_text("Body-only marker"))
    |> Repo.update!()

    ctx.document
    |> Ecto.Changeset.change(content: RichText.rich_text("Body-only marker"))
    |> Repo.update!()

    ctx = Factory.log_in_person(ctx, :creator)

    assert {200, result} = query(ctx.conn, [:companies, :quick_search], query: "Searchable")
    refute Map.has_key?(hd(result.discussions), :body)
    refute Map.has_key?(hd(result.documents), :content)

    assert {200, body_results} =
             query(ctx.conn, [:companies, :quick_search], query: "Body-only marker")

    assert body_results.discussions == []
    assert body_results.documents == []
  end

  test "applies live space permissions to discussions and resource hub items", ctx do
    ctx =
      ctx
      |> Factory.add_company_member(:viewer)
      |> Factory.add_space(:private_space, name: "Private Space", company_permissions: Binding.no_access())
      |> Factory.add_messages_board(:private_board, :private_space)
      |> Factory.add_message(:private_discussion, :private_board, title: "Permission Marker")
      |> Factory.add_resource_hub(:private_hub, :private_space, :creator)
      |> Factory.add_document(:private_document, :private_hub, name: "Permission Marker")
      |> Factory.log_in_person(:viewer)

    assert {200, result} = query(ctx.conn, [:companies, :quick_search], query: "Permission Marker")
    assert result.discussions == []
    assert result.documents == []

    context = Access.get_context!(group_id: ctx.private_space.id)
    assert {:ok, _binding} = Access.bind(context, person_id: ctx.viewer.id, level: Binding.view_access())

    assert {200, result} = query(ctx.conn, [:companies, :quick_search], query: "Permission Marker")
    assert Enum.map(result.discussions, & &1.id) == [Paths.message_id(ctx.private_discussion)]
    assert Enum.map(result.documents, & &1.id) == [Paths.document_id(ctx.private_document)]

    assert {:ok, _binding} = Access.unbind(context, person_id: ctx.viewer.id)

    assert {200, result} = query(ctx.conn, [:companies, :quick_search], query: "Permission Marker")
    assert result.discussions == []
    assert result.documents == []
  end

  test "does not return resources from another company", ctx do
    _other =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:other_space, name: "Other Space")
      |> Factory.add_messages_board(:other_board, :other_space)
      |> Factory.add_message(:other_discussion, :other_board, title: "Company Isolation Marker")
      |> Factory.add_resource_hub(:other_hub, :other_space, :creator)
      |> Factory.add_document(:other_document, :other_hub, name: "Company Isolation Marker")

    ctx = Factory.log_in_person(ctx, :creator)

    assert {200, result} = query(ctx.conn, [:companies, :quick_search], query: "Company Isolation Marker")
    assert result.discussions == []
    assert result.documents == []
  end
end

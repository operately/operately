defmodule Operately.Data.Change100FlattenCommentContentTest do
  use Operately.DataCase
  import Ecto.Query

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.CommentsFixtures

  alias Operately.Data.Change100FlattenCommentContent, as: Change
  alias Operately.Data.Change100FlattenCommentContent.Comment, as: DataComment
  alias Operately.Support.RichText
  alias Operately.Repo

  setup do
    company = company_fixture()
    author = person_fixture_with_account(%{company_id: company.id})

    {:ok, author: author}
  end

  test "run/0 flattens wrapped comment content and is idempotent", ctx do
    wrapped = comment_fixture(ctx.author, %{content: %{"message" => RichText.rich_text("wrapped content")}})
    wrapped_nil = comment_fixture(ctx.author, %{content: %{"message" => nil}})
    already_flat = comment_fixture(ctx.author, %{content: RichText.rich_text("already flat")})

    Change.run()

    assert fetch_content(wrapped.id) == RichText.rich_text("wrapped content")
    assert fetch_content(wrapped_nil.id) == %{}
    assert fetch_content(already_flat.id) == RichText.rich_text("already flat")

    Change.run()

    assert fetch_content(wrapped.id) == RichText.rich_text("wrapped content")
    assert fetch_content(wrapped_nil.id) == %{}
    assert fetch_content(already_flat.id) == RichText.rich_text("already flat")
  end

  test "flatten_content/1 handles string keys, atom keys, and already-flat content" do
    content = RichText.rich_text("hello")

    assert Change.flatten_content(%{"message" => content}) == content
    assert Change.flatten_content(%{message: content}) == content
    assert Change.flatten_content(%{message: nil}) == %{}
    assert Change.flatten_content(content) == content
  end

  defp fetch_content(comment_id) do
    from(c in DataComment, where: c.id == ^comment_id, select: c.content)
    |> Repo.one()
  end
end

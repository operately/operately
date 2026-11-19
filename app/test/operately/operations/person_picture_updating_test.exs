defmodule Operately.Operations.PersonPictureUpdatingTest do
  use Operately.DataCase

  alias Operately.Blobs.Blob
  alias Operately.Operations.PersonPictureUpdating

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_member(:person)
    |> Factory.add_blob(:blob)
  end

  test "attaches the author's upload to the target person", ctx do
    attrs = %{avatar_blob_id: ctx.blob.id, avatar_url: Blob.url(ctx.blob)}

    assert {:ok, person} = PersonPictureUpdating.run(ctx.creator, ctx.person, attrs)
    assert person.id == ctx.person.id
    assert person.avatar_blob_id == ctx.blob.id
    assert person.avatar_url == Blob.url(ctx.blob)
    assert Repo.reload(ctx.blob).status == :uploaded
  end

  test "rejects a foreign blob without changing either record", ctx do
    foreign = %{} |> Factory.setup() |> Factory.add_blob(:blob)
    attrs = %{avatar_blob_id: foreign.blob.id, avatar_url: Blob.url(foreign.blob)}

    assert {:error, :not_found} = PersonPictureUpdating.run(ctx.creator, ctx.person, attrs)
    assert Repo.reload(ctx.person).avatar_blob_id == nil
    assert Repo.reload(foreign.blob).status == :pending
  end

  test "rolls back the blob status when the person update fails", ctx do
    attrs = %{avatar_blob_id: ctx.blob.id, avatar_url: %{invalid: "url"}}

    assert {:error, %Ecto.Changeset{}} = PersonPictureUpdating.run(ctx.creator, ctx.person, attrs)
    assert Repo.reload(ctx.blob).status == :pending
    assert Repo.reload(ctx.person).avatar_blob_id == nil
  end
end

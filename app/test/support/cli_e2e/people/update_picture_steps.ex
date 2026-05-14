defmodule Operately.Support.CliE2E.People.UpdatePictureSteps do
  use Operately.Support.CliE2E

  alias Operately.Blobs
  alias Operately.Blobs.Blob
  alias Operately.People.Person
  alias Operately.Support.CliE2E.Helpers
  alias OperatelyWeb.Paths

  step :setup, ctx do
    previous = Helpers.enable_auth_methods()

    on_exit(fn ->
      Helpers.restore_auth_methods(previous)
    end)

    ctx = Factory.setup(ctx)
    ctx = Factory.add_api_token(ctx, :api_token, :creator, read_only: false)

    result =
      run_cli(ctx, [
        "auth",
        "login",
        "--token",
        ctx.api_token,
        "--base-url",
        ctx.cli_base_url,
        "--profile",
        "e2e"
      ])

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:profile, "e2e")
  end

  step :update_picture_from_mock_file, ctx do
    avatar_contents = <<137, 80, 78, 71, 13, 10, 26, 10, "operately-cli-avatar-payload">>
    avatar_file = create_temp_file!("operately-cli-avatar", avatar_contents, ".png")

    on_exit(fn ->
      _ = File.rm(avatar_file)
    end)

    result =
      run_cli(ctx, [
        "people",
        "update_picture",
        "--avatar-file",
        avatar_file
      ])

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:avatar_file, avatar_file)
    |> Map.put(:avatar_contents, avatar_contents)
  end

  step :assert_picture_updated_successfully, ctx do
    assert ctx.cli_result.exit_code == 0

    payload = Jason.decode!(ctx.cli_result.output)
    person_payload = payload["person"]

    assert is_map(person_payload)
    assert person_payload["id"] == Paths.person_id(ctx.creator)

    person = Repo.get!(Person, ctx.creator.id)

    assert person.avatar_blob_id
    assert person.avatar_url

    blob = Blobs.get_blob!(person.avatar_blob_id)

    on_exit(fn ->
      _ = File.rm(storage_path(blob))
    end)

    assert blob.status == :uploaded
    assert blob.filename == Path.basename(ctx.avatar_file)
    assert blob.content_type == "image/png"
    assert blob.size == byte_size(ctx.avatar_contents)
    assert person.avatar_url == Blob.url(blob)
    assert person_payload["avatar_url"] == Blob.url(blob)
    assert File.read!(storage_path(blob)) == ctx.avatar_contents

    ctx
    |> Map.put(:uploaded_avatar_blob, blob)
    |> Map.put(:creator, person)
  end

  step :given_an_existing_profile_picture, ctx do
    avatar_contents = "existing-avatar-payload"

    blob =
      Operately.BlobsFixtures.blob_fixture(%{
        author_id: ctx.creator.id,
        company_id: ctx.company.id,
        filename: "existing-avatar.png",
        content_type: "image/png",
        size: byte_size(avatar_contents),
        status: :uploaded
      })

    File.mkdir_p!(Path.dirname(storage_path(blob)))
    File.write!(storage_path(blob), avatar_contents)

    on_exit(fn ->
      _ = File.rm(storage_path(blob))
    end)

    {:ok, person} =
      Operately.People.update_person(ctx.creator, %{
        avatar_blob_id: blob.id,
        avatar_url: Blob.url(blob)
      })

    ctx
    |> Map.put(:creator, person)
    |> Map.put(:existing_avatar_blob, blob)
  end

  step :clear_the_profile_picture, ctx do
    result =
      run_cli(ctx, [
        "people",
        "update_picture",
        "--clear"
      ])

    Map.put(ctx, :cli_result, result)
  end

  step :assert_picture_cleared_successfully, ctx do
    assert ctx.cli_result.exit_code == 0

    payload = Jason.decode!(ctx.cli_result.output)
    person_payload = payload["person"]

    assert is_map(person_payload)
    assert person_payload["id"] == Paths.person_id(ctx.creator)
    assert is_nil(person_payload["avatar_url"])

    person = Repo.get!(Person, ctx.creator.id)
    assert is_nil(person.avatar_blob_id)
    assert is_nil(person.avatar_url)

    ctx
  end

  defp storage_path(%Blob{} = blob) do
    Path.join("/media", Blob.path(blob))
  end
end

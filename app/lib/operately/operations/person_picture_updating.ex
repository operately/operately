defmodule Operately.Operations.PersonPictureUpdating do
  alias Ecto.Multi
  alias Operately.Blobs
  alias Operately.People
  alias Operately.Repo

  def run(author, person, attrs) do
    blob_ids = if attrs.avatar_blob_id, do: [attrs.avatar_blob_id], else: []

    Multi.new()
    |> Multi.run(:blobs, fn _, _ -> Blobs.lock_for_attachment(author, blob_ids) end)
    |> Multi.run(:blob, fn _, changes -> maybe_mark_blob_uploaded(changes.blobs, attrs.avatar_blob_id) end)
    |> Multi.run(:person, fn _, _ -> People.update_person(person, Map.take(attrs, [:avatar_blob_id, :avatar_url])) end)
    |> Repo.transaction()
    |> case do
      {:ok, %{person: person}} ->
        OperatelyWeb.Api.Subscriptions.ProfileUpdated.broadcast(person_id: person.id)
        {:ok, person}

      {:error, _, reason, _} ->
        {:error, reason}
    end
  end

  defp maybe_mark_blob_uploaded(_blobs, nil), do: {:ok, nil}
  defp maybe_mark_blob_uploaded(blobs, blob_id) do
    blob = Map.fetch!(blobs, Ecto.UUID.cast!(blob_id))
    Blobs.update_blob(blob, %{status: :uploaded})
  end
end

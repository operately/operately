defmodule Operately.BlobsFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Operately.Blobs` context.
  """

  @doc """
  Generate a blob.
  """
  def blob_fixture(attrs \\ %{}) do
    {:ok, blob} =
      attrs
      |> Enum.into(%{
        filename: "some filename",
        status: :pending,
        storage_type: :local  # Adiciona storage_type padrão
      })
      |> Operately.Blobs.create_blob()

    blob
  end
end

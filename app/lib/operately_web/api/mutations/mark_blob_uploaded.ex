defmodule OperatelyWeb.Api.Mutations.MarkBlobUploaded do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Billing
  alias Operately.Blobs
  alias Operately.Blobs.Blob

  inputs do
    field :blob_id, :id, null: false
  end

  outputs do
    field :blob, :blob, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:company, fn -> {:ok, conn.assigns[:current_company]} end)
    |> run(:account, fn -> find_account(conn) end)
    |> run(:blob, fn -> fetch_blob(inputs.blob_id) end)
    |> run(:permissions, fn ctx -> authorize(ctx.blob, ctx.account, conn.assigns[:current_person]) end)
    |> run(:previous_storage_usage, fn ctx -> previous_storage_usage(ctx.blob, ctx.company) end)
    |> run(:updated_blob, fn ctx -> mark_uploaded(ctx.blob) end)
    |> run(:near_limit_warning, fn ctx -> maybe_enqueue_near_limit_warning(ctx.blob, ctx.updated_blob, ctx.previous_storage_usage, ctx.company) end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, %{blob: Serializer.serialize(ctx.updated_blob)}}
      {:error, :blob, %{error: :not_found}} -> {:error, :not_found}
      {:error, :permissions, %{error: :forbidden}} -> {:error, :forbidden}
      {:error, :updated_blob, %{error: :invalid_status}} -> {:error, :bad_request, "Blob cannot be marked as uploaded from its current state"}
      _ -> {:error, :internal_server_error}
    end
  end

  defp fetch_blob(id) do
    case Repo.get(Blob, id) do
      nil -> {:error, :not_found}
      blob -> {:ok, blob}
    end
  end

  defp authorize(%Blob{purpose: :company_transfer_import_artifact} = blob, account, _person) do
    if blob.account_id == account.id do
      {:ok, :allowed}
    else
      {:error, :forbidden}
    end
  end

  defp authorize(blob, _account, person) when not is_nil(person) do
    if blob.author_id == person.id do
      {:ok, :allowed}
    else
      {:error, :forbidden}
    end
  end

  defp authorize(_blob, _account, _person), do: {:error, :forbidden}

  defp mark_uploaded(%Blob{status: :pending} = blob), do: Blobs.update_blob(blob, %{status: :uploaded})
  defp mark_uploaded(%Blob{status: :uploaded} = blob), do: {:ok, blob}
  defp mark_uploaded(%Blob{}), do: {:error, :invalid_status}

  defp previous_storage_usage(%Blob{company_id: company_id, purpose: :company_file, status: :pending}, %{id: company_id} = company) do
    {:ok, Billing.company_storage_bytes(company)}
  end

  defp previous_storage_usage(_blob, _company), do: {:ok, nil}

  defp maybe_enqueue_near_limit_warning(
         %Blob{company_id: company_id, purpose: :company_file, status: :pending},
         %Blob{status: :uploaded},
         previous_storage_usage,
         %{id: company_id} = company
       )
       when is_integer(previous_storage_usage) do
    Billing.maybe_enqueue_near_limit_warning_email(company, :storage_bytes, previous_storage_usage,
      current_usage: Billing.company_storage_bytes(company)
    )

    {:ok, :queued}
  end

  defp maybe_enqueue_near_limit_warning(_blob, _updated_blob, _previous_storage_usage, _company), do: {:ok, :skipped}
end

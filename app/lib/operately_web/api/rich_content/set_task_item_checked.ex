defmodule OperatelyWeb.Api.RichContent.SetTaskItemChecked do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.{Repo, RichContent.TaskItems}
  alias OperatelyWeb.Api.RichContent.Resources

  inputs do
    field :resource_type, :rich_text_resource_type, null: false
    field :resource_id, :id, null: false
    field :field, :rich_text_field, null: false
    field :item_path, list_of(:integer), null: false
    field :expected_content, :json, null: false
    field :checked, :boolean, null: false
  end

  outputs do
    field :success, :boolean, null: false
  end

  def call(conn, inputs) do
    with {:ok, _} <- find_me(conn) do
      Repo.transaction(fn -> update(conn, inputs) end)
      |> respond()
    else
      _ -> {:error, :unauthorized}
    end
  end

  defp update(conn, inputs) do
    with {:ok, record} <- Resources.load(conn, inputs.resource_type, inputs.resource_id, inputs.field),
         {:ok, locked} <- Repo.Locking.lock_for_update(Repo, record),
         {:ok, content} <- TaskItems.set_checked(Map.fetch!(locked, inputs.field), inputs.expected_content, inputs.item_path, inputs.checked),
         {:ok, _} <- save_if_changed(conn, inputs, locked, content) do
      %{success: true}
    else
      error -> Repo.rollback(error)
    end
  end

  defp save_if_changed(conn, inputs, record, content) do
    if Map.fetch!(record, inputs.field) == content do
      {:ok, record}
    else
      Resources.save(conn, inputs.resource_type, record, content)
    end
  end

  defp respond({:ok, result}), do: {:ok, result}
  defp respond({:error, {:error, :content_conflict}}), do: {:error, :bad_request, "The content has changed. Refresh and try again.", %{reason: "content_conflict"}}
  defp respond({:error, {:error, :invalid_task_item}}), do: {:error, :bad_request, "The selected task item no longer exists"}
  defp respond({:error, {:error, :unauthorized}}), do: {:error, :forbidden}
  defp respond({:error, {:error, reason}}) when reason in [:not_found, :forbidden, :bad_request], do: {:error, reason}
  defp respond({:error, {:error, reason, message}}), do: {:error, reason, message}
  defp respond(_), do: {:error, :internal_server_error}
end

defmodule OperatelyWeb.Api.Ids do
  def decode_id(id) when id == nil or id == "" do
    {:ok, nil}
  end

  def decode_id(id) when is_binary(id) do
    remove_comments(id)
    |> Operately.ShortUuid.decode()
    |> handle_error()
  end

  def decode_company_id(id) when id == nil do
    {:ok, nil}
  end

  def decode_company_id(id) do
    remove_comments(id)
    |> Operately.Companies.ShortId.decode()
    |> handle_error()
  end

  defp remove_comments(id) do
    id |> String.split("-") |> List.last()
  end

  defp handle_error({:ok, id}), do: {:ok, id}
  defp handle_error(:error), do: {:error, 422, "Invalid id format"}
end

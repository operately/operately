defmodule OperatelyWeb.Api.Types.CompanyId do
  def decode(id) when id == nil do
    {:ok, nil}
  end

  def decode(id) do
    remove_comments(id)
    |> Operately.Companies.ShortId.decode()
    |> handle_error()
  end

  defp remove_comments(id) do
    id |> String.split("-") |> List.last()
  end

  defp handle_error({:ok, id}), do: {:ok, id}
  defp handle_error({:error, _}), do: {:error, "Invalid id format"}
  defp handle_error(:error), do: {:error, "Invalid id format"}
end

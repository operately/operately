defmodule TurboConnect.Plugs.RequiredFieldValidator do
  @moduledoc """
  This plug is used to validate the required fields in the request inputs.
  This plug should be used after the `ParseInputs` plug.
  """

  use Plug.Builder

  def init(_), do: []

  def call(conn, _opts) do
    inputs_specs = conn.assigns.turbo_req_handler.__inputs__()
    actual_inputs = conn.assigns.turbo_inputs

    case missing_required_fields?(inputs_specs, actual_inputs) do
      [] -> conn
      missing_fields -> missing_fields_response(conn, missing_fields)
    end
  end

  defp missing_fields_response(conn, missing_fields) do
    missing_fields_str = Enum.join(missing_fields, ", ")
    message = "Missing required fields: #{missing_fields_str}"

    conn
    |> put_resp_content_type("application/json")
    |> send_resp(400, Jason.encode!(%{error: "Bad request", message: message}))
    |> halt()
  end

  defp missing_required_fields?(input_specs, actual_inputs) do
    input_specs.fields
    |> Enum.filter(fn f -> is_missing?(f, actual_inputs) end)
    |> Enum.map(fn {name, _, _} -> name end)
  end

  defp is_missing?({name, type, opts}, actual_inputs) do
    if opts[:required] do
      cond do
        is_nil(actual_inputs[name]) -> true
        type == :string && actual_inputs[name] == "" -> true
        true -> false
      end
    else
      false
    end
  end
end

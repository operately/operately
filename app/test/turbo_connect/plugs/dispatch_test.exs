defmodule TurboConnect.Plugs.DispatchTest do
  use ExUnit.Case, async: true

  defmodule Handler do
    def call(conn, _inputs), do: conn.assigns.result
  end

  defmodule Api do
    def prepare_inputs(_conn, inputs), do: inputs
  end

  test "default errors translate without changing protocol error categories or status" do
    cases = [
      {:not_found, 404, "Not found", "O recurso solicitado não foi encontrado"},
      {:forbidden, 403, "Forbidden", "Você não tem permissão para realizar esta ação"},
      {:bad_request, 400, "Bad request", "A solicitação está malformada"},
      {:unauthorized, 401, "Unauthorized", "Autenticação necessária"},
      {:internal_server_error, 500, "Internal server error", "Ocorreu um erro inesperado"}
    ]

    Gettext.with_locale(OperatelyWeb.Gettext, "pt_BR", fn ->
      for {reason, status, error, message} <- cases do
        response = dispatch({:error, reason})
        assert response.status == status
        assert Jason.decode!(response.resp_body) == %{"error" => error, "message" => message}
      end
    end)
  end

  test "custom error messages and machine details are passed through literally" do
    Gettext.with_locale(OperatelyWeb.Gettext, "pt_BR", fn ->
      response = dispatch({:error, :bad_request, "Literal <name>", %{reason: "version_conflict"}})
      assert Jason.decode!(response.resp_body) == %{"error" => "Bad request", "message" => "Literal <name>", "details" => %{"reason" => "version_conflict"}}
    end)
  end

  defp dispatch(result) do
    Plug.Test.conn(:post, "/")
    |> Plug.Conn.assign(:turbo_api, Api)
    |> Plug.Conn.assign(:turbo_inputs, %{})
    |> Plug.Conn.assign(:turbo_req_handler, Handler)
    |> Plug.Conn.assign(:turbo_req_name, "example")
    |> Plug.Conn.assign(:result, result)
    |> TurboConnect.Plugs.Dispatch.call([])
  end
end

defmodule OperatelyWeb.HealthController do
  use OperatelyWeb, :controller

  @doc """
  If the certification mode is auto, the health check will
  return unhealthy if the certification is not yet retrived
  from Let's Encrypt
  """
  def index(conn, _params) do
    if OperatelyWeb.Certification.mode() == :auto do
      case OperatelyWeb.Certification.status() do
        :ready -> return_healthy(conn)
        _ -> return_unhealthy(conn, "SSL certificate not yet retrieved")
      end
    else
      return_healthy(conn)
    end
  rescue
    _ -> return_unhealthy(conn, "An error occurred")
  end

  defp return_healthy(conn) do
    conn |> put_status(:ok) |> text("HEALTHY")
  end

  defp return_unhealthy(conn, message) do
    conn |> put_status(:service_unavailable) |> text("UNHEALTHY: #{message}")
  end
end

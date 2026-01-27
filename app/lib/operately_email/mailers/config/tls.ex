defmodule OperatelyEmail.Mailers.Config.TLS do
  @moduledoc false

  def options(host \\ System.get_env("SMTP_SERVER")) do
    [
      verify: :verify_peer,
      depth: 3,
      versions: [:"tlsv1.2"]
    ]
    |> maybe_add_hostname_verification(host)
    |> add_certificate_options()
  end

  defp maybe_add_hostname_verification(options, host) do
    case host do
      host when host not in [nil, ""] ->
        options ++
          [
            server_name_indication: String.to_charlist(host),
            customize_hostname_check: [
              match_fun: :public_key.pkix_verify_hostname_match_fun(:https)
            ]
          ]

      _ ->
        options
    end
  end

  defp add_certificate_options(options) do
    cert_option =
      case System.get_env("SMTP_CACERTFILE") || default_cacertfile() do
        nil -> [cacerts: :public_key.cacerts_get()]
        cacertfile -> [cacertfile: cacertfile]
      end

    options ++ cert_option
  end

  defp default_cacertfile do
    [
      "/etc/ssl/certs/ca-certificates.crt",
      "/etc/ssl/cert.pem"
    ]
    |> Enum.find(fn path -> File.exists?(path) end)
  end
end

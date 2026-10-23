defmodule Operately.RuntimeConfigTest do
  use ExUnit.Case, async: false

  @variables ~w(
    POSTHOG_API_KEY OPERATELY_ANALYTICS_ENABLED OPERATELY_ANALYTICS_TOKEN OPERATELY_ANALYTICS_HOST
    OPERATELY_ANALYTICS_COOKIE_DOMAIN OPERATELY_HOST OPERATELY_URL_SCHEME OPERATELY_URL_PORT
    PORT DATABASE_URL SECRET_KEY_BASE CERT_AUTO_RENEW
  )

  setup do
    previous = Map.new(@variables, &{&1, System.get_env(&1)})
    Enum.each(@variables, &System.delete_env/1)

    on_exit(fn ->
      Enum.each(previous, fn
        {key, nil} -> System.delete_env(key)
        {key, value} -> System.put_env(key, value)
      end)
    end)
  end

  test "installations without a PostHog key stay disabled" do
    assert analytics_config()[:enabled] == false
    assert analytics_config()[:token] == nil

    System.put_env("POSTHOG_API_KEY", "  ")
    assert analytics_config()[:enabled] == false
  end

  test "the existing beacon key enables conversion tracking without new variables" do
    System.put_env("POSTHOG_API_KEY", "phc_existing_project")
    System.put_env("OPERATELY_HOST", "app.operately.com")
    config = runtime_config()

    assert config[:posthog_api_key] == "phc_existing_project"
    assert config[:conversion_analytics][:enabled] == true
    assert config[:conversion_analytics][:token] == "phc_existing_project"
    assert config[:conversion_analytics][:cookie_domain] == ".operately.com"
  end

  test "conversion tracking can be disabled without changing the beacon key" do
    System.put_env("POSTHOG_API_KEY", "phc_existing_project")
    System.put_env("OPERATELY_ANALYTICS_ENABLED", "false")
    config = runtime_config()

    assert config[:conversion_analytics][:enabled] == false
    assert config[:posthog_api_key] == "phc_existing_project"
  end

  test "explicit staging settings override defaults without changing beacons" do
    System.put_env(%{
      "POSTHOG_API_KEY" => "phc_existing_project",
      "OPERATELY_ANALYTICS_ENABLED" => "true",
      "OPERATELY_ANALYTICS_TOKEN" => "phc_staging_project",
      "OPERATELY_ANALYTICS_HOST" => "https://eu.i.posthog.com",
      "OPERATELY_ANALYTICS_COOKIE_DOMAIN" => ".example.com"
    })

    config = runtime_config()
    assert config[:posthog_api_key] == "phc_existing_project"
    assert config[:conversion_analytics][:enabled] == true
    assert config[:conversion_analytics][:token] == "phc_staging_project"
    assert config[:conversion_analytics][:host] == "https://eu.i.posthog.com"
    assert config[:conversion_analytics][:cookie_domain] == ".example.com"
  end

  test "a standalone analytics token requires explicit enablement" do
    System.put_env("OPERATELY_ANALYTICS_TOKEN", "phc_staging_project")
    assert analytics_config()[:enabled] == false

    System.put_env("OPERATELY_ANALYTICS_ENABLED", "true")
    assert analytics_config()[:enabled] == true
    assert analytics_config()[:token] == "phc_staging_project"
  end

  test "other installations do not inherit the production cookie domain" do
    System.put_env("POSTHOG_API_KEY", "phc_other_project")
    System.put_env("OPERATELY_HOST", "self-hosted.example.com")
    assert analytics_config()[:cookie_domain] == nil

    System.put_env("OPERATELY_HOST", "app.operately.com")
    System.put_env("OPERATELY_ANALYTICS_COOKIE_DOMAIN", "")
    assert analytics_config()[:cookie_domain] == ""
  end

  describe "production public URL" do
    setup do
      System.put_env(%{
        "DATABASE_URL" => "ecto://postgres:postgres@localhost/operately_test",
        "SECRET_KEY_BASE" => String.duplicate("a", 64),
        "OPERATELY_HOST" => "operately.example.com"
      })
    end

    test "defaults to HTTPS on port 443" do
      assert endpoint_config()[:url] == [host: "operately.example.com", port: 443, scheme: "https"]
    end

    test "plain HTTP uses public port 80 independently of the internal listener" do
      System.put_env("OPERATELY_URL_SCHEME", "http")
      System.put_env("PORT", "4100")

      config = endpoint_config()
      assert config[:url] == [host: "operately.example.com", port: 80, scheme: "http"]
      assert config[:http][:port] == 4100
    end

    test "proxy HTTPS does not require managed certificates" do
      System.put_env("OPERATELY_URL_SCHEME", "https")
      System.put_env("CERT_AUTO_RENEW", "no")

      assert endpoint_config()[:url] == [host: "operately.example.com", port: 443, scheme: "https"]
      assert endpoint_config()[:http][:port] == 4000
    end

    test "supports custom public ports for HTTP and HTTPS" do
      for {scheme, port} <- [{"http", 8080}, {"https", 8443}] do
        System.put_env("OPERATELY_URL_SCHEME", scheme)
        System.put_env("OPERATELY_URL_PORT", to_string(port))

        assert endpoint_config()[:url] == [host: "operately.example.com", port: port, scheme: scheme]
        assert endpoint_config()[:http][:port] == 4000
      end
    end

    test "local media URLs use the configured public origin and valid tokens" do
      alias Operately.Blobs.{Blob, SignedUrls, Tokens}
      alias OperatelyWeb.Endpoint

      original_url = Endpoint.config(:url)
      on_exit(fn -> configure_endpoint_url(original_url) end)

      blob = %Blob{id: Ecto.UUID.generate(), company_id: Ecto.UUID.generate(), filename: "avatar.png", storage_type: :local}

      for {scheme, port, origin} <- [
            {"http", "80", "http://operately.example.com"},
            {"https", "443", "https://operately.example.com"},
            {"http", "8080", "http://operately.example.com:8080"},
            {"https", "8443", "https://operately.example.com:8443"}
          ] do
        System.put_env("OPERATELY_URL_SCHEME", scheme)
        System.put_env("OPERATELY_URL_PORT", port)
        configure_endpoint_url(endpoint_config()[:url])

        assert {:ok, upload_url} = SignedUrls.get_signed_upload_url(blob)
        assert {:ok, download_url} = SignedUrls.get_signed_get_url(blob, "inline")

        for {url, operation} <- [{upload_url, "upload"}, {download_url, "get"}] do
          assert String.starts_with?(url, "#{origin}/media/#{Blob.path(blob)}?")
          token = url |> URI.parse() |> Map.fetch!(:query) |> URI.decode_query() |> Map.fetch!("token")
          assert :ok = Tokens.validate(operation, Blob.path(blob), token)
        end
      end
    end
  end

  defp configure_endpoint_url(url) do
    config = Application.fetch_env!(:operately, OperatelyWeb.Endpoint) |> Keyword.put(:url, url)
    OperatelyWeb.Endpoint.config_change([{OperatelyWeb.Endpoint, config}], [])
  end

  defp endpoint_config, do: runtime_config(:prod)[OperatelyWeb.Endpoint]
  defp analytics_config, do: runtime_config()[:conversion_analytics]

  defp runtime_config(env \\ :test) do
    Config.Reader.read!(Path.expand("../../config/runtime.exs", __DIR__), env: env)[:operately]
  end
end

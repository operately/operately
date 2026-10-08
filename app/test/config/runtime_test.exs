defmodule Operately.RuntimeConfigTest do
  use ExUnit.Case, async: false

  @variables ~w(POSTHOG_API_KEY OPERATELY_ANALYTICS_ENABLED OPERATELY_ANALYTICS_TOKEN OPERATELY_ANALYTICS_HOST OPERATELY_ANALYTICS_COOKIE_DOMAIN OPERATELY_HOST)

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

  defp analytics_config, do: runtime_config()[:conversion_analytics]

  defp runtime_config do
    Config.Reader.read!(Path.expand("../../config/runtime.exs", __DIR__), env: :test)[:operately]
  end
end

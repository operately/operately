defmodule Operately.MixProject do
  use Mix.Project

  def project do
    [
      app: :operately,
      version: "0.1.0",
      elixir: "~> 1.17",
      elixirc_paths: elixirc_paths(Mix.env()),
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps()
    ]
  end

  # Configuration for the OTP application.
  #
  # Type `mix help compile.app` for more information.
  def application do
    [
      mod: {Operately.Application, []},
      extra_applications: [:logger, :runtime_tools]
    ]
  end

  # Specifies which paths to compile per environment.
  defp elixirc_paths(:test), do: ["lib", "test/support", "ee/lib", "ee/test"]
  defp elixirc_paths(_), do: ["lib", "ee/lib"]

  # Specifies your project dependencies.
  #
  # Type `mix help deps` for examples and options.
  defp deps do
    [
      {:bcrypt_elixir, "~> 3.1"},
      {:phoenix, "~> 1.7.4"},
      {:phoenix_ecto, "~> 4.6.2"},
      {:ecto_sql, "~> 3.12"},
      {:postgrex, ">= 0.0.0"},
      {:phoenix_html, "~> 4.1"},
      {:phoenix_view, "~> 2.0"},
      {:phoenix_live_view, "~> 0.20.17"},
      {:swoosh, "~> 1.17"},
      {:finch, "~> 0.19"},
      {:telemetry_metrics, "~> 1.0"},
      {:telemetry_poller, "~> 1.1"},
      {:jason, "~> 1.4"},
      {:plug_cowboy, "~> 2.7"},
      {:ueberauth, "~> 0.10"},
      {:ueberauth_google, "~> 0.12"},
      {:inflex, "~> 2.0.0"},
      {:ex_aws, "~> 2.5"},
      {:custom_base, "~> 0.2"},

      {:oban, "~> 2.14"},
      {:bamboo, "~> 2.3.0"},
      {:site_encrypt, "~> 0.6.0"},
      {:hackney, "~> 1.20"},
      {:sweet_xml, "~> 0.7"},
      {:req, "~> 0.5.0"},
      {:telemetry_metrics_statsd, "~> 0.7.0"},

      # only in dev
      {:phoenix_live_reload, "~> 1.5", only: :dev},
      {:tailwind, "~> 0.2.3", runtime: Mix.env() == :dev},

      # only in tests
      {:wallaby, "~> 0.30.9", runtime: false, only: :test},
      {:junit_formatter, "~> 3.1", only: [:test]},
      {:floki, ">= 0.36.0", only: :test},
      {:mock, "~> 0.3.0", only: :test}
    ]
  end

  # Aliases are shortcuts or tasks specific to the current project.
  # For example, to install project dependencies and perform other setup tasks, run:
  #
  #     $ mix setup
  #
  # See the documentation for `Mix` for more info on aliases.
  defp aliases do
    [
      setup: ["deps.get", "ecto.setup", "assets.setup", "assets.build"],
      "ecto.setup": ["ecto.create", "ecto.migrate", "run priv/repo/seeds.exs"],
      "ecto.reset": ["ecto.drop", "ecto.setup"],
      test: ["ecto.create --quiet", "ecto.migrate --quiet", "test"],
      "assets.setup": ["tailwind.install --if-missing", "esbuild.install --if-missing"],
      "assets.build": ["tailwind default", "esbuild default"],
      "assets.deploy": ["tailwind default --minify", "cmd --cd assets node build.js --deploy", "phx.digest"]
    ]
  end
end

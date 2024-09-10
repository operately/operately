defmodule Operately.Support.Fixtures.Registry do

  def get(ctx, name) do
    Map.get(ctx.fixtures, name) || raise """
    No fixture with the name '#{name}' exists.
    """
  end

  def add(ctx, name, value) when is_atom(name) do
    ctx = ctx
      |> initialize_fixtures()
      |> verify_unique_fixture_name(name)

    %{ctx | fixtures: Map.put(ctx.fixtures, name, value)}
  end

  def add(_ctx, name, _value) when not is_atom(name) do
    raise """
    The name of a fixture must be an atom. Got: #{inspect(name)}
    """
  end

  defp initialize_fixtures(ctx) do
    ctx = ctx || %{}
    fixtures = ctx[:fixtures] || %{}

    Map.put(ctx, :fixtures, fixtures)
  end

  defp verify_unique_fixture_name(ctx, name) do
    if Map.has_key?(ctx.fixtures, name) do
      raise """
      A fixture with the name '#{name}' already exists.
      """
    else
      ctx
    end
  end

end

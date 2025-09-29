defmodule Operately.Support.Factory.Utils do
  @surnames [
    "Smith",
    "Johnson",
    "Williams",
    "Jones",
    "Brown",
    "Davis",
    "Miller",
    "Wilson",
    "Moore",
    "Taylor"
  ]

  def testid_to_name(testid) do
    name = Atom.to_string(testid)

    String.capitalize(name) <> " " <> Enum.random(@surnames)
  end

  def preload(ctx, resource_name, preload) do
    resource = Map.fetch!(ctx, resource_name)

    resource = Operately.Repo.preload(resource, preload)

    Map.put(ctx, resource_name, resource)
  end

  def reload(ctx, resource_name) do
    resource = Map.fetch!(ctx, resource_name)
    resource = Operately.Repo.reload(resource)
    Map.put(ctx, resource_name, resource)
  end

  def reload_all(ctx) do
    Enum.reduce(Map.keys(ctx), ctx, fn key, ctx ->
      resource = Map.fetch!(ctx, key)

      if is_ecto_schema?(resource) do
        reload(ctx, key)
      else
        ctx
      end
    end)
  end

  defp is_ecto_schema?(res) do
    is_struct(res) && Map.has_key?(res, :__meta__) && is_struct(res.__meta__, Ecto.Schema.Metadata)
  end

end

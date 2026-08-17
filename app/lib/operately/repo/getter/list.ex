defmodule Operately.Repo.Getter.List do
  import Ecto.Query

  alias Operately.Access.Binding
  alias Operately.Repo
  alias Operately.Repo.RequestInfo
  alias Operately.Repo.Getter.{AccessQuery, Args, AuthPreloader, BaseQuery}

  def list(module, requester, args) do
    args = Args.parse(args)
    {query, profile} = BaseQuery.build(module, args)

    case requester do
      :system -> list_for_system(query, args)
      %{id: requester_id} -> list_for_person(query, requester_id, args, profile.access_contexts)
      requester_id when is_binary(requester_id) -> list_for_person(query, requester_id, args, profile.access_contexts)
      _ -> raise ArgumentError, "Invalid requester: #{inspect(requester)}"
    end
  end

  defp list_for_system(query, args) do
    query
    |> Repo.all(with_deleted: args.with_deleted)
    |> process_resources(:system, args, Binding.full_access())
  end

  defp list_for_person(query, requester_id, args, access_contexts) do
    resources =
      AccessQuery.authorize(query, requester_id, args.required_access_level, access_contexts)
      |> group_by([resource: resource, person: person], [resource.id, person.id])
      |> select([resource: resource, binding: binding, person: person], {resource, max(binding.access_level), person})
      |> Repo.all(with_deleted: args.with_deleted)

    process_resources(resources, args)
  end

  defp process_resources(resources, requester, args, access_level) do
    resources
    |> Enum.map(&RequestInfo.populate_request_info(&1, requester, access_level))
    |> AuthPreloader.preload(requester, args)
    |> run_after_load_hooks(args.after_load)
  end

  defp process_resources([], _args), do: []

  defp process_resources([{_resource, _access_level, requester} | _] = resources, args) do
    resources
    |> Enum.map(fn {resource, access_level, resource_requester} ->
      RequestInfo.populate_request_info(resource, resource_requester, access_level)
    end)
    |> AuthPreloader.preload(requester, args)
    |> run_after_load_hooks(args.after_load)
  end

  defp run_after_load_hooks(resources, hooks) do
    Enum.map(resources, fn resource ->
      Enum.reduce(hooks, resource, fn hook, resource -> hook.(resource) end)
    end)
  end
end

defmodule TurboConnect.Specs do
  defmacro query(_name, _input, _output, _resolver) do
    quote do
      nil
    end
  end

  defmacro mutation(_name, _input, _output, _resolver) do
    quote do
      nil
    end
  end

  defmacro namespace(_path, do: block) do
    quote do
      unquote(block)
    end
  end

  defmacro __using__(_) do
    quote do
      import TurboConnect.Specs
    end
  end
end

defmodule OperatelyWeb.JsonApi.Queries do
  use TurboConnect.Specs

  namespace "/api/v1" do
    query :get_person, :get_person_params, :person, nil
    query :get_people, :get_people_params, :people, nil

    mutation :create_person, :create_person_input, :person, nil
    mutation :update_person, :update_person_input, :person, nil
    mutation :delete_person, :delete_person_input, :person, nil
  end

end

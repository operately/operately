defmodule Operately.Activities.EncoderTest do
  use Operately.DataCase

  test "removes all un-encodable things from the structure" do
    content = %{
      company: %Ecto.Association.NotLoaded{},
      company_id: "67a389fe-2291-49ae-957a-80461010ce4a",
      embedded_stuff: %{
        company: %Ecto.Association.NotLoaded{},
        company_id: "67a389fe-2291-49ae-957a-80461010ce4a",
        deeply_nested: %{
          company: %Ecto.Association.NotLoaded{},
          company_id: "67a389fe-2291-49ae-957a-80461010ce4a",
        },
      },
      embedded_list: [
        %{
          company: %Ecto.Association.NotLoaded{},
          company_id: "67a389fe-2291-49ae-957a-80461010ce4a",
        }
      ]
    }

    assert Operately.Activities.Encoder.encode(content) == %{
      company_id: "67a389fe-2291-49ae-957a-80461010ce4a",
      embedded_stuff: %{
        company_id: "67a389fe-2291-49ae-957a-80461010ce4a",
        deeply_nested: %{
          company_id: "67a389fe-2291-49ae-957a-80461010ce4a",
        },
      },
      embedded_list: [
        %{
          company_id: "67a389fe-2291-49ae-957a-80461010ce4a",
        },
      ]
    }
  end
end

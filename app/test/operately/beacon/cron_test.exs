defmodule Operately.Beacon.CronTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  import Mock

  describe "perform/1" do
    test "sends beacon when enabled" do
      with_mock System, [:passthrough], get_env: fn 
        "OPERATELY_BEACON_ENABLED", "true" -> "true"
        key, default -> System.get_env(key, default)
      end do
        with_mock Finch, [:passthrough], request: fn _request, _finch, _opts ->
          {:ok, %Finch.Response{status: 200, body: "", headers: []}}
        end do
          result = Operately.Beacon.Cron.perform(nil)
          
          assert result == :ok
          assert called(Finch.request(:_, :_, :_))
        end
      end
    end

    test "does not send beacon when disabled via 'false'" do
      with_mock System, [:passthrough], get_env: fn 
        "OPERATELY_BEACON_ENABLED", "true" -> "false"
        key, default -> System.get_env(key, default)
      end do
        with_mock Finch, [:passthrough], request: fn _request, _finch, _opts ->
          {:ok, %Finch.Response{status: 200, body: "", headers: []}}
        end do
          result = Operately.Beacon.Cron.perform(nil)
          
          assert result == :ok
          refute called(Finch.request(:_, :_, :_))
        end
      end
    end

    test "does not send beacon when disabled via 'no'" do
      with_mock System, [:passthrough], get_env: fn 
        "OPERATELY_BEACON_ENABLED", "true" -> "no"
        key, default -> System.get_env(key, default)
      end do
        with_mock Finch, [:passthrough], request: fn _request, _finch, _opts ->
          {:ok, %Finch.Response{status: 200, body: "", headers: []}}
        end do
          result = Operately.Beacon.Cron.perform(nil)
          
          assert result == :ok
          refute called(Finch.request(:_, :_, :_))
        end
      end
    end

    test "does not send beacon when disabled via '0'" do
      with_mock System, [:passthrough], get_env: fn 
        "OPERATELY_BEACON_ENABLED", "true" -> "0"
        key, default -> System.get_env(key, default)
      end do
        with_mock Finch, [:passthrough], request: fn _request, _finch, _opts ->
          {:ok, %Finch.Response{status: 200, body: "", headers: []}}
        end do
          result = Operately.Beacon.Cron.perform(nil)
          
          assert result == :ok
          refute called(Finch.request(:_, :_, :_))
        end
      end
    end

    test "does not send beacon when disabled via application config" do
      with_mock Application, [:passthrough], get_env: fn 
        :operately, :beacon_enabled, true -> false
        app, key, default -> Application.get_env(app, key, default)
      end do
        with_mock Finch, [:passthrough], request: fn _request, _finch, _opts ->
          {:ok, %Finch.Response{status: 200, body: "", headers: []}}
        end do
          result = Operately.Beacon.Cron.perform(nil)
          
          assert result == :ok
          refute called(Finch.request(:_, :_, :_))
        end
      end
    end
  end

  describe "send_beacon/0" do
    test "sends correct beacon data format" do
      with_mock System, [:passthrough], get_env: fn 
        "OPERATELY_BEACON_ENABLED", "true" -> "true"
        key, default -> System.get_env(key, default)
      end do
        with_mock Finch, [:passthrough], request: fn request, _finch, _opts ->
          # Validate the request structure
          assert %Finch.Request{method: "POST", url: "http://beacons.operately.com"} = request
          
          # Decode and validate the JSON body
          data = Jason.decode!(request.body)
          assert Map.has_key?(data, "version")
          assert Map.has_key?(data, "operating_system")
          assert Map.has_key?(data, "timestamp")
          assert is_binary(data["version"])
          assert is_binary(data["operating_system"])
          assert is_binary(data["timestamp"])
          
          {:ok, %Finch.Response{status: 200, body: "", headers: []}}
        end do
          result = Operately.Beacon.Cron.send_beacon()
          
          assert result == :ok
          assert called(Finch.request(:_, :_, :_))
        end
      end
    end

    test "handles HTTP errors gracefully" do
      with_mock System, [:passthrough], get_env: fn 
        "OPERATELY_BEACON_ENABLED", "true" -> "true"
        key, default -> System.get_env(key, default)
      end do
        with_mock Finch, [:passthrough], request: fn _request, _finch, _opts ->
          {:error, :timeout}
        end do
          # Should not raise an exception
          result = Operately.Beacon.Cron.send_beacon()
          
          assert result == :ok
          assert called(Finch.request(:_, :_, :_))
        end
      end
    end

    test "handles non-200 HTTP responses gracefully" do
      with_mock System, [:passthrough], get_env: fn 
        "OPERATELY_BEACON_ENABLED", "true" -> "true"
        key, default -> System.get_env(key, default)
      end do
        with_mock Finch, [:passthrough], request: fn _request, _finch, _opts ->
          {:ok, %Finch.Response{status: 500, body: "Server Error", headers: []}}
        end do
          # Should not raise an exception
          result = Operately.Beacon.Cron.send_beacon()
          
          assert result == :ok
          assert called(Finch.request(:_, :_, :_))
        end
      end
    end

    test "handles JSON encoding errors gracefully" do
      with_mock System, [:passthrough], get_env: fn 
        "OPERATELY_BEACON_ENABLED", "true" -> "true"
        key, default -> System.get_env(key, default)
      end do
        with_mock Jason, [:passthrough], encode!: fn _data ->
          raise Jason.EncodeError, data: "invalid"
        end do
          # Should not raise an exception
          result = Operately.Beacon.Cron.send_beacon()
          
          assert result == :ok
        end
      end
    end
  end

  describe "beacon data collection" do
    test "collects version information" do
      # Test that we can get a version string
      version = Application.spec(:operately, :vsn) |> to_string()
      assert is_binary(version)
      assert String.length(version) > 0
    end

    test "collects operating system information" do
      # Test that we can determine the OS
      os_info = case :os.type() do
        {:unix, :linux} -> "linux"
        {:unix, :darwin} -> "macos"
        {:unix, :freebsd} -> "freebsd"
        {:win32, _} -> "windows"
        {family, name} -> "#{family}_#{name}"
      end
      
      assert is_binary(os_info)
      assert String.length(os_info) > 0
    end
  end
end
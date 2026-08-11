using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace GeoGuessrAiHelper;

internal static class Program
{
    private const int Port = 43117;
    private const string Version = "1.0.0";
    private const string Model = "qwen/qwen3.6-27b";
    private const string WebsiteUrl = "https://steven44554.github.io/geoguessr-world-reference/";
    private const string DefaultGroqUrl = "https://api.groq.com/openai/v1/chat/completions";
    private const int MaxDecodedImageBytes = 15 * 1024 * 1024;
    private const long MaxRequestBytes = 24L * 1024L * 1024L;
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public static async Task<int> Main(string[] args)
    {
        Console.OutputEncoding = Encoding.UTF8;
        Console.Title = "GeoGuessr KI-Helfer";

        if (!OperatingSystem.IsWindows())
        {
            Console.Error.WriteLine("Dieser Helfer ist für Windows vorgesehen.");
            return 1;
        }

        if (args.Contains("--self-test", StringComparer.OrdinalIgnoreCase))
        {
            return RunSelfTest();
        }

        var keyStore = new ApiKeyStore();
        if (args.Contains("--reset-key", StringComparer.OrdinalIgnoreCase))
        {
            keyStore.Delete();
            Console.WriteLine("Der lokal gespeicherte Groq-Schlüssel wurde entfernt.");
            Console.WriteLine("Beim nächsten Start fragt der Helfer nach einem neuen Schlüssel.");
            return 0;
        }

        var apiKey = Environment.GetEnvironmentVariable("GEOGUESSR_GROQ_API_KEY")?.Trim();
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            apiKey = keyStore.TryLoad();
        }

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            apiKey = PromptForApiKey();
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                Console.Error.WriteLine("Kein Schlüssel eingegeben. Der Helfer wird beendet.");
                return 2;
            }

            try
            {
                keyStore.Save(apiKey);
                Console.WriteLine("Der Schlüssel wurde mit Windows-DPAPI für dieses Benutzerkonto verschlüsselt gespeichert.");
            }
            catch (Exception error)
            {
                Console.Error.WriteLine($"Der Schlüssel konnte nicht sicher gespeichert werden: {error.Message}");
                return 3;
            }
        }

        var groqUrl = ResolveGroqUrl();
        var settings = new HelperSettings(apiKey, groqUrl);
        var builder = WebApplication.CreateSlimBuilder(args);
        builder.Logging.ClearProviders();
        builder.Logging.AddSimpleConsole(options => options.SingleLine = true);
        builder.Logging.SetMinimumLevel(LogLevel.Warning);
        builder.WebHost.ConfigureKestrel(options =>
        {
            options.AddServerHeader = false;
            options.Limits.MaxRequestBodySize = MaxRequestBytes;
            options.Listen(IPAddress.Loopback, Port);
        });
        builder.Services.AddSingleton(settings);
        builder.Services.AddHttpClient("groq", client =>
        {
            client.Timeout = TimeSpan.FromSeconds(75);
        });

        var app = builder.Build();
        app.Use(async (context, next) =>
        {
            context.Response.Headers.CacheControl = "no-store";
            context.Response.Headers.XContentTypeOptions = "nosniff";

            if (!IsAllowedHost(context.Request.Host.Host))
            {
                await WriteError(context, 403, "FORBIDDEN_HOST", "Dieser Host ist nicht erlaubt.");
                return;
            }

            var origin = context.Request.Headers.Origin.ToString();
            if (!string.IsNullOrEmpty(origin))
            {
                if (!OriginPolicy.IsAllowed(origin))
                {
                    await WriteError(context, 403, "FORBIDDEN_ORIGIN", "Diese Webseite darf den lokalen Helfer nicht verwenden.");
                    return;
                }

                context.Response.Headers.AccessControlAllowOrigin = origin;
                context.Response.Headers.Vary = "Origin";
                context.Response.Headers.AccessControlAllowMethods = "GET, POST, OPTIONS";
                context.Response.Headers.AccessControlAllowHeaders = "Content-Type, X-GeoGuessr-Helper";
                context.Response.Headers["Access-Control-Allow-Private-Network"] = "true";
            }

            if (HttpMethods.IsOptions(context.Request.Method))
            {
                context.Response.StatusCode = StatusCodes.Status204NoContent;
                return;
            }

            if (context.Request.Headers["X-GeoGuessr-Helper"] != "1")
            {
                await WriteError(context, 403, "MISSING_HELPER_HEADER", "Die Sicherheitskennung der Webseite fehlt.");
                return;
            }

            await next();
        });

        app.MapGet("/health", (HelperSettings current) => Results.Json(new
        {
            ok = true,
            configured = !string.IsNullOrWhiteSpace(current.ApiKey),
            model = Model,
            version = Version,
        }, JsonOptions));

        app.MapPost("/analyze", AnalyzeScreenshot);
        app.MapFallback((HttpContext context) => WriteError(context, 404, "NOT_FOUND", "Dieser Helfer-Endpunkt existiert nicht."));

        try
        {
            await app.StartAsync();
        }
        catch (IOException error)
        {
            Console.Error.WriteLine($"Der Helfer konnte Port {Port} nicht öffnen: {error.Message}");
            Console.Error.WriteLine("Möglicherweise läuft der Helfer bereits.");
            return 4;
        }

        Console.WriteLine();
        Console.WriteLine("GeoGuessr KI-Helfer läuft.");
        Console.WriteLine($"Lokale Adresse: http://127.0.0.1:{Port}");
        Console.WriteLine($"Vision-Modell: {Model}");
        Console.WriteLine("Dieses Fenster offen lassen, solange du die KI-Funktion verwendest.");
        Console.WriteLine("Zum Beenden dieses Fenster schließen oder Strg+C drücken.");
        Console.WriteLine("Schlüssel zurücksetzen: GeoGuessr-KI-Helfer.exe --reset-key");
        Console.WriteLine();

        if (!args.Contains("--no-browser", StringComparer.OrdinalIgnoreCase))
        {
            TryOpenWebsite();
        }

        await app.WaitForShutdownAsync();
        return 0;
    }

    private static async Task<IResult> AnalyzeScreenshot(
        HttpContext context,
        HelperSettings settings,
        IHttpClientFactory httpClientFactory)
    {
        if (context.Request.ContentLength is > MaxRequestBytes)
        {
            return ErrorResult(413, "IMAGE_TOO_LARGE", "Der Screenshot ist zu groß. Erlaubt sind höchstens 15 MB Bilddaten.");
        }

        AnalyzeRequest? request;
        try
        {
            request = await JsonSerializer.DeserializeAsync<AnalyzeRequest>(
                context.Request.Body,
                JsonOptions,
                context.RequestAborted);
        }
        catch (JsonException)
        {
            return ErrorResult(400, "INVALID_REQUEST", "Die Anfrage enthält kein gültiges JSON.");
        }

        if (request is null || string.IsNullOrWhiteSpace(request.ImageDataUrl))
        {
            return ErrorResult(400, "INVALID_IMAGE", "Es wurde kein Screenshot übertragen.");
        }

        var validation = ImageDataUrl.Validate(request.ImageDataUrl, MaxDecodedImageBytes);
        if (!validation.Valid)
        {
            return ErrorResult(validation.StatusCode, validation.Code, validation.Message);
        }

        using var upstreamRequest = new HttpRequestMessage(HttpMethod.Post, settings.GroqUrl);
        upstreamRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", settings.ApiKey);
        upstreamRequest.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        upstreamRequest.Content = JsonContent.Create(BuildGroqRequest(request.ImageDataUrl), options: JsonOptions);

        HttpResponseMessage upstreamResponse;
        try
        {
            upstreamResponse = await httpClientFactory.CreateClient("groq").SendAsync(
                upstreamRequest,
                HttpCompletionOption.ResponseHeadersRead,
                context.RequestAborted);
        }
        catch (OperationCanceledException) when (!context.RequestAborted.IsCancellationRequested)
        {
            return ErrorResult(504, "UPSTREAM_TIMEOUT", "Groq hat nicht rechtzeitig geantwortet. Versuche es erneut.");
        }
        catch (HttpRequestException)
        {
            return ErrorResult(502, "UPSTREAM_ERROR", "Groq konnte nicht erreicht werden. Prüfe deine Internetverbindung.");
        }

        await using var responseBody = await upstreamResponse.Content.ReadAsStreamAsync(context.RequestAborted);
        if (!upstreamResponse.IsSuccessStatusCode)
        {
            return upstreamResponse.StatusCode switch
            {
                HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden =>
                    ErrorResult(401, "INVALID_API_KEY", "Der Groq-Schlüssel wurde abgelehnt. Setze ihn im Helfer zurück und trage einen gültigen Schlüssel ein."),
                HttpStatusCode.TooManyRequests =>
                    ErrorResult(429, "RATE_LIMITED", "Das kostenlose Groq-Limit ist gerade erreicht. Warte kurz und versuche es erneut."),
                HttpStatusCode.RequestEntityTooLarge =>
                    ErrorResult(413, "IMAGE_TOO_LARGE", "Groq hat den Screenshot als zu groß abgelehnt."),
                _ => ErrorResult(502, "UPSTREAM_ERROR", $"Groq konnte die Analyse nicht abschließen (Status {(int)upstreamResponse.StatusCode})."),
            };
        }

        string modelContent;
        try
        {
            using var upstreamJson = await JsonDocument.ParseAsync(responseBody, cancellationToken: context.RequestAborted);
            modelContent = upstreamJson.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? "";
        }
        catch (Exception error) when (error is JsonException or KeyNotFoundException or InvalidOperationException or IndexOutOfRangeException)
        {
            return ErrorResult(502, "INVALID_MODEL_RESPONSE", "Groq hat keine lesbare Analyse zurückgegeben.");
        }

        var normalized = NormalizeModelResponse(modelContent);
        if (normalized is null)
        {
            return ErrorResult(502, "INVALID_MODEL_RESPONSE", "Die KI-Antwort hatte nicht das erwartete Format. Versuche es erneut.");
        }

        return Results.Json(new
        {
            ok = true,
            model = Model,
            summary = normalized.Summary,
            observations = normalized.Observations,
            warnings = normalized.Warnings,
        }, JsonOptions);
    }

    private static object BuildGroqRequest(string imageDataUrl)
    {
        const string systemPrompt = """
Du extrahierst ausschließlich direkt sichtbare Straßenmerkmale aus einem GeoGuessr- oder Straßenfoto.
Rate niemals ein Land und nenne keine Ländernamen. Erfinde keine verdeckten oder unklaren Merkmale.
Wenn etwas nicht eindeutig sichtbar ist, lasse das Feld vollständig weg. Die Ausgabe muss ein einzelnes JSON-Objekt sein.

Erlaubte Struktur:
{
  "summary": "Kurze deutsche Zusammenfassung dessen, was wirklich sichtbar ist.",
  "observations": {
    "traffic": {"value":"left|right", "confidence":0.0, "evidence":"kurzer sichtbarer Beleg"},
    "centerColor": {"value":"white|yellow|green|none", "confidence":0.0, "evidence":"..."},
    "centerStyle": {"value":"dashed|solid|double-solid|solid-dashed|none", "confidence":0.0, "evidence":"..."},
    "edgeColor": {"value":"white|yellow|none", "confidence":0.0, "evidence":"..."},
    "edgeStyle": {"value":"dashed|solid|double-solid|solid-dashed|none", "confidence":0.0, "evidence":"..."},
    "plateColor": {"value":"yellow|white|dark", "confidence":0.0, "evidence":"..."},
    "surface": {"value":"asphalt|concrete|gravel|unpaved", "confidence":0.0, "evidence":"..."},
    "stopOnly": {"value":true, "confidence":0.0, "evidence":"Stoppschild zeigt nur STOP"},
    "stopOther": {"value":true, "confidence":0.0, "evidence":"Stoppschild zeigt anderen oder zusätzlichen Text"},
    "stopText": {"value":"alto|pare|berhenti|tomare-stop", "confidence":0.0, "evidence":"..."},
    "warningSign": {"value":"diamond-yellow|triangle-white|triangle-yellow", "confidence":0.0, "evidence":"..."},
    "plateLayout": {"value":"white-white|white-yellow|yellow-yellow|dark-dark", "confidence":0.0, "evidence":"..."},
    "bollard": {"value":"white-black|painted-black-white|black-yellow", "confidence":0.0, "evidence":"..."},
    "pole": {"value":"wood|concrete", "confidence":0.0, "evidence":"..."},
    "shoulder": {"value":"paved|gravel|none|drainage", "confidence":0.0, "evidence":"..."},
    "signBack": {"value":"dark", "confidence":0.0, "evidence":"..."},
    "camera": {"value":"low", "confidence":0.0, "evidence":"..."}
  },
  "warnings": ["kurzer deutscher Unsicherheitshinweis"]
}

Regeln:
- Nutze nur exakt die erlaubten englischen Werte.
- confidence liegt zwischen 0 und 1 und beschreibt Sichtbarkeit, nicht Vermutung.
- Verkehrsseite nur aus eindeutig erkennbaren Fahrzeugrichtungen oder Fahrbahnpositionen ableiten.
- "none" nur verwenden, wenn das Fehlen im relevanten Straßenabschnitt klar sichtbar ist.
- stopOnly und stopOther dürfen nie gleichzeitig vorkommen.
- tomare-stop bedeutet japanisches 止まれ, allein oder zusammen mit STOP.
- Kennzeichenfarbe meint den Hintergrund, nicht die Schriftfarbe.
- Gib keine unbekannten Felder, kein Markdown und keine zusätzlichen Texte außerhalb des JSON aus.
""";

        return new
        {
            model = Model,
            temperature = 0.1,
            max_completion_tokens = 1800,
            response_format = new { type = "json_object" },
            messages = new object[]
            {
                new { role = "system", content = systemPrompt },
                new
                {
                    role = "user",
                    content = new object[]
                    {
                        new { type = "text", text = "Analysiere nur die sichtbaren Merkmale dieses Straßen-Screenshots nach dem vorgegebenen Schema." },
                        new { type = "image_url", image_url = new { url = imageDataUrl } },
                    },
                },
            },
        };
    }

    private static NormalizedResponse? NormalizeModelResponse(string rawContent)
    {
        var json = StripMarkdownFence(rawContent);
        try
        {
            using var document = JsonDocument.Parse(json);
            var root = document.RootElement;
            var summary = ReadTrimmedString(root, "summary", 500) ?? "Die KI hat sichtbare Straßenmerkmale ausgewertet.";
            var warnings = new List<string>();
            if (root.TryGetProperty("warnings", out var warningElement) && warningElement.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in warningElement.EnumerateArray().Take(5))
                {
                    if (item.ValueKind != JsonValueKind.String) continue;
                    var text = TrimTo(item.GetString(), 300);
                    if (!string.IsNullOrWhiteSpace(text)) warnings.Add(text);
                }
            }

            var observations = new Dictionary<string, NormalizedObservation>(StringComparer.Ordinal);
            if (root.TryGetProperty("observations", out var observationElement)
                && observationElement.ValueKind == JsonValueKind.Object)
            {
                foreach (var property in observationElement.EnumerateObject())
                {
                    if (!ObservationRules.Allowed.TryGetValue(property.Name, out var allowed)) continue;
                    if (property.Value.ValueKind != JsonValueKind.Object) continue;
                    if (!property.Value.TryGetProperty("value", out var valueElement)) continue;

                    object? value = null;
                    if (allowed.BooleanValue)
                    {
                        if (valueElement.ValueKind == JsonValueKind.True) value = true;
                    }
                    else if (valueElement.ValueKind == JsonValueKind.String)
                    {
                        var candidate = valueElement.GetString() ?? "";
                        if (allowed.Values.Contains(candidate)) value = candidate;
                    }

                    if (value is null) continue;
                    var confidence = 0d;
                    if (property.Value.TryGetProperty("confidence", out var confidenceElement)
                        && confidenceElement.ValueKind == JsonValueKind.Number
                        && confidenceElement.TryGetDouble(out var parsedConfidence)
                        && double.IsFinite(parsedConfidence))
                    {
                        confidence = Math.Clamp(parsedConfidence, 0d, 1d);
                    }

                    var evidence = ReadTrimmedString(property.Value, "evidence", 500) ?? "Kein genauer Sichtbeleg angegeben.";
                    observations[property.Name] = new NormalizedObservation(value, confidence, evidence);
                }
            }

            ResolveStopConflict(observations, warnings);
            ResolveRoadAbsenceConflict(observations, "centerColor", "centerStyle", "Mittellinie", warnings);
            ResolveRoadAbsenceConflict(observations, "edgeColor", "edgeStyle", "Randlinie", warnings);
            if (observations.Count == 0)
            {
                warnings.Add("Es wurde kein Merkmal sicher genug erkannt. Nutze die manuellen Filter.");
            }

            return new NormalizedResponse(summary, observations, warnings.Distinct().Take(6).ToArray());
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static void ResolveStopConflict(Dictionary<string, NormalizedObservation> observations, List<string> warnings)
    {
        if (!observations.TryGetValue("stopOnly", out var stopOnly)) return;
        var conflictingKeys = new[] { "stopOther", "stopText" }
            .Where(observations.ContainsKey)
            .ToArray();
        if (conflictingKeys.Length == 0) return;

        var strongestOther = conflictingKeys
            .Select(key => (Key: key, Observation: observations[key]))
            .OrderByDescending(item => item.Observation.Confidence)
            .First();
        if (Math.Abs(stopOnly.Confidence - strongestOther.Observation.Confidence) < 0.0001)
        {
            observations.Remove("stopOnly");
            foreach (var key in conflictingKeys) observations.Remove(key);
        }
        else if (stopOnly.Confidence > strongestOther.Observation.Confidence)
        {
            foreach (var key in conflictingKeys) observations.Remove(key);
        }
        else
        {
            observations.Remove("stopOnly");
        }

        warnings.Add("Widersprüchliche Stoppschild-Merkmale wurden vorsichtshalber bereinigt.");
    }

    private static void ResolveRoadAbsenceConflict(
        Dictionary<string, NormalizedObservation> observations,
        string colorKey,
        string styleKey,
        string label,
        List<string> warnings)
    {
        if (!observations.TryGetValue(colorKey, out var color)
            || !observations.TryGetValue(styleKey, out var style)) return;
        var colorValue = color.Value as string;
        var styleValue = style.Value as string;
        if ((colorValue == "none") == (styleValue == "none")) return;

        if (Math.Abs(color.Confidence - style.Confidence) < 0.0001)
        {
            observations.Remove(colorKey);
            observations.Remove(styleKey);
        }
        else if (color.Confidence > style.Confidence)
        {
            observations.Remove(styleKey);
        }
        else
        {
            observations.Remove(colorKey);
        }
        warnings.Add($"Widersprüchliche Angaben zur {label} wurden vorsichtshalber bereinigt.");
    }

    private static string StripMarkdownFence(string content)
    {
        var text = content.Trim();
        if (!text.StartsWith("```", StringComparison.Ordinal)) return text;
        var firstLineEnd = text.IndexOf('\n');
        var finalFence = text.LastIndexOf("```", StringComparison.Ordinal);
        return firstLineEnd >= 0 && finalFence > firstLineEnd
            ? text[(firstLineEnd + 1)..finalFence].Trim()
            : text;
    }

    private static string? ReadTrimmedString(JsonElement element, string propertyName, int maxLength)
    {
        if (!element.TryGetProperty(propertyName, out var property) || property.ValueKind != JsonValueKind.String) return null;
        return TrimTo(property.GetString(), maxLength);
    }

    private static string? TrimTo(string? value, int maxLength)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrWhiteSpace(trimmed)) return null;
        return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength];
    }

    private static IResult ErrorResult(int status, string code, string message) =>
        Results.Json(new { ok = false, error = new { code, message } }, JsonOptions, statusCode: status);

    private static Task WriteError(HttpContext context, int status, string code, string message)
    {
        context.Response.StatusCode = status;
        context.Response.ContentType = "application/json; charset=utf-8";
        return context.Response.WriteAsJsonAsync(new { ok = false, error = new { code, message } }, JsonOptions);
    }

    private static bool IsAllowedHost(string host) =>
        string.Equals(host, "127.0.0.1", StringComparison.OrdinalIgnoreCase)
        || string.Equals(host, "localhost", StringComparison.OrdinalIgnoreCase)
        || string.Equals(host, "::1", StringComparison.OrdinalIgnoreCase);

    private static Uri ResolveGroqUrl()
    {
        var configured = Environment.GetEnvironmentVariable("GEOGUESSR_GROQ_BASE_URL")?.Trim();
        if (!string.IsNullOrEmpty(configured)
            && Uri.TryCreate(configured, UriKind.Absolute, out var custom)
            && IsAllowedGroqOverride(custom))
        {
            return custom;
        }

        return new Uri(DefaultGroqUrl);
    }

    private static bool IsAllowedGroqOverride(Uri uri)
    {
        var loopback = string.Equals(uri.Host, "localhost", StringComparison.OrdinalIgnoreCase)
            || IPAddress.TryParse(uri.Host, out var address) && IPAddress.IsLoopback(address);
        if (loopback)
        {
            return uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps;
        }
        return uri.Scheme == Uri.UriSchemeHttps
            && string.Equals(uri.Host, "api.groq.com", StringComparison.OrdinalIgnoreCase);
    }

    private static string? PromptForApiKey()
    {
        if (Console.IsInputRedirected) return null;
        Console.WriteLine("Für die optionale Bildanalyse wird ein kostenloser Groq-API-Key benötigt.");
        Console.WriteLine("Key erstellen: https://console.groq.com/keys");
        Console.Write("Groq-Key einfügen (Eingabe bleibt verborgen): ");
        var builder = new StringBuilder();
        while (true)
        {
            var key = Console.ReadKey(intercept: true);
            if (key.Key == ConsoleKey.Enter)
            {
                Console.WriteLine();
                break;
            }
            if (key.Key == ConsoleKey.Backspace)
            {
                if (builder.Length > 0) builder.Length -= 1;
                continue;
            }
            if (!char.IsControl(key.KeyChar)) builder.Append(key.KeyChar);
        }

        var result = builder.ToString().Trim();
        if (result.Length < 20)
        {
            Console.Error.WriteLine("Der eingegebene Schlüssel ist zu kurz.");
            return null;
        }
        return result;
    }

    private static void TryOpenWebsite()
    {
        try
        {
            Process.Start(new ProcessStartInfo(WebsiteUrl) { UseShellExecute = true });
        }
        catch
        {
            Console.WriteLine($"Öffne die Website manuell: {WebsiteUrl}");
        }
    }

    private static int RunSelfTest()
    {
        try
        {
            SelfTest.Assert(OriginPolicy.IsAllowed("https://steven44554.github.io"), "GitHub-Pages-Origin");
            SelfTest.Assert(OriginPolicy.IsAllowed("http://127.0.0.1:8000"), "lokaler Entwicklungs-Origin");
            SelfTest.Assert(OriginPolicy.IsAllowed("null"), "lokale Datei");
            SelfTest.Assert(!OriginPolicy.IsAllowed("https://example.com"), "fremder Origin blockiert");
            SelfTest.Assert(ImageDataUrl.Validate(SelfTest.OnePixelPng, MaxDecodedImageBytes).Valid, "gültiges PNG");
            SelfTest.Assert(!ImageDataUrl.Validate("data:image/svg+xml;base64,PHN2Zz4=", MaxDecodedImageBytes).Valid, "SVG blockiert");
            SelfTest.Assert(!ImageDataUrl.Validate(SelfTest.OnePixelPng, 4).Valid, "überlanges Bild blockiert");
            SelfTest.Assert(!ImageDataUrl.Validate("data:image/png;base64,***", MaxDecodedImageBytes).Valid, "ungültiges Base64 blockiert");
            SelfTest.Assert(!ImageDataUrl.Validate("data:image/png;base64,SGVsbG8=", MaxDecodedImageBytes).Valid, "falsche Dateisignatur blockiert");
            SelfTest.Assert(NormalizeModelResponse(SelfTest.ValidModelResponse)?.Observations.Count == 2, "Antwort-Normalisierung");
            SelfTest.Assert(NormalizeModelResponse(SelfTest.InvalidKnownValueResponse)?.Observations.Count == 0, "ungültiger bekannter Wert blockiert");
            SelfTest.Assert(NormalizeModelResponse(SelfTest.ConflictingRoadResponse)?.Observations.Count == 1, "widersprüchliche Straßenwerte bereinigt");
            SelfTest.Assert(NormalizeModelResponse("kein JSON") is null, "ungültige Modellantwort blockiert");
            SelfTest.Assert(IsAllowedGroqOverride(new Uri("http://127.0.0.1:43118/")), "lokaler Mock erlaubt");
            SelfTest.Assert(!IsAllowedGroqOverride(new Uri("http://example.com/")), "entferntes HTTP blockiert");

            var plain = Encoding.UTF8.GetBytes("nur_fuer_den_lokalen_dpapi_selbsttest");
            var cipher = ProtectedData.Protect(plain, ApiKeyStore.Entropy, DataProtectionScope.CurrentUser);
            var restored = ProtectedData.Unprotect(cipher, ApiKeyStore.Entropy, DataProtectionScope.CurrentUser);
            SelfTest.Assert(CryptographicOperations.FixedTimeEquals(plain, restored), "DPAPI-Rundlauf");

            Console.WriteLine("Selbsttest erfolgreich: Origin, Bildvalidierung, Antwortschema und DPAPI sind in Ordnung.");
            return 0;
        }
        catch (Exception error)
        {
            Console.Error.WriteLine($"Selbsttest fehlgeschlagen: {error.Message}");
            return 10;
        }
    }
}

internal sealed record HelperSettings(string ApiKey, Uri GroqUrl);
internal sealed record AnalyzeRequest(string ImageDataUrl, string? FileName);
internal sealed record NormalizedObservation(object Value, double Confidence, string Evidence);
internal sealed record NormalizedResponse(string Summary, Dictionary<string, NormalizedObservation> Observations, string[] Warnings);
internal sealed record ImageValidation(bool Valid, int StatusCode, string Code, string Message);

internal static class OriginPolicy
{
    private const string PublishedOrigin = "https://steven44554.github.io";

    public static bool IsAllowed(string origin)
    {
        if (string.Equals(origin, "null", StringComparison.Ordinal)) return true;
        if (string.Equals(origin.TrimEnd('/'), PublishedOrigin, StringComparison.OrdinalIgnoreCase)) return true;
        if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;
        return (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)
            && (string.Equals(uri.Host, "localhost", StringComparison.OrdinalIgnoreCase)
                || IPAddress.TryParse(uri.Host, out var address) && IPAddress.IsLoopback(address));
    }
}

internal static class ImageDataUrl
{
    private static readonly Dictionary<string, Func<byte[], bool>> Validators = new(StringComparer.OrdinalIgnoreCase)
    {
        ["data:image/png;base64,"] = bytes => bytes.Length >= 8
            && bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4e && bytes[3] == 0x47
            && bytes[4] == 0x0d && bytes[5] == 0x0a && bytes[6] == 0x1a && bytes[7] == 0x0a,
        ["data:image/jpeg;base64,"] = bytes => bytes.Length >= 3
            && bytes[0] == 0xff && bytes[1] == 0xd8 && bytes[2] == 0xff,
        ["data:image/webp;base64,"] = bytes => bytes.Length >= 12
            && Encoding.ASCII.GetString(bytes, 0, 4) == "RIFF"
            && Encoding.ASCII.GetString(bytes, 8, 4) == "WEBP",
    };

    public static ImageValidation Validate(string dataUrl, int maxDecodedBytes)
    {
        var prefix = Validators.Keys.FirstOrDefault(item => dataUrl.StartsWith(item, StringComparison.OrdinalIgnoreCase));
        if (prefix is null)
        {
            return new ImageValidation(false, 415, "UNSUPPORTED_IMAGE", "Verwende ein PNG-, JPEG- oder WebP-Bild.");
        }

        var base64 = dataUrl[prefix.Length..];
        if (base64.Length == 0 || (long)base64.Length * 3L / 4L > maxDecodedBytes + 3L)
        {
            return new ImageValidation(false, 413, "IMAGE_TOO_LARGE", "Der Screenshot ist größer als 15 MB.");
        }

        byte[] bytes;
        try
        {
            bytes = Convert.FromBase64String(base64);
        }
        catch (FormatException)
        {
            return new ImageValidation(false, 400, "INVALID_IMAGE", "Die Bilddaten sind nicht gültig kodiert.");
        }

        if (bytes.Length == 0 || bytes.Length > maxDecodedBytes)
        {
            return new ImageValidation(false, 413, "IMAGE_TOO_LARGE", "Der Screenshot ist größer als 15 MB.");
        }
        if (!Validators[prefix](bytes))
        {
            return new ImageValidation(false, 400, "INVALID_IMAGE", "Bildformat und Bildinhalt passen nicht zusammen.");
        }

        return new ImageValidation(true, 200, "", "");
    }
}

internal static class ObservationRules
{
    public static readonly IReadOnlyDictionary<string, ObservationRule> Allowed =
        new Dictionary<string, ObservationRule>(StringComparer.Ordinal)
        {
            ["traffic"] = ObservationRule.Strings("left", "right"),
            ["centerColor"] = ObservationRule.Strings("white", "yellow", "green", "none"),
            ["centerStyle"] = ObservationRule.Strings("dashed", "solid", "double-solid", "solid-dashed", "none"),
            ["edgeColor"] = ObservationRule.Strings("white", "yellow", "none"),
            ["edgeStyle"] = ObservationRule.Strings("dashed", "solid", "double-solid", "solid-dashed", "none"),
            ["plateColor"] = ObservationRule.Strings("yellow", "white", "dark"),
            ["surface"] = ObservationRule.Strings("asphalt", "concrete", "gravel", "unpaved"),
            ["stopOnly"] = ObservationRule.Boolean(),
            ["stopOther"] = ObservationRule.Boolean(),
            ["stopText"] = ObservationRule.Strings("alto", "pare", "berhenti", "tomare-stop"),
            ["warningSign"] = ObservationRule.Strings("diamond-yellow", "triangle-white", "triangle-yellow"),
            ["plateLayout"] = ObservationRule.Strings("white-white", "white-yellow", "yellow-yellow", "dark-dark"),
            ["bollard"] = ObservationRule.Strings("white-black", "painted-black-white", "black-yellow"),
            ["pole"] = ObservationRule.Strings("wood", "concrete"),
            ["shoulder"] = ObservationRule.Strings("paved", "gravel", "none", "drainage"),
            ["signBack"] = ObservationRule.Strings("dark"),
            ["camera"] = ObservationRule.Strings("low"),
        };
}

internal sealed record ObservationRule(bool BooleanValue, HashSet<string> Values)
{
    public static ObservationRule Boolean() => new(true, new HashSet<string>(StringComparer.Ordinal));
    public static ObservationRule Strings(params string[] values) => new(false, new HashSet<string>(values, StringComparer.Ordinal));
}

internal sealed class ApiKeyStore
{
    internal static readonly byte[] Entropy = Encoding.UTF8.GetBytes("GeoGuessr-KI-Helfer-v1");
    private readonly string _filePath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "GeoGuessr-KI-Helfer",
        "groq-key.dpapi");

    public string? TryLoad()
    {
        if (!File.Exists(_filePath)) return null;
        try
        {
            var encrypted = File.ReadAllBytes(_filePath);
            var plain = ProtectedData.Unprotect(encrypted, Entropy, DataProtectionScope.CurrentUser);
            return Encoding.UTF8.GetString(plain).Trim();
        }
        catch
        {
            Console.Error.WriteLine("Der gespeicherte Schlüssel konnte nicht entschlüsselt werden und wurde entfernt.");
            Delete();
            return null;
        }
    }

    public void Save(string apiKey)
    {
        var directory = Path.GetDirectoryName(_filePath)!;
        Directory.CreateDirectory(directory);
        var encrypted = ProtectedData.Protect(
            Encoding.UTF8.GetBytes(apiKey),
            Entropy,
            DataProtectionScope.CurrentUser);
        File.WriteAllBytes(_filePath, encrypted);
    }

    public void Delete()
    {
        if (File.Exists(_filePath)) File.Delete(_filePath);
    }
}

internal static class SelfTest
{
    internal const string OnePixelPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    internal const string ValidModelResponse = "{\"summary\":\"Test\",\"observations\":{\"traffic\":{\"value\":\"left\",\"confidence\":0.9,\"evidence\":\"Fahrzeugposition\"},\"centerColor\":{\"value\":\"white\",\"confidence\":0.8,\"evidence\":\"sichtbare Linie\"},\"unknown\":{\"value\":\"x\",\"confidence\":1}},\"warnings\":[]}";
    internal const string InvalidKnownValueResponse = "{\"summary\":\"Test\",\"observations\":{\"traffic\":{\"value\":\"sideways\",\"confidence\":1,\"evidence\":\"ungültig\"}},\"warnings\":[]}";
    internal const string ConflictingRoadResponse = "{\"summary\":\"Test\",\"observations\":{\"centerColor\":{\"value\":\"none\",\"confidence\":0.9,\"evidence\":\"keine Linie\"},\"centerStyle\":{\"value\":\"solid\",\"confidence\":0.7,\"evidence\":\"Widerspruch\"}},\"warnings\":[]}";

    internal static void Assert(bool condition, string name)
    {
        if (!condition) throw new InvalidOperationException(name);
    }
}
